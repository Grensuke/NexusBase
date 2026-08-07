const express = require('express');
const pool    = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------
// GET /api/users/me  — current user profile
// ---------------------------------------------------------------
router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.role, u.bio, u.avatar_url, u.avg_rating, u.created_at,
              GROUP_CONCAT(s.skill_name ORDER BY s.skill_name SEPARATOR ',') AS skills
         FROM USERS u
         LEFT JOIN USER_SKILLS us ON us.user_id = u.user_id
         LEFT JOIN SKILLS s       ON s.skill_id  = us.skill_id
        WHERE u.user_id = ?
        GROUP BY u.user_id`,
      [req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];
    user.skills = user.skills ? user.skills.split(',') : [];
    res.json(user);
  } catch (err) {
    console.error('[users/me]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------
// GET /api/users/top/freelancers  — from the VIEW
// MUST be before /:id to prevent Express treating "top" as an id
// ---------------------------------------------------------------
router.get('/top/freelancers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM top_freelancers LIMIT 10');
    res.json(rows);
  } catch (err) {
    console.error('[top-freelancers]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------
// GET /api/users/:id  — public profile
// ---------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.name, u.role, u.bio, u.avatar_url, u.avg_rating, u.created_at,
              GROUP_CONCAT(s.skill_name ORDER BY s.skill_name SEPARATOR ',') AS skills
         FROM USERS u
         LEFT JOIN USER_SKILLS us ON us.user_id = u.user_id
         LEFT JOIN SKILLS s       ON s.skill_id  = us.skill_id
        WHERE u.user_id = ?
        GROUP BY u.user_id`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];
    user.skills = user.skills ? user.skills.split(',') : [];
    res.json(user);
  } catch (err) {
    console.error('[users/:id]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------
// PUT /api/users/me  — update bio / avatar
// ---------------------------------------------------------------
router.put('/me', authenticate, async (req, res) => {
  const { bio, avatar_url } = req.body;
  try {
    await pool.query(
      'UPDATE USERS SET bio = ?, avatar_url = ? WHERE user_id = ?',
      [bio || null, avatar_url || null, req.user.user_id]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error('[users/me PUT]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------
// PUT /api/users/me/skills  — replace skill set for freelancer
// ---------------------------------------------------------------
router.put('/me/skills', authenticate, requireRole('freelancer'), async (req, res) => {
  const { skills } = req.body; // array of skill names
  if (!Array.isArray(skills)) {
    return res.status(400).json({ error: 'skills must be an array of skill names' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Upsert each skill name → get skill_id
    const skillIds = [];
    for (const name of skills) {
      if (!name || !name.trim()) continue;
      await conn.query(
        'INSERT IGNORE INTO SKILLS (skill_name) VALUES (?)', [name.trim()]
      );
      const [[row]] = await conn.query(
        'SELECT skill_id FROM SKILLS WHERE skill_name = ?', [name.trim()]
      );
      skillIds.push(row.skill_id);
    }

    // Replace USER_SKILLS
    await conn.query('DELETE FROM USER_SKILLS WHERE user_id = ?', [req.user.user_id]);
    for (const sid of skillIds) {
      await conn.query(
        'INSERT IGNORE INTO USER_SKILLS (user_id, skill_id) VALUES (?, ?)',
        [req.user.user_id, sid]
      );
    }

    await conn.commit();
    res.json({ message: 'Skills updated', skills });
  } catch (err) {
    await conn.rollback();
    console.error('[users/me/skills]', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
