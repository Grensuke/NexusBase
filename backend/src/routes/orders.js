const express = require('express');
const pool    = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------
// POST /api/orders  — place an order via stored procedure
// ---------------------------------------------------------------
router.post('/', authenticate, requireRole('client'), async (req, res) => {
  const { gig_id, method = 'card' } = req.body;
  if (!gig_id) {
    return res.status(400).json({ error: 'gig_id is required' });
  }

  const conn = await pool.getConnection();
  try {
    // Fetch gig price for the amount
    const [[gig]] = await conn.query(
      'SELECT gig_id, price FROM GIGS WHERE gig_id = ?', [gig_id]
    );
    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    // Call the stored procedure
    await conn.query('SET @order_id = 0');
    await conn.query(
      'CALL place_order(?, ?, ?, ?, @order_id)',
      [gig_id, req.user.user_id, gig.price, method]
    );
    const [[outRow]] = await conn.query('SELECT @order_id AS order_id');
    const order_id = outRow.order_id;

    res.status(201).json({ order_id, message: 'Order placed successfully' });
  } catch (err) {
    console.error('[orders POST]', err);
    const msg = err.sqlMessage || err.message || 'Server error';
    res.status(err.sqlMessage ? 400 : 500).json({ error: msg });
  } finally {
    conn.release();
  }
});

// ---------------------------------------------------------------
// GET /api/orders  — list orders (client sees own, freelancer sees gig orders)
// ---------------------------------------------------------------
router.get('/', authenticate, async (req, res) => {
  try {
    let query, params;

    if (req.user.role === 'client') {
      query = `
        SELECT o.order_id, o.status, o.amount, o.order_date,
               g.gig_id, g.title AS gig_title, g.delivery_days,
               u.user_id AS freelancer_id, u.name AS freelancer_name,
               p.status AS payment_status, p.method AS payment_method,
               r.review_id, r.rating, r.comment AS review_comment
          FROM ORDERS   o
          JOIN GIGS     g ON g.gig_id    = o.gig_id
          JOIN USERS    u ON u.user_id   = g.freelancer_id
          LEFT JOIN PAYMENTS p ON p.order_id = o.order_id
          LEFT JOIN REVIEWS  r ON r.order_id = o.order_id
         WHERE o.client_id = ?
         ORDER BY o.order_date DESC`;
      params = [req.user.user_id];
    } else {
      query = `
        SELECT o.order_id, o.status, o.amount, o.order_date,
               g.gig_id, g.title AS gig_title,
               u.user_id AS client_id, u.name AS client_name,
               p.status AS payment_status,
               r.review_id, r.rating
          FROM ORDERS   o
          JOIN GIGS     g ON g.gig_id    = o.gig_id
          JOIN USERS    u ON u.user_id   = o.client_id
          LEFT JOIN PAYMENTS p ON p.order_id = o.order_id
          LEFT JOIN REVIEWS  r ON r.order_id = o.order_id
         WHERE g.freelancer_id = ?
         ORDER BY o.order_date DESC`;
      params = [req.user.user_id];
    }

    const [orders] = await pool.query(query, params);
    res.json(orders);
  } catch (err) {
    console.error('[orders GET]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------
// GET /api/orders/:id  — single order detail
// ---------------------------------------------------------------
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, g.title AS gig_title, g.delivery_days,
              uc.name AS client_name, uf.name AS freelancer_name,
              p.payment_id, p.status AS payment_status, p.method,
              r.review_id, r.rating, r.comment, r.review_date
         FROM ORDERS   o
         JOIN GIGS     g  ON g.gig_id   = o.gig_id
         JOIN USERS    uc ON uc.user_id = o.client_id
         JOIN USERS    uf ON uf.user_id = g.freelancer_id
         LEFT JOIN PAYMENTS p ON p.order_id = o.order_id
         LEFT JOIN REVIEWS  r ON r.order_id = o.order_id
        WHERE o.order_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = rows[0];
    // Access control
    const isClient     = req.user.role === 'client'     && order.client_id === req.user.user_id;
    const isFreelancer = req.user.role === 'freelancer'; // need to verify it's their gig
    if (!isClient && !isFreelancer) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(order);
  } catch (err) {
    console.error('[orders/:id]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------
// PATCH /api/orders/:id/status  — update order status
// Freelancers can move: pending -> in_progress
// Clients can move: in_progress -> completed, any -> cancelled
// ---------------------------------------------------------------
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const conn = await pool.getConnection();
  try {
    const [[order]] = await conn.query(
      `SELECT o.order_id, o.status, o.client_id, g.freelancer_id
         FROM ORDERS o JOIN GIGS g ON g.gig_id = o.gig_id
        WHERE o.order_id = ?`,
      [req.params.id]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Role-based transition rules
    const isClient     = order.client_id     === req.user.user_id;
    const isFreelancer = order.freelancer_id === req.user.user_id;

    if (status === 'in_progress' && !isFreelancer) {
      return res.status(403).json({ error: 'Only freelancer can accept order' });
    }
    if (status === 'completed' && !isClient) {
      return res.status(403).json({ error: 'Only client can mark order complete' });
    }
    if (status === 'cancelled' && !isClient && !isFreelancer) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await conn.beginTransaction();
    await conn.query(
      'UPDATE ORDERS SET status = ? WHERE order_id = ?',
      [status, req.params.id]
    );

    // If completed, also mark payment as completed
    if (status === 'completed') {
      await conn.query(
        "UPDATE PAYMENTS SET status = 'completed' WHERE order_id = ?",
        [req.params.id]
      );
    }
    // If cancelled, refund payment
    if (status === 'cancelled') {
      await conn.query(
        "UPDATE PAYMENTS SET status = 'refunded' WHERE order_id = ?",
        [req.params.id]
      );
    }
    await conn.commit();
    res.json({ message: `Order status updated to ${status}` });
  } catch (err) {
    await conn.rollback();
    console.error('[orders PATCH]', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
