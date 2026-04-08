const { body, query, param, validationResult } = require('express-validator');
const SparkasseBankingService = require('../services/bankingService');
const { BankAccount, Bank, User, Transaction } = require('../models');
const { APIError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Initialize Sparkasse service
const sparkasseService = new SparkasseBankingService({
  mockMode: process.env.MOCK_BANKING_API === 'true'
});

// ============ OAUTH2 & CONSENT MANAGEMENT ============

/**
 * Initiate bank account linking flow
 * GET /api/banks/link/start/:bankId
 */
const startAccountLinking = async (req, res, next) => {
  try {
    const { bankId } = req.params;
    const userId = req.user.id;

    // Get bank details
    const bank = await Bank.findByPk(bankId);
    if (!bank) {
      return next(new APIError('Bank not found', 404));
    }

    // Generate OAuth2 authorization URL
    const redirectUri = `${process.env.API_BASE_URL}/api/banks/link/callback`;
    const state = crypto.randomBytes(16).toString('hex');
    const scope = 'AIS PIS openid'; // Request both account info and payment initiation

    const authData = sparkasseService.getAuthorizationUrl(scope, redirectUri, state);

    // Store state and code verifier in session/cache for security
    // In production, use Redis or secure session storage
    req.session = req.session || {};
    req.session.oauth = {
      bankId,
      userId,
      state: authData.state,
      codeVerifier: authData.codeVerifier,
      redirectUri
    };

    logger.info('Bank account linking initiated', {
      userId,
      bankId,
      state: authData.state
    });

    res.json({
      success: true,
      data: {
        authorizationUrl: authData.authorizationUrl,
        bankName: bank.name,
        message: 'Redirect user to authorization URL to complete account linking'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle OAuth2 callback from bank
 * GET /api/banks/link/callback
 */
const handleAccountLinkingCallback = async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      logger.error('OAuth2 callback error', { error });
      return next(new APIError(`Authorization failed: ${error}`, 400));
    }

    // Verify state parameter
    const sessionData = req.session?.oauth;
    if (!sessionData || sessionData.state !== state) {
      return next(new APIError('Invalid state parameter', 400));
    }

    // Exchange authorization code for access token
    const tokenData = await sparkasseService.exchangeCodeForToken(
      code,
      sessionData.codeVerifier,
      sessionData.redirectUri
    );

    // Create AIS consent to access account information
    const consentData = {
      access: {
        availableAccounts: 'allAccounts',
        balances: 'allAccounts',
        transactions: 'allAccounts'
      },
      recurringIndicator: true,
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days
      frequencyPerDay: 4
    };

    const consent = await sparkasseService.createConsent(consentData, tokenData.access_token);

    // Get user's accounts from the bank
    const accountsData = await sparkasseService.getAccounts(
      consent.consentId,
      tokenData.access_token,
      true // withBalance
    );

    // Store bank accounts in our database
    const createdAccounts = [];
    for (const bankAccount of accountsData.accounts) {
      const account = await BankAccount.create({
        userId: sessionData.userId,
        bankId: sessionData.bankId,
        accountNumber: bankAccount.iban,
        iban: bankAccount.iban,
        accountName: bankAccount.name,
        accountType: bankAccount.accountType.toLowerCase(),
        currency: bankAccount.currency,
        balance: bankAccount.balances?.[0]?.balanceAmount?.amount || 0,
        isVerified: true,
        consentId: consent.consentId,
        consentExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        // Store encrypted access token (in production, use proper encryption)
        encryptedDetails: JSON.stringify({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          resourceId: bankAccount.resourceId
        })
      });

      createdAccounts.push(account);
    }

    // Clear session data
    delete req.session.oauth;

    logger.info('Bank account linking completed', {
      userId: sessionData.userId,
      bankId: sessionData.bankId,
      accountsCount: createdAccounts.length
    });

    res.json({
      success: true,
      data: {
        message: 'Bank accounts successfully linked',
        accounts: createdAccounts.map(acc => ({
          id: acc.id,
          accountName: acc.accountName,
          iban: acc.iban,
          currency: acc.currency,
          balance: acc.balance
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============ ACCOUNT INFORMATION ENDPOINTS ============

/**
 * Get user's linked bank accounts
 * GET /api/banks/accounts
 */
const getUserBankAccounts = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const accounts = await BankAccount.findAll({
      where: {
        userId,
        isActive: true
      },
      include: [{
        model: Bank,
        as: 'bank',
        attributes: ['id', 'name', 'code', 'logoUrl']
      }],
      attributes: { exclude: ['encryptedDetails'] } // Don't expose sensitive data
    });

    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh account balance from bank
 * POST /api/banks/accounts/:accountId/refresh
 */
const refreshAccountBalance = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.id;

    const bankAccount = await BankAccount.findOne({
      where: { id: accountId, userId },
      include: [{ model: Bank, as: 'bank' }]
    });

    if (!bankAccount) {
      return next(new APIError('Bank account not found', 404));
    }

    // Decrypt stored credentials
    const credentials = JSON.parse(bankAccount.encryptedDetails);

    // Check if consent is still valid
    if (new Date() > new Date(bankAccount.consentExpiresAt)) {
      return next(new APIError('Bank consent expired. Please re-link your account.', 400));
    }

    // Fetch fresh balance from bank
    const balanceData = await sparkasseService.getAccountBalances(
      credentials.resourceId,
      bankAccount.consentId,
      credentials.accessToken
    );

    // Update balance in database
    const newBalance = balanceData.balances[0]?.balanceAmount?.amount || 0;
    bankAccount.balance = newBalance;
    bankAccount.lastBalanceUpdate = new Date();
    await bankAccount.save();

    logger.info('Account balance refreshed', {
      userId,
      accountId,
      newBalance
    });

    res.json({
      success: true,
      data: {
        balance: newBalance,
        currency: bankAccount.currency,
        lastUpdated: bankAccount.lastBalanceUpdate
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get account transactions from bank
 * GET /api/banks/accounts/:accountId/transactions
 */
const getAccountTransactions = [
  query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new APIError('Validation failed', 400));
      }

      const { accountId } = req.params;
      const { dateFrom, dateTo, limit = 50 } = req.query;
      const userId = req.user.id;

      const bankAccount = await BankAccount.findOne({
        where: { id: accountId, userId },
        include: [{ model: Bank, as: 'bank' }]
      });

      if (!bankAccount) {
        return next(new APIError('Bank account not found', 404));
      }

      const credentials = JSON.parse(bankAccount.encryptedDetails);

      // Check consent validity
      if (new Date() > new Date(bankAccount.consentExpiresAt)) {
        return next(new APIError('Bank consent expired. Please re-link your account.', 400));
      }

      // Fetch transactions from bank
      const transactionsData = await sparkasseService.getAccountTransactions(
        credentials.resourceId,
        bankAccount.consentId,
        credentials.accessToken,
        {
          dateFrom: dateFrom ? dateFrom.split('T')[0] : undefined,
          dateTo: dateTo ? dateTo.split('T')[0] : undefined,
          bookingStatus: 'booked'
        }
      );

      // Transform bank transactions to our format
      const transactions = transactionsData.transactions.booked
        .slice(0, limit)
        .map(tx => ({
          id: tx.transactionId,
          date: tx.bookingDate,
          amount: parseFloat(tx.transactionAmount.amount),
          currency: tx.transactionAmount.currency,
          description: tx.remittanceInformationUnstructured || tx.creditorName || tx.debtorName,
          type: parseFloat(tx.transactionAmount.amount) > 0 ? 'credit' : 'debit',
          counterparty: tx.creditorName || tx.debtorName,
          reference: tx.endToEndId || tx.transactionId
        }));

      res.json({
        success: true,
        data: {
          transactions,
          account: {
            id: bankAccount.id,
            name: bankAccount.accountName,
            iban: bankAccount.iban
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
];

// ============ PAYMENT INITIATION ENDPOINTS ============

/**
 * Initiate a payment between Denar users
 * POST /api/banks/payments/initiate
 */
const initiatePayment = [
  body('fromAccountId').isUUID().withMessage('Valid fromAccountId required'),
  body('toAccountId').optional().isUUID().withMessage('Invalid toAccountId'),
  body('toIban').optional().isLength({ min: 15, max: 34 }).withMessage('Invalid IBAN'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').isLength({ min: 3, max: 3 }).withMessage('Invalid currency code'),
  body('description').optional().isLength({ max: 255 }).withMessage('Description too long'),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new APIError('Validation failed', 400));
      }

      const {
        fromAccountId,
        toAccountId,
        toIban,
        amount,
        currency,
        description
      } = req.body;
      const userId = req.user.id;

      // Get sender's account
      const fromAccount = await BankAccount.findOne({
        where: { id: fromAccountId, userId },
        include: [{ model: Bank, as: 'bank' }]
      });

      if (!fromAccount) {
        return next(new APIError('Source account not found', 404));
      }

      // Determine recipient details
      let recipientData;
      if (toAccountId) {
        // Internal Denar transfer
        const toAccount = await BankAccount.findOne({
          where: { id: toAccountId },
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName']
          }]
        });

        if (!toAccount) {
          return next(new APIError('Recipient account not found', 404));
        }

        recipientData = {
          iban: toAccount.iban,
          name: `${toAccount.user.firstName} ${toAccount.user.lastName}`,
          isDenarUser: true,
          userId: toAccount.userId
        };
      } else if (toIban) {
        // External transfer
        recipientData = {
          iban: toIban,
          name: description || 'External Transfer',
          isDenarUser: false
        };
      } else {
        return next(new APIError('Either toAccountId or toIban must be provided', 400));
      }

      // Calculate fee based on transfer type
      const fee = recipientData.isDenarUser ? 0 : 25; // Free for Denar users, 25 MKD for external

      // Create transaction record
      const transaction = await Transaction.create({
        fromUserId: userId,
        toUserId: recipientData.userId || null,
        fromBankAccountId: fromAccountId,
        toBankAccountId: toAccountId || null,
        toAccountNumber: recipientData.iban,
        toAccountName: recipientData.name,
        amount,
        currency,
        fee,
        totalAmount: parseFloat(amount) + fee,
        description,
        type: recipientData.isDenarUser ? 'p2p_transfer' : 'bank_transfer',
        status: 'pending'
      });

      // For mock mode, simulate payment initiation
      if (sparkasseService.isMockMode) {
        // Simulate immediate success for internal transfers
        if (recipientData.isDenarUser) {
          transaction.status = 'completed';
          transaction.processedAt = new Date();
          await transaction.save();

          logger.info('Internal payment completed', {
            transactionId: transaction.id,
            amount,
            fromUserId: userId
          });
        } else {
          // For external transfers, initiate through banking service
          const credentials = JSON.parse(fromAccount.encryptedDetails);

          const paymentData = {
            instructedAmount: {
              amount: amount.toString(),
              currency
            },
            creditorAccount: {
              iban: recipientData.iban
            },
            creditorName: recipientData.name,
            remittanceInformationUnstructured: description || `Transfer from Denar user`
          };

          const paymentResult = await sparkasseService.initiatePayment(
            paymentData,
            credentials.accessToken
          );

          transaction.externalReference = paymentResult.paymentId;
          transaction.status = 'processing';
          await transaction.save();

          logger.info('External payment initiated', {
            transactionId: transaction.id,
            paymentId: paymentResult.paymentId,
            amount
          });
        }
      }

      res.json({
        success: true,
        data: {
          transactionId: transaction.id,
          status: transaction.status,
          amount: transaction.amount,
          fee: transaction.fee,
          totalAmount: transaction.totalAmount,
          recipient: recipientData.name,
          estimatedCompletion: recipientData.isDenarUser ? 'Immediate' : '1-2 business days'
        }
      });
    } catch (error) {
      next(error);
    }
  }
];

/**
 * Get payment/transaction status
 * GET /api/banks/payments/:transactionId/status
 */
const getPaymentStatus = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({
      where: {
        id: transactionId,
        $or: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'fromUser',
          attributes: ['firstName', 'lastName']
        },
        {
          model: User,
          as: 'toUser',
          attributes: ['firstName', 'lastName']
        }
      ]
    });

    if (!transaction) {
      return next(new APIError('Transaction not found', 404));
    }

    // If external payment and still processing, check status with bank
    if (transaction.externalReference && transaction.status === 'processing') {
      try {
        const fromAccount = await BankAccount.findByPk(transaction.fromBankAccountId);
        const credentials = JSON.parse(fromAccount.encryptedDetails);

        const paymentStatus = await sparkasseService.getPaymentStatus(
          transaction.externalReference,
          credentials.accessToken
        );

        // Map bank status to our status
        const statusMap = {
          'RCVD': 'pending',
          'PDNG': 'processing',
          'ACTC': 'processing',
          'ACCC': 'completed',
          'RJCT': 'failed'
        };

        const newStatus = statusMap[paymentStatus.transactionStatus] || 'processing';

        if (newStatus !== transaction.status) {
          transaction.status = newStatus;
          if (newStatus === 'completed') {
            transaction.processedAt = new Date();
          }
          await transaction.save();
        }
      } catch (error) {
        logger.error('Failed to check payment status with bank', error);
      }
    }

    res.json({
      success: true,
      data: {
        transactionId: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        fee: transaction.fee,
        description: transaction.description,
        createdAt: transaction.createdAt,
        processedAt: transaction.processedAt,
        from: transaction.fromUser ? `${transaction.fromUser.firstName} ${transaction.fromUser.lastName}` : 'External',
        to: transaction.toUser ? `${transaction.toUser.firstName} ${transaction.toUser.lastName}` : transaction.toAccountName
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startAccountLinking,
  handleAccountLinkingCallback,
  getUserBankAccounts,
  refreshAccountBalance,
  getAccountTransactions,
  initiatePayment,
  getPaymentStatus
};