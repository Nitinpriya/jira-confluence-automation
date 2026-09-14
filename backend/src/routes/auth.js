const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const { rows } = await pool.query('SELECT id, password_hash FROM users WHERE username = $1', [
    username,
  ]);
  const user = rows[0];
  const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;

  if (!user || !passwordMatches) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  req.session.userId = user.id;
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

module.exports = router;
