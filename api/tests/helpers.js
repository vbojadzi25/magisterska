/**
 * Shared test helpers.
 *
 * Each helper creates fresh DB records and returns everything the caller
 * needs (user object, access token, bank account id, etc.).
 */

'use strict';

const request = require('supertest');
const app = require('../src/app');
const { User, Bank } = require('../src/models');

// ── Counter for unique test data ─────────────────────────────────────────────

let _seq = 0;
function seq() { return ++_seq; }

// ── User factory ─────────────────────────────────────────────────────────────

/**
 * Build unique registration payload. Pass overrides to customise any field.
 */
function makeUserPayload(overrides = {}) {
  const n = seq();
  return {
    username:     `testuser${n}`,
    email:        `testuser${n}@denar.test`,
    password:     'Test1234!',
    firstName:    'Test',
    lastName:     `User${n}`,
    phoneNumber:  `+38971${String(n).padStart(6, '0')}`,
    dateOfBirth:  '1995-06-15',
    ...overrides,
  };
}

/**
 * Register a user and return `{ user, accessToken, refreshToken }`.
 * Uses the POST /api/auth/register endpoint directly — no 2FA needed.
 */
async function registerUser(overrides = {}) {
  const payload = makeUserPayload(overrides);
  const res = await request(app)
    .post('/api/auth/register')
    .send(payload);

  if (res.status !== 201) {
    throw new Error(`registerUser failed (${res.status}): ${JSON.stringify(res.body)}`);
  }

  return {
    user:         res.body.data.user,
    accessToken:  res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
    payload,      // original registration payload (contains plain password)
  };
}

/**
 * Register and add a bank account. Returns `{ user, accessToken, accountId }`.
 */
async function registerWithBankAccount(overrides = {}) {
  const { user, accessToken, payload } = await registerUser(overrides);
  const bank = await Bank.findOne();
  if (!bank) throw new Error('No bank found — check globalSetup bank seeding');

  const n = seq();
  const res = await request(app)
    .post('/api/banks/accounts')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      bankId:      bank.id,
      accountNumber: `200${String(n).padStart(12, '0')}`,
      accountName:  'Test Account',
      accountType:  'checking',
      currency:     'MKD',
    });

  if (res.status !== 201) {
    throw new Error(`addBankAccount failed (${res.status}): ${JSON.stringify(res.body)}`);
  }

  return {
    user,
    accessToken,
    payload,
    account: res.body.data,
    accountId: res.body.data.id,
  };
}

/**
 * Do the full 2FA login flow. Returns `{ user, accessToken, refreshToken }`.
 */
async function loginWithTwoFactor(username, password) {
  // Step 1: submit credentials
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username, password });

  if (loginRes.status !== 200) {
    throw new Error(`login failed (${loginRes.status}): ${JSON.stringify(loginRes.body)}`);
  }

  const { userId } = loginRes.body.data;

  // Step 2: read the OTP directly from the DB (no real SMS in tests)
  const user = await User.findByPk(userId, {
    attributes: ['phoneVerificationCode'],
  });

  const verifyRes = await request(app)
    .post('/api/auth/verify-login')
    .send({ userId, code: user.phoneVerificationCode });

  if (verifyRes.status !== 200) {
    throw new Error(`verify-login failed (${verifyRes.status}): ${JSON.stringify(verifyRes.body)}`);
  }

  return {
    user:         verifyRes.body.data.user,
    accessToken:  verifyRes.body.data.accessToken,
    refreshToken: verifyRes.body.data.refreshToken,
  };
}

/**
 * Create a friendship between two users (A sends request, B accepts).
 */
async function makeFriends(tokenA, userBId, tokenB, friendRequestId) {
  if (!friendRequestId) {
    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ friendUserId: userBId });
    friendRequestId = reqRes.body.requestId;
  }

  await request(app)
    .post(`/api/friends/accept/${friendRequestId}`)
    .set('Authorization', `Bearer ${tokenB}`);
}

module.exports = {
  makeUserPayload,
  registerUser,
  registerWithBankAccount,
  loginWithTwoFactor,
  makeFriends,
};
