const express = require('express');
const { authenticate, requireKYC, optionalAuth } = require('../middleware/auth');
const {
  startAccountLinking,
  handleAccountLinkingCallback,
  getUserBankAccounts,
  refreshAccountBalance,
  getAccountTransactions,
  initiatePayment,
  getPaymentStatus
} = require('../controllers/bankController');
const { Bank, BankAccount } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

// Public endpoint to list available banks
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const banks = await Bank.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'code', 'logoUrl', 'supportedCurrencies', 'supportsPSD2'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: banks
    });
  } catch (error) {
    next(error);
  }
});

// Protected endpoints - require authentication
router.use(authenticate);

// ============ ACCOUNT LINKING ENDPOINTS ============

/**
 * @route   GET /api/banks/link/start/:bankId
 * @desc    Start bank account linking process (OAuth2 flow)
 * @access  Private
 */
router.get('/link/start/:bankId', startAccountLinking);

/**
 * @route   GET /api/banks/link/callback
 * @desc    Handle OAuth2 callback from bank
 * @access  Private (but called by bank redirect)
 */
router.get('/link/callback', handleAccountLinkingCallback);

// ============ ACCOUNT MANAGEMENT ENDPOINTS ============

/**
 * @route   GET /api/banks/accounts
 * @desc    Get user's linked bank accounts
 * @access  Private
 */
router.get('/accounts', getUserBankAccounts);

/**
 * @route   POST /api/banks/accounts
 * @desc    Manually add a bank account (simulation — no OAuth)
 * @access  Private
 */
router.post('/accounts', async (req, res, next) => {
  try {
    const { bankId, accountNumber, accountName, accountType = 'checking', currency = 'MKD' } = req.body;
    const userId = req.user.id;

    if (!bankId || !accountNumber || !accountName) {
      return next(new (require('../middleware/errorHandler').APIError)('bankId, accountNumber and accountName are required', 400));
    }

    const bank = await Bank.findByPk(bankId);
    if (!bank) return next(new (require('../middleware/errorHandler').APIError)('Bank not found', 404));

    // Check no duplicate
    const existing = await BankAccount.findOne({ where: { accountNumber, bankId } });
    if (existing) return next(new (require('../middleware/errorHandler').APIError)('This account number is already registered', 400));

    const isFirstAccount = (await BankAccount.count({ where: { userId } })) === 0;

    // Simulated balance for demo purposes
    const simulatedBalance = parseFloat((Math.random() * 150000 + 5000).toFixed(2));

    const account = await BankAccount.create({
      userId,
      bankId,
      accountNumber,
      accountName,
      accountType,
      currency,
      balance: simulatedBalance,
      availableBalance: simulatedBalance,
      lastBalanceUpdate: new Date(),
      isDefault: isFirstAccount,
      isVerified: true,
      verificationStatus: 'verified',
    });

    const accountWithBank = await BankAccount.findByPk(account.id, {
      include: [{ model: Bank, as: 'bank', attributes: ['id', 'name', 'code', 'logoUrl'] }],
      attributes: { exclude: ['encryptedDetails'] },
    });

    logger.info('Bank account added manually', { userId, bankId, accountNumber });

    res.status(201).json({ success: true, data: accountWithBank });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/banks/accounts/:accountId
 * @desc    Remove a linked bank account
 * @access  Private
 */
router.delete('/accounts/:accountId', async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.id;

    const account = await BankAccount.findOne({ where: { id: accountId, userId } });
    if (!account) return next(new (require('../middleware/errorHandler').APIError)('Account not found', 404));

    account.isActive = false;
    await account.save();

    res.json({ success: true, message: 'Account removed' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/banks/accounts/:accountId/refresh
 * @desc    Refresh account balance from bank
 * @access  Private
 */
router.post('/accounts/:accountId/refresh', refreshAccountBalance);

/**
 * @route   GET /api/banks/accounts/:accountId/transactions
 * @desc    Get account transactions from bank
 * @access  Private
 */
router.get('/accounts/:accountId/transactions', getAccountTransactions);

// ============ PAYMENT ENDPOINTS ============
// These require KYC verification for financial transactions

/**
 * @route   POST /api/banks/payments/initiate
 * @desc    Initiate a payment (P2P or external)
 * @access  Private + KYC
 */
router.post('/payments/initiate', requireKYC, initiatePayment);

/**
 * @route   GET /api/banks/payments/:transactionId/status
 * @desc    Get payment/transaction status
 * @access  Private
 */
router.get('/payments/:transactionId/status', getPaymentStatus);

module.exports = router;