-- =============================================================
--  NexusBase — Full Schema DDL
--  DBMS Capstone Project
-- =============================================================

CREATE DATABASE IF NOT EXISTS nexusbase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nexusbase;

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
    avg_rating   DECIMAL(3,2)  DEFAULT NULL,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    order_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    gig_id     INT UNSIGNED NOT NULL,
    client_id  INT UNSIGNED NOT NULL,
    status     ENUM('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
    amount     DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    order_date TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    payment_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id     INT UNSIGNED NOT NULL UNIQUE,          -- 1:1
    amount       DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status       ENUM('pending','completed','refunded') NOT NULL DEFAULT 'pending',
    payment_date TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    method       VARCHAR(50)  NOT NULL DEFAULT 'card',
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
    IN  p_amount    DECIMAL(10,2),
    IN  p_method    VARCHAR(50),
    OUT p_order_id  INT UNSIGNED
)
BEGIN
    DECLARE v_gig_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Validate gig exists
    SELECT COUNT(*) INTO v_gig_count FROM GIGS WHERE gig_id = p_gig_id;
    IF v_gig_count = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Gig not found';
    END IF;

    START TRANSACTION;

        INSERT INTO ORDERS (gig_id, client_id, status, amount)
        VALUES (p_gig_id, p_client_id, 'pending', p_amount);

        SET p_order_id = LAST_INSERT_ID();

        INSERT INTO PAYMENTS (order_id, amount, status, method)
        VALUES (p_order_id, p_amount, 'pending', p_method);

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
