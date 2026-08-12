const express = require('express');
const pool    = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { getQuestionsForGrading, getQuestionsForClient } = require('../data/questions');

const router = express.Router();

// ---------------------------------------------------------------
// GET /api/assessments/:skill_id/questions
// Returns the quiz questions for a given skill WITHOUT correct
// answers.  The frontend displays them (optionally shuffled for
// UI) but must submit answers as canonical-order indices.
// ---------------------------------------------------------------
router.get('/:skill_id/questions', authenticate, requireRole('freelancer'), async (req, res) => {
  const skill_id = parseInt(req.params.skill_id, 10);

  try {
    const [[skill]] = await pool.query(
      'SELECT skill_id, skill_name FROM SKILLS WHERE skill_id = ?', [skill_id]
    );
    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    const questions = getQuestionsForClient(skill.skill_name);

    res.json({
      skill_id:   skill.skill_id,
      skill_name: skill.skill_name,
      total:      questions.length,
      pass_threshold: 70,
      questions,   // { q, options } — NO correct index
    });
  } catch (err) {
    console.error('[assessments/questions GET]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------
// POST /api/assessments/:skill_id
// Submit assessment answers (freelancers only).
// Body: { answers: [number, ...] }
//   — each element is the 0-based index of the selected option
//     in the CANONICAL order (same order returned by the GET).
//
// The backend grades the answers against the server-side question
// bank and computes the score.  The client CANNOT influence the
// score directly.
//
// On pass (>= 70%): skill is added to USER_SKILLS.
// After every attempt: recalculate_trust_score is called.
// ---------------------------------------------------------------
router.post('/:skill_id', authenticate, requireRole('freelancer'), async (req, res) => {
  const { answers } = req.body;
  const skill_id    = parseInt(req.params.skill_id, 10);

  // Validate answers is a non-empty array of numbers
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'answers must be a non-empty array of option indices' });
  }

  const conn = await pool.getConnection();
  try {
    // Verify the skill exists
    const [[skill]] = await conn.query(
      'SELECT skill_id, skill_name FROM SKILLS WHERE skill_id = ?', [skill_id]
    );
    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    // Fetch the authoritative questions (WITH correct answers)
    const questions = getQuestionsForGrading(skill.skill_name);

    // Validate answer count matches question count
    if (answers.length !== questions.length) {
      return res.status(400).json({
        error: `Expected ${questions.length} answers, received ${answers.length}`,
      });
    }

    // Validate each answer is a valid option index
    for (let i = 0; i < answers.length; i++) {
      const a = answers[i];
      if (typeof a !== 'number' || !Number.isInteger(a) || a < 0 || a >= questions[i].options.length) {
        return res.status(400).json({
          error: `Invalid answer at index ${i}: must be an integer 0–${questions[i].options.length - 1}`,
        });
      }
    }

    // Grade — server computes the score
    const correctCount = questions.filter((q, i) => answers[i] === q.correct).length;
    const score  = Math.round((correctCount / questions.length) * 100);
    const passed = score >= 70 ? 1 : 0;

    // Insert assessment row
    const [result] = await conn.query(
      `INSERT INTO SKILL_ASSESSMENTS (user_id, skill_id, score, passed)
       VALUES (?, ?, ?, ?)`,
      [req.user.user_id, skill_id, score, passed]
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
      score,
      correct:                correctCount,
      total:                  questions.length,
      passed:                 !!passed,
      skill_added_to_profile: !!passed,
      message:                passed
        ? 'Assessment passed ✓ — skill added to your profile'
        : 'Assessment failed — you may retake it',
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
