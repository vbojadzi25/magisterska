/**
 * Denar Mock Bank Server
 *
 * Simulates the NextGenPSD2 Berlin Group bank API (PIS + AIS).
 * Runs on port 3001 by default.
 *
 * Environment variables:
 *   PORT              — server port (default: 3001)
 *   SCA_MODE          — 'auto' (default) or 'redirect'
 *                       auto: POST authorisations immediately approves + executes payment
 *                       redirect: returns scaOAuth URL for manual approval via browser
 *   MOCK_BANK_BASE_URL — public base URL for _links (default: http://localhost:3001)
 *   TPP_REDIRECT_URI  — where to redirect after OAuth approval (default: http://localhost:3000/api/banks/link/callback)
 *
 * Usage:
 *   npm start            (or: node index.js)
 *   SCA_MODE=redirect node index.js   # test full SCA redirect flow
 *
 * Migration to real bank:
 *   In api/.env, change:
 *     PAYMENT_MODE=tpp
 *     TPP_BASE_URL=https://real-bank-host
 *   Then swap the mock mTLS certs for real eIDAS certificates.
 *   All Denar API code calling /v1/payments/... stays identical.
 */

const express = require('express');
const cors = require('cors');

const pisRouter = require('./src/routes/pis');
const aisRouter = require('./src/routes/ais');
const oauthRouter = require('./src/routes/oauth');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // needed for OAuth form POST

// Log every request for development visibility
app.use((req, res, next) => {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// PIS — payment initiation (all payment-service/payment-product combinations)
app.use('/v1', pisRouter);

// AIS — account information + consent management
app.use('/v1', aisRouter);

// Mock OAuth / SCA pages
app.use('/mock-oauth', oauthRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'denar-mock-bank',
    scaMode: process.env.SCA_MODE || 'auto',
    baseUrl: process.env.MOCK_BANK_BASE_URL || `http://localhost:${PORT}`,
    endpoints: {
      pis: {
        initiatePayment:     'POST /v1/payments/domestic-transfer',
        getPayment:          'GET  /v1/payments/domestic-transfer/:paymentId',
        getPaymentStatus:    'GET  /v1/payments/domestic-transfer/:paymentId/status',
        startAuthorisation:  'POST /v1/payments/domestic-transfer/:paymentId/authorisations',
        confirmAuthorisation:'PUT  /v1/payments/domestic-transfer/:paymentId/authorisations/:authorisationId',
        cancelPayment:       'DELETE /v1/payments/domestic-transfer/:paymentId',
      },
      ais: {
        createConsent:       'POST /v1/consents',
        getConsent:          'GET  /v1/consents/:consentId',
        getConsentStatus:    'GET  /v1/consents/:consentId/status',
        deleteConsent:       'DELETE /v1/consents/:consentId',
        startConsentAuth:    'POST /v1/consents/:consentId/authorisations',
        confirmConsentAuth:  'PUT  /v1/consents/:consentId/authorisations/:authorisationId',
        getAccounts:         'GET  /v1/accounts',
        getAccount:          'GET  /v1/accounts/:accountId',
        getBalances:         'GET  /v1/accounts/:accountId/balances',
        getTransactions:     'GET  /v1/accounts/:accountId/transactions',
      },
      oauth: {
        paymentApproval: 'GET  /mock-oauth/authorize?paymentId=&authorisationId=&redirectUri=',
        consentApproval: 'GET  /mock-oauth/consent?consentId=&authorisationId=&redirectUri=',
      },
    },
  });
});

// ─── 404 catch-all ────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    tppMessages: [{ category: 'ERROR', code: 'SERVICE_INVALID', text: `Route ${req.method} ${req.path} not found`, path: 'path' }],
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🏦  Mock Bank running on http://localhost:${PORT}`);
  console.log(`    SCA mode: ${process.env.SCA_MODE || 'auto'}`);
  console.log(`    Health:   http://localhost:${PORT}/health\n`);
});
