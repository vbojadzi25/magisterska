/**
 * Account Information Service (AIS) — NextGenPSD2 Berlin Group
 *
 * Consent endpoints:
 *   POST   /v1/consents                                               — create consent
 *   GET    /v1/consents/:consentId                                    — get consent info
 *   GET    /v1/consents/:consentId/status                             — get consent status
 *   DELETE /v1/consents/:consentId                                    — revoke consent
 *   POST   /v1/consents/:consentId/authorisations                     — start SCA for consent
 *   GET    /v1/consents/:consentId/authorisations/:authorisationId    — get auth status
 *   PUT    /v1/consents/:consentId/authorisations/:authorisationId    — confirm SCA
 *
 * Account data endpoints (require valid Consent-ID header):
 *   GET    /v1/accounts                                               — list accounts
 *   GET    /v1/accounts/:accountId                                    — account details
 *   GET    /v1/accounts/:accountId/balances                           — balances
 *   GET    /v1/accounts/:accountId/transactions                       — transaction list
 *   GET    /v1/accounts/:accountId/transactions/:transactionId        — transaction details
 */

const express = require('express');
const store = require('../store');
const { validateHeaders, requireConsent } = require('../middleware');

const router = express.Router();

const SCA_MODE = process.env.SCA_MODE || 'auto';
const BASE_URL = process.env.MOCK_BANK_BASE_URL || 'http://localhost:3001';
const TPP_REDIRECT_URI = process.env.TPP_REDIRECT_URI || 'http://localhost:3000/api/banks/link/callback';

// ─── POST /v1/consents ────────────────────────────────────────────────────────
router.post('/consents', validateHeaders, (req, res) => {
  const { access, recurringIndicator, validUntil, frequencyPerDay } = req.body;

  if (!access) {
    return res.status(400).json({
      tppMessages: [{ category: 'ERROR', code: 'FORMAT_ERROR', text: 'access is required', path: 'body.access' }],
    });
  }

  const consent = store.createConsent({ access, recurringIndicator, validUntil, frequencyPerDay });

  res.status(201).json({
    consentId: consent.consentId,
    consentStatus: consent.consentStatus,
    _links: {
      startAuthorisation: { href: `${BASE_URL}/v1/consents/${consent.consentId}/authorisations` },
      self: { href: `${BASE_URL}/v1/consents/${consent.consentId}` },
      status: { href: `${BASE_URL}/v1/consents/${consent.consentId}/status` },
    },
  });
});

// ─── GET /v1/consents/:consentId ──────────────────────────────────────────────
router.get('/consents/:consentId', validateHeaders, (req, res) => {
  const consent = store.consents.get(req.params.consentId);
  if (!consent) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Consent not found', path: 'path.consentId' }],
    });
  }
  res.json({
    consentId: consent.consentId,
    access: consent.access,
    recurringIndicator: consent.recurringIndicator,
    validUntil: consent.validUntil,
    frequencyPerDay: consent.frequencyPerDay,
    consentStatus: consent.consentStatus,
  });
});

// ─── GET /v1/consents/:consentId/status ──────────────────────────────────────
router.get('/consents/:consentId/status', validateHeaders, (req, res) => {
  const consent = store.consents.get(req.params.consentId);
  if (!consent) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Consent not found', path: 'path.consentId' }],
    });
  }
  res.json({ consentStatus: consent.consentStatus });
});

// ─── DELETE /v1/consents/:consentId ──────────────────────────────────────────
router.delete('/consents/:consentId', validateHeaders, (req, res) => {
  const consent = store.consents.get(req.params.consentId);
  if (!consent) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Consent not found', path: 'path.consentId' }],
    });
  }
  consent.consentStatus = 'terminatedByTpp';
  res.status(204).send();
});

// ─── POST /v1/consents/:consentId/authorisations ─────────────────────────────
router.post('/consents/:consentId/authorisations', validateHeaders, (req, res) => {
  const { consentId } = req.params;
  const consent = store.consents.get(consentId);
  if (!consent) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Consent not found', path: 'path.consentId' }],
    });
  }

  const auth = store.createConsentAuthorisation(consentId, SCA_MODE);
  const authHref = `${BASE_URL}/v1/consents/${consentId}/authorisations/${auth.authorisationId}`;

  const links = { self: { href: authHref } };
  if (SCA_MODE === 'redirect') {
    const scaOAuthUrl = `${BASE_URL}/mock-oauth/consent?consentId=${consentId}&authorisationId=${auth.authorisationId}&redirectUri=${encodeURIComponent(TPP_REDIRECT_URI)}`;
    links.scaOAuth = { href: scaOAuthUrl };
  }

  res.status(201).json({
    authorisationId: auth.authorisationId,
    scaStatus: auth.scaStatus,
    _links: links,
  });
});

// ─── GET /v1/consents/:consentId/authorisations/:authorisationId ──────────────
router.get('/consents/:consentId/authorisations/:authorisationId', validateHeaders, (req, res) => {
  const auth = store.consentAuths.get(req.params.authorisationId);
  if (!auth || auth.consentId !== req.params.consentId) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Authorisation not found', path: 'path.authorisationId' }],
    });
  }
  res.json({ scaStatus: auth.scaStatus, authorisationId: auth.authorisationId });
});

