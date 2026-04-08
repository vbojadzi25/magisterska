module.exports = {
  up: async (queryInterface, Sequelize) => {
    const banks = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Štedilnica Bank AD Skopje (Sparkasse)',
        code: 'SPARKASSE_MK',
        swiftCode: 'STBAMK22',
        nbrCode: '200',
        country: 'MK',
        logoUrl: 'https://www.sparkasse.mk/assets/images/logo.png',
        supportedCurrencies: JSON.stringify(['MKD', 'EUR', 'USD']),
        supportsPSD2: true,
        supportsSEPA: true,
        maxTransactionAmount: 500000.00,
        dailyTransactionLimit: 100000.00,
        monthlyTransactionLimit: 1000000.00,
        transactionFee: 0.00,
        interBankFee: 25.00,
        processingTime: 'instant',
        apiConfig: JSON.stringify({
          baseUrl: 'https://auth.dev.mk.open-bank.io',
          clientId: process.env.SPARKASSE_CLIENT_ID || 'sparkasse_client',
          authorizationEndpoint: '/v1/authentication/tenants/{tenant-id}/connect/authorize',
          tokenEndpoint: '/v1/authentication/tenants/{tenant-id}/connect/token',
          accountsEndpoint: '/v1/accounts',
          paymentsEndpoint: '/v1/payments/domestic-credit-transfers',
          scopes: ['AIS', 'PIS', 'PIIS', 'openid']
        }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Komercijalna Banka AD Skopje',
        code: 'KOMBANK_MK',
        swiftCode: 'KOBAMK22',
        nbrCode: '300',
        country: 'MK',
        logoUrl: 'https://www.kb.com.mk/assets/images/logo.png',
        supportedCurrencies: JSON.stringify(['MKD', 'EUR', 'USD']),
        supportsPSD2: false,
        supportsSEPA: true,
        maxTransactionAmount: 1000000.00,
        dailyTransactionLimit: 200000.00,
        monthlyTransactionLimit: 2000000.00,
        transactionFee: 50.00,
        interBankFee: 75.00,
        processingTime: '1-2 hours',
        apiConfig: JSON.stringify({
          baseUrl: 'https://api.kb.com.mk',
          clientId: process.env.KOMERCIJALNA_CLIENT_ID || 'kombank_client',
          authorizationEndpoint: '/oauth2/authorize',
          tokenEndpoint: '/oauth2/token',
          accountsEndpoint: '/api/v1/accounts',
          paymentsEndpoint: '/api/v1/payments',
          scopes: ['accounts', 'payments']
        }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Stopanska Banka AD Skopje',
        code: 'STBMK_MK',
        swiftCode: 'STBAMK22',
        nbrCode: '250',
        country: 'MK',
        logoUrl: 'https://www.stb.com.mk/assets/images/logo.png',
        supportedCurrencies: JSON.stringify(['MKD', 'EUR']),
        supportsPSD2: false,
        supportsSEPA: true,
        maxTransactionAmount: 750000.00,
        dailyTransactionLimit: 150000.00,
        monthlyTransactionLimit: 1500000.00,
        transactionFee: 30.00,
        interBankFee: 50.00,
        processingTime: '1 business day',
        apiConfig: JSON.stringify({
          baseUrl: 'https://api.stb.com.mk',
          clientId: process.env.STOPANSKA_CLIENT_ID || 'stb_client',
          authorizationEndpoint: '/auth/authorize',
          tokenEndpoint: '/auth/token',
          accountsEndpoint: '/v1/accounts',
          paymentsEndpoint: '/v1/transfers',
          scopes: ['read_accounts', 'initiate_payments']
        }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'NLB Banka AD Skopje',
        code: 'NLBMK_MK',
        swiftCode: 'NLBVMK22',
        nbrCode: '365',
        country: 'MK',
        logoUrl: 'https://www.nlb.mk/assets/images/logo.png',
        supportedCurrencies: JSON.stringify(['MKD', 'EUR', 'USD']),
        supportsPSD2: true,
        supportsSEPA: true,
        maxTransactionAmount: 600000.00,
        dailyTransactionLimit: 120000.00,
        monthlyTransactionLimit: 1200000.00,
        transactionFee: 25.00,
        interBankFee: 40.00,
        processingTime: 'instant',
        apiConfig: JSON.stringify({
          baseUrl: 'https://api.nlb.mk',
          clientId: process.env.NLB_CLIENT_ID || 'nlb_client',
          authorizationEndpoint: '/psd2/authorize',
          tokenEndpoint: '/psd2/token',
          accountsEndpoint: '/psd2/v1/accounts',
          paymentsEndpoint: '/psd2/v1/payments',
          scopes: ['AIS', 'PIS', 'openid']
        }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'Silk Road Bank AD Skopje',
        code: 'SILKBANK_MK',
        swiftCode: 'SILKMK22',
        nbrCode: '610',
        country: 'MK',
        logoUrl: 'https://www.silkroadbank.com.mk/assets/images/logo.png',
        supportedCurrencies: JSON.stringify(['MKD', 'EUR']),
        supportsPSD2: false,
        supportsSEPA: false,
        maxTransactionAmount: 300000.00,
        dailyTransactionLimit: 50000.00,
        monthlyTransactionLimit: 500000.00,
        transactionFee: 35.00,
        interBankFee: 60.00,
        processingTime: '2-4 hours',
        apiConfig: JSON.stringify({
          baseUrl: 'https://api.silkroadbank.com.mk',
          clientId: process.env.SILK_CLIENT_ID || 'silk_client',
          authorizationEndpoint: '/api/oauth/authorize',
          tokenEndpoint: '/api/oauth/token',
          accountsEndpoint: '/api/v1/accounts',
          paymentsEndpoint: '/api/v1/payments',
          scopes: ['account_info', 'payment_initiation']
        }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return queryInterface.bulkInsert('banks', banks);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('banks', null, {});
  }
};