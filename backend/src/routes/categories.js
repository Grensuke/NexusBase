const express = require('express');
const pool    = require('../config/db');

const categoriesRouter = express.Router();
const skillsRouter     = express.Router();

// GET /api/categories
categoriesRouter.get('/', async (req, res) => {
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

// ---------------------------------------------------------------
// GET /api/skills?q=react
// Public — returns all skills whose name matches the optional
// ?q search term (case-insensitive prefix/substring search).
// Used by the dashboard skill autocomplete typeahead.
// ---------------------------------------------------------------
skillsRouter.get('/', async (req, res) => {
  const { q } = req.query;
  try {
    let rows;
    if (q && q.trim()) {
      [rows] = await pool.query(
        `SELECT skill_id, skill_name
           FROM SKILLS
          WHERE skill_name LIKE ?
          ORDER BY skill_name
          LIMIT 20`,
        [`%${q.trim()}%`]
      );
    } else {
      [rows] = await pool.query(
        'SELECT skill_id, skill_name FROM SKILLS ORDER BY skill_name'
      );
    }
    res.json(rows);
  } catch (err) {
    console.error('[skills]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = { categoriesRouter, skillsRouter };