// ─── PUT /v1/consents/:consentId/authorisations/:authorisationId ──────────────
router.put('/consents/:consentId/authorisations/:authorisationId', validateHeaders, (req, res) => {
  const { consentId, authorisationId } = req.params;
  const { confirmationCode, scaAuthenticationData } = req.body;
  const code = confirmationCode || scaAuthenticationData;

  if (!code) {
    return res.status(400).json({
      tppMessages: [{ category: 'ERROR', code: 'FORMAT_ERROR', text: 'confirmationCode is required', path: 'body.confirmationCode' }],
    });
  }

  const auth = store.consentAuths.get(authorisationId);
  if (!auth || auth.consentId !== consentId) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Authorisation not found', path: 'path.authorisationId' }],
    });
  }

  const updated = store.confirmConsentAuthorisation(authorisationId, code);
  if (updated.scaStatus === 'failed') {
    return res.status(401).json({
      tppMessages: [{ category: 'ERROR', code: 'SCA_INVALID', text: 'Invalid confirmation code', path: 'body.confirmationCode' }],
    });
  }

  res.json({ scaStatus: updated.scaStatus, authorisationId });
});

// ─── GET /v1/accounts ─────────────────────────────────────────────────────────
// List all accounts accessible under the consent.
router.get('/accounts', validateHeaders, requireConsent(store), (req, res) => {
  const withBalance = req.query.withBalance === 'true';
  const accountList = Array.from(store.accounts.values()).map(acc => {
    const entry = {
      resourceId: acc.resourceId,
      iban: acc.iban,
      currency: acc.currency,
      name: acc.name,
      product: acc.product,
      cashAccountType: acc.cashAccountType,
      status: acc.status,
      _links: { balances: { href: `${BASE_URL}/v1/accounts/${acc.resourceId}/balances` } },
    };
    if (withBalance) {
      entry.balances = buildBalancePayload(acc);
    }
    return entry;
  });

  res.json({ accounts: accountList });
});

// ─── GET /v1/accounts/:accountId ─────────────────────────────────────────────
router.get('/accounts/:accountId', validateHeaders, requireConsent(store), (req, res) => {
  const acc = findAccountByResourceId(req.params.accountId);
  if (!acc) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Account not found', path: 'path.accountId' }],
    });
  }

  const withBalance = req.query.withBalance === 'true';
  const entry = {
    resourceId: acc.resourceId,
    iban: acc.iban,
    currency: acc.currency,
    name: acc.name,
    product: acc.product,
    cashAccountType: acc.cashAccountType,
    status: acc.status,
  };
  if (withBalance) entry.balances = buildBalancePayload(acc);
  res.json({ account: entry });
});

// ─── GET /v1/accounts/:accountId/balances ────────────────────────────────────
router.get('/accounts/:accountId/balances', validateHeaders, requireConsent(store), (req, res) => {
  const acc = findAccountByResourceId(req.params.accountId);
  if (!acc) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Account not found', path: 'path.accountId' }],
    });
  }
  res.json({ account: { iban: acc.iban }, balances: buildBalancePayload(acc) });
});

// ─── GET /v1/accounts/:accountId/transactions ────────────────────────────────
router.get('/accounts/:accountId/transactions', validateHeaders, requireConsent(store), (req, res) => {
  const acc = findAccountByResourceId(req.params.accountId);
  if (!acc) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Account not found', path: 'path.accountId' }],
    });
  }

  const bookingStatus = req.query.bookingStatus || 'booked'; // booked | pending | both
  let txns = acc.transactions;
  if (bookingStatus !== 'both') {
    txns = txns.filter(t => t.bookingStatus === bookingStatus);
  }

  res.json({
    account: { iban: acc.iban },
    transactions: {
      booked: txns.filter(t => t.bookingStatus === 'booked'),
      pending: txns.filter(t => t.bookingStatus === 'pending'),
    },
  });
});

// ─── GET /v1/accounts/:accountId/transactions/:transactionId ─────────────────
router.get('/accounts/:accountId/transactions/:transactionId', validateHeaders, requireConsent(store), (req, res) => {
  const acc = findAccountByResourceId(req.params.accountId);
  if (!acc) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Account not found', path: 'path.accountId' }],
    });
  }
  const txn = acc.transactions.find(t => t.transactionId === req.params.transactionId);
  if (!txn) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Transaction not found', path: 'path.transactionId' }],
    });
  }
  res.json({ transactionDetails: txn });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findAccountByResourceId(resourceId) {
  for (const acc of store.accounts.values()) {
    if (acc.resourceId === resourceId) return acc;
  }
  return null;
}

function buildBalancePayload(acc) {
  const now = new Date().toISOString();
  return [
    {
      balanceType: 'closingBooked',
      balanceAmount: { currency: acc.currency, amount: acc.balances.booked.toFixed(2) },
      referenceDate: now.slice(0, 10),
    },
    {
      balanceType: 'interimAvailable',
      balanceAmount: { currency: acc.currency, amount: acc.balances.available.toFixed(2) },
      lastChangeDateTime: now,
    },
  ];
}

module.exports = router;
