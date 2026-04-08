/**
 * Payment Initiation Service (PIS) — NextGenPSD2 Berlin Group
 *
 * Endpoints (all under /v1/{payment-service}/{payment-product}):
 *
 *   POST   /v1/payments/domestic-transfer                             — initiate
 *   GET    /v1/payments/domestic-transfer/:paymentId                  — get details
 *   GET    /v1/payments/domestic-transfer/:paymentId/status           — get status
 *   POST   /v1/payments/domestic-transfer/:paymentId/authorisations   — start SCA
 *   GET    /v1/payments/domestic-transfer/:paymentId/authorisations   — list auths
 *   GET    /v1/payments/domestic-transfer/:paymentId/authorisations/:authorisationId — get auth
 *   PUT    /v1/payments/domestic-transfer/:paymentId/authorisations/:authorisationId — confirm SCA
 *   DELETE /v1/payments/domestic-transfer/:paymentId                  — cancel payment
 *
 * SCA_MODE=auto  → SCA is auto-approved on POST authorisations (default for dev).
 * SCA_MODE=redirect → returns scaOAuth URL; requires manual confirmation via PUT.
 */

const express = require('express');
const store = require('../store');
const { validateHeaders } = require('../middleware');

const router = express.Router();

const SCA_MODE = process.env.SCA_MODE || 'auto';
const BASE_URL = process.env.MOCK_BANK_BASE_URL || 'http://localhost:3001';
const TPP_REDIRECT_URI = process.env.TPP_REDIRECT_URI || 'http://localhost:3000/api/banks/link/callback';

// ─── POST /v1/:paymentService/:paymentProduct ─────────────────────────────────
// Initiate a payment. Returns paymentId and RCVD status.
router.post('/:paymentService/:paymentProduct', validateHeaders, (req, res) => {
  const { paymentService, paymentProduct } = req.params;
  const {
    endToEndIdentification,
    debtorName,
    debtorAccount,
    instructedAmount,
    creditorAccount,
    creditorName,
    remittanceInformationUnstructured,
    requestedExecutionDate,
  } = req.body;

  if (!debtorAccount?.iban) {
    return res.status(400).json({
      tppMessages: [{ category: 'ERROR', code: 'FORMAT_ERROR', text: 'debtorAccount.iban is required', path: 'body.debtorAccount.iban' }],
    });
  }
  if (!creditorAccount?.iban) {
    return res.status(400).json({
      tppMessages: [{ category: 'ERROR', code: 'FORMAT_ERROR', text: 'creditorAccount.iban is required', path: 'body.creditorAccount.iban' }],
    });
  }
  if (!instructedAmount?.amount || !instructedAmount?.currency) {
    return res.status(400).json({
      tppMessages: [{ category: 'ERROR', code: 'FORMAT_ERROR', text: 'instructedAmount.amount and currency are required', path: 'body.instructedAmount' }],
    });
  }

  const payment = store.createPayment({
    paymentService,
    paymentProduct,
    endToEndIdentification,
    debtorName,
    debtorAccount,
    instructedAmount,
    creditorAccount,
    creditorName,
    remittanceInformationUnstructured,
    requestedExecutionDate,
  });

  const selfHref = `${BASE_URL}/v1/${paymentService}/${paymentProduct}/${payment.paymentId}`;

  res.status(201).json({
    transactionStatus: payment.transactionStatus,
    paymentId: payment.paymentId,
    _links: {
      startAuthorisation: { href: `${selfHref}/authorisations` },
      self: { href: selfHref },
      status: { href: `${selfHref}/status` },
    },
  });
});

// ─── GET /v1/:paymentService/:paymentProduct/:paymentId ───────────────────────
// Get full payment details.
router.get('/:paymentService/:paymentProduct/:paymentId', validateHeaders, (req, res) => {
  const payment = store.payments.get(req.params.paymentId);
  if (!payment) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Payment not found', path: 'path.paymentId' }],
    });
  }
  res.json({
    endToEndIdentification: payment.endToEndIdentification,
    debtorAccount: payment.debtorAccount,
    instructedAmount: payment.instructedAmount,
    creditorAccount: payment.creditorAccount,
    creditorName: payment.creditorName,
    remittanceInformationUnstructured: payment.remittanceInformationUnstructured,
    requestedExecutionDate: payment.requestedExecutionDate,
    transactionStatus: payment.transactionStatus,
  });
});

// ─── GET /v1/:paymentService/:paymentProduct/:paymentId/status ────────────────
// Poll payment execution status.
router.get('/:paymentService/:paymentProduct/:paymentId/status', validateHeaders, (req, res) => {
  const payment = store.payments.get(req.params.paymentId);
  if (!payment) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Payment not found', path: 'path.paymentId' }],
    });
  }
  res.json({ transactionStatus: payment.transactionStatus });
});

