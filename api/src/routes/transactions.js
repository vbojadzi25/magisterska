const express = require('express');
const { Op } = require('sequelize');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Transaction, BankAccount, User } = require('../models');
const { authenticate, requireKYC } = require('../middleware/auth');
const paymentConfig = require('../config/payment');
const { notifyUser } = require('../services/notificationService');

const router = express.Router();

router.use(authenticate);
// KYC check only enforced for real bank payments; simulation skips it
if (paymentConfig.mode !== 'simulated') {
  router.use(requireKYC);
}

// User fields to include when joining sender/recipient
const USER_ATTRS = ['id', 'firstName', 'lastName', 'profileImageUrl'];
const TXN_INCLUDE = [
  { model: User, as: 'fromUser', attributes: USER_ATTRS },
  { model: User, as: 'toUser',   attributes: USER_ATTRS },
];

function formatTxn(txn, requestingUserId) {
  const amt = parseFloat(String(txn.amount));
  const direction = txn.fromUserId === requestingUserId ? 'sent' : 'received';
  const fromUser = txn.fromUser
    ? { id: txn.fromUser.id, name: `${txn.fromUser.firstName} ${txn.fromUser.lastName}`.trim(), profileImageUrl: txn.fromUser.profileImageUrl }
    : null;
  const toUser = txn.toUser
    ? { id: txn.toUser.id, name: `${txn.toUser.firstName} ${txn.toUser.lastName}`.trim(), profileImageUrl: txn.toUser.profileImageUrl }
    : null;
  return {
    id: txn.id,
    reference: txn.reference,
    amount: amt,
    currency: txn.currency,
    description: txn.description,
    emoji: txn.emoji,
    privacy: txn.privacy,
    status: txn.status,
    type: txn.type,
    isRequest: txn.isRequest,
    direction,
    fromUser,
    toUser,
    requestExpiresAt: txn.requestExpiresAt,
    createdAt: txn.createdAt,
    completedAt: txn.completedAt,
  };
}

