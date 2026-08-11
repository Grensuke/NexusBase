-- Migration: fix after_dispute_resolved trigger self-referencing bug
-- MySQL forbids a trigger from modifying the same table that fired it.
-- The resolved_at timestamp is now set by the backend UPDATE statement instead.

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
