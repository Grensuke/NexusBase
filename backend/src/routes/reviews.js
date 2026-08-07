const express = require('express');
const pool    = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------
// POST /api/reviews/:order_id  — leave a review (client only, order must be completed)
// ---------------------------------------------------------------
router.post('/:order_id', authenticate, requireRole('client'), async (req, res) => {
  const { rating, comment } = req.body;
  const order_id = parseInt(req.params.order_id);

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    // Verify order belongs to client and is completed
    const [[order]] = await pool.query(
      `SELECT order_id, client_id, status FROM ORDERS WHERE order_id = ?`,
      [order_id]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.client_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Not your order' });
    }
    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed orders' });
    }

    // Check no existing review
    const [[existing]] = await pool.query(
      'SELECT review_id FROM REVIEWS WHERE order_id = ?', [order_id]
    );
    if (existing) {
      return res.status(409).json({ error: 'Review already submitted for this order' });
    }

    // Insert — this fires the TRIGGER which updates freelancer avg_rating
    const [result] = await pool.query(
      'INSERT INTO REVIEWS (order_id, rating, comment) VALUES (?, ?, ?)',
      [order_id, rating, comment || null]
    );

    res.status(201).json({ review_id: result.insertId, message: 'Review submitted' });
  } catch (err) {
    console.error('[reviews POST]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------
// GET /api/reviews/gig/:gig_id  — all reviews for a gig
// ---------------------------------------------------------------
router.get('/gig/:gig_id', async (req, res) => {
  try {
    const [reviews] = await pool.query(
      `SELECT r.review_id, r.rating, r.comment, r.review_date,
              u.name AS client_name, u.avatar_url AS client_avatar
         FROM REVIEWS r
         JOIN ORDERS  o ON o.order_id = r.order_id
         JOIN USERS   u ON u.user_id  = o.client_id
        WHERE o.gig_id = ?
        ORDER BY r.review_date DESC`,
      [req.params.gig_id]
    );
    res.json(reviews);
  } catch (err) {
    console.error('[reviews/gig]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
