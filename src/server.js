const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_ATTEMPTS = 5;
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const phoneCooldowns = new Map();
const challenges = new Map();
const users = new Map();
const accessTokens = new Map();
const refreshTokens = new Map();

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function pruneExpiredChallenges() {
  const now = Date.now();
  for (const [challengeId, challenge] of challenges.entries()) {
    if (challenge.expiresAt <= now) {
      challenges.delete(challengeId);
    }
  }
}

function validatePhoneNumber(phoneNumber) {
  if (typeof phoneNumber !== 'string') return false;
  // Basic validation for E.164 + country code format (Taiwan numbers start with +886)
  return /^\+?[1-9]\d{6,14}$/.test(phoneNumber);
}

function buildProfileForUser(user) {
  return {
    phoneNumber: user.phoneNumber,
    locale: user.locale || 'zh-TW',
    createdAt: new Date(user.createdAt).toISOString(),
  };
}

app.post('/auth/otp/request', (req, res) => {
  pruneExpiredChallenges();

  const { phoneNumber, channel = 'sms', locale = 'zh-TW' } = req.body || {};

  if (!validatePhoneNumber(phoneNumber)) {
    return res.status(400).json({ error: 'Invalid phoneNumber format.' });
  }

  if (channel !== 'sms') {
    return res.status(400).json({ error: 'Unsupported delivery channel.' });
  }

  const now = Date.now();
  const cooldown = phoneCooldowns.get(phoneNumber);
  if (cooldown && cooldown > now) {
    const retryAfterSeconds = Math.ceil((cooldown - now) / 1000);
    return res.status(429).json({
      error: 'Too many OTP requests. Please wait before requesting again.',
      retryAfterSeconds,
    });
  }

  const challengeId = uuidv4();
  const otpCode = generateOtpCode();
  const expiresAt = now + CHALLENGE_TTL_MS;
  const resendAvailableAt = now + RESEND_COOLDOWN_MS;

  challenges.set(challengeId, {
    challengeId,
    phoneNumber,
    otpCode,
    locale,
    expiresAt,
    resendAvailableAt,
    attemptsRemaining: MAX_ATTEMPTS,
    createdAt: now,
    verified: false,
  });

  phoneCooldowns.set(phoneNumber, now + RESEND_COOLDOWN_MS);

  return res.status(202).json({
    challengeId,
    expiresInSeconds: Math.floor((expiresAt - now) / 1000),
    resendAvailableAt: new Date(resendAvailableAt).toISOString(),
    attemptsRemaining: MAX_ATTEMPTS,
  });
});

app.post('/auth/otp/resend', (req, res) => {
  pruneExpiredChallenges();

  const { challengeId, deliveryHint = 'sms' } = req.body || {};
  if (!challengeId) {
    return res.status(400).json({ error: 'challengeId is required.' });
  }

  if (deliveryHint !== 'sms') {
    return res.status(400).json({ error: 'Unsupported delivery channel.' });
  }

  const challenge = challenges.get(challengeId);
  if (!challenge) {
    return res.status(404).json({ error: 'Challenge not found or expired.' });
  }

  const now = Date.now();
  if (challenge.expiresAt <= now) {
    challenges.delete(challengeId);
    return res.status(404).json({ error: 'Challenge not found or expired.' });
  }

  if (challenge.resendAvailableAt > now) {
    return res.status(429).json({
      error: 'Resend is throttled. Please wait.',
      resendAvailableAt: new Date(challenge.resendAvailableAt).toISOString(),
    });
  }

  challenge.otpCode = generateOtpCode();
  challenge.resendAvailableAt = now + RESEND_COOLDOWN_MS;
  challenge.expiresAt = now + CHALLENGE_TTL_MS;

  return res.status(202).json({
    challengeId,
    expiresInSeconds: Math.floor((challenge.expiresAt - now) / 1000),
    resendAvailableAt: new Date(challenge.resendAvailableAt).toISOString(),
  });
});

app.post('/auth/otp/verify', (req, res) => {
  pruneExpiredChallenges();

  const { challengeId, otpCode, deviceId, referralCode } = req.body || {};

  if (!challengeId || !otpCode) {
    return res.status(400).json({ error: 'challengeId and otpCode are required.' });
  }

  const challenge = challenges.get(challengeId);
  if (!challenge) {
    return res.status(400).json({ error: 'Invalid or expired challenge.' });
  }

  const now = Date.now();
  if (challenge.expiresAt <= now) {
    challenges.delete(challengeId);
    return res.status(400).json({ error: 'Invalid or expired challenge.' });
  }

  if (challenge.attemptsRemaining <= 0) {
    challenges.delete(challengeId);
    return res.status(401).json({ error: 'No attempts remaining.' });
  }

  if (challenge.otpCode !== String(otpCode)) {
    challenge.attemptsRemaining -= 1;
    return res.status(401).json({
      error: 'Incorrect OTP code.',
      attemptsRemaining: challenge.attemptsRemaining,
    });
  }

  challenges.delete(challengeId);

  let user = users.get(challenge.phoneNumber);
  let newUser = false;
  if (!user) {
    user = {
      userId: uuidv4(),
      phoneNumber: challenge.phoneNumber,
      locale: challenge.locale,
      createdAt: now,
      referralCode: referralCode || null,
    };
    users.set(challenge.phoneNumber, user);
    newUser = true;
  }

  const accessToken = uuidv4();
  const refreshToken = uuidv4();
  const accessExpiresAt = now + ACCESS_TOKEN_TTL_MS;
  const refreshExpiresAt = now + REFRESH_TOKEN_TTL_MS;

  const session = {
    userId: user.userId,
    phoneNumber: challenge.phoneNumber,
    deviceId: deviceId || null,
    accessToken,
    refreshToken,
    accessExpiresAt,
    refreshExpiresAt,
  };

  accessTokens.set(accessToken, session);
  refreshTokens.set(refreshToken, session);

  return res.json({
    userId: user.userId,
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: Math.floor((accessExpiresAt - now) / 1000),
    newUser,
    profile: buildProfileForUser(user),
  });
});

app.post('/auth/logout', (req, res) => {
  const authHeader = req.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const { deviceId } = req.body || {};

  if (!deviceId) {
    return res.status(400).json({ error: 'deviceId is required.' });
  }

  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid access token.' });
  }

  const session = accessTokens.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired access token.' });
  }

  if (session.deviceId && deviceId !== session.deviceId) {
    return res.status(401).json({ error: 'Device mismatch.' });
  }

  accessTokens.delete(session.accessToken);
  refreshTokens.delete(session.refreshToken);

  return res.status(204).send();
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Auth service listening on port ${PORT}`);
  });
}

module.exports = { app, __stores: { challenges, users, accessTokens, refreshTokens, phoneCooldowns } };
