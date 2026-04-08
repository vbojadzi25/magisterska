const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');

class SparkasseBankingService {
  constructor(config) {
    this.baseUrl = config.baseUrl || process.env.SPARKASSE_API_URL;
    this.clientId = config.clientId || process.env.SPARKASSE_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.SPARKASSE_CLIENT_SECRET;
    this.tenantId = config.tenantId || process.env.SPARKASSE_TENANT_ID;
    this.isMockMode = config.mockMode || process.env.MOCK_BANKING_API === 'true';

    // Mock data for development
    this.mockData = {
      accounts: [
        {
          resourceId: 'ACC_MK_001',
          iban: 'MK07200002785123456',
          currency: 'MKD',
          accountType: 'CURRENT',
          cashAccountType: 'CACC',
          name: 'My Checking Account',
          balances: [{
            balanceType: 'INTERIM_BOOKED',
            balanceAmount: { amount: '15420.50', currency: 'MKD' },
            lastChangeDateTime: '2024-03-06T10:30:00Z'
          }]
        },
        {
          resourceId: 'ACC_MK_002',
          iban: 'MK07200002785654321',
          currency: 'MKD',
          accountType: 'SAVINGS',
          cashAccountType: 'SVGS',
          name: 'My Savings Account',
          balances: [{
            balanceType: 'INTERIM_BOOKED',
            balanceAmount: { amount: '45890.75', currency: 'MKD' },
            lastChangeDateTime: '2024-03-06T10:30:00Z'
          }]
        }
      ],
      transactions: [
        {
          transactionId: 'TXN_001',
          bookingDate: '2024-03-06',
          valueDate: '2024-03-06',
          transactionAmount: { amount: '-150.00', currency: 'MKD' },
          creditorName: 'Grocery Store',
          remittanceInformationUnstructured: 'Weekly shopping',
          bankTransactionCode: 'PMNT'
        },
        {
          transactionId: 'TXN_002',
          bookingDate: '2024-03-05',
          valueDate: '2024-03-05',
          transactionAmount: { amount: '+1200.00', currency: 'MKD' },
          debtorName: 'Employer Corp',
          remittanceInformationUnstructured: 'Salary payment',
          bankTransactionCode: 'RCDT'
        }
      ],
      consents: new Map(),
      payments: new Map()
    };
  }

  // ============ AUTHENTICATION METHODS ============

  /**
   * Register TPP client (OAuth2 registration)
   */
  async registerClient(registrationData) {
    if (this.isMockMode) {
      return this._mockRegisterClient(registrationData);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/authentication/tenants/${this.tenantId}/connect/register/mtls`,
        registrationData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          // In production, include mTLS certificates
          // httpsAgent: new https.Agent({
          //   cert: fs.readFileSync(process.env.QWAC_CERTIFICATE_PATH),
          //   key: fs.readFileSync(process.env.QWAC_KEY_PATH),
          // })
        }
      );

      return response.data;
    } catch (error) {
      logger.error('TPP registration failed', error);
      throw new APIError('Failed to register TPP client', 500);
    }
  }

  /**
   * Generate PKCE code challenge and verifier
   */
  generatePKCE() {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256'
    };
  }

  /**
   * Get authorization URL for OAuth2 flow
   */
  getAuthorizationUrl(scope, redirectUri, state) {
    const pkce = this.generatePKCE();

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: scope, // 'AIS PIS PIIS openid'
      state: state,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: pkce.codeChallengeMethod
    });

    const authUrl = `${this.baseUrl}/v1/authentication/tenants/${this.tenantId}/connect/authorize?${params}`;

    return {
      authorizationUrl: authUrl,
      codeVerifier: pkce.codeVerifier,
      state: state
    };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(authorizationCode, codeVerifier, redirectUri) {
    if (this.isMockMode) {
      return this._mockExchangeToken(authorizationCode);
    }

    try {
      const formData = new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code_verifier: codeVerifier
      });

      const response = await axios.post(
        `${this.baseUrl}/v1/authentication/tenants/${this.tenantId}/connect/token`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Token exchange failed', error);
      throw new APIError('Failed to exchange authorization code for token', 400);
    }
  }

  // ============ ACCOUNT INFORMATION SERVICE (AIS) ============

  /**
   * Create AIS consent
   */
  async createConsent(consentData, accessToken) {
    if (this.isMockMode) {
      return this._mockCreateConsent(consentData);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/consents`,
        consentData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Request-ID': crypto.randomUUID(),
            'Date': new Date().toISOString()
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('AIS consent creation failed', error);
      throw new APIError('Failed to create AIS consent', 400);
    }
  }

