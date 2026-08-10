const express = require('express');
const pool    = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------
// POST /api/assessments/:skill_id
// Submit a skill assessment attempt (freelancers only).
// Body: { score: Number }
// Passing threshold: score >= 70 marks the attempt as passed.
// On pass: skill is automatically added to USER_SKILLS so it
//   appears immediately in the dashboard Skills tab.
// After writing the row, recalculate_trust_score is called so the
// freelancer's trust_score and potential auto-promotion are
// computed immediately.
// ---------------------------------------------------------------
router.post('/:skill_id', authenticate, requireRole('freelancer'), async (req, res) => {
  const { score } = req.body;
  const skill_id  = parseInt(req.params.skill_id, 10);

  if (score === undefined || score === null) {
    return res.status(400).json({ error: 'score is required' });
  }
  const numScore = parseFloat(score);
  if (isNaN(numScore) || numScore < 0 || numScore > 100) {
    return res.status(400).json({ error: 'score must be a number between 0 and 100' });
  }

  const conn = await pool.getConnection();
  try {
    // Verify the skill exists
    const [[skill]] = await conn.query(
      'SELECT skill_id, skill_name FROM SKILLS WHERE skill_id = ?', [skill_id]
    );
    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    const passed = numScore >= 70 ? 1 : 0;

    // Insert assessment row
    const [result] = await conn.query(
      `INSERT INTO SKILL_ASSESSMENTS (user_id, skill_id, score, passed)
       VALUES (?, ?, ?, ?)`,
      [req.user.user_id, skill_id, numScore, passed]
    );

    // On pass: automatically add skill to USER_SKILLS so the
    // dashboard Skills tab reflects the verified skill immediately.
    // INSERT IGNORE silently skips if the row already exists.
    if (passed) {
      await conn.query(
        `INSERT IGNORE INTO USER_SKILLS (user_id, skill_id) VALUES (?, ?)`,
        [req.user.user_id, skill_id]
      );
    }

    // Trigger trust-score recalculation (procedure handles auto-promotion)
    await conn.query('CALL recalculate_trust_score(?)', [req.user.user_id]);

    // Return updated trust snapshot alongside the new assessment record
    const [[trustRow]] = await conn.query(
      `SELECT u.trust_score, u.trust_tier_id, u.trial_orders_completed,
              tt.tier_name, tt.commission_rate, tt.trial_price_cap,
              tt.trial_orders_required
         FROM USERS u
         JOIN TRUST_TIERS tt ON tt.tier_id = u.trust_tier_id
        WHERE u.user_id = ?`,
      [req.user.user_id]
    );

    res.status(201).json({
      assessment_id:          result.insertId,
      skill_id,
      skill_name:             skill.skill_name,
      score:                  numScore,
      passed:                 !!passed,
      skill_added_to_profile: !!passed,
      message:                passed
        ? 'Assessment passed \u2713 \u2014 skill added to your profile'
        : 'Assessment failed \u2014 you may retake it',
      trust_snapshot: trustRow,
    });
  } catch (err) {
    console.error('[assessments POST]', err);
    const msg = err.sqlMessage || err.message || 'Server error';
    res.status(err.sqlMessage ? 400 : 500).json({ error: msg });
  } finally {
    conn.release();
  }
});

// ---------------------------------------------------------------
// GET /api/assessments/me
// Returns the authenticated freelancer's full assessment history,
// most recent first.  Includes skill name for display convenience.
// ---------------------------------------------------------------
router.get('/me', authenticate, requireRole('freelancer'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT sa.assessment_id, sa.skill_id, s.skill_name,
              sa.score, sa.passed, sa.taken_at
         FROM SKILL_ASSESSMENTS sa
         JOIN SKILLS s ON s.skill_id = sa.skill_id
        WHERE sa.user_id = ?
        ORDER BY sa.taken_at DESC`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[assessments/me]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
