require('dotenv').config();

// Switch PAYMENT_MODE=tpp in .env when you have real TPP credentials.
// In 'tpp' mode the routes call the real bank PIS API (NextGenPSD2 / Berlin Group).
// In 'simulated' mode balances are adjusted directly in the database.

module.exports = {
  mode: process.env.PAYMENT_MODE || 'simulated', // 'simulated' | 'tpp'

  tpp: {
    // Real bank PIS/AIS API base URL
    baseUrl: process.env.TPP_BASE_URL || 'https://sandbox-host',
    // OAuth2 client credentials (from TPP registration)
    clientId: process.env.TPP_CLIENT_ID || '',
    clientSecret: process.env.TPP_CLIENT_SECRET || '',
    // mTLS certificate paths (required for PSD2 TPP authentication)
    certPath: process.env.TPP_CERT_PATH || '',
    keyPath: process.env.TPP_KEY_PATH || '',
    // Redirect URI for SCA OAuth 2.0 flow
    redirectUri: process.env.TPP_REDIRECT_URI || 'http://localhost:3000/api/banks/link/callback',
  },
};
