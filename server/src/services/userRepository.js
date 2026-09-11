const { query } = require('../config/database');

const userRepository = {
  async findByEmail(email) {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await query(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async findByIdWithPassword(id) {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create({ name, email, passwordHash, role, phone }) {
    const { rows } = await query(
      'INSERT INTO users (name, email, password, role, phone) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [name, email, passwordHash, role, phone || null]
    );
    return this.findById(rows[0].id);
  },

  async listByRole(role) {
    const { rows } = await query('SELECT id, name, email, phone FROM users WHERE role = $1', [role]);
    return rows;
  },

  async existsAndHasRole(id, role) {
    const { rows } = await query('SELECT id FROM users WHERE id = $1 AND role = $2', [id, role]);
    return rows.length > 0;
  },

  async updatePassword(id, passwordHash) {
    await query('UPDATE users SET password = $1 WHERE id = $2', [passwordHash, id]);
  },
};

module.exports = userRepository;
