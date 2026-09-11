const request = require('supertest');
const { freshApp } = require('./testApp');

describe('POST /api/auth/register', () => {
  it('creates a new customer account and returns a token', async () => {
    const { app } = await freshApp();
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe', email: 'jane@example.com', password: 'Secret123!',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('jane@example.com');
    expect(res.body.user.role).toBe('customer'); // default role
  });

  it('allows registering as a driver explicitly', async () => {
    const { app } = await freshApp();
    const res = await request(app).post('/api/auth/register').send({
      name: 'Driver Dan', email: 'dan@example.com', password: 'Secret123!', role: 'driver',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('driver');
  });

  it('never allows self-registering as admin — rejected at validation', async () => {
    const { app } = await freshApp();
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sneaky', email: 'sneaky@example.com', password: 'Secret123!', role: 'admin',
    });
    // 'admin' is not in the allowed role enum for self-registration, so this is
    // rejected by input validation rather than silently downgraded — stricter
    // and more auditable than accepting it and rewriting the role server-side.
    expect(res.status).toBe(400);
  });

  it('rejects duplicate emails with 409', async () => {
    const { app } = await freshApp();
    await request(app).post('/api/auth/register').send({
      name: 'First', email: 'dup@example.com', password: 'Secret123!',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Second', email: 'dup@example.com', password: 'Secret123!',
    });
    expect(res.status).toBe(409);
  });

  it('rejects a weak/short password with 400', async () => {
    const { app } = await freshApp();
    const res = await request(app).post('/api/auth/register').send({
      name: 'Weak', email: 'weak@example.com', password: '123',
    });
    expect(res.status).toBe(400);
    expect(res.body.details).toBeTruthy();
  });

  it('rejects a malformed email with 400', async () => {
    const { app } = await freshApp();
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bad Email', email: 'not-an-email', password: 'Secret123!',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in a seeded demo user successfully', async () => {
    const { app } = await freshApp();
    const res = await request(app).post('/api/auth/login').send({
      email: 'customer@swiftship.com', password: 'Customer1234!',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('customer');
  });

  it('rejects an incorrect password with 401', async () => {
    const { app } = await freshApp();
    const res = await request(app).post('/api/auth/login').send({
      email: 'customer@swiftship.com', password: 'wrong-password',
    });
    expect(res.status).toBe(401);
  });

  it('rejects a non-existent email with 401 (not 404 — avoids leaking which emails exist)', async () => {
    const { app } = await freshApp();
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com', password: 'whatever123',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user when a valid token is provided', async () => {
    const { app } = await freshApp();
    const login = await request(app).post('/api/auth/login').send({
      email: 'admin@swiftship.com', password: 'Admin1234!',
    });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@swiftship.com');
  });

  it('rejects a request with no token with 401', async () => {
    const { app } = await freshApp();
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a garbage/invalid token with 401', async () => {
    const { app } = await freshApp();
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage.token.here');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('returns the same generic response whether or not the email exists', async () => {
    const { app } = await freshApp();
    const res1 = await request(app).post('/api/auth/forgot-password').send({ email: 'customer@swiftship.com' });
    const res2 = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody-at-all@example.com' });
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body.message).toBe(res2.body.message);
  });

  it('sends an email containing a reset link when the account exists', async () => {
    const { app } = await freshApp();
    const emailService = require('../services/emailService');
    emailService._clearSentEmails();

    await request(app).post('/api/auth/forgot-password').send({ email: 'customer@swiftship.com' });

    const sent = emailService._getSentEmails();
    expect(sent.length).toBe(1);
    expect(sent[0].to).toBe('customer@swiftship.com');
    expect(sent[0].html).toContain('/reset-password?token=');
  });

  it('does not send an email when the account does not exist', async () => {
    const { app } = await freshApp();
    const emailService = require('../services/emailService');
    emailService._clearSentEmails();

    await request(app).post('/api/auth/forgot-password').send({ email: 'nobody-at-all@example.com' });

    expect(emailService._getSentEmails().length).toBe(0);
  });

  it('rejects a malformed email with 400', async () => {
    const { app } = await freshApp();
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/reset-password', () => {
  function extractToken(html) {
    const match = html.match(/token=([a-f0-9]+)/);
    return match ? match[1] : null;
  }

  it('resets the password and allows login with the new password', async () => {
    const { app } = await freshApp();
    const emailService = require('../services/emailService');
    emailService._clearSentEmails();

    await request(app).post('/api/auth/forgot-password').send({ email: 'customer@swiftship.com' });
    const token = extractToken(emailService._getSentEmails()[0].html);
    expect(token).toBeTruthy();

    const resetRes = await request(app).post('/api/auth/reset-password').send({ token, password: 'NewPass123!' });
    expect(resetRes.status).toBe(200);

    const loginOld = await request(app).post('/api/auth/login').send({ email: 'customer@swiftship.com', password: 'Customer1234!' });
    expect(loginOld.status).toBe(401);

    const loginNew = await request(app).post('/api/auth/login').send({ email: 'customer@swiftship.com', password: 'NewPass123!' });
    expect(loginNew.status).toBe(200);
  });

  it('rejects reusing an already-used token', async () => {
    const { app } = await freshApp();
    const emailService = require('../services/emailService');
    emailService._clearSentEmails();

    await request(app).post('/api/auth/forgot-password').send({ email: 'customer@swiftship.com' });
    const token = extractToken(emailService._getSentEmails()[0].html);

    const first = await request(app).post('/api/auth/reset-password').send({ token, password: 'NewPass123!' });
    expect(first.status).toBe(200);

    const second = await request(app).post('/api/auth/reset-password').send({ token, password: 'AnotherPass123!' });
    expect(second.status).toBe(400);
  });

  it('rejects an invalid/unknown token', async () => {
    const { app } = await freshApp();
    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'a'.repeat(64), password: 'NewPass123!',
    });
    expect(res.status).toBe(400);
  });

  it('invalidates a previous reset token when a new one is requested', async () => {
    const { app } = await freshApp();
    const emailService = require('../services/emailService');
    emailService._clearSentEmails();

    await request(app).post('/api/auth/forgot-password').send({ email: 'customer@swiftship.com' });
    const firstToken = extractToken(emailService._getSentEmails()[0].html);

    emailService._clearSentEmails();
    await request(app).post('/api/auth/forgot-password').send({ email: 'customer@swiftship.com' });
    const secondToken = extractToken(emailService._getSentEmails()[0].html);

    expect(firstToken).not.toBe(secondToken);

    const useFirst = await request(app).post('/api/auth/reset-password').send({ token: firstToken, password: 'NewPass123!' });
    expect(useFirst.status).toBe(400);

    const useSecond = await request(app).post('/api/auth/reset-password').send({ token: secondToken, password: 'NewPass123!' });
    expect(useSecond.status).toBe(200);
  });

  it('rejects a weak new password', async () => {
    const { app } = await freshApp();
    const emailService = require('../services/emailService');
    emailService._clearSentEmails();

    await request(app).post('/api/auth/forgot-password').send({ email: 'customer@swiftship.com' });
    const token = extractToken(emailService._getSentEmails()[0].html);

    const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'weak' });
    expect(res.status).toBe(400);
  });
});
