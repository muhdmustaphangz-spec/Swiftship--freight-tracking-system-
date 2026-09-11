const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userRepository = require('./userRepository');
const passwordResetRepository = require('./passwordResetRepository');
const { signToken } = require('../middleware/auth');
const { sendEmail } = require('./emailService');
const { welcomeEmail, passwordResetEmail } = require('./emailTemplates');
const AppError = require('../utils/AppError');
const config = require('../config/env');

const RESET_TOKEN_TTL_MINUTES = 30;

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone };
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

const authService = {
  async register({ name, email, password, role, phone }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw AppError.conflict('An account with this email already exists');

    const passwordHash = bcrypt.hashSync(password, config.bcryptRounds);
    const finalRole = role === 'driver' ? 'driver' : 'customer'; // admins are never self-registered

    const user = await userRepository.create({ name, email, passwordHash, role: finalRole, phone });
    const token = signToken(user);

    // Fire-and-forget: a slow/failed welcome email should never block registration.
    const welcome = welcomeEmail(user);
    sendEmail({ to: user.email, ...welcome }).catch(() => {});

    return { token, user: toPublicUser(user) };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw AppError.unauthorized('Invalid email or password');
    }
    const token = signToken(user);
    return { token, user: toPublicUser(user) };
  },

  async getCurrentUser(id) {
    const user = await userRepository.findById(id);
    if (!user) throw AppError.notFound('User not found');
    return user;
  },

  /**
   * Requests a password reset. Always resolves the same way whether or not
   * the email exists, so this endpoint can never be used to enumerate which
   * emails have accounts. If the account exists, an email is sent with a
   * one-time link; any previously requested, still-valid reset is invalidated.
   */
  async requestPasswordReset(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) return; // deliberately silent — same response as the success path

    await passwordResetRepository.invalidateAllForUser(user.id);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    await passwordResetRepository.create(user.id, tokenHash, expiresAt);

    const resetUrl = `${config.frontendUrl}/reset-password?token=${rawToken}`;
    const email_ = passwordResetEmail({ name: user.name, resetUrl, ttlMinutes: RESET_TOKEN_TTL_MINUTES });
    await sendEmail({ to: user.email, ...email_ });
  },

  /**
   * Completes a password reset given the raw token from the emailed link.
   * The token is single-use (marked used immediately) and time-limited.
   */
  async resetPassword(rawToken, newPassword) {
    const tokenHash = hashToken(rawToken);
    const record = await passwordResetRepository.findValidByHash(tokenHash);
    if (!record) throw AppError.badRequest('This reset link is invalid or has expired. Please request a new one.');

    const passwordHash = bcrypt.hashSync(newPassword, config.bcryptRounds);
    await userRepository.updatePassword(record.user_id, passwordHash);
    await passwordResetRepository.markUsed(record.id);
  },
};

module.exports = authService;
