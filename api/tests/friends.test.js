'use strict';

const request = require('supertest');
const app = require('../src/app');
const { registerUser } = require('./helpers');

describe('Friends — GET /api/friends', () => {
  test('returns empty list for a new user', async () => {
    const { accessToken } = await registerUser();
    const res = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.friends).toHaveLength(0);
  });

  test('returns accepted friends after completing a friendship', async () => {
    const { accessToken: tokenA, user: userA } = await registerUser();
    const { accessToken: tokenB, user: userB } = await registerUser();

    // A sends request to B
    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ friendUserId: userB.id });

    // B accepts
    await request(app)
      .post(`/api/friends/accept/${reqRes.body.requestId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    const res = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.friends).toHaveLength(1);
    expect(res.body.friends[0].id).toBe(userB.id);
    expect(res.body.friends[0].friendsSince).toBeDefined();
  });

  test('returns 401 without a token', async () => {
    const res = await request(app).get('/api/friends');
    expect(res.status).toBe(401);
  });
});

describe('Friends — POST /api/friends/request', () => {
  test('sends a friend request successfully', async () => {
    const { accessToken: tokenA } = await registerUser();
    const { user: userB } = await registerUser();

    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ friendUserId: userB.id });

    expect(res.status).toBe(201);
    expect(res.body.requestId).toBeDefined();
  });

  test('returns 400 when sending request to yourself', async () => {
    const { accessToken, user } = await registerUser();

    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ friendUserId: user.id });

    expect(res.status).toBe(400);
  });

  test('returns 400 for duplicate friend request', async () => {
    const { accessToken: tokenA } = await registerUser();
    const { user: userB } = await registerUser();

    await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ friendUserId: userB.id });

    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ friendUserId: userB.id });

    expect(res.status).toBe(400);
  });

  test('returns 404 when target user does not exist', async () => {
    const { accessToken } = await registerUser();

    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ friendUserId: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(404);
  });
});

describe('Friends — GET /api/friends/requests', () => {
  test('shows received pending request', async () => {
    const { accessToken: tokenA } = await registerUser();
    const { user: userB, accessToken: tokenB } = await registerUser();

    await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ friendUserId: userB.id });

    const res = await request(app)
      .get('/api/friends/requests')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.received).toHaveLength(1);
    expect(res.body.received[0].type).toBe('received');
  });

  test('shows sent pending request', async () => {
    const { accessToken: tokenA } = await registerUser();
    const { user: userB } = await registerUser();

    await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ friendUserId: userB.id });

    const res = await request(app)
      .get('/api/friends/requests')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.sent).toHaveLength(1);
    expect(res.body.sent[0].type).toBe('sent');
  });
});

describe('Friends — POST /api/friends/accept/:id', () => {
  test('accepts a request and moves it to friends list', async () => {
    const { accessToken: tokenA, user: userA } = await registerUser();
    const { accessToken: tokenB, user: userB } = await registerUser();

    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ friendUserId: userB.id });

    const acceptRes = await request(app)
      .post(`/api/friends/accept/${reqRes.body.requestId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(acceptRes.status).toBe(200);

    // Verify A now sees B in friends list
    const listRes = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(listRes.body.friends.map(f => f.id)).toContain(userB.id);
  });

  test('returns 404 when the sender tries to accept their own request', async () => {
    const { accessToken: tokenA } = await registerUser();
    const { user: userB } = await registerUser();

    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ friendUserId: userB.id });

    // tokenA (the sender) tries to accept — only tokenB (receiver) can
    const res = await request(app)
      .post(`/api/friends/accept/${reqRes.body.requestId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
  });
});

describe('Friends — POST /api/friends/decline/:id', () => {
  test('declines a request and removes the record', async () => {
    const { accessToken: tokenA } = await registerUser();
    const { user: userB, accessToken: tokenB } = await registerUser();

    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ friendUserId: userB.id });

    const declineRes = await request(app)
      .post(`/api/friends/decline/${reqRes.body.requestId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(declineRes.status).toBe(200);

    // B's received requests list should now be empty
    const reqListRes = await request(app)
      .get('/api/friends/requests')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(reqListRes.body.received).toHaveLength(0);
  });
});

describe('Friends — DELETE /api/friends/:friendId', () => {
  test('removes an existing friendship from both sides', async () => {
    const { accessToken: tokenA, user: userA } = await registerUser();
    const { accessToken: tokenB, user: userB } = await registerUser();

    // Establish friendship
    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ friendUserId: userB.id });

    await request(app)
      .post(`/api/friends/accept/${reqRes.body.requestId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    // A removes B
    const delRes = await request(app)
      .delete(`/api/friends/${userB.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(delRes.status).toBe(200);

    // A's friend list should be empty
    const listRes = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(listRes.body.friends).toHaveLength(0);
  });
});

describe('Friends — GET /api/friends/search', () => {
  test('finds a user by exact username', async () => {
    const { accessToken: tokenA } = await registerUser();
    const { payload: payloadB } = await registerUser();

    const res = await request(app)
      .get('/api/friends/search')
      .set('Authorization', `Bearer ${tokenA}`)
      .query({ username: payloadB.username });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(payloadB.username);
    expect(res.body.friendshipStatus).toBeNull();
  });

  test('returns friendship status when request already sent', async () => {
    const { accessToken: tokenA } = await registerUser();
    const { user: userB, payload: payloadB } = await registerUser();

    await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ friendUserId: userB.id });

    const res = await request(app)
      .get('/api/friends/search')
      .set('Authorization', `Bearer ${tokenA}`)
      .query({ username: payloadB.username });

    expect(res.status).toBe(200);
    expect(res.body.friendshipStatus).toBe('pending');
    expect(res.body.requestDirection).toBe('sent');
  });

  test('returns 404 for non-existent username', async () => {
    const { accessToken } = await registerUser();

    const res = await request(app)
      .get('/api/friends/search')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ username: 'nobody_here_xyz999' });

    expect(res.status).toBe(404);
  });

  test('returns 400 when username param is missing', async () => {
    const { accessToken } = await registerUser();

    const res = await request(app)
      .get('/api/friends/search')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
  });
});
