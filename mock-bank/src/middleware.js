/**
 * Mock bank middleware.
 *
 * validateHeaders: requires X-Request-ID and Date (matches real bank spec).
 * Skips Digest / Signature / TPP-Signature-Certificate in dev — add real
 * validation here when migrating to production.
 */

function validateHeaders(req, res, next) {
  if (!req.headers['x-request-id']) {
    return res.status(400).json({
      tppMessages: [{ category: 'ERROR', code: 'FORMAT_ERROR', text: 'X-Request-ID header is required', path: 'header.X-Request-ID' }],
    });
  }
  if (!req.headers['date']) {
    return res.status(400).json({
      tppMessages: [{ category: 'ERROR', code: 'FORMAT_ERROR', text: 'Date header is required', path: 'header.Date' }],
    });
  }
  // In dev mode we skip Digest / Signature / TPP-Signature-Certificate.
  // TODO: validate these when using real mTLS certs (production TPP).
  next();
}

/**
 * Require a valid Consent-ID header for AIS endpoints.
 * Attaches the consent object to req.consent.
 */
function requireConsent(store) {
  return (req, res, next) => {
    const consentId = req.headers['consent-id'];
    if (!consentId) {
      return res.status(401).json({
        tppMessages: [{ category: 'ERROR', code: 'TOKEN_UNKNOWN', text: 'Consent-ID header is required', path: 'header.Consent-ID' }],
      });
    }
    const consent = store.getValidConsent(consentId);
    if (!consent) {
      return res.status(401).json({
        tppMessages: [{ category: 'ERROR', code: 'CONSENT_INVALID', text: 'Consent is not valid or has expired', path: 'header.Consent-ID' }],
      });
    }
    req.consent = consent;
    next();
  };
}

module.exports = { validateHeaders, requireConsent };
