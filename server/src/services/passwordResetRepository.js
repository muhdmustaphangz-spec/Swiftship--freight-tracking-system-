const { query } = require('../config/database');

const passwordResetRepository = {
  async create(userId, tokenHash, expiresAt) {
    await query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)',
      [userId, tokenHash, expiresAt]
    );
  },

  // Finds a valid (unused, unexpired) token row by its hash, joined with the user.
  async findValidByHash(tokenHash) {
    const { rows } = await query(
      `SELECT prt.id, prt.user_id, prt.expires_at, prt.used_at, u.email, u.name, u.role
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1 AND prt.used_at IS NULL AND prt.expires_at > NOW()`,
      [tokenHash]
    );
    return rows[0] || null;
  },

  async markUsed(id) {
    await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [id]);
  },

  // Invalidate any previous outstanding tokens for a user when a new one is
  // requested, so only the most recently requested reset link can ever work.
  async invalidateAllForUser(userId) {
    await query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
      [userId]
    );
  },
};

module.exports = passwordResetRepository;
