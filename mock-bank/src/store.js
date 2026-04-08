/**
 * In-memory store for the mock bank.
 *
 * accounts:      Map<iban, AccountRecord>
 * payments:      Map<paymentId, PaymentRecord>
 * authorisations:Map<authorisationId, AuthRecord>   (PIS)
 * consents:      Map<consentId, ConsentRecord>
 * consentAuths:  Map<authorisationId, ConsentAuthRecord> (AIS)
 */

const { v4: uuidv4 } = require('uuid');

// ─── Account helpers ──────────────────────────────────────────────────────────

const accounts = new Map();

/**
 * Return an existing account or auto-create one with a default balance.
 * Accepts any string as an account identifier (IBAN, account number, etc.)
 */
function getOrCreateAccount(iban) {
  if (!accounts.has(iban)) {
    accounts.set(iban, {
      resourceId: uuidv4(),
      iban,
      currency: 'MKD',
      name: `Account ${iban.slice(-4)}`,
      product: 'Current Account',
      cashAccountType: 'CACC',
      status: 'enabled',
      balances: {
        booked: 100000.00,  // Start everyone with 100,000 MKD for testing
        available: 100000.00,
      },
      transactions: [],
    });
  }
  return accounts.get(iban);
}

function applyDebit(iban, amount) {
  const acc = getOrCreateAccount(iban);
  acc.balances.booked -= amount;
  acc.balances.available -= amount;
}

function applyCredit(iban, amount) {
  const acc = getOrCreateAccount(iban);
  acc.balances.booked += amount;
  acc.balances.available += amount;
}

function recordAccountTransaction(paymentRecord) {
  const debtorAcc = getOrCreateAccount(paymentRecord.debtorAccount.iban);
  const creditorAcc = getOrCreateAccount(paymentRecord.creditorAccount.iban);
  const amount = parseFloat(paymentRecord.instructedAmount.amount);
  const now = new Date().toISOString();

  debtorAcc.transactions.push({
    transactionId: uuidv4(),
    bookingDate: now.slice(0, 10),
    valueDate: now.slice(0, 10),
    transactionAmount: { currency: paymentRecord.instructedAmount.currency, amount: `-${amount}` },
    creditorName: paymentRecord.creditorName,
    remittanceInformationUnstructured: paymentRecord.remittanceInformationUnstructured || '',
    proprietaryBankTransactionCode: 'TRANSFER',
    bookingStatus: 'booked',
  });

  creditorAcc.transactions.push({
    transactionId: uuidv4(),
    bookingDate: now.slice(0, 10),
    valueDate: now.slice(0, 10),
    transactionAmount: { currency: paymentRecord.instructedAmount.currency, amount: `${amount}` },
    debtorName: paymentRecord.debtorName || 'Unknown',
    remittanceInformationUnstructured: paymentRecord.remittanceInformationUnstructured || '',
    proprietaryBankTransactionCode: 'TRANSFER',
    bookingStatus: 'booked',
  });
}

// ─── Payment helpers ──────────────────────────────────────────────────────────

const payments = new Map();
const authorisations = new Map();

function createPayment(data) {
  const paymentId = uuidv4();
  const payment = {
    paymentId,
    paymentService: data.paymentService || 'payments',
    paymentProduct: data.paymentProduct || 'domestic-transfer',
    transactionStatus: 'RCVD',
    endToEndIdentification: data.endToEndIdentification || '',
    debtorName: data.debtorName || '',
    debtorAccount: data.debtorAccount,
    instructedAmount: data.instructedAmount,
    creditorAccount: data.creditorAccount,
    creditorName: data.creditorName || '',
    remittanceInformationUnstructured: data.remittanceInformationUnstructured || '',
    requestedExecutionDate: data.requestedExecutionDate || new Date().toISOString().slice(0, 10),
    authorisationIds: [],
    createdAt: new Date().toISOString(),
  };
  payments.set(paymentId, payment);
  return payment;
}

