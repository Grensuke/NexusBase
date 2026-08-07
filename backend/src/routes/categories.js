const express = require('express');
const pool    = require('../config/db');

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT category_id, category_name FROM CATEGORIES ORDER BY category_name'
    );
    res.json(rows);
  } catch (err) {
    console.error('[categories]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
