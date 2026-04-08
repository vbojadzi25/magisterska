'use strict';

const request = require('supertest');
const app = require('../src/app');
const { registerWithBankAccount } = require('./helpers');

// Helper: set a specific balance on a bank account directly through the DB
async function setBalance(accountId, balance) {
  const { BankAccount } = require('../src/models');
  await BankAccount.update(
    { balance, availableBalance: balance },
    { where: { id: accountId } },
  );
}

describe('Transactions — POST /api/transactions/send', () => {
  test('sends money via TPP flow and returns completed transaction', async () => {
    const { user: userA, accessToken: tokenA, accountId: accountIdA } = await registerWithBankAccount();
    const { user: userB, accountId: accountIdB } = await registerWithBankAccount();

    await setBalance(accountIdA, 5000);

    const res = await request(app)
      .post('/api/transactions/send')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        toUserId: userB.id,
        fromBankAccountId: accountIdA,
        amount: 500,
        description: 'Test payment',
      });

    expect(res.status).toBe(201);
    expect(res.body.transaction).toBeDefined();
    expect(res.body.transaction.status).toBe('completed');
    expect(res.body.transaction.amount).toBe(500);
    expect(res.body.transaction.direction).toBe('sent');
    expect(res.body.transaction.isRequest).toBe(false);
  });

  test('returns 400 when balance is insufficient', async () => {
    const { user: userA, accessToken: tokenA, accountId: accountIdA } = await registerWithBankAccount();
    const { user: userB } = await registerWithBankAccount();

    await setBalance(accountIdA, 100);

    const res = await request(app)
      .post('/api/transactions/send')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        toUserId: userB.id,
        fromBankAccountId: accountIdA,
        amount: 999,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient/i);
  });

  test('returns 400 when sending to yourself', async () => {
    const { user, accessToken, accountId } = await registerWithBankAccount();

    await setBalance(accountId, 5000);

    const res = await request(app)
      .post('/api/transactions/send')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        toUserId: user.id,
        fromBankAccountId: accountId,
        amount: 100,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/yourself/i);
  });

  test('returns 400 when required fields are missing', async () => {
    const { accessToken } = await registerWithBankAccount();

    const res = await request(app)
      .post('/api/transactions/send')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 100 });

    expect(res.status).toBe(400);
  });

  test('returns 400 when amount is below minimum', async () => {
    const { user: userA, accessToken: tokenA, accountId: accountIdA } = await registerWithBankAccount();
    const { user: userB } = await registerWithBankAccount();

    await setBalance(accountIdA, 5000);

    const res = await request(app)
      .post('/api/transactions/send')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        toUserId: userB.id,
        fromBankAccountId: accountIdA,
        amount: 0.5,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/minimum/i);
  });

  test('returns 404 when recipient does not exist', async () => {
    const { accessToken: tokenA, accountId: accountIdA } = await registerWithBankAccount();

    await setBalance(accountIdA, 5000);

    const res = await request(app)
      .post('/api/transactions/send')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        toUserId: '00000000-0000-0000-0000-000000000000',
        fromBankAccountId: accountIdA,
        amount: 100,
      });

    expect(res.status).toBe(404);
  });

  test('returns 400 when recipient has no bank account', async () => {
    // registerUser (no bank account) via registerUser helper
    const { registerUser } = require('./helpers');
    const { user: userB } = await registerUser();
    const { accessToken: tokenA, accountId: accountIdA } = await registerWithBankAccount();

    await setBalance(accountIdA, 5000);

    const res = await request(app)
      .post('/api/transactions/send')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        toUserId: userB.id,
        fromBankAccountId: accountIdA,
        amount: 100,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no linked bank account/i);
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/transactions/send')
      .send({ toUserId: 'x', fromBankAccountId: 'y', amount: 100 });

    expect(res.status).toBe(401);
  });
});

