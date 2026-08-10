const express = require('express');
const pool    = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------
// GET /api/trust/tiers
// Public endpoint — serves the fee_transparency view so that
// evaluators can verify the commission schedule is enforced, not
// just documented in the README.
// ---------------------------------------------------------------
router.get('/tiers', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT tier_id, tier_name, min_trust_score,
              commission_rate, commission_pct,
              trial_price_cap, trial_orders_required,
              freelancers_in_tier
         FROM fee_transparency`
    );
    res.json(rows);
  } catch (err) {
    console.error('[trust/tiers]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------
// GET /api/users/me/trust
// Authenticated — returns the caller's own trust snapshot:
//   • trust_score         (current computed value)
//   • trust_tier_id / tier_name
//   • commission_rate     (what they're currently charged)
//   • trial_orders_completed / trial_orders_required
//   • trial_price_cap     (NULL if not in a trial tier)
//   • trial_progress_pct  (0-100 convenience field for UI bar)
//
// Mounted on /api/trust so the path is GET /api/trust/me/trust —
// but consumed by the frontend as /api/trust/me (see index.js).
// ---------------------------------------------------------------
router.get('/me', authenticate, async (req, res) => {
  try {
    const [[row]] = await pool.query(
      `SELECT u.user_id, u.name, u.role,
              u.trust_score, u.trial_orders_completed,
              tt.tier_id      AS trust_tier_id,
              tt.tier_name,
              tt.commission_rate,
              ROUND(tt.commission_rate * 100, 2) AS commission_pct,
              tt.trial_price_cap,
              tt.trial_orders_required,
              -- Progress toward promotion expressed as a percentage (capped at 100)
              LEAST(100, ROUND(
                  u.trial_orders_completed /
                  GREATEST(tt.trial_orders_required, 1) * 100,
              0)) AS trial_progress_pct
         FROM USERS u
         JOIN TRUST_TIERS tt ON tt.tier_id = u.trust_tier_id
        WHERE u.user_id = ?`,
      [req.user.user_id]
    );
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  } catch (err) {
    console.error('[trust/me]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
