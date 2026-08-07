const express = require('express');
const pool    = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------
// GET /api/dashboard  — role-aware dashboard data
// ---------------------------------------------------------------
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'freelancer') {
      // Freelancer dashboard: gigs + order queue + stats
      const [gigs] = await pool.query(
        `SELECT g.gig_id, g.title, g.price, g.delivery_days, c.category_name,
                COUNT(DISTINCT o.order_id) AS total_orders,
                COUNT(DISTINCT CASE WHEN o.status='completed' THEN o.order_id END) AS completed_orders,
                COALESCE(AVG(r.rating),0) AS avg_rating
           FROM GIGS g
           JOIN CATEGORIES c ON c.category_id = g.category_id
           LEFT JOIN ORDERS  o ON o.gig_id    = g.gig_id
           LEFT JOIN REVIEWS r ON r.order_id  = o.order_id AND o.status='completed'
          WHERE g.freelancer_id = ?
          GROUP BY g.gig_id, c.category_name
          ORDER BY g.created_at DESC`,
        [req.user.user_id]
      );

      const [orders] = await pool.query(
        `SELECT o.order_id, o.status, o.amount, o.order_date,
                g.title AS gig_title,
                u.name AS client_name
           FROM ORDERS o
           JOIN GIGS   g ON g.gig_id    = o.gig_id
           JOIN USERS  u ON u.user_id   = o.client_id
          WHERE g.freelancer_id = ? AND o.status IN ('pending','in_progress')
          ORDER BY o.order_date DESC`,
        [req.user.user_id]
      );

      const [[stats]] = await pool.query(
        `SELECT u.avg_rating,
                (SELECT COUNT(*) FROM GIGS WHERE freelancer_id = ?) AS gig_count,
                (SELECT COUNT(*) FROM ORDERS o JOIN GIGS g ON g.gig_id=o.gig_id
                  WHERE g.freelancer_id = ?) AS total_orders,
                (SELECT COALESCE(SUM(o.amount),0) FROM ORDERS o JOIN GIGS g ON g.gig_id=o.gig_id
                  WHERE g.freelancer_id = ? AND o.status='completed') AS total_earned
           FROM USERS u
          WHERE u.user_id = ?`,
        [req.user.user_id, req.user.user_id, req.user.user_id, req.user.user_id]
      );

      return res.json({ role: 'freelancer', gigs, orders, stats });
    }

    // Client dashboard: order history + spending stats
    const [orders] = await pool.query(
      `SELECT o.order_id, o.status, o.amount, o.order_date,
              g.gig_id, g.title AS gig_title, g.delivery_days,
              u.name AS freelancer_name,
              p.status AS payment_status,
              r.review_id, r.rating
         FROM ORDERS   o
         JOIN GIGS     g ON g.gig_id    = o.gig_id
         JOIN USERS    u ON u.user_id   = g.freelancer_id
         LEFT JOIN PAYMENTS p ON p.order_id = o.order_id
         LEFT JOIN REVIEWS  r ON r.order_id = o.order_id
        WHERE o.client_id = ?
        ORDER BY o.order_date DESC`,
      [req.user.user_id]
    );

    const [[stats]] = await pool.query(
      `SELECT COUNT(*) AS total_orders,
              COALESCE(SUM(CASE WHEN status='completed' THEN amount ELSE 0 END), 0) AS total_spent,
              COUNT(CASE WHEN status='completed' THEN 1 END) AS completed_orders,
              COUNT(CASE WHEN status='in_progress' THEN 1 END) AS active_orders
         FROM ORDERS
        WHERE client_id = ?`,
      [req.user.user_id]
    );

    res.json({ role: 'client', orders, stats });
  } catch (err) {
    console.error('[dashboard]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