describe('Transactions — POST /api/transactions/request', () => {
  test('creates a pending money request', async () => {
    const { user: userA, accessToken: tokenA, accountId: accountIdA } = await registerWithBankAccount();
    const { user: userB, accessToken: tokenB } = await registerWithBankAccount();

    const res = await request(app)
      .post('/api/transactions/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        payerUserId: userB.id,
        amount: 200,
        description: 'Split the bill',
      });

    expect(res.status).toBe(201);
    expect(res.body.transaction).toBeDefined();
    expect(res.body.transaction.isRequest).toBe(true);
    expect(res.body.transaction.status).toBe('pending');
    expect(res.body.transaction.amount).toBe(200);
  });

  test('returns 400 when requesting money from yourself', async () => {
    const { user, accessToken } = await registerWithBankAccount();

    const res = await request(app)
      .post('/api/transactions/request')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ payerUserId: user.id, amount: 100 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/yourself/i);
  });

  test('returns 400 when required fields are missing', async () => {
    const { accessToken } = await registerWithBankAccount();

    const res = await request(app)
      .post('/api/transactions/request')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 100 });

    expect(res.status).toBe(400);
  });

  test('returns 404 when payer does not exist', async () => {
    const { accessToken } = await registerWithBankAccount();

    const res = await request(app)
      .post('/api/transactions/request')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        payerUserId: '00000000-0000-0000-0000-000000000000',
        amount: 100,
      });

    expect(res.status).toBe(404);
  });

  test('returns 400 when requester has no bank account', async () => {
    const { registerUser } = require('./helpers');
    const { user: userA, accessToken: tokenA } = await registerUser();
    const { user: userB } = await registerWithBankAccount();

    const res = await request(app)
      .post('/api/transactions/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ payerUserId: userB.id, amount: 100 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/bank account/i);
  });
});

describe('Transactions — GET /api/transactions/pending-requests', () => {
  test('returns pending requests directed at the current user', async () => {
    const { user: userA, accessToken: tokenA } = await registerWithBankAccount();
    const { user: userB, accessToken: tokenB } = await registerWithBankAccount();

    // A requests money from B
    await request(app)
      .post('/api/transactions/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ payerUserId: userB.id, amount: 150 });

    // B should see the pending request
    const res = await request(app)
      .get('/api/transactions/pending-requests')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.requests).toHaveLength(1);
    expect(res.body.requests[0].isRequest).toBe(true);
    expect(res.body.requests[0].status).toBe('pending');
    expect(res.body.requests[0].amount).toBe(150);
  });

  test('returns empty list when no pending requests', async () => {
    const { accessToken } = await registerWithBankAccount();

    const res = await request(app)
      .get('/api/transactions/pending-requests')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.requests).toHaveLength(0);
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/transactions/pending-requests');
    expect(res.status).toBe(401);
  });
});

