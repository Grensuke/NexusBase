const express = require('express');
const pool    = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------
// GET /api/gigs  — browse with optional search & category filter
// ---------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = 'WHERE 1=1';

    if (category) {
      where += ' AND g.category_id = ?';
      params.push(category);
    }
    if (search) {
      where += ' AND (g.title LIKE ? OR g.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countQuery = `SELECT COUNT(*) AS total FROM GIGS g ${where}`;
    const [[countRow]] = await pool.query(countQuery, params);

    const dataQuery = `
      SELECT g.gig_id, g.title, g.description, g.price, g.delivery_days, g.created_at,
             c.category_name,
             u.user_id AS freelancer_id, u.name AS freelancer_name, u.avg_rating AS freelancer_rating,
             COALESCE(AVG(r.rating), 0) AS avg_rating,
             COUNT(DISTINCT r.review_id) AS review_count
        FROM GIGS g
        JOIN CATEGORIES c ON c.category_id = g.category_id
        JOIN USERS      u ON u.user_id      = g.freelancer_id
        LEFT JOIN ORDERS  o ON o.gig_id = g.gig_id AND o.status = 'completed'
        LEFT JOIN REVIEWS r ON r.order_id = o.order_id
       ${where}
       GROUP BY g.gig_id, g.title, g.description, g.price, g.delivery_days,
                g.created_at, c.category_name, u.user_id, u.name, u.avg_rating
       ORDER BY avg_rating DESC, g.created_at DESC
       LIMIT ? OFFSET ?`;

    params.push(parseInt(limit), offset);
    const [gigs] = await pool.query(dataQuery, params);

    res.json({
      gigs,
      total:    countRow.total,
      page:     parseInt(page),
      pages:    Math.ceil(countRow.total / parseInt(limit)),
    });
  } catch (err) {
    console.error('[gigs GET]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------
// GET /api/gigs/freelancer/my  — freelancer's own gigs
// MUST be before /:id to prevent Express treating "freelancer" as an id
// ---------------------------------------------------------------
router.get('/freelancer/my', authenticate, requireRole('freelancer'), async (req, res) => {
  try {
    const [gigs] = await pool.query(
      `SELECT g.*, c.category_name,
              COUNT(DISTINCT o.order_id) AS total_orders,
              COUNT(DISTINCT CASE WHEN o.status='completed' THEN o.order_id END) AS completed_orders
         FROM GIGS g
         JOIN CATEGORIES c ON c.category_id = g.category_id
         LEFT JOIN ORDERS o ON o.gig_id = g.gig_id
        WHERE g.freelancer_id = ?
        GROUP BY g.gig_id, c.category_name
        ORDER BY g.created_at DESC`,
      [req.user.user_id]
    );
    res.json(gigs);
  } catch (err) {
    console.error('[gigs/freelancer/my]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------
// GET /api/gigs/:id  — single gig detail
// ---------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT g.gig_id, g.title, g.description, g.price, g.delivery_days, g.created_at,
              c.category_id, c.category_name,
              u.user_id AS freelancer_id, u.name AS freelancer_name,
              u.bio AS freelancer_bio, u.avg_rating AS freelancer_rating,
              GROUP_CONCAT(DISTINCT s.skill_name ORDER BY s.skill_name SEPARATOR ',') AS freelancer_skills,
              COALESCE(AVG(r.rating), 0) AS avg_rating,
              COUNT(DISTINCT r.review_id) AS review_count
         FROM GIGS g
         JOIN CATEGORIES c  ON c.category_id = g.category_id
         JOIN USERS      u  ON u.user_id      = g.freelancer_id
         LEFT JOIN USER_SKILLS us ON us.user_id  = u.user_id
         LEFT JOIN SKILLS      s  ON s.skill_id  = us.skill_id
         LEFT JOIN ORDERS  o ON o.gig_id    = g.gig_id AND o.status = 'completed'
         LEFT JOIN REVIEWS r ON r.order_id  = o.order_id
        WHERE g.gig_id = ?
        GROUP BY g.gig_id, c.category_id, u.user_id`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Gig not found' });
    const gig = rows[0];
    gig.freelancer_skills = gig.freelancer_skills ? gig.freelancer_skills.split(',') : [];

    // Fetch reviews separately
    const [reviews] = await pool.query(
      `SELECT r.review_id, r.rating, r.comment, r.review_date,
              u.name AS client_name
         FROM REVIEWS r
         JOIN ORDERS  o ON o.order_id = r.order_id
         JOIN USERS   u ON u.user_id  = o.client_id
        WHERE o.gig_id = ?
        ORDER BY r.review_date DESC`,
      [req.params.id]
    );
    gig.reviews = reviews;
    res.json(gig);
  } catch (err) {
    console.error('[gigs/:id]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------
// POST /api/gigs  — create gig (freelancer only)
// ---------------------------------------------------------------
router.post('/', authenticate, requireRole('freelancer'), async (req, res) => {
  const { category_id, title, description, price, delivery_days } = req.body;
  if (!category_id || !title || !description || !price || !delivery_days) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO GIGS (freelancer_id, category_id, title, description, price, delivery_days)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.user_id, category_id, title, description, price, delivery_days]
    );
    res.status(201).json({ gig_id: result.insertId, message: 'Gig created' });
  } catch (err) {
    console.error('[gigs POST]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------
// PUT /api/gigs/:id  — edit gig (owner only)
// ---------------------------------------------------------------
router.put('/:id', authenticate, requireRole('freelancer'), async (req, res) => {
  const { category_id, title, description, price, delivery_days } = req.body;
  try {
    const [[gig]] = await pool.query(
      'SELECT freelancer_id FROM GIGS WHERE gig_id = ?', [req.params.id]
    );
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.freelancer_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Not your gig' });
    }
    await pool.query(
      `UPDATE GIGS SET category_id=?, title=?, description=?, price=?, delivery_days=?
        WHERE gig_id = ?`,
      [category_id, title, description, price, delivery_days, req.params.id]
    );
    res.json({ message: 'Gig updated' });
  } catch (err) {
    console.error('[gigs PUT]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------
// DELETE /api/gigs/:id  — delete gig (owner only)
// ---------------------------------------------------------------
router.delete('/:id', authenticate, requireRole('freelancer'), async (req, res) => {
  try {
    const [[gig]] = await pool.query(
      'SELECT freelancer_id FROM GIGS WHERE gig_id = ?', [req.params.id]
    );
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.freelancer_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Not your gig' });
    }
    await pool.query('DELETE FROM GIGS WHERE gig_id = ?', [req.params.id]);
    res.json({ message: 'Gig deleted' });
  } catch (err) {
    console.error('[gigs DELETE]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
