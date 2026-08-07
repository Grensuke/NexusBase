const express  = require('express');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const pool     = require('../config/db');

const router = express.Router();
const SALT_ROUNDS = 10;

// ---------------------------------------------------------------
// POST /api/auth/signup
// ---------------------------------------------------------------
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!['client', 'freelancer'].includes(role)) {
    return res.status(400).json({ error: 'Role must be client or freelancer' });
  }

  try {
    // Check email uniqueness
    const [existing] = await pool.query(
      'SELECT user_id FROM USERS WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO USERS (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, role]
    );

    const user_id = result.insertId;
    const token = jwt.sign(
      { user_id, email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: { user_id, name, email, role }
    });
  } catch (err) {
    console.error('[signup]', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// ---------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT user_id, name, email, password_hash, role FROM USERS WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        user_id:  user.user_id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
      }
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
