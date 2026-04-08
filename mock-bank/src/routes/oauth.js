/**
 * Mock SCA OAuth pages (used when SCA_MODE=redirect).
 *
 * GET  /mock-oauth/authorize  — show "Approve payment" HTML page
 * POST /mock-oauth/authorize  — process approval; redirect to TPP with confirmationCode
 *
 * GET  /mock-oauth/consent    — show "Approve consent" HTML page
 * POST /mock-oauth/consent    — process approval; redirect to TPP with confirmationCode
 *
 * In SCA_MODE=auto these endpoints are never called by the Denar API, but you
 * can open them in a browser to test the redirect flow manually.
 */

const express = require('express');
const store = require('../store');

const router = express.Router();

// ─── Payment SCA ──────────────────────────────────────────────────────────────

router.get('/authorize', (req, res) => {
  const { paymentId, authorisationId, redirectUri } = req.query;
  const payment = store.payments.get(paymentId);
  const auth = store.authorisations.get(authorisationId);

  if (!payment || !auth) {
    return res.status(404).send(errorPage('Payment or authorisation not found.'));
  }

  const { debtorAccount, creditorAccount, creditorName, instructedAmount } = payment;
  res.send(approvePage({
    title: 'Authorise Payment',
    details: [
      { label: 'From', value: debtorAccount.iban },
      { label: 'To', value: `${creditorName} (${creditorAccount.iban})` },
      { label: 'Amount', value: `${instructedAmount.amount} ${instructedAmount.currency}` },
    ],
    action: `/mock-oauth/authorize`,
    hiddenFields: { paymentId, authorisationId, redirectUri },
    approveLabel: 'Approve Payment',
    rejectLabel: 'Reject Payment',
  }));
});

router.post('/authorize', (req, res) => {
  const { paymentId, authorisationId, redirectUri, action } = req.body;
  const auth = store.authorisations.get(authorisationId);

  if (!auth || auth.paymentId !== paymentId) {
    return res.status(404).send(errorPage('Authorisation not found.'));
  }

  if (action === 'reject') {
    auth.scaStatus = 'failed';
    const payment = store.payments.get(paymentId);
    if (payment) payment.transactionStatus = 'RJCT';
    const url = buildRedirectUrl(redirectUri, { error: 'access_denied', paymentId });
    return res.redirect(url);
  }

  // Approve — pass the confirmationCode back to the TPP
  const url = buildRedirectUrl(redirectUri, { confirmationCode: auth.confirmationCode, paymentId, authorisationId });
  res.redirect(url);
});

// ─── Consent SCA ──────────────────────────────────────────────────────────────

router.get('/consent', (req, res) => {
  const { consentId, authorisationId, redirectUri } = req.query;
  const consent = store.consents.get(consentId);
  const auth = store.consentAuths.get(authorisationId);

  if (!consent || !auth) {
    return res.status(404).send(errorPage('Consent or authorisation not found.'));
  }

  const accessSummary = JSON.stringify(consent.access, null, 2);
  res.send(approvePage({
    title: 'Authorise Account Access',
    details: [
      { label: 'Access', value: accessSummary },
      { label: 'Valid Until', value: consent.validUntil },
      { label: 'Recurring', value: consent.recurringIndicator ? 'Yes' : 'No' },
    ],
    action: `/mock-oauth/consent`,
    hiddenFields: { consentId, authorisationId, redirectUri },
    approveLabel: 'Approve Access',
    rejectLabel: 'Deny Access',
  }));
});

router.post('/consent', (req, res) => {
  const { consentId, authorisationId, redirectUri, action } = req.body;
  const auth = store.consentAuths.get(authorisationId);

  if (!auth || auth.consentId !== consentId) {
    return res.status(404).send(errorPage('Authorisation not found.'));
  }

  if (action === 'reject') {
    auth.scaStatus = 'failed';
    const consent = store.consents.get(consentId);
    if (consent) consent.consentStatus = 'rejected';
    const url = buildRedirectUrl(redirectUri, { error: 'access_denied', consentId });
    return res.redirect(url);
  }

  const url = buildRedirectUrl(redirectUri, { confirmationCode: auth.confirmationCode, consentId, authorisationId });
  res.redirect(url);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRedirectUrl(base, params) {
  if (!base) return '/';
  const url = new URL(base);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

function approvePage({ title, details, action, hiddenFields, approveLabel, rejectLabel }) {
  const detailRows = details.map(d => `
    <tr>
      <td style="padding:8px 16px 8px 0;color:#6b7280;font-size:14px;">${d.label}</td>
      <td style="padding:8px 0;font-size:14px;font-weight:600;">${escHtml(String(d.value))}</td>
    </tr>`).join('');

  const hidden = Object.entries(hiddenFields).map(([k, v]) =>
    `<input type="hidden" name="${escHtml(k)}" value="${escHtml(String(v || ''))}">`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mock Bank — ${escHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: white; border-radius: 16px; padding: 40px; max-width: 440px; width: 90%; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .bank-badge { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
    .bank-icon { width: 40px; height: 40px; background: #1d4ed8; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 18px; }
    .bank-name { font-size: 15px; font-weight: 700; color: #1d4ed8; }
    .bank-sub { font-size: 12px; color: #6b7280; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    .dev-notice { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #92400e; margin-bottom: 24px; }
    .buttons { display: flex; gap: 12px; }
    button { flex: 1; padding: 14px; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; }
    .btn-approve { background: #1d4ed8; color: white; }
    .btn-approve:hover { background: #1e40af; }
    .btn-reject { background: #f3f4f6; color: #374151; }
    .btn-reject:hover { background: #e5e7eb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="bank-badge">
      <div class="bank-icon">M</div>
      <div>
        <div class="bank-name">Mock Bank</div>
        <div class="bank-sub">Development Sandbox</div>
      </div>
    </div>
    <h1>${escHtml(title)}</h1>
    <table>${detailRows}</table>
    <div class="dev-notice">⚠️ This is a development mock. In production, real bank authentication replaces this page.</div>
    <form method="POST" action="${escHtml(action)}">
      ${hidden}
      <div class="buttons">
        <button type="submit" name="action" value="reject" class="btn-reject">${escHtml(rejectLabel)}</button>
        <button type="submit" name="action" value="approve" class="btn-approve">${escHtml(approveLabel)}</button>
      </div>
    </form>
  </div>
</body>
</html>`;
}

function errorPage(message) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px"><h2>Error</h2><p>${escHtml(message)}</p></body></html>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = router;
