'use strict';

const request = require('supertest');
const app = require('../src/app');
const { Bank } = require('../src/models');
const { registerUser } = require('./helpers');

describe('Banks — GET /api/banks', () => {
  test('returns list of active banks (public endpoint)', async () => {
    const res = await request(app).get('/api/banks');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const bank = res.body.data[0];
    expect(bank.id).toBeDefined();
    expect(bank.name).toBeDefined();
    expect(bank.code).toBeDefined();
    // password / secret fields must not leak
    expect(bank.apiSecret).toBeUndefined();
  });

  test('does not require authentication', async () => {
    const res = await request(app).get('/api/banks');
    expect(res.status).toBe(200);
  });
});

describe('Banks — POST /api/banks/accounts', () => {
  let accessToken;
  let bankId;

  beforeEach(async () => {
    ({ accessToken } = await registerUser());
    const bank = await Bank.findOne();
    bankId = bank.id;
  });

  test('adds a bank account and returns the created record', async () => {
    const res = await request(app)
      .post('/api/banks/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bankId,
        accountNumber: '200000000000001',
        accountName:   'My Main Account',
        accountType:   'checking',
        currency:      'MKD',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accountNumber).toBe('200000000000001');
    expect(res.body.data.isDefault).toBe(true);   // first account is auto-default
    expect(res.body.data.isVerified).toBe(true);
    expect(res.body.data.bank.id).toBe(bankId);
  });

  test('marks second account as non-default', async () => {
    await request(app)
      .post('/api/banks/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ bankId, accountNumber: '200000000000011', accountName: 'First', accountType: 'checking', currency: 'MKD' });

    const res = await request(app)
      .post('/api/banks/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ bankId, accountNumber: '200000000000022', accountName: 'Second', accountType: 'savings', currency: 'MKD' });

    expect(res.status).toBe(201);
    expect(res.body.data.isDefault).toBe(false);
  });

  test('returns 400 for duplicate account number', async () => {
    const payload = { bankId, accountNumber: '200000099999999', accountName: 'Dupe', accountType: 'checking', currency: 'MKD' };
    await request(app).post('/api/banks/accounts').set('Authorization', `Bearer ${accessToken}`).send(payload);

    const res = await request(app)
      .post('/api/banks/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  test('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/banks/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ bankId }); // missing accountNumber and accountName

    expect(res.status).toBe(400);
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/banks/accounts')
      .send({ bankId, accountNumber: '200000000000001', accountName: 'Test', accountType: 'checking', currency: 'MKD' });

    expect(res.status).toBe(401);
  });
});

describe('Banks — GET /api/banks/accounts', () => {
  test('returns empty list for a new user', async () => {
    const { accessToken } = await registerUser();
    const res = await request(app)
      .get('/api/banks/accounts')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    const accounts = res.body.data || res.body.accounts || [];
    expect(accounts).toHaveLength(0);
  });

  test('returns added accounts with bank info', async () => {
    const { accessToken } = await registerUser();
    const bank = await Bank.findOne();

    await request(app)
      .post('/api/banks/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ bankId: bank.id, accountNumber: '200111222333444', accountName: 'Test', accountType: 'checking', currency: 'MKD' });

    const res = await request(app)
      .get('/api/banks/accounts')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    const accounts = res.body.data || res.body.accounts || [];
    expect(accounts).toHaveLength(1);
    expect(accounts[0].bank.name).toBeDefined();
  });
});

describe('Banks — DELETE /api/banks/accounts/:accountId', () => {
  test('soft-deletes an account (isActive=false)', async () => {
    const { accessToken } = await registerUser();
    const bank = await Bank.findOne();

    const addRes = await request(app)
      .post('/api/banks/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ bankId: bank.id, accountNumber: '200777888999000', accountName: 'ToDelete', accountType: 'checking', currency: 'MKD' });

    const accountId = addRes.body.data.id;

    const delRes = await request(app)
      .delete(`/api/banks/accounts/${accountId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(delRes.status).toBe(200);

    // Account should no longer appear in list
    const listRes = await request(app)
      .get('/api/banks/accounts')
      .set('Authorization', `Bearer ${accessToken}`);

    const accounts = listRes.body.data || listRes.body.accounts || [];
    expect(accounts.find(a => a.id === accountId)).toBeUndefined();
  });

  test('returns 404 when deleting another user\'s account', async () => {
    const { accessToken: tokenA } = await registerUser();
    const { accessToken: tokenB } = await registerUser();
    const bank = await Bank.findOne();

    const addRes = await request(app)
      .post('/api/banks/accounts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ bankId: bank.id, accountNumber: '200555444333222', accountName: 'A Account', accountType: 'checking', currency: 'MKD' });

    const accountId = addRes.body.data.id;

    const res = await request(app)
      .delete(`/api/banks/accounts/${accountId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });
});
