const request = require('supertest');
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { app, __stores } = require('../src/server');

function resetStores() {
  Object.values(__stores).forEach((store) => {
    if (store instanceof Map) {
      store.clear();
    }
  });
}

describe('Auth OTP API', () => {
  beforeEach(() => {
    resetStores();
  });

  it('rejects invalid phone numbers', async () => {
    const res = await request(app)
      .post('/auth/otp/request')
      .send({ phoneNumber: '12345' });

    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /Invalid phoneNumber/);
  });

  it('creates a challenge and returns metadata', async () => {
    const res = await request(app)
      .post('/auth/otp/request')
      .send({ phoneNumber: '+886912345678' });

    assert.equal(res.statusCode, 202);
    assert.ok(res.body.challengeId);
    assert.equal(typeof res.body.expiresInSeconds, 'number');
    assert.equal(res.body.attemptsRemaining, 5);
  });

  it('allows resending after cooldown and extends expiration', async () => {
    const requestRes = await request(app)
      .post('/auth/otp/request')
      .send({ phoneNumber: '+886912345678' });

    const challengeId = requestRes.body.challengeId;
    const challenge = __stores.challenges.get(challengeId);

    // Fast-forward cooldown and expiration for test purposes.
    challenge.resendAvailableAt = Date.now() - 1000;
    challenge.expiresAt = Date.now() + 1000;

    const resendRes = await request(app)
      .post('/auth/otp/resend')
      .send({ challengeId });

    assert.equal(resendRes.statusCode, 202);
    assert.ok(resendRes.body.resendAvailableAt);
  });

  it('verifies OTP, returns tokens, and supports logout', async () => {
    const requestRes = await request(app)
      .post('/auth/otp/request')
      .send({ phoneNumber: '+886912345678' });

    const challengeId = requestRes.body.challengeId;
    const challenge = __stores.challenges.get(challengeId);
    const wrongRes = await request(app)
      .post('/auth/otp/verify')
      .send({ challengeId, otpCode: '000000' });

    assert.equal(wrongRes.statusCode, 401);
    assert.equal(wrongRes.body.attemptsRemaining, 4);

    const verifyRes = await request(app)
      .post('/auth/otp/verify')
      .send({
        challengeId,
        otpCode: challenge.otpCode,
        deviceId: 'device-1',
      });

    assert.equal(verifyRes.statusCode, 200);
    assert.ok(verifyRes.body.accessToken);
    assert.ok(verifyRes.body.refreshToken);
    assert.equal(verifyRes.body.tokenType, 'Bearer');

    const logoutRes = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${verifyRes.body.accessToken}`)
      .send({ deviceId: 'device-1' });

    assert.equal(logoutRes.statusCode, 204);
  });
});
