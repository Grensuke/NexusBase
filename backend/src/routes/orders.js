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
    // Validate gig exists (quick 404 before calling the procedure)
    const [[gig]] = await conn.query(
      'SELECT gig_id FROM GIGS WHERE gig_id = ?', [gig_id]
    );
    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    // Call the stored procedure — it fetches the gig price internally
    await conn.query('SET @order_id = 0');
    await conn.query(
      'CALL place_order(?, ?, ?, @order_id)',
      [gig_id, req.user.user_id, method]
    );
    const [[outRow]] = await conn.query('SELECT @order_id AS order_id');
    const order_id = outRow.order_id;

    // Fetch the newly created order to surface commission / trial fields
    const [[newOrder]] = await conn.query(
      `SELECT order_id, gig_id, client_id, status, amount,
              is_trial, commission_rate_applied, commission_amount
         FROM ORDERS WHERE order_id = ?`,
      [order_id]
    );

    res.status(201).json({
      order_id,
      is_trial:               !!newOrder.is_trial,
      commission_rate_applied: newOrder.commission_rate_applied,
      commission_amount:       newOrder.commission_amount,
      message: 'Order placed successfully',
    });
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
               o.is_trial, o.commission_rate_applied, o.commission_amount,
               g.gig_id, g.title AS gig_title, g.delivery_days,
               u.user_id AS freelancer_id, u.name AS freelancer_name,
               p.status AS payment_status, p.method AS payment_method,
               p.escrow_status,
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
               o.is_trial, o.commission_rate_applied, o.commission_amount,
               g.gig_id, g.title AS gig_title,
               u.user_id AS client_id, u.name AS client_name,
               p.status AS payment_status, p.escrow_status,
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
      `SELECT o.*, g.title AS gig_title, g.delivery_days, g.is_trial AS gig_is_trial,
              g.freelancer_id,
              uc.name AS client_name, uf.name AS freelancer_name,
              p.payment_id, p.status AS payment_status, p.method, p.escrow_status,
              r.review_id, r.rating, r.comment, r.review_date,
              d.dispute_id, d.reason AS dispute_reason, d.status AS dispute_status,
              d.raised_by AS dispute_raised_by
         FROM ORDERS   o
         JOIN GIGS     g  ON g.gig_id   = o.gig_id
         JOIN USERS    uc ON uc.user_id = o.client_id
         JOIN USERS    uf ON uf.user_id = g.freelancer_id
         LEFT JOIN PAYMENTS p ON p.order_id = o.order_id
         LEFT JOIN REVIEWS  r ON r.order_id = o.order_id
         LEFT JOIN DISPUTES d ON d.order_id = o.order_id
        WHERE o.order_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = rows[0];
    // Access control — verify the user is either the client or the freelancer on this order
    const isClient     = req.user.role === 'client'     && order.client_id     === req.user.user_id;
    const isFreelancer = req.user.role === 'freelancer' && order.freelancer_id === req.user.user_id;
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
// State machine (matches schema ENUM lifecycle):
//   pending     → in_progress  (freelancer only)
//   in_progress → completed    (client only)
//   pending | in_progress → cancelled  (client or freelancer)
// Terminal states (completed, cancelled) reject all transitions.
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

    // Role-based transition rules + state machine enforcement
    //   pending     → in_progress  (freelancer only)
    //   in_progress → completed    (client only)
    //   pending | in_progress → cancelled (client or freelancer)
    const isClient     = order.client_id     === req.user.user_id;
    const isFreelancer = order.freelancer_id === req.user.user_id;

    // Block transitions from terminal states
    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({
        error: `Cannot change status — order is already ${order.status}`,
      });
    }

    if (status === 'in_progress') {
      if (!isFreelancer) {
        return res.status(403).json({ error: 'Only freelancer can accept order' });
      }
      if (order.status !== 'pending') {
        return res.status(400).json({ error: 'Can only accept a pending order' });
      }
    }
    if (status === 'completed') {
      if (!isClient) {
        return res.status(403).json({ error: 'Only client can mark order complete' });
      }
      if (order.status !== 'in_progress') {
        return res.status(400).json({ error: 'Can only complete an in-progress order' });
      }
    }
    if (status === 'cancelled') {
      if (!isClient && !isFreelancer) {
        return res.status(403).json({ error: 'Access denied' });
      }
      // cancellation allowed from pending or in_progress (already guarded by terminal check above)
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

// ---------------------------------------------------------------
// POST /api/orders/:id/dispute  — raise a dispute on an order
// Either the client or the freelancer on that order can raise one.
// Body: { reason: String }
// ---------------------------------------------------------------
router.post('/:id/dispute', authenticate, async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'reason is required' });
  }

  const conn = await pool.getConnection();
  try {
    // Fetch order + ownership info
    const [[order]] = await conn.query(
      `SELECT o.order_id, o.status, o.client_id, g.freelancer_id
         FROM ORDERS o JOIN GIGS g ON g.gig_id = o.gig_id
        WHERE o.order_id = ?`,
      [req.params.id]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isClient     = order.client_id     === req.user.user_id;
    const isFreelancer = order.freelancer_id === req.user.user_id;
    if (!isClient && !isFreelancer) {
      return res.status(403).json({ error: 'Access denied — not your order' });
    }

    // Only allow disputes on in-progress orders (escrow is still held)
    if (order.status !== 'in_progress') {
      return res.status(400).json({
        error: `Cannot raise a dispute on a ${order.status} order`,
      });
    }

    // Prevent duplicate open disputes
    const [[existing]] = await conn.query(
      `SELECT dispute_id FROM DISPUTES
        WHERE order_id = ? AND status = 'open'`,
      [req.params.id]
    );
    if (existing) {
      return res.status(409).json({
        error: 'An open dispute already exists for this order',
        dispute_id: existing.dispute_id,
      });
    }

    const [result] = await conn.query(
      `INSERT INTO DISPUTES (order_id, raised_by, reason) VALUES (?, ?, ?)`,
      [req.params.id, req.user.user_id, reason.trim()]
    );

    res.status(201).json({
      dispute_id: result.insertId,
      order_id:   parseInt(req.params.id, 10),
      status:     'open',
      message:    'Dispute raised — the platform will review and resolve it',
    });
  } catch (err) {
    console.error('[orders/:id/dispute POST]', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

// ---------------------------------------------------------------
// PATCH /api/disputes/:id  — resolve a dispute
// Allowed resolution values:
//   'resolved_for_client'     — freelancer at fault; escrow refunded
//   'resolved_for_freelancer' — client claim rejected; escrow released
// Access: the freelancer on the order or an admin.
//   (In this implementation "admin" is approximated as the
//    freelancer on the order for demo purposes; a real system
//    would add an admin role.)
// The after_dispute_resolved trigger does the trust-score work.
// ---------------------------------------------------------------
router.patch('/disputes/:id', authenticate, async (req, res) => {
  const { status } = req.body;
  const allowed = ['resolved_for_client', 'resolved_for_freelancer'];
  if (!allowed.includes(status)) {
    return res.status(400).json({
      error: `status must be one of: ${allowed.join(', ')}`,
    });
  }

  const conn = await pool.getConnection();
  try {
    // Fetch dispute + order context
    const [[dispute]] = await conn.query(
      `SELECT d.dispute_id, d.order_id, d.status AS current_status,
              o.client_id, g.freelancer_id
         FROM DISPUTES d
         JOIN ORDERS   o ON o.order_id = d.order_id
         JOIN GIGS     g ON g.gig_id   = o.gig_id
        WHERE d.dispute_id = ?`,
      [req.params.id]
    );
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

    if (dispute.current_status !== 'open') {
      return res.status(400).json({ error: 'Dispute is already resolved' });
    }

    // Only the freelancer on the order can resolve (admin approximation)
    const isFreelancer = dispute.freelancer_id === req.user.user_id;
    if (!isFreelancer) {
      return res.status(403).json({
        error: 'Only the freelancer (or an admin) can resolve a dispute',
      });
    }

    // Update dispute — the after_dispute_resolved trigger fires here.
    // resolved_at is set here because the trigger cannot modify its own table.
    await conn.query(
      'UPDATE DISPUTES SET status = ?, resolved_at = NOW() WHERE dispute_id = ?',
      [status, req.params.id]
    );

    res.json({
      dispute_id: parseInt(req.params.id, 10),
      status,
      message: `Dispute resolved: ${status.replace(/_/g, ' ')}`,
    });
  } catch (err) {
    console.error('[disputes/:id PATCH]', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