// ─── POST /api/transactions/send ─────────────────────────────────────────────
// Send money to another Denar user.
// Body: { toUserId, fromBankAccountId, amount, description?, emoji?, privacy? }
//
// TPP migration path:
//   Replace the simulation block below with a call to the bank PIS API:
//   POST {paymentConfig.tpp.baseUrl}/v1/payments/domestic-transfer
//   Headers: X-Request-ID, Date, Digest, Signature, TPP-Signature-Certificate
//   Then follow the SCA authorisation flow (see api-documentation/pis.md)
router.post('/send', async (req, res) => {
  try {
    const { toUserId, fromBankAccountId, amount, description, emoji, privacy = 'friends' } = req.body;

    if (!toUserId || !fromBankAccountId || !amount) {
      return res.status(400).json({ error: 'toUserId, fromBankAccountId and amount are required' });
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 1) {
      return res.status(400).json({ error: 'Minimum amount is 1 MKD' });
    }
    if (toUserId === req.user.id) {
      return res.status(400).json({ error: 'Cannot send money to yourself' });
    }

    const fromAccount = await BankAccount.findOne({
      where: { id: fromBankAccountId, userId: req.user.id, isActive: true },
    });
    if (!fromAccount) return res.status(404).json({ error: 'Sender account not found' });

    const available = parseFloat(String(fromAccount.availableBalance));
    if (available < amountNum) {
      return res.status(400).json({ error: `Insufficient balance. Available: ${available.toFixed(2)} MKD` });
    }

    const toUser = await User.findOne({ where: { id: toUserId, isActive: true } });
    if (!toUser) return res.status(404).json({ error: 'Recipient not found' });

    const toAccount = await BankAccount.findOne({
      where: { userId: toUserId, isActive: true },
      order: [['isDefault', 'DESC']],
    });
    if (!toAccount) return res.status(400).json({ error: 'Recipient has no linked bank account' });

    const txn = await Transaction.create({
      fromUserId: req.user.id,
      toUserId,
      fromBankAccountId,
      toBankAccountId: toAccount.id,
      amount: amountNum,
      currency: fromAccount.currency || 'MKD',
      fee: 0,
      totalAmount: amountNum,
      description: description || '',
      emoji: emoji || '💸',
      privacy,
      status: 'pending',
      type: 'p2p_transfer',
      isRequest: false,
      initiatedAt: new Date(),
    });

    if (paymentConfig.mode === 'simulated') {
      // ── Simulated mode: adjust balances directly ──────────────────────────
      await fromAccount.update({
        balance: parseFloat(String(fromAccount.balance)) - amountNum,
        availableBalance: available - amountNum,
        lastBalanceUpdate: new Date(),
      });
      await toAccount.update({
        balance: parseFloat(String(toAccount.balance)) + amountNum,
        availableBalance: parseFloat(String(toAccount.availableBalance)) + amountNum,
        lastBalanceUpdate: new Date(),
      });
      await txn.update({ status: 'completed', processedAt: new Date(), completedAt: new Date() });
    } else {
      // ── TPP mode: call bank PIS API (NextGenPSD2 Berlin Group) ────────────
      // Step 1 — Initiate payment
      // Migration note: swap paymentConfig.tpp.baseUrl to real bank URL in .env
      const tppHeaders = () => ({
        'Content-Type': 'application/json',
        'X-Request-ID': uuidv4(),
        'Date': new Date().toUTCString(),
        // TODO: add Digest, Signature, TPP-Signature-Certificate for production
      });

      const initiateRes = await axios.post(
        `${paymentConfig.tpp.baseUrl}/v1/payments/domestic-transfer`,
        {
          endToEndIdentification: txn.reference,
          debtorName: `${req.user.firstName} ${req.user.lastName}`.trim(),
          debtorAccount: { iban: fromAccount.accountNumber },
          instructedAmount: { currency: fromAccount.currency || 'MKD', amount: String(amountNum) },
          creditorAccount: { iban: toAccount.accountNumber },
          creditorName: `${toUser.firstName} ${toUser.lastName}`.trim(),
          remittanceInformationUnstructured: description || '',
        },
        { headers: tppHeaders() },
      );

      const bankPaymentId = initiateRes.data.paymentId;
      await txn.update({ paymentId: bankPaymentId });

      // Step 2 — Start authorisation (auto-approved in mock SCA_MODE=auto)
      await axios.post(
        `${paymentConfig.tpp.baseUrl}/v1/payments/domestic-transfer/${bankPaymentId}/authorisations`,
        {},
        { headers: tppHeaders() },
      );

      // Step 3 — Poll status until terminal state
      let transactionStatus = 'RCVD';
      for (let i = 0; i < 10; i++) {
        const statusRes = await axios.get(
          `${paymentConfig.tpp.baseUrl}/v1/payments/domestic-transfer/${bankPaymentId}/status`,
          { headers: tppHeaders() },
        );
        transactionStatus = statusRes.data.transactionStatus;
        if (transactionStatus === 'ACCC' || transactionStatus === 'RJCT' || transactionStatus === 'CANC') break;
        await new Promise(r => setTimeout(r, 300));
      }

      if (transactionStatus === 'ACCC') {
        await txn.update({ status: 'completed', processedAt: new Date(), completedAt: new Date() });
      } else {
        await txn.update({ status: 'failed', errorMessage: `Bank returned status: ${transactionStatus}`, failedAt: new Date() });
        return res.status(400).json({ error: `Payment rejected by bank (status: ${transactionStatus})` });
      }
    }

    // Notify recipient — fire-and-forget
    notifyUser(toUser, 'paymentRequests', {
      title: 'You received money',
      body: `${req.user.firstName} ${req.user.lastName} sent you ${amountNum.toFixed(2)} MKD`,
      data: { type: 'payment_received', transactionId: txn.id },
    });

    const full = await Transaction.findByPk(txn.id, { include: TXN_INCLUDE });
    res.status(201).json({ transaction: formatTxn(full, req.user.id) });
  } catch (error) {
    console.error('Error sending money:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// ─── POST /api/transactions/request ──────────────────────────────────────────
// Request money from another Denar user (creates a pending request they must pay).
// Body: { payerUserId, amount, description?, emoji?, privacy? }
router.post('/request', async (req, res) => {
  try {
    const { payerUserId, amount, description, emoji, privacy = 'friends' } = req.body;

    if (!payerUserId || !amount) {
      return res.status(400).json({ error: 'payerUserId and amount are required' });
    }
    if (payerUserId === req.user.id) {
      return res.status(400).json({ error: 'Cannot request money from yourself' });
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 1) {
      return res.status(400).json({ error: 'Minimum amount is 1 MKD' });
    }

    const payer = await User.findOne({ where: { id: payerUserId, isActive: true } });
    if (!payer) return res.status(404).json({ error: 'User not found' });

    // The requester's account — where they will receive the money
    const myAccount = await BankAccount.findOne({
      where: { userId: req.user.id, isActive: true },
      order: [['isDefault', 'DESC']],
    });
    if (!myAccount) return res.status(400).json({ error: 'You need a bank account to receive money' });

    // fromBankAccountId is a placeholder; updated to the payer's real account when they pay
    const txn = await Transaction.create({
      fromUserId: payerUserId,
      toUserId: req.user.id,
      fromBankAccountId: myAccount.id,
      toBankAccountId: myAccount.id,
      amount: amountNum,
      currency: 'MKD',
      fee: 0,
      totalAmount: amountNum,
      description: description || '',
      emoji: emoji || '💸',
      privacy,
      status: 'pending',
      type: 'p2p_transfer',
      isRequest: true,
      requestMessage: description || '',
      requestExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      initiatedAt: new Date(),
    });

    // Notify payer — fire-and-forget
    notifyUser(payer, 'paymentRequests', {
      title: 'Money request',
      body: `${req.user.firstName} ${req.user.lastName} is requesting ${amountNum.toFixed(2)} MKD`,
      data: { type: 'payment_request', transactionId: txn.id },
    });

    const full = await Transaction.findByPk(txn.id, { include: TXN_INCLUDE });
    res.status(201).json({ transaction: formatTxn(full, req.user.id) });
  } catch (error) {
    console.error('Error creating money request:', error);
    res.status(500).json({ error: 'Failed to create money request' });
  }
});

// ─── POST /api/transactions/:id/pay ──────────────────────────────────────────
// Pay a pending money request that was sent to the current user.
// Body: { fromBankAccountId }
router.post('/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { fromBankAccountId } = req.body;

    if (!fromBankAccountId) {
      return res.status(400).json({ error: 'fromBankAccountId is required' });
    }

    const txn = await Transaction.findOne({
      where: { id, fromUserId: req.user.id, isRequest: true, status: 'pending' },
    });
    if (!txn) return res.status(404).json({ error: 'Pending request not found' });

    if (txn.requestExpiresAt && new Date() > new Date(txn.requestExpiresAt)) {
      await txn.update({ status: 'cancelled' });
      return res.status(400).json({ error: 'This request has expired' });
    }

    const fromAccount = await BankAccount.findOne({
      where: { id: fromBankAccountId, userId: req.user.id, isActive: true },
    });
    if (!fromAccount) return res.status(404).json({ error: 'Your bank account not found' });

    const amountNum = parseFloat(String(txn.amount));
    const available = parseFloat(String(fromAccount.availableBalance));
    if (available < amountNum) {
      return res.status(400).json({ error: `Insufficient balance. Available: ${available.toFixed(2)} MKD` });
    }

    const toAccount = await BankAccount.findByPk(txn.toBankAccountId);
    if (!toAccount) return res.status(400).json({ error: 'Recipient account not found' });

    if (paymentConfig.mode === 'simulated') {
      // ── Simulated mode: adjust balances directly ──────────────────────────
      await fromAccount.update({
        balance: parseFloat(String(fromAccount.balance)) - amountNum,
        availableBalance: available - amountNum,
        lastBalanceUpdate: new Date(),
      });
      await toAccount.update({
        balance: parseFloat(String(toAccount.balance)) + amountNum,
        availableBalance: parseFloat(String(toAccount.availableBalance)) + amountNum,
        lastBalanceUpdate: new Date(),
      });
      await txn.update({
        fromBankAccountId,
        status: 'completed',
        processedAt: new Date(),
        completedAt: new Date(),
      });
    } else {
      // ── TPP mode: call bank PIS API ────────────────────────────────────────
      const tppHeaders = () => ({
        'Content-Type': 'application/json',
        'X-Request-ID': uuidv4(),
        'Date': new Date().toUTCString(),
      });

      const requesterAccount = toAccount;
      const requesterUser = await User.findByPk(txn.toUserId);

      const initiateRes = await axios.post(
        `${paymentConfig.tpp.baseUrl}/v1/payments/domestic-transfer`,
        {
          endToEndIdentification: txn.reference,
          debtorName: `${req.user.firstName} ${req.user.lastName}`.trim(),
          debtorAccount: { iban: fromAccount.accountNumber },
          instructedAmount: { currency: txn.currency || 'MKD', amount: String(amountNum) },
          creditorAccount: { iban: requesterAccount.accountNumber },
          creditorName: requesterUser
            ? `${requesterUser.firstName} ${requesterUser.lastName}`.trim()
            : 'Denar User',
          remittanceInformationUnstructured: txn.description || '',
        },
        { headers: tppHeaders() },
      );

      const bankPaymentId = initiateRes.data.paymentId;

      await axios.post(
        `${paymentConfig.tpp.baseUrl}/v1/payments/domestic-transfer/${bankPaymentId}/authorisations`,
        {},
        { headers: tppHeaders() },
      );

      let transactionStatus = 'RCVD';
      for (let i = 0; i < 10; i++) {
        const statusRes = await axios.get(
          `${paymentConfig.tpp.baseUrl}/v1/payments/domestic-transfer/${bankPaymentId}/status`,
          { headers: tppHeaders() },
        );
        transactionStatus = statusRes.data.transactionStatus;
        if (transactionStatus === 'ACCC' || transactionStatus === 'RJCT' || transactionStatus === 'CANC') break;
        await new Promise(r => setTimeout(r, 300));
      }

      if (transactionStatus === 'ACCC') {
        await txn.update({
          fromBankAccountId,
          paymentId: bankPaymentId,
          status: 'completed',
          processedAt: new Date(),
          completedAt: new Date(),
        });
      } else {
        await txn.update({ status: 'failed', errorMessage: `Bank returned status: ${transactionStatus}`, failedAt: new Date() });
        return res.status(400).json({ error: `Payment rejected by bank (status: ${transactionStatus})` });
      }
    }

    // Notify the requester that they were paid — fire-and-forget
    const requester = await User.findByPk(txn.toUserId);
    if (requester) {
      notifyUser(requester, 'paymentRequests', {
        title: 'Request paid',
        body: `${req.user.firstName} ${req.user.lastName} paid your request of ${amountNum.toFixed(2)} MKD`,
        data: { type: 'request_paid', transactionId: txn.id },
      });
    }

    const full = await Transaction.findByPk(txn.id, { include: TXN_INCLUDE });
    res.json({ transaction: formatTxn(full, req.user.id) });
  } catch (error) {
    console.error('Error paying request:', error);
    res.status(500).json({ error: 'Failed to pay request' });
  }
});

// ─── GET /api/transactions ────────────────────────────────────────────────────
// Transaction history for the current user (sent + received, no requests).
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const txns = await Transaction.findAll({
      where: {
        [Op.or]: [{ fromUserId: req.user.id }, { toUserId: req.user.id }],
        isRequest: false,
        status: { [Op.ne]: 'cancelled' },
      },
      include: TXN_INCLUDE,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({ transactions: txns.map(t => formatTxn(t, req.user.id)) });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// ─── GET /api/transactions/pending-requests ───────────────────────────────────
// Money requests directed AT the current user that are still unpaid.
router.get('/pending-requests', async (req, res) => {
  try {
    const requests = await Transaction.findAll({
      where: {
        fromUserId: req.user.id,
        isRequest: true,
        status: 'pending',
      },
      include: TXN_INCLUDE,
      order: [['createdAt', 'DESC']],
    });
    res.json({ requests: requests.map(t => formatTxn(t, req.user.id)) });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

module.exports = router;