describe('Transactions — POST /api/transactions/:id/pay', () => {
  test('pays a pending request via TPP flow and marks it completed', async () => {
    const { user: userA, accessToken: tokenA } = await registerWithBankAccount();
    const { user: userB, accessToken: tokenB, accountId: accountIdB } = await registerWithBankAccount();

    await setBalance(accountIdB, 5000);

    // A requests money from B
    const reqRes = await request(app)
      .post('/api/transactions/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ payerUserId: userB.id, amount: 300, description: 'Dinner' });

    const txnId = reqRes.body.transaction.id;

    // B pays the request
    const payRes = await request(app)
      .post(`/api/transactions/${txnId}/pay`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ fromBankAccountId: accountIdB });

    expect(payRes.status).toBe(200);
    expect(payRes.body.transaction.status).toBe('completed');
    expect(payRes.body.transaction.amount).toBe(300);
  });

  test('returns 400 when balance is insufficient to pay request', async () => {
    const { user: userA, accessToken: tokenA } = await registerWithBankAccount();
    const { user: userB, accessToken: tokenB, accountId: accountIdB } = await registerWithBankAccount();

    await setBalance(accountIdB, 50);

    const reqRes = await request(app)
      .post('/api/transactions/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ payerUserId: userB.id, amount: 500 });

    const txnId = reqRes.body.transaction.id;

    const res = await request(app)
      .post(`/api/transactions/${txnId}/pay`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ fromBankAccountId: accountIdB });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient/i);
  });

  test('returns 400 when fromBankAccountId is missing', async () => {
    const { user: userA, accessToken: tokenA } = await registerWithBankAccount();
    const { user: userB, accessToken: tokenB } = await registerWithBankAccount();

    const reqRes = await request(app)
      .post('/api/transactions/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ payerUserId: userB.id, amount: 100 });

    const txnId = reqRes.body.transaction.id;

    const res = await request(app)
      .post(`/api/transactions/${txnId}/pay`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('returns 404 when request does not belong to current user', async () => {
    const { user: userA, accessToken: tokenA } = await registerWithBankAccount();
    const { user: userB, accessToken: tokenB } = await registerWithBankAccount();
    const { user: userC, accessToken: tokenC, accountId: accountIdC } = await registerWithBankAccount();

    // A requests from B
    const reqRes = await request(app)
      .post('/api/transactions/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ payerUserId: userB.id, amount: 100 });

    const txnId = reqRes.body.transaction.id;

    // C tries to pay B's request — should fail
    const res = await request(app)
      .post(`/api/transactions/${txnId}/pay`)
      .set('Authorization', `Bearer ${tokenC}`)
      .send({ fromBankAccountId: accountIdC });

    expect(res.status).toBe(404);
  });

  test('returns 404 when the requester (sender) tries to pay their own request', async () => {
    const { user: userA, accessToken: tokenA, accountId: accountIdA } = await registerWithBankAccount();
    const { user: userB } = await registerWithBankAccount();

    await setBalance(accountIdA, 5000);

    // A requests from B
    const reqRes = await request(app)
      .post('/api/transactions/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ payerUserId: userB.id, amount: 100 });

    const txnId = reqRes.body.transaction.id;

    // A tries to pay their own request
    const res = await request(app)
      .post(`/api/transactions/${txnId}/pay`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ fromBankAccountId: accountIdA });

    expect(res.status).toBe(404);
  });
});

describe('Transactions — GET /api/transactions', () => {
  test('returns transaction history for the current user', async () => {
    const { user: userA, accessToken: tokenA, accountId: accountIdA } = await registerWithBankAccount();
    const { user: userB } = await registerWithBankAccount();

    await setBalance(accountIdA, 5000);

    await request(app)
      .post('/api/transactions/send')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ toUserId: userB.id, fromBankAccountId: accountIdA, amount: 100 });

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.transactions[0].direction).toBe('sent');
    expect(res.body.transactions[0].amount).toBe(100);
  });

  test('transaction history does not include money requests', async () => {
    const { user: userA, accessToken: tokenA } = await registerWithBankAccount();
    const { user: userB, accessToken: tokenB } = await registerWithBankAccount();

    // Create a request only (no send)
    await request(app)
      .post('/api/transactions/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ payerUserId: userB.id, amount: 100 });

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(0);
  });

  test('returns empty list for a new user with no transactions', async () => {
    const { accessToken } = await registerWithBankAccount();

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(0);
  });

  test('recipient also sees the transaction in their history', async () => {
    const { user: userA, accessToken: tokenA, accountId: accountIdA } = await registerWithBankAccount();
    const { user: userB, accessToken: tokenB } = await registerWithBankAccount();

    await setBalance(accountIdA, 5000);

    await request(app)
      .post('/api/transactions/send')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ toUserId: userB.id, fromBankAccountId: accountIdA, amount: 250 });

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.transactions[0].direction).toBe('received');
    expect(res.body.transactions[0].amount).toBe(250);
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
  });

  test('respects limit and offset query params', async () => {
    const { user: userA, accessToken: tokenA, accountId: accountIdA } = await registerWithBankAccount();
    const { user: userB } = await registerWithBankAccount();

    await setBalance(accountIdA, 50000);

    // Create 3 transactions
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/transactions/send')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ toUserId: userB.id, fromBankAccountId: accountIdA, amount: 100 });
    }

    const res = await request(app)
      .get('/api/transactions')
      .query({ limit: 2, offset: 0 })
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(2);
  });
});