function createAuthorisation(paymentId, scaMode) {
  const authorisationId = uuidv4();
  const payment = payments.get(paymentId);
  const confirmationCode = Math.random().toString(36).slice(2, 8).toUpperCase();

  const auth = {
    authorisationId,
    paymentId,
    scaStatus: scaMode === 'auto' ? 'finalised' : 'received',
    confirmationCode, // stored so the OAuth page can pass it back
    createdAt: new Date().toISOString(),
  };

  authorisations.set(authorisationId, auth);
  if (payment) {
    payment.authorisationIds.push(authorisationId);

    if (scaMode === 'auto') {
      // Auto-approve: execute the payment immediately
      executePayment(payment);
    } else {
      payment.transactionStatus = 'ACTC';
    }
  }

  return auth;
}

function confirmAuthorisation(authorisationId, suppliedCode) {
  const auth = authorisations.get(authorisationId);
  if (!auth) return null;

  if (auth.confirmationCode !== suppliedCode) {
    auth.scaStatus = 'failed';
    return auth;
  }

  auth.scaStatus = 'finalised';
  const payment = payments.get(auth.paymentId);
  if (payment && payment.transactionStatus !== 'ACCC') {
    executePayment(payment);
  }
  return auth;
}

function executePayment(payment) {
  const amount = parseFloat(payment.instructedAmount.amount);
  applyDebit(payment.debtorAccount.iban, amount);
  applyCredit(payment.creditorAccount.iban, amount);
  recordAccountTransaction(payment);
  payment.transactionStatus = 'ACCC';
  payment.executedAt = new Date().toISOString();
}

// ─── Consent helpers (AIS) ────────────────────────────────────────────────────

const consents = new Map();
const consentAuths = new Map();

function createConsent(data) {
  const consentId = uuidv4();
  const validUntil = data.validUntil || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const consent = {
    consentId,
    access: data.access,
    recurringIndicator: data.recurringIndicator ?? true,
    validUntil,
    frequencyPerDay: data.frequencyPerDay || 4,
    consentStatus: 'received',
    authorisationIds: [],
    createdAt: new Date().toISOString(),
  };
  consents.set(consentId, consent);
  return consent;
}

function createConsentAuthorisation(consentId, scaMode) {
  const authorisationId = uuidv4();
  const consent = consents.get(consentId);
  const confirmationCode = Math.random().toString(36).slice(2, 8).toUpperCase();

  const auth = {
    authorisationId,
    consentId,
    scaStatus: scaMode === 'auto' ? 'finalised' : 'received',
    confirmationCode,
    createdAt: new Date().toISOString(),
  };

  consentAuths.set(authorisationId, auth);
  if (consent) {
    consent.authorisationIds.push(authorisationId);
    consent.consentStatus = scaMode === 'auto' ? 'valid' : 'received';
  }
  return auth;
}

function confirmConsentAuthorisation(authorisationId, suppliedCode) {
  const auth = consentAuths.get(authorisationId);
  if (!auth) return null;

  if (auth.confirmationCode !== suppliedCode) {
    auth.scaStatus = 'failed';
    return auth;
  }

  auth.scaStatus = 'finalised';
  const consent = consents.get(auth.consentId);
  if (consent) consent.consentStatus = 'valid';
  return auth;
}

function getValidConsent(consentId) {
  const consent = consents.get(consentId);
  if (!consent) return null;
  if (consent.consentStatus !== 'valid') return null;
  if (new Date(consent.validUntil) < new Date()) {
    consent.consentStatus = 'expired';
    return null;
  }
  return consent;
}

module.exports = {
  // Accounts
  accounts,
  getOrCreateAccount,
  // Payments (PIS)
  payments,
  authorisations,
  createPayment,
  createAuthorisation,
  confirmAuthorisation,
  // Consents (AIS)
  consents,
  consentAuths,
  createConsent,
  createConsentAuthorisation,
  confirmConsentAuthorisation,
  getValidConsent,
};
