const bcrypt = require('bcrypt');
const pool = require('../db');
const config = require('../config/env');

// Ensures a default team login exists (TASK-04); idempotent on repeated startup.
async function seedDefaultUser() {
  const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [
    config.seedUsername,
  ]);
  if (rows.length > 0) return;

  const passwordHash = await bcrypt.hash(config.seedPassword, 12);
  await pool.query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
    [config.seedUsername, passwordHash]
  );
  console.log(`Seeded default user "${config.seedUsername}"`);
}

module.exports = { seedDefaultUser };