  /**
   * Get consent status
   */
  async getConsentStatus(consentId, accessToken) {
    if (this.isMockMode) {
      return this._mockGetConsentStatus(consentId);
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/consents/${consentId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Request-ID': crypto.randomUUID(),
            'Date': new Date().toISOString()
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Get consent status failed', error);
      throw new APIError('Failed to get consent status', 400);
    }
  }

  /**
   * Get account list
   */
  async getAccounts(consentId, accessToken, withBalance = false) {
    if (this.isMockMode) {
      return this._mockGetAccounts(withBalance);
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/accounts?withBalance=${withBalance}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Consent-ID': consentId,
            'X-Request-ID': crypto.randomUUID(),
            'Date': new Date().toISOString()
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Get accounts failed', error);
      throw new APIError('Failed to get accounts', 400);
    }
  }

  /**
   * Get account balances
   */
  async getAccountBalances(accountId, consentId, accessToken) {
    if (this.isMockMode) {
      return this._mockGetAccountBalances(accountId);
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/accounts/${accountId}/balances`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Consent-ID': consentId,
            'X-Request-ID': crypto.randomUUID(),
            'Date': new Date().toISOString()
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Get account balances failed', error);
      throw new APIError('Failed to get account balances', 400);
    }
  }

  /**
   * Get account transactions
   */
  async getAccountTransactions(accountId, consentId, accessToken, options = {}) {
    if (this.isMockMode) {
      return this._mockGetAccountTransactions(accountId, options);
    }

    const params = new URLSearchParams();
    if (options.dateFrom) params.append('dateFrom', options.dateFrom);
    if (options.dateTo) params.append('dateTo', options.dateTo);
    if (options.bookingStatus) params.append('bookingStatus', options.bookingStatus);

    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/accounts/${accountId}/transactions?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Consent-ID': consentId,
            'X-Request-ID': crypto.randomUUID(),
            'Date': new Date().toISOString()
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Get account transactions failed', error);
      throw new APIError('Failed to get account transactions', 400);
    }
  }

  // ============ PAYMENT INITIATION SERVICE (PIS) ============

  /**
   * Initiate payment
   */
  async initiatePayment(paymentData, accessToken) {
    if (this.isMockMode) {
      return this._mockInitiatePayment(paymentData);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/payments/domestic-credit-transfers`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Request-ID': crypto.randomUUID(),
            'Date': new Date().toISOString()
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Payment initiation failed', error);
      throw new APIError('Failed to initiate payment', 400);
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId, accessToken) {
    if (this.isMockMode) {
      return this._mockGetPaymentStatus(paymentId);
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/payments/domestic-credit-transfers/${paymentId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Request-ID': crypto.randomUUID(),
            'Date': new Date().toISOString()
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Get payment status failed', error);
      throw new APIError('Failed to get payment status', 400);
    }
  }

  // ============ MOCK IMPLEMENTATIONS FOR DEVELOPMENT ============

  _mockRegisterClient(registrationData) {
    return {
      client_id: `${this.clientId || 'mock.client'}`,
      client_secret: crypto.randomBytes(16).toString('hex'),
      client_name: 'Denar Money Transfer App',
      grant_types: 'authorization_code,client_credentials',
      scope: 'PIS AIS PIIS openid',
      client_uri: registrationData.client_uri,
      logo_uri: registrationData.logo_uri,
      redirect_uris: registrationData.redirect_uris,
      post_logout_redirect_uris: registrationData.post_logout_redirect_uris
    };
  }

  _mockExchangeToken(authorizationCode) {
    return {
      access_token: crypto.randomBytes(32).toString('hex'),
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: crypto.randomBytes(32).toString('hex'),
      scope: 'PIS AIS PIIS openid'
    };
  }

  _mockCreateConsent(consentData) {
    const consentId = crypto.randomUUID();
    const consent = {
      consentId,
      consentStatus: 'received',
      validUntil: '2024-06-06',
      frequencyPerDay: 4,
      lastActionDate: new Date().toISOString().split('T')[0],
      ...consentData
    };

    this.mockData.consents.set(consentId, consent);

    return {
      consentId,
      consentStatus: 'received',
      _links: {
        scaOAuth: `${this.baseUrl}/oauth?consentId=${consentId}`,
        self: `${this.baseUrl}/v1/consents/${consentId}`,
        status: `${this.baseUrl}/v1/consents/${consentId}/status`
      }
    };
  }

  _mockGetConsentStatus(consentId) {
    const consent = this.mockData.consents.get(consentId);
    if (!consent) {
      throw new APIError('Consent not found', 404);
    }

    return {
      consentStatus: consent.consentStatus || 'valid'
    };
  }

  _mockGetAccounts(withBalance = false) {
    const accounts = this.mockData.accounts.map(account => {
      const result = {
        resourceId: account.resourceId,
        iban: account.iban,
        currency: account.currency,
        accountType: account.accountType,
        cashAccountType: account.cashAccountType,
        name: account.name
      };

      if (withBalance) {
        result.balances = account.balances;
      }

      return result;
    });

    return {
      accounts: accounts
    };
  }

  _mockGetAccountBalances(accountId) {
    const account = this.mockData.accounts.find(acc => acc.resourceId === accountId);
    if (!account) {
      throw new APIError('Account not found', 404);
    }

    return {
      account: {
        iban: account.iban
      },
      balances: account.balances
    };
  }

  _mockGetAccountTransactions(accountId, options = {}) {
    const account = this.mockData.accounts.find(acc => acc.resourceId === accountId);
    if (!account) {
      throw new APIError('Account not found', 404);
    }

    let transactions = [...this.mockData.transactions];

    // Apply date filtering if provided
    if (options.dateFrom) {
      transactions = transactions.filter(tx => tx.bookingDate >= options.dateFrom);
    }
    if (options.dateTo) {
      transactions = transactions.filter(tx => tx.bookingDate <= options.dateTo);
    }

    return {
      account: {
        iban: account.iban
      },
      transactions: {
        booked: transactions
      }
    };
  }

  _mockInitiatePayment(paymentData) {
    const paymentId = crypto.randomUUID();
    const payment = {
      paymentId,
      transactionStatus: 'RCVD',
      ...paymentData
    };

    this.mockData.payments.set(paymentId, payment);

    return {
      transactionStatus: 'RCVD',
      paymentId: paymentId,
      _links: {
        startAuthorisation: `${this.baseUrl}/v1/payments/domestic-credit-transfers/${paymentId}/authorisations`,
        self: `${this.baseUrl}/v1/payments/domestic-credit-transfers/${paymentId}`,
        status: `${this.baseUrl}/v1/payments/domestic-credit-transfers/${paymentId}/status`
      }
    };
  }

  _mockGetPaymentStatus(paymentId) {
    const payment = this.mockData.payments.get(paymentId);
    if (!payment) {
      throw new APIError('Payment not found', 404);
    }

    // Simulate payment processing
    const statuses = ['RCVD', 'PDNG', 'ACTC', 'ACCC'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      transactionStatus: randomStatus
    };
  }
}

module.exports = SparkasseBankingService;