// ─── POST /v1/:paymentService/:paymentProduct/:paymentId/authorisations ───────
// Start SCA authorisation.
// SCA_MODE=auto  → immediately finalised + payment ACCC.
// SCA_MODE=redirect → returns scaOAuth URL for user to complete SCA.
router.post('/:paymentService/:paymentProduct/:paymentId/authorisations', validateHeaders, (req, res) => {
  const { paymentService, paymentProduct, paymentId } = req.params;
  const payment = store.payments.get(paymentId);
  if (!payment) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Payment not found', path: 'path.paymentId' }],
    });
  }
  if (payment.transactionStatus === 'ACCC') {
    return res.status(409).json({
      tppMessages: [{ category: 'ERROR', code: 'SESSIONS_NOT_SUPPORTED', text: 'Payment is already executed', path: 'path.paymentId' }],
    });
  }

  const auth = store.createAuthorisation(paymentId, SCA_MODE);
  const authHref = `${BASE_URL}/v1/${paymentService}/${paymentProduct}/${paymentId}/authorisations/${auth.authorisationId}`;

  const links = {
    self: { href: authHref },
    status: { href: `${authHref}/status` },
  };

  if (SCA_MODE === 'redirect') {
    const scaOAuthUrl = `${BASE_URL}/mock-oauth/authorize?paymentId=${paymentId}&authorisationId=${auth.authorisationId}&redirectUri=${encodeURIComponent(TPP_REDIRECT_URI)}`;
    links.scaOAuth = { href: scaOAuthUrl };
  }

  res.status(201).json({
    authorisationId: auth.authorisationId,
    scaStatus: auth.scaStatus,
    _links: links,
  });
});

// ─── GET /v1/:paymentService/:paymentProduct/:paymentId/authorisations ────────
// List all authorisations for a payment.
router.get('/:paymentService/:paymentProduct/:paymentId/authorisations', validateHeaders, (req, res) => {
  const payment = store.payments.get(req.params.paymentId);
  if (!payment) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Payment not found', path: 'path.paymentId' }],
    });
  }
  res.json({ authorisationIds: payment.authorisationIds });
});

// ─── GET /v1/:paymentService/:paymentProduct/:paymentId/authorisations/:authId ─
// Get a single authorisation (check scaStatus).
router.get('/:paymentService/:paymentProduct/:paymentId/authorisations/:authorisationId', validateHeaders, (req, res) => {
  const auth = store.authorisations.get(req.params.authorisationId);
  if (!auth || auth.paymentId !== req.params.paymentId) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Authorisation not found', path: 'path.authorisationId' }],
    });
  }
  res.json({ scaStatus: auth.scaStatus, authorisationId: auth.authorisationId });
});

// ─── PUT /v1/:paymentService/:paymentProduct/:paymentId/authorisations/:authId ─
// Confirm SCA with confirmationCode (from OAuth redirect or OTP).
// Used in SCA_MODE=redirect after user completes OAuth.
router.put('/:paymentService/:paymentProduct/:paymentId/authorisations/:authorisationId', validateHeaders, (req, res) => {
  const { paymentId, authorisationId } = req.params;
  const { confirmationCode, scaAuthenticationData } = req.body;
  const code = confirmationCode || scaAuthenticationData; // accept both names per spec

  if (!code) {
    return res.status(400).json({
      tppMessages: [{ category: 'ERROR', code: 'FORMAT_ERROR', text: 'confirmationCode is required', path: 'body.confirmationCode' }],
    });
  }

  const auth = store.authorisations.get(authorisationId);
  if (!auth || auth.paymentId !== paymentId) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Authorisation not found', path: 'path.authorisationId' }],
    });
  }

  const updated = store.confirmAuthorisation(authorisationId, code);
  if (updated.scaStatus === 'failed') {
    return res.status(401).json({
      tppMessages: [{ category: 'ERROR', code: 'SCA_INVALID', text: 'Invalid confirmation code', path: 'body.confirmationCode' }],
    });
  }

  res.json({ scaStatus: updated.scaStatus, authorisationId });
});

// ─── DELETE /v1/:paymentService/:paymentProduct/:paymentId ───────────────────
// Cancel a payment (only if not yet executed).
router.delete('/:paymentService/:paymentProduct/:paymentId', validateHeaders, (req, res) => {
  const payment = store.payments.get(req.params.paymentId);
  if (!payment) {
    return res.status(404).json({
      tppMessages: [{ category: 'ERROR', code: 'RESOURCE_UNKNOWN', text: 'Payment not found', path: 'path.paymentId' }],
    });
  }
  if (payment.transactionStatus === 'ACCC') {
    return res.status(405).json({
      tppMessages: [{ category: 'ERROR', code: 'CANCELLATION_INVALID', text: 'Executed payment cannot be cancelled', path: 'path.paymentId' }],
    });
  }
  payment.transactionStatus = 'CANC';
  res.status(204).send();
});

module.exports = router;
