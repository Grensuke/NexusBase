-- Migration: fix place_order to fetch gig price internally
-- instead of trusting the caller-supplied p_amount parameter.

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
