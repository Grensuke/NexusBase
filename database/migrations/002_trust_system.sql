-- =============================================================
--  NexusBase — Migration 002: Cold-Start Trust System
--  Safe to run AFTER schema.sql on an existing database.
--  All DDL is guarded (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
--  so this script is idempotent and purely additive.
-- =============================================================
USE nexusbase;

-- ----------------------------------------------------------------
-- STEP 1: TRUST_TIERS lookup table
--   Must be created BEFORE the USERS FK is added below.
--   Tier rows are inserted here; seed.sql can INSERT IGNORE
--   additional rows without conflict.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS TRUST_TIERS (
    tier_id               INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    tier_name             VARCHAR(50)   NOT NULL UNIQUE,
    -- The minimum trust_score a freelancer must reach to be IN this tier.
    -- 'New' starts at 0 so every new user qualifies on sign-up.
    min_trust_score       DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    -- Platform commission charged to the freelancer on each order.
    -- Stored as a fraction (e.g. 0.1000 = 10 %).
    commission_rate       DECIMAL(5,4)  NOT NULL,
    -- Maximum price a trial gig may be listed at.
    -- NULL means no cap applies (non-trial tiers).
    trial_price_cap       DECIMAL(10,2) DEFAULT NULL,
    -- Number of successful trial orders required to auto-promote
    -- out of this tier.  0 = no trial requirement.
    trial_orders_required INT UNSIGNED  NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- Seed tiers immediately so the FK below has rows to reference.
INSERT IGNORE INTO TRUST_TIERS
    (tier_name, min_trust_score, commission_rate, trial_price_cap, trial_orders_required)
VALUES
    -- New      : trial-only, lowest commission to reduce barrier-to-entry.
    --            Price cap ₹1500 keeps client risk low on unproven work.
    ('New',          0.00, 0.1000, 1500.00, 3),
    -- Trusted  : completed 3 trial orders with no disputes, mid commission.
    ('Trusted',     40.00, 0.1500,    NULL, 0),
    -- Established : high trust score, lowest commission as reward.
    ('Established', 75.00, 0.0800,    NULL, 0);

-- ----------------------------------------------------------------
-- STEP 2: Extend USERS
-- ----------------------------------------------------------------
-- trust_score
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA='nexusbase' AND TABLE_NAME='USERS' AND COLUMN_NAME='trust_score');
SET @sql := IF(@col=0, 'ALTER TABLE USERS ADD COLUMN trust_score DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER avg_rating', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- trust_tier_id
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA='nexusbase' AND TABLE_NAME='USERS' AND COLUMN_NAME='trust_tier_id');
SET @sql := IF(@col=0, 'ALTER TABLE USERS ADD COLUMN trust_tier_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER trust_score', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- trial_orders_completed
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA='nexusbase' AND TABLE_NAME='USERS' AND COLUMN_NAME='trial_orders_completed');
SET @sql := IF(@col=0, 'ALTER TABLE USERS ADD COLUMN trial_orders_completed INT UNSIGNED NOT NULL DEFAULT 0 AFTER trust_tier_id', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- FK: only add if it doesn't already exist (guard via information_schema).
SET @fk_exists = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = 'nexusbase'
       AND TABLE_NAME        = 'USERS'
       AND CONSTRAINT_NAME   = 'fk_user_tier'
);
SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE USERS ADD CONSTRAINT fk_user_tier
         FOREIGN KEY (trust_tier_id) REFERENCES TRUST_TIERS(tier_id)',
    'SELECT 1 -- fk_user_tier already exists'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ----------------------------------------------------------------
-- STEP 3: Extend GIGS
-- ----------------------------------------------------------------
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA='nexusbase' AND TABLE_NAME='GIGS' AND COLUMN_NAME='is_trial');
SET @sql := IF(@col=0, 'ALTER TABLE GIGS ADD COLUMN is_trial TINYINT(1) NOT NULL DEFAULT 0 AFTER delivery_days', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ----------------------------------------------------------------
-- STEP 4: Extend ORDERS
-- ----------------------------------------------------------------
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA='nexusbase' AND TABLE_NAME='ORDERS' AND COLUMN_NAME='is_trial');
SET @sql := IF(@col=0, 'ALTER TABLE ORDERS ADD COLUMN is_trial TINYINT(1) NOT NULL DEFAULT 0 AFTER status', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA='nexusbase' AND TABLE_NAME='ORDERS' AND COLUMN_NAME='commission_rate_applied');
SET @sql := IF(@col=0, 'ALTER TABLE ORDERS ADD COLUMN commission_rate_applied DECIMAL(5,4) DEFAULT NULL AFTER amount', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA='nexusbase' AND TABLE_NAME='ORDERS' AND COLUMN_NAME='commission_amount');
SET @sql := IF(@col=0, 'ALTER TABLE ORDERS ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT NULL AFTER commission_rate_applied', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ----------------------------------------------------------------
-- STEP 5: Extend PAYMENTS
-- ----------------------------------------------------------------
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA='nexusbase' AND TABLE_NAME='PAYMENTS' AND COLUMN_NAME='escrow_status');
SET @sql := IF(@col=0, "ALTER TABLE PAYMENTS ADD COLUMN escrow_status ENUM('holding','released','refunded') NOT NULL DEFAULT 'holding' AFTER status", 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ----------------------------------------------------------------
-- STEP 6: SKILL_ASSESSMENTS
--   Verified skill proof that is independent of order history.
--   A freelancer can take the same skill assessment multiple times
--   (only the best or latest pass matters for score calculation).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS SKILL_ASSESSMENTS (
    assessment_id INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED  NOT NULL,
    skill_id      INT UNSIGNED  NOT NULL,
    score         DECIMAL(5,2)  NOT NULL CHECK (score BETWEEN 0.00 AND 100.00),
    passed        TINYINT(1)    NOT NULL DEFAULT 0,
    taken_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sa_user  FOREIGN KEY (user_id)  REFERENCES USERS(user_id)  ON DELETE CASCADE,
    CONSTRAINT fk_sa_skill FOREIGN KEY (skill_id) REFERENCES SKILLS(skill_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- STEP 7: DISPUTES
--   Protects the escrow promise and prevents trust-gaming.
--   A dispute on a trial order blocks promotion counting for that
--   order and can reduce trust_score via trigger.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS DISPUTES (
    dispute_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id    INT UNSIGNED NOT NULL,
    raised_by   INT UNSIGNED NOT NULL,
    reason      TEXT         NOT NULL,
    status      ENUM('open','resolved_for_client','resolved_for_freelancer')
                NOT NULL DEFAULT 'open',
    resolved_at TIMESTAMP    DEFAULT NULL,
    CONSTRAINT fk_dispute_order FOREIGN KEY (order_id)  REFERENCES ORDERS(order_id) ON DELETE RESTRICT,
    CONSTRAINT fk_dispute_user  FOREIGN KEY (raised_by) REFERENCES USERS(user_id)   ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- STEP 8: Procedure — recalculate_trust_score(p_user_id)
--
--   Weighted-sum formula (weights tuned to be defensible at viva):
--
--   Component A — Skill assessment pass rate (30 % weight)
--     = (passed_count / total_count) × 100  → 0-100
--     Rationale: independent of order history, so brand-new
--     freelancers can earn baseline trust via verified skills.
--
--   Component B — Trial completion ratio (30 % weight)
--     = (trial_orders_completed / max(total_trial_orders,1)) × 100
--     Rationale: rewards actually finishing trial work, not just
--     signing up.
--
--   Component C — Average rating contribution (30 % weight)
--     = avg_rating × 20  → maps the 1-5 star scale to 0-100.
--     Rationale: real client satisfaction signal once orders exist.
--     At zero orders avg_rating IS NULL → treated as 0, so new
--     freelancers aren't penalised, they just start at 0 here.
--
--   Component D — Dispute penalty (10 % weight)
--     = −(disputes_against / max(1, total_orders)) × 100
--     Rationale: caps gaming by sockpuppet accounts; every
--     unresolved-against-freelancer dispute costs points.
--
--   Final score is clamped to [0, 100].
--
--   After recalculation, auto-promotion is checked: if the new
--   score ≥ the next tier's min_trust_score AND
--   trial_orders_completed ≥ current tier's trial_orders_required,
--   the freelancer is promoted one tier.
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS recalculate_trust_score;

DELIMITER $$

CREATE PROCEDURE recalculate_trust_score(IN p_user_id INT UNSIGNED)
BEGIN
    DECLARE v_pass_rate        DECIMAL(10,4) DEFAULT 0;
    DECLARE v_completion_ratio DECIMAL(10,4) DEFAULT 0;
    DECLARE v_avg_rating_comp  DECIMAL(10,4) DEFAULT 0;
    DECLARE v_dispute_penalty  DECIMAL(10,4) DEFAULT 0;
    DECLARE v_raw_score        DECIMAL(10,4) DEFAULT 0;
    DECLARE v_final_score      DECIMAL(5,2)  DEFAULT 0.00;
    DECLARE v_current_tier_id  INT UNSIGNED  DEFAULT 1;
    DECLARE v_trial_required   INT UNSIGNED  DEFAULT 0;
    DECLARE v_trial_completed  INT UNSIGNED  DEFAULT 0;
    DECLARE v_next_tier_id     INT UNSIGNED  DEFAULT NULL;
    DECLARE v_next_min_score   DECIMAL(7,2)  DEFAULT 9999.00;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        RESIGNAL;
    END;

    -- ---- Component A: Skill assessment pass rate ----
    SELECT COALESCE(
               AVG(CASE WHEN passed = 1 THEN 100.0 ELSE 0.0 END), 0
           )
      INTO v_pass_rate
      FROM SKILL_ASSESSMENTS
     WHERE user_id = p_user_id;

    -- ---- Component B: Trial completion ratio ----
    -- Uses total trial orders attempted (via ORDERS + GIGS) as denominator
    SELECT
        COALESCE(
            (SELECT trial_orders_completed FROM USERS WHERE user_id = p_user_id), 0
        ) / GREATEST(
            (SELECT COUNT(*)
               FROM ORDERS o
               JOIN GIGS   g ON g.gig_id = o.gig_id
              WHERE g.freelancer_id = p_user_id
                AND o.is_trial      = 1
                AND o.status       IN ('completed','cancelled')),
            1
        ) * 100
      INTO v_completion_ratio;

    -- ---- Component C: Average rating (maps 0-5 → 0-100) ----
    SELECT COALESCE(avg_rating, 0) * 20
      INTO v_avg_rating_comp
      FROM USERS
     WHERE user_id = p_user_id;

    -- ---- Component D: Dispute penalty ----
    -- Count disputes resolved against this freelancer on their orders
    SELECT
        COALESCE(
            (SELECT COUNT(*)
               FROM DISPUTES d
               JOIN ORDERS   o ON o.order_id = d.order_id
               JOIN GIGS     g ON g.gig_id   = o.gig_id
              WHERE g.freelancer_id = p_user_id
                AND d.status        = 'resolved_for_client'),
            0
        ) / GREATEST(
            (SELECT COUNT(*)
               FROM ORDERS o
               JOIN GIGS   g ON g.gig_id = o.gig_id
              WHERE g.freelancer_id = p_user_id),
            1
        ) * 100
      INTO v_dispute_penalty;

    -- ---- Weighted sum (weights sum to 1.0) ----
    SET v_raw_score = (v_pass_rate        * 0.30)
                    + (v_completion_ratio  * 0.30)
                    + (v_avg_rating_comp   * 0.30)
                    - (v_dispute_penalty   * 0.10);

    -- Clamp to [0, 100]
    SET v_final_score = LEAST(100.00, GREATEST(0.00, ROUND(v_raw_score, 2)));

    -- ---- Persist updated score ----
    UPDATE USERS
       SET trust_score = v_final_score
     WHERE user_id = p_user_id;

    -- ---- Auto-promotion check ----
    SELECT trust_tier_id, trial_orders_completed
      INTO v_current_tier_id, v_trial_completed
      FROM USERS
     WHERE user_id = p_user_id;

    -- How many trial orders does the current tier require?
    SELECT trial_orders_required
      INTO v_trial_required
      FROM TRUST_TIERS
     WHERE tier_id = v_current_tier_id;

    -- Is there a next tier the freelancer qualifies for?
    SELECT tier_id, min_trust_score
      INTO v_next_tier_id, v_next_min_score
      FROM TRUST_TIERS
     WHERE min_trust_score > (SELECT min_trust_score
                                FROM TRUST_TIERS
                               WHERE tier_id = v_current_tier_id)
     ORDER BY min_trust_score ASC
     LIMIT 1;

    IF v_next_tier_id IS NOT NULL
       AND v_final_score       >= v_next_min_score
       AND v_trial_completed   >= v_trial_required
    THEN
        UPDATE USERS
           SET trust_tier_id = v_next_tier_id
         WHERE user_id = p_user_id;
    END IF;

END$$

DELIMITER ;

-- ----------------------------------------------------------------
-- STEP 9: Extended place_order procedure
--   DROP + CREATE (not ALTER, which MySQL doesn't support for procs).
--   Preserves the original TRANSACTION / EXIT HANDLER / ROLLBACK /
--   RESIGNAL shape exactly.  New logic:
--     • Looks up the gig's freelancer → their trust_tier_id
--     • Fetches commission_rate and trial_price_cap from TRUST_TIERS
--     • Enforces the trial price cap when gig.is_trial = 1
--     • Writes is_trial, commission_rate_applied, commission_amount
--       onto the ORDERS row in the same INSERT (historical lock)
--     • Sets escrow_status = 'holding' on the PAYMENTS row
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS place_order;

DELIMITER $$

CREATE PROCEDURE place_order(
    IN  p_gig_id    INT UNSIGNED,
    IN  p_client_id INT UNSIGNED,
    IN  p_amount    DECIMAL(10,2),
    IN  p_method    VARCHAR(50),
    OUT p_order_id  INT UNSIGNED
)
BEGIN
    DECLARE v_gig_count          INT           DEFAULT 0;
    DECLARE v_is_trial           TINYINT(1)    DEFAULT 0;
    DECLARE v_freelancer_id      INT UNSIGNED  DEFAULT 0;
    DECLARE v_tier_id            INT UNSIGNED  DEFAULT 1;
    DECLARE v_commission_rate    DECIMAL(5,4)  DEFAULT 0.1000;
    DECLARE v_trial_price_cap    DECIMAL(10,2) DEFAULT NULL;
    DECLARE v_commission_amount  DECIMAL(10,2) DEFAULT 0.00;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- ---- Validate gig exists ----
    SELECT COUNT(*) INTO v_gig_count FROM GIGS WHERE gig_id = p_gig_id;
    IF v_gig_count = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Gig not found';
    END IF;

    -- ---- Fetch gig's trial flag and freelancer ----
    SELECT is_trial, freelancer_id
      INTO v_is_trial, v_freelancer_id
      FROM GIGS
     WHERE gig_id = p_gig_id;

    -- ---- Fetch freelancer's tier commission rate and cap ----
    SELECT tt.tier_id, tt.commission_rate, tt.trial_price_cap
      INTO v_tier_id, v_commission_rate, v_trial_price_cap
      FROM USERS        u
      JOIN TRUST_TIERS  tt ON tt.tier_id = u.trust_tier_id
     WHERE u.user_id = v_freelancer_id;

    -- ---- Enforce trial price cap ----
    IF v_is_trial = 1 AND v_trial_price_cap IS NOT NULL
                      AND p_amount > v_trial_price_cap THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Order amount exceeds trial price cap for this gig';
    END IF;

    -- ---- Calculate commission (locked at order time) ----
    SET v_commission_amount = ROUND(p_amount * v_commission_rate, 2);

    START TRANSACTION;

        INSERT INTO ORDERS
            (gig_id, client_id, status, amount,
             is_trial, commission_rate_applied, commission_amount)
        VALUES
            (p_gig_id, p_client_id, 'pending', p_amount,
             v_is_trial, v_commission_rate, v_commission_amount);

        SET p_order_id = LAST_INSERT_ID();

        INSERT INTO PAYMENTS (order_id, amount, status, method, escrow_status)
        VALUES (p_order_id, p_amount, 'pending', p_method, 'holding');

    COMMIT;
END$$

DELIMITER ;

-- ----------------------------------------------------------------
-- STEP 10: Trigger — after_trial_order_complete
--   Fires AFTER UPDATE on ORDERS for each row where:
--     • NEW.status  = 'completed'
--     • OLD.status != 'completed'   (prevents re-fire on no-op)
--     • NEW.is_trial = 1
--   Actions:
--     1. Find the gig's freelancer.
--     2. Increment trial_orders_completed on USERS.
--     3. Call recalculate_trust_score → may auto-promote tier.
--     4. Release escrow: PAYMENTS.escrow_status = 'released'.
-- ----------------------------------------------------------------
DROP TRIGGER IF EXISTS after_trial_order_complete;

DELIMITER $$

CREATE TRIGGER after_trial_order_complete
AFTER UPDATE ON ORDERS
FOR EACH ROW
BEGIN
    DECLARE v_freelancer_id INT UNSIGNED;

    -- Only act on trial orders that just transitioned to completed
    IF NEW.status = 'completed'
       AND OLD.status <> 'completed'
       AND NEW.is_trial = 1
    THEN
        -- Resolve the freelancer who owns this gig
        SELECT g.freelancer_id
          INTO v_freelancer_id
          FROM GIGS g
         WHERE g.gig_id = NEW.gig_id
         LIMIT 1;

        -- Increment cached counter
        UPDATE USERS
           SET trial_orders_completed = trial_orders_completed + 1
         WHERE user_id = v_freelancer_id;

        -- Recalculate trust score and possibly auto-promote
        CALL recalculate_trust_score(v_freelancer_id);

        -- Release escrow funds
        UPDATE PAYMENTS
           SET escrow_status = 'released',
               status        = 'completed'
         WHERE order_id = NEW.order_id;
    END IF;
END$$

DELIMITER ;

-- ----------------------------------------------------------------
-- STEP 11: Trigger — after_dispute_resolved
--   Fires AFTER UPDATE on DISPUTES for each row where:
--     • NEW.status != 'open'   (dispute just got resolved)
--     • OLD.status  = 'open'
--   Actions:
--     1. Stamp resolved_at.
--     2. If resolved_for_client (freelancer was at fault):
--        a. Recalculate trust score (penalty built into formula).
--        b. If the order is_trial, do NOT increment
--           trial_orders_completed (handled via the formula:
--           the dispute count increases denominator effect).
--        c. Set escrow_status = 'refunded' on the PAYMENTS row.
--     3. If resolved_for_freelancer:
--        a. Recalculate trust score (no net penalty; may improve
--           if removal of the open dispute reduces dispute_rate).
--        b. If the order is_trial and NOT already completed,
--           still mark it completed so promotion can proceed.
-- ----------------------------------------------------------------
DROP TRIGGER IF EXISTS after_dispute_resolved;

DELIMITER $$

CREATE TRIGGER after_dispute_resolved
AFTER UPDATE ON DISPUTES
FOR EACH ROW
BEGIN
    DECLARE v_freelancer_id INT UNSIGNED;
    DECLARE v_is_trial      TINYINT(1) DEFAULT 0;
    DECLARE v_order_status  VARCHAR(20);

    -- Only fire when an open dispute just got a resolution
    IF OLD.status = 'open'
       AND NEW.status IN ('resolved_for_client', 'resolved_for_freelancer')
    THEN
        -- Stamp resolution time
        UPDATE DISPUTES
           SET resolved_at = CURRENT_TIMESTAMP
         WHERE dispute_id = NEW.dispute_id;

        -- Resolve order's freelancer and trial flag
        SELECT g.freelancer_id, o.is_trial, o.status
          INTO v_freelancer_id, v_is_trial, v_order_status
          FROM ORDERS o
          JOIN GIGS   g ON g.gig_id = o.gig_id
         WHERE o.order_id = NEW.order_id
         LIMIT 1;

        IF NEW.status = 'resolved_for_client' THEN
            -- Freelancer was at fault: refund escrow
            UPDATE PAYMENTS
               SET escrow_status = 'refunded',
                   status        = 'refunded'
             WHERE order_id = NEW.order_id;

            -- Recalculate score; dispute is now counted in penalty component
            CALL recalculate_trust_score(v_freelancer_id);

        ELSE -- resolved_for_freelancer
            -- Freelancer vindicated: if it was a trial order still pending,
            -- allow it to be marked completed so promotion can proceed.
            IF v_is_trial = 1 AND v_order_status <> 'completed' THEN
                UPDATE ORDERS
                   SET status = 'completed'
                 WHERE order_id = NEW.order_id;
                -- The after_trial_order_complete trigger will fire and
                -- handle counter increment + escrow release automatically.
            ELSE
                -- Non-trial or already completed: just recalculate
                CALL recalculate_trust_score(v_freelancer_id);
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;

-- ----------------------------------------------------------------
-- STEP 12: View — fee_transparency
--   Mirrors the style of the existing top_freelancers view:
--   LEFT JOIN + GROUP BY aggregation.
--   Shows the commission schedule and how many freelancers are
--   currently in each tier — provably enforced, not just documented.
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW fee_transparency AS
SELECT
    tt.tier_id,
    tt.tier_name,
    tt.min_trust_score,
    tt.commission_rate,
    -- Display as percentage for readability
    ROUND(tt.commission_rate * 100, 2)   AS commission_pct,
    tt.trial_price_cap,
    tt.trial_orders_required,
    COUNT(DISTINCT u.user_id)             AS freelancers_in_tier
FROM TRUST_TIERS tt
LEFT JOIN USERS u ON u.trust_tier_id = tt.tier_id
                 AND u.role          = 'freelancer'
GROUP BY
    tt.tier_id,
    tt.tier_name,
    tt.min_trust_score,
    tt.commission_rate,
    tt.trial_price_cap,
    tt.trial_orders_required
ORDER BY tt.min_trust_score ASC;
