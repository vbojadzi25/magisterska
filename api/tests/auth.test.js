'use strict';

const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models');
const { makeUserPayload, registerUser, loginWithTwoFactor } = require('./helpers');

describe('Auth — POST /api/auth/register', () => {
  test('registers a new user and returns tokens', async () => {
    const payload = makeUserPayload();
    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(payload.email);
    expect(res.body.data.user.username).toBe(payload.username);
    expect(res.body.data.user.password).toBeUndefined(); // stripped by toJSON()
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  test('returns 409 when username is already taken', async () => {
    const payload = makeUserPayload();
    await request(app).post('/api/auth/register').send(payload);

    const duplicate = makeUserPayload({ username: payload.username });
    const res = await request(app).post('/api/auth/register').send(duplicate);

    expect(res.status).toBe(409);
  });

  test('returns 409 when phone number is already registered', async () => {
    const payload = makeUserPayload();
    await request(app).post('/api/auth/register').send(payload);

    const duplicate = makeUserPayload({ phoneNumber: payload.phoneNumber });
    const res = await request(app).post('/api/auth/register').send(duplicate);

    expect(res.status).toBe(409);
  });

  test('returns 400 for invalid Macedonian phone number', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(makeUserPayload({ phoneNumber: '+38591234567' })); // 359 = Bulgaria

    expect(res.status).toBe(400);
  });

  test('returns 400 for weak password (no special character)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(makeUserPayload({ password: 'Test1234' }));

    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid username (starts with digit)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(makeUserPayload({ username: '1badname' }));

    expect(res.status).toBe(400);
  });
});

describe('Auth — GET /api/auth/check-username', () => {
  test('returns available=true for unused username', async () => {
    const res = await request(app)
      .get('/api/auth/check-username')
      .query({ username: 'totallyunused99' });

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
  });

  test('returns available=false for taken username', async () => {
    const { payload } = await registerUser();
    const res = await request(app)
      .get('/api/auth/check-username')
      .query({ username: payload.username });

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
  });

  test('returns available=false for invalid username format', async () => {
    const res = await request(app)
      .get('/api/auth/check-username')
      .query({ username: '!invalid!' });

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
    expect(res.body.reason).toBe('invalid');
  });
});

describe('Auth — POST /api/auth/login', () => {
  test('returns requiresTwoFactor=true and userId on valid credentials', async () => {
    const { payload } = await registerUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: payload.username, password: payload.password });

    expect(res.status).toBe(200);
    expect(res.body.data.requiresTwoFactor).toBe(true);
    expect(res.body.data.userId).toBeDefined();
    expect(res.body.data.phoneHint).toMatch(/\+389/);
  });

  test('returns 401 for wrong password', async () => {
    const { payload } = await registerUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: payload.username, password: 'WrongPass1!' });

    expect(res.status).toBe(401);
  });

  test('returns 401 for unknown username', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ghost_user_xyz', password: 'Test1234!' });

    expect(res.status).toBe(401);
  });
});

describe('Auth — POST /api/auth/verify-login (2FA)', () => {
  test('returns tokens after correct OTP', async () => {
    const { payload } = await registerUser();
    const { user, accessToken, refreshToken } = await loginWithTwoFactor(
      payload.username,
      payload.password
    );

    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    expect(user.username).toBe(payload.username);
  });

  test('returns 401 for wrong OTP code', async () => {
    const { payload } = await registerUser();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: payload.username, password: payload.password });

    const { userId } = loginRes.body.data;

    const res = await request(app)
      .post('/api/auth/verify-login')
      .send({ userId, code: '000000' });

    expect(res.status).toBe(401);
  });

  test('returns 400 when userId or code is missing', async () => {
    const res = await request(app)
      .post('/api/auth/verify-login')
      .send({ userId: 'some-id' }); // no code

    expect(res.status).toBe(400);
  });
});

describe('Auth — GET /api/auth/me', () => {
  test('returns the authenticated user', async () => {
    const { accessToken, user } = await registerUser();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user.id);
  });

  test('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.token');

    expect(res.status).toBe(401);
  });
});

describe('Auth — POST /api/auth/refresh', () => {
  test('returns a new access token from a valid refresh token', async () => {
    const { refreshToken } = await registerUser();
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  test('returns 400 when refresh token is missing', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });
});
