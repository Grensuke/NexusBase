-- =============================================================
--  NexusBase — Full Schema DDL
--  DBMS Capstone Project
--
--  Includes (v2): Cold-Start Trust System
--    • TRUST_TIERS, SKILL_ASSESSMENTS, DISPUTES tables
--    • Extended USERS / GIGS / ORDERS / PAYMENTS columns
--    • recalculate_trust_score procedure
--    • Extended place_order procedure
--    • after_trial_order_complete trigger
--    • after_dispute_resolved trigger
--    • fee_transparency view
-- =============================================================

CREATE DATABASE IF NOT EXISTS nexusbase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nexusbase;

-- ----------------------------------------------------------------
-- 0. TRUST_TIERS  (lookup — must precede USERS so FK can resolve)
--    Defines the three-tier commission and trial-order schedule.
--    trial_price_cap = NULL means no cap (non-trial tiers).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS TRUST_TIERS (
    tier_id               INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    tier_name             VARCHAR(50)   NOT NULL UNIQUE,
    min_trust_score       DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    commission_rate       DECIMAL(5,4)  NOT NULL,
    trial_price_cap       DECIMAL(10,2) DEFAULT NULL,
    trial_orders_required INT UNSIGNED  NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- Seed tier rows inline so FK references resolve on first run
INSERT IGNORE INTO TRUST_TIERS
    (tier_name, min_trust_score, commission_rate, trial_price_cap, trial_orders_required)
VALUES
    ('New',          0.00, 0.1000, 1500.00, 3),
    ('Trusted',     40.00, 0.1500,    NULL, 0),
    ('Established', 75.00, 0.0800,    NULL, 0);

-- ----------------------------------------------------------------
-- 1. USERS
--    Central identity table. role distinguishes clients from
--    freelancers. avg_rating is maintained by a TRIGGER (see below).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS USERS (
    user_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100)  NOT NULL,
    email        VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role         ENUM('client','freelancer') NOT NULL,
    bio          TEXT,
    avatar_url   VARCHAR(500),
    avg_rating              DECIMAL(3,2)  DEFAULT NULL,
    -- Trust system columns (v2) — maintained by triggers/procedure
    trust_score             DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    trust_tier_id           INT UNSIGNED  NOT NULL DEFAULT 1,
    trial_orders_completed  INT UNSIGNED  NOT NULL DEFAULT 0,
    created_at              TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_tier FOREIGN KEY (trust_tier_id) REFERENCES TRUST_TIERS(tier_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 2. SKILLS
--    Lookup table for skill tags (e.g. "React", "Photoshop").
--    Normalised so the same skill is never duplicated.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS SKILLS (
    skill_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 3. USER_SKILLS  (junction / bridge table)
--    Implements the many-to-many relationship between USERS and
--    SKILLS. A freelancer can have many skills; a skill can belong
--    to many freelancers. Composite PK prevents duplicates.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS USER_SKILLS (
    user_id  INT UNSIGNED NOT NULL,
    skill_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, skill_id),
    CONSTRAINT fk_us_user  FOREIGN KEY (user_id)  REFERENCES USERS(user_id)  ON DELETE CASCADE,
    CONSTRAINT fk_us_skill FOREIGN KEY (skill_id) REFERENCES SKILLS(skill_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 4. CATEGORIES
--    Gig categories (e.g. "Web Development", "Design").
--    Kept separate so admin can manage them without touching GIGS.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS CATEGORIES (
    category_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 5. GIGS
--    Service listings posted by freelancers.
--    freelancer_id -> USERS  (only freelancers should post gigs,
--                             enforced at application layer)
--    category_id  -> CATEGORIES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS GIGS (
    gig_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    freelancer_id INT UNSIGNED NOT NULL,
    category_id   INT UNSIGNED NOT NULL,
    title         VARCHAR(200) NOT NULL,
    description   TEXT         NOT NULL,
    price         DECIMAL(10,2) NOT NULL CHECK (price > 0),
    delivery_days INT UNSIGNED  NOT NULL CHECK (delivery_days > 0),
    -- is_trial: set by backend when posting freelancer is in a trial-required tier
    is_trial      TINYINT(1)   NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gig_freelancer FOREIGN KEY (freelancer_id) REFERENCES USERS(user_id)     ON DELETE CASCADE,
    CONSTRAINT fk_gig_category  FOREIGN KEY (category_id)   REFERENCES CATEGORIES(category_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Search-performance indexes (explicitly required)
CREATE INDEX idx_gigs_category ON GIGS(category_id);
CREATE INDEX idx_gigs_title    ON GIGS(title);

-- ----------------------------------------------------------------
-- 6. ORDERS
--    Represents a client purchasing a specific gig.
--    status drives the order lifecycle:
--      pending -> in_progress -> completed | cancelled
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ORDERS (
    order_id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    gig_id                   INT UNSIGNED NOT NULL,
    client_id                INT UNSIGNED NOT NULL,
    status                   ENUM('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
    -- is_trial mirrors GIGS.is_trial at order-placement time (historical lock)
    is_trial                 TINYINT(1)    NOT NULL DEFAULT 0,
    amount                   DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    -- Commission locked at order time — same pattern as amount vs gig price
    commission_rate_applied  DECIMAL(5,4)  DEFAULT NULL,
    commission_amount        DECIMAL(10,2) DEFAULT NULL,
    order_date               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_gig    FOREIGN KEY (gig_id)    REFERENCES GIGS(gig_id)   ON DELETE RESTRICT,
    CONSTRAINT fk_order_client FOREIGN KEY (client_id) REFERENCES USERS(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 7. PAYMENTS
--    One payment record per order (1:1 relationship).
--    Kept separate from ORDERS so payment logic (method, refund
--    status, gateway ref) can evolve independently without
--    bloating the ORDERS table. UNIQUE on order_id enforces 1:1.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS PAYMENTS (
    payment_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id       INT UNSIGNED NOT NULL UNIQUE,          -- 1:1
    amount         DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status         ENUM('pending','completed','refunded') NOT NULL DEFAULT 'pending',
    -- escrow_status makes the escrow promise explicit:
    --   holding  → funds received, held until order completes
    --   released → order completed, funds disbursed to freelancer
    --   refunded → order cancelled or dispute resolved for client
    escrow_status  ENUM('holding','released','refunded') NOT NULL DEFAULT 'holding',
    payment_date   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    method         VARCHAR(50)  NOT NULL DEFAULT 'card',
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES ORDERS(order_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 8. REVIEWS
--    One review per completed order (1:1 relationship).
--    Kept separate from ORDERS because:
--      a) Not every order gets a review — so a mandatory column
--         on ORDERS would be NULL most of the time (bad design).
--      b) Review logic (moderation, helpful votes, etc.) can grow
--         independently.
--    UNIQUE on order_id enforces 1:1.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS REVIEWS (
    review_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id    INT UNSIGNED NOT NULL UNIQUE,           -- 1:1
    rating      TINYINT UNSIGNED NOT NULL,
    comment     TEXT,
    review_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES ORDERS(order_id) ON DELETE CASCADE,
    CONSTRAINT chk_rating      CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 9. SKILL_ASSESSMENTS
--    Verified skill proof, independent of order history.
--    Feeds Component A of recalculate_trust_score.
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
-- 10. DISPUTES
--     Escrow protection and trust-gaming prevention.
--     Resolution status drives after_dispute_resolved trigger.
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

-- =============================================================
--  TRIGGER: after_review_insert
--  Fires AFTER every INSERT on REVIEWS.
--  Walks up through ORDERS -> GIGS to find the freelancer, then
--  recalculates their avg_rating from ALL their reviews.
-- =============================================================
DELIMITER $$

CREATE TRIGGER after_review_insert
AFTER INSERT ON REVIEWS
FOR EACH ROW
BEGIN
    DECLARE v_freelancer_id INT UNSIGNED;

    -- Resolve the freelancer who owns the gig in this order
    SELECT g.freelancer_id
      INTO v_freelancer_id
      FROM ORDERS o
      JOIN GIGS   g ON g.gig_id = o.gig_id
     WHERE o.order_id = NEW.order_id
     LIMIT 1;

    -- Recalculate average across all reviews for this freelancer
    UPDATE USERS
       SET avg_rating = (
           SELECT AVG(r.rating)
             FROM REVIEWS  r
             JOIN ORDERS   o ON o.order_id = r.order_id
             JOIN GIGS     g ON g.gig_id   = o.gig_id
            WHERE g.freelancer_id = v_freelancer_id
       )
     WHERE user_id = v_freelancer_id;
END$$

DELIMITER ;

-- =============================================================
--  STORED PROCEDURE: place_order
--  Places an order atomically:
--    1. Validates the gig exists
--    2. INSERTs into ORDERS
--    3. INSERTs into PAYMENTS (pending)
--  Wrapped in a TRANSACTION so both succeed or both roll back.
--  OUT parameter p_order_id returns the new order's id.
-- =============================================================
DELIMITER $$

CREATE PROCEDURE place_order(
    IN  p_gig_id    INT UNSIGNED,
    IN  p_client_id INT UNSIGNED,
    IN  p_method    VARCHAR(50),
    OUT p_order_id  INT UNSIGNED
)
BEGIN
    DECLARE v_gig_count INT DEFAULT 0;
    DECLARE v_price     DECIMAL(10,2) DEFAULT 0.00;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Validate gig exists and fetch its price
    SELECT COUNT(*) INTO v_gig_count FROM GIGS WHERE gig_id = p_gig_id;
    IF v_gig_count = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Gig not found';
    END IF;

    SELECT price INTO v_price FROM GIGS WHERE gig_id = p_gig_id;

    START TRANSACTION;

        INSERT INTO ORDERS (gig_id, client_id, status, amount)
        VALUES (p_gig_id, p_client_id, 'pending', v_price);

        SET p_order_id = LAST_INSERT_ID();

        INSERT INTO PAYMENTS (order_id, amount, status, method)
        VALUES (p_order_id, v_price, 'pending', p_method);

    COMMIT;
END$$

DELIMITER ;

-- =============================================================
--  VIEW: top_freelancers
--  Joins USERS, GIGS, ORDERS, REVIEWS to show each freelancer's
--  average rating and total number of completed orders.
--  Used on the "Browse Freelancers" and leaderboard screens.
-- =============================================================
CREATE OR REPLACE VIEW top_freelancers AS
SELECT
    u.user_id,
    u.name,
    u.email,
    u.bio,
    u.avatar_url,
    u.avg_rating,
    COUNT(DISTINCT g.gig_id)                                    AS total_gigs,
    COUNT(DISTINCT CASE WHEN o.status = 'completed'
                        THEN o.order_id END)                    AS completed_orders,
    COALESCE(AVG(r.rating), 0)                                  AS calculated_avg_rating
FROM USERS u
LEFT JOIN GIGS    g ON g.freelancer_id = u.user_id
LEFT JOIN ORDERS  o ON o.gig_id        = g.gig_id
LEFT JOIN REVIEWS r ON r.order_id      = o.order_id
WHERE u.role = 'freelancer'
GROUP BY u.user_id, u.name, u.email, u.bio, u.avatar_url, u.avg_rating
ORDER BY u.avg_rating DESC, completed_orders DESC;

-- =============================================================
--  PROCEDURE: recalculate_trust_score(p_user_id)
--
--  Weighted-sum formula (weights must sum to 1.0):
--
--  Component A (30%): skill assessment pass rate
--    = (passed_count / total_count) × 100
--    Rationale: independent of order history — new freelancers
--    can earn baseline trust via verified skills alone.
--
--  Component B (30%): trial completion ratio
--    = (trial_orders_completed / total_trial_attempts) × 100
--    Rationale: rewards actually finishing work, not just signing up.
--
--  Component C (30%): avg_rating mapped to 0-100
--    = avg_rating × 20  (5-star scale → 0-100)
--    Rationale: real client satisfaction signal.
--    NULL avg_rating → 0, so newcomers start neutral, not penalised.
--
--  Component D (10%): dispute penalty
--    = (disputes_against / total_orders_as_freelancer) × 100  (subtracted)
--    Rationale: caps gaming via sockpuppet accounts.
--
--  Final score clamped to [0, 100].
--  Also evaluates auto-promotion to the next tier.
-- =============================================================
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
    DECLARE v_next_min_score   DECIMAL(5,2)  DEFAULT 9999.00;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        RESIGNAL;
    END;

    -- Component A: assessment pass rate
    SELECT COALESCE(AVG(CASE WHEN passed = 1 THEN 100.0 ELSE 0.0 END), 0)
      INTO v_pass_rate
      FROM SKILL_ASSESSMENTS
     WHERE user_id = p_user_id;

    -- Component B: trial completion ratio
    SELECT COALESCE(
               (SELECT trial_orders_completed FROM USERS WHERE user_id = p_user_id), 0
           ) / GREATEST(
               (SELECT COUNT(*)
                  FROM ORDERS o JOIN GIGS g ON g.gig_id = o.gig_id
                 WHERE g.freelancer_id = p_user_id
                   AND o.is_trial = 1
                   AND o.status IN ('completed','cancelled')), 1
           ) * 100
      INTO v_completion_ratio;

    -- Component C: avg_rating mapped 0-100
    SELECT COALESCE(avg_rating, 0) * 20
      INTO v_avg_rating_comp
      FROM USERS WHERE user_id = p_user_id;

    -- Component D: dispute penalty
    SELECT COALESCE(
               (SELECT COUNT(*)
                  FROM DISPUTES d JOIN ORDERS o ON o.order_id = d.order_id
                                  JOIN GIGS   g ON g.gig_id   = o.gig_id
                 WHERE g.freelancer_id = p_user_id
                   AND d.status = 'resolved_for_client'), 0
           ) / GREATEST(
               (SELECT COUNT(*)
                  FROM ORDERS o JOIN GIGS g ON g.gig_id = o.gig_id
                 WHERE g.freelancer_id = p_user_id), 1
           ) * 100
      INTO v_dispute_penalty;

    SET v_raw_score = (v_pass_rate       * 0.30)
                    + (v_completion_ratio * 0.30)
                    + (v_avg_rating_comp  * 0.30)
                    - (v_dispute_penalty  * 0.10);

    SET v_final_score = LEAST(100.00, GREATEST(0.00, ROUND(v_raw_score, 2)));

    UPDATE USERS SET trust_score = v_final_score WHERE user_id = p_user_id;

    -- Auto-promotion check
    SELECT trust_tier_id, trial_orders_completed
      INTO v_current_tier_id, v_trial_completed
      FROM USERS WHERE user_id = p_user_id;

    SELECT trial_orders_required INTO v_trial_required
      FROM TRUST_TIERS WHERE tier_id = v_current_tier_id;

    SELECT tier_id, min_trust_score INTO v_next_tier_id, v_next_min_score
      FROM TRUST_TIERS
     WHERE min_trust_score > (SELECT min_trust_score FROM TRUST_TIERS WHERE tier_id = v_current_tier_id)
     ORDER BY min_trust_score ASC LIMIT 1;

    IF v_next_tier_id IS NOT NULL
       AND v_final_score     >= v_next_min_score
       AND v_trial_completed >= v_trial_required
    THEN
        UPDATE USERS SET trust_tier_id = v_next_tier_id WHERE user_id = p_user_id;
    END IF;
END$$

DELIMITER ;

-- =============================================================
--  PROCEDURE: place_order  (extended — same transaction/rollback shape)
--  New logic vs original:
--    • Fetches gig's is_trial flag and freelancer's commission tier
--    • Enforces trial_price_cap when gig is_trial = 1
--    • Locks commission_rate_applied and commission_amount at INSERT
--    • Sets PAYMENTS.escrow_status = 'holding'
-- =============================================================
DROP PROCEDURE IF EXISTS place_order;

DELIMITER $$

CREATE PROCEDURE place_order(
    IN  p_gig_id    INT UNSIGNED,
    IN  p_client_id INT UNSIGNED,
    IN  p_method    VARCHAR(50),
    OUT p_order_id  INT UNSIGNED
)
BEGIN
    DECLARE v_gig_count         INT           DEFAULT 0;
    DECLARE v_price             DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_is_trial          TINYINT(1)    DEFAULT 0;
    DECLARE v_freelancer_id     INT UNSIGNED  DEFAULT 0;
    DECLARE v_tier_id           INT UNSIGNED  DEFAULT 1;
    DECLARE v_commission_rate   DECIMAL(5,4)  DEFAULT 0.1000;
    DECLARE v_trial_price_cap   DECIMAL(10,2) DEFAULT NULL;
    DECLARE v_commission_amount DECIMAL(10,2) DEFAULT 0.00;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Validate gig exists
    SELECT COUNT(*) INTO v_gig_count FROM GIGS WHERE gig_id = p_gig_id;
    IF v_gig_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Gig not found';
    END IF;

    -- Fetch gig price, trial flag, and freelancer (single authoritative source)
    SELECT price, is_trial, freelancer_id
      INTO v_price, v_is_trial, v_freelancer_id
      FROM GIGS WHERE gig_id = p_gig_id;

    -- Fetch freelancer's commission rate and cap
    SELECT tt.tier_id, tt.commission_rate, tt.trial_price_cap
      INTO v_tier_id, v_commission_rate, v_trial_price_cap
      FROM USERS u JOIN TRUST_TIERS tt ON tt.tier_id = u.trust_tier_id
     WHERE u.user_id = v_freelancer_id;

    -- Enforce trial price cap
    IF v_is_trial = 1 AND v_trial_price_cap IS NOT NULL
                     AND v_price > v_trial_price_cap THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Gig price exceeds trial price cap';
    END IF;

    SET v_commission_amount = ROUND(v_price * v_commission_rate, 2);

    START TRANSACTION;

        INSERT INTO ORDERS
            (gig_id, client_id, status, amount,
             is_trial, commission_rate_applied, commission_amount)
        VALUES
            (p_gig_id, p_client_id, 'pending', v_price,
             v_is_trial, v_commission_rate, v_commission_amount);

        SET p_order_id = LAST_INSERT_ID();

        INSERT INTO PAYMENTS (order_id, amount, status, method, escrow_status)
        VALUES (p_order_id, v_price, 'pending', p_method, 'holding');

    COMMIT;
END$$

DELIMITER ;

-- =============================================================
--  TRIGGER: after_trial_order_complete
--  Fires AFTER UPDATE on ORDERS when a trial order is completed.
--  Increments trial_orders_completed, calls recalculate_trust_score,
--  and releases escrow on PAYMENTS.
-- =============================================================
DROP TRIGGER IF EXISTS after_trial_order_complete;

DELIMITER $$

CREATE TRIGGER after_trial_order_complete
AFTER UPDATE ON ORDERS
FOR EACH ROW
BEGIN
    DECLARE v_freelancer_id INT UNSIGNED;

    IF NEW.status = 'completed'
       AND OLD.status <> 'completed'
       AND NEW.is_trial = 1
    THEN
        SELECT g.freelancer_id INTO v_freelancer_id
          FROM GIGS g WHERE g.gig_id = NEW.gig_id LIMIT 1;

        UPDATE USERS
           SET trial_orders_completed = trial_orders_completed + 1
         WHERE user_id = v_freelancer_id;

        CALL recalculate_trust_score(v_freelancer_id);

        UPDATE PAYMENTS
           SET escrow_status = 'released', status = 'completed'
         WHERE order_id = NEW.order_id;
    END IF;
END$$

DELIMITER ;

-- =============================================================
--  TRIGGER: after_dispute_resolved
--  Fires AFTER UPDATE on DISPUTES when a dispute is resolved.
--  If resolved_for_client: refunds escrow and applies trust penalty.
--  If resolved_for_freelancer: allows trial order to complete.
-- =============================================================
DROP TRIGGER IF EXISTS after_dispute_resolved;

DELIMITER $$

CREATE TRIGGER after_dispute_resolved
AFTER UPDATE ON DISPUTES
FOR EACH ROW
BEGIN
    DECLARE v_freelancer_id INT UNSIGNED;
    DECLARE v_is_trial      TINYINT(1) DEFAULT 0;
    DECLARE v_order_status  VARCHAR(20);

    IF OLD.status = 'open'
       AND NEW.status IN ('resolved_for_client', 'resolved_for_freelancer')
    THEN
        -- NOTE: resolved_at is set by the backend UPDATE that triggers this,
        -- NOT here — MySQL forbids a trigger from modifying its own table.

        SELECT g.freelancer_id, o.is_trial, o.status
          INTO v_freelancer_id, v_is_trial, v_order_status
          FROM ORDERS o JOIN GIGS g ON g.gig_id = o.gig_id
         WHERE o.order_id = NEW.order_id LIMIT 1;

        IF NEW.status = 'resolved_for_client' THEN
            UPDATE PAYMENTS
               SET escrow_status = 'refunded', status = 'refunded'
             WHERE order_id = NEW.order_id;
            CALL recalculate_trust_score(v_freelancer_id);
        ELSE
            IF v_is_trial = 1 AND v_order_status <> 'completed' THEN
                UPDATE ORDERS SET status = 'completed'
                 WHERE order_id = NEW.order_id;
                -- after_trial_order_complete fires here automatically
            ELSE
                CALL recalculate_trust_score(v_freelancer_id);
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;

-- =============================================================
--  VIEW: fee_transparency
--  Mirrors top_freelancers style (LEFT JOIN + GROUP BY aggregation).
--  Shows the live commission schedule and freelancer counts per tier
--  so evaluators can verify it is enforced, not just documented.
-- =============================================================
CREATE OR REPLACE VIEW fee_transparency AS
SELECT
    tt.tier_id,
    tt.tier_name,
    tt.min_trust_score,
    tt.commission_rate,
    ROUND(tt.commission_rate * 100, 2)  AS commission_pct,
    tt.trial_price_cap,
    tt.trial_orders_required,
    COUNT(DISTINCT u.user_id)            AS freelancers_in_tier
FROM TRUST_TIERS tt
LEFT JOIN USERS u ON u.trust_tier_id = tt.tier_id
                 AND u.role          = 'freelancer'
GROUP BY tt.tier_id, tt.tier_name, tt.min_trust_score,
         tt.commission_rate, tt.trial_price_cap, tt.trial_orders_required
ORDER BY tt.min_trust_score ASC;
