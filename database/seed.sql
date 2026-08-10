-- =============================================================
--  NexusBase — Seed Data
--  5 clients, 5 freelancers, 10 gigs, 10 orders, payments, reviews
--  v2 additions: TRUST_TIERS, SKILL_ASSESSMENTS, DISPUTES
-- =============================================================
USE nexusbase;

-- ----------------------------------------------------------------
-- SKILLS
-- ----------------------------------------------------------------
INSERT INTO SKILLS (skill_name) VALUES
('React'), ('Node.js'), ('UI/UX Design'), ('Photoshop'), ('SEO'),
('Python'), ('Data Analysis'), ('Copywriting'), ('Video Editing'), ('WordPress');

-- ----------------------------------------------------------------
-- CATEGORIES
-- ----------------------------------------------------------------
INSERT INTO CATEGORIES (category_name) VALUES
('Web Development'), ('Graphic Design'), ('Digital Marketing'),
('Writing & Translation'), ('Video & Animation'), ('Data Science');

-- ----------------------------------------------------------------
-- USERS  (passwords are bcrypt hash of "Password123!")
-- ----------------------------------------------------------------
INSERT INTO USERS (name, email, password_hash, role, bio) VALUES
-- Freelancers
('Alex Rivera',   'alex@nexus.dev',    '$2b$10$hLZJBNhGx3dNW1HgTNEOp.FLPXsTgn3LdFW71RpBPByZHnCDyOE2S', 'freelancer', 'Full-stack developer with 5 years of experience in React and Node.js.'),
('Sofia Chen',    'sofia@nexus.dev',   '$2b$10$hLZJBNhGx3dNW1HgTNEOp.FLPXsTgn3LdFW71RpBPByZHnCDyOE2S', 'freelancer', 'Creative UI/UX designer passionate about clean, minimal interfaces.'),
('Marcus Johnson','marcus@nexus.dev',  '$2b$10$hLZJBNhGx3dNW1HgTNEOp.FLPXsTgn3LdFW71RpBPByZHnCDyOE2S', 'freelancer', 'Digital marketing specialist with expertise in SEO and content strategy.'),
('Priya Patel',   'priya@nexus.dev',   '$2b$10$hLZJBNhGx3dNW1HgTNEOp.FLPXsTgn3LdFW71RpBPByZHnCDyOE2S', 'freelancer', 'Data scientist and ML engineer. Python, pandas, scikit-learn expert.'),
('Liam O Brien',  'liam@nexus.dev',    '$2b$10$hLZJBNhGx3dNW1HgTNEOp.FLPXsTgn3LdFW71RpBPByZHnCDyOE2S', 'freelancer', 'Professional video editor and motion graphics designer.'),
-- Clients
('Emma Watson',   'emma@client.dev',   '$2b$10$hLZJBNhGx3dNW1HgTNEOp.FLPXsTgn3LdFW71RpBPByZHnCDyOE2S', 'client', NULL),
('James Carter',  'james@client.dev',  '$2b$10$hLZJBNhGx3dNW1HgTNEOp.FLPXsTgn3LdFW71RpBPByZHnCDyOE2S', 'client', NULL),
('Olivia Brown',  'olivia@client.dev', '$2b$10$hLZJBNhGx3dNW1HgTNEOp.FLPXsTgn3LdFW71RpBPByZHnCDyOE2S', 'client', NULL),
('Noah Williams', 'noah@client.dev',   '$2b$10$hLZJBNhGx3dNW1HgTNEOp.FLPXsTgn3LdFW71RpBPByZHnCDyOE2S', 'client', NULL),
('Ava Thompson',  'ava@client.dev',    '$2b$10$hLZJBNhGx3dNW1HgTNEOp.FLPXsTgn3LdFW71RpBPByZHnCDyOE2S', 'client', NULL);

-- ----------------------------------------------------------------
-- USER_SKILLS (freelancer skill tags)
-- ----------------------------------------------------------------
-- Alex Rivera: React, Node.js
INSERT INTO USER_SKILLS VALUES (1,1),(1,2);
-- Sofia Chen: UI/UX Design, Photoshop
INSERT INTO USER_SKILLS VALUES (2,3),(2,4);
-- Marcus Johnson: SEO, Copywriting
INSERT INTO USER_SKILLS VALUES (3,5),(3,8);
-- Priya Patel: Python, Data Analysis
INSERT INTO USER_SKILLS VALUES (4,6),(4,7);
-- Liam O Brien: Video Editing
INSERT INTO USER_SKILLS VALUES (5,9);

-- ----------------------------------------------------------------
-- GIGS (10 gigs)
-- ----------------------------------------------------------------
INSERT INTO GIGS (freelancer_id, category_id, title, description, price, delivery_days) VALUES
(1, 1, 'Build a full-stack React & Node.js web app',        'I will build a complete web application with React frontend and Node.js backend, including authentication and a database.', 500.00,  7),
(1, 1, 'Fix bugs in your React or Node.js project',         'I will debug and fix issues in your existing React or Node.js codebase. Fast turnaround guaranteed.', 100.00,  2),
(2, 2, 'Design a modern UI/UX for your app or website',     'I will create clean, modern, and user-friendly UI/UX designs using Figma. Includes 3 screens and revision rounds.', 200.00,  5),
(2, 2, 'Create a professional logo and brand identity',     'I will design a unique logo and brand identity package including color palette, typography, and usage guidelines.', 150.00,  4),
(3, 3, 'SEO audit and optimization for your website',       'I will perform a comprehensive SEO audit and optimize your site for top search rankings. Keyword research included.', 250.00,  5),
(3, 4, 'Write SEO-optimized blog posts (5 articles)',       'I will write 5 high-quality, SEO-optimized blog posts on any topic. 1000 words each, with meta descriptions.', 180.00,  7),
(4, 6, 'Build a machine learning model for your data',      'I will analyze your dataset, build an ML model (classification or regression), and deliver a full report.', 400.00, 10),
(4, 6, 'Data analysis and visualization dashboard',         'I will analyze your data and create an interactive dashboard with charts and insights using Python and Plotly.', 300.00,  7),
(5, 5, 'Edit your YouTube video professionally',            'I will professionally edit your YouTube video with color grading, sound design, subtitles, and thumbnail.', 120.00,  3),
(5, 5, 'Create a 60-second promo video for your business',  'I will create an eye-catching 60-second promotional video with motion graphics and professional voiceover.', 350.00,  6);

-- ----------------------------------------------------------------
-- ORDERS (10 orders across different statuses)
-- ----------------------------------------------------------------
-- Use direct INSERT instead of stored procedure for seed flexibility
INSERT INTO ORDERS (gig_id, client_id, status, amount, order_date) VALUES
(1, 6,  'completed',   500.00, '2026-06-10 09:00:00'),
(3, 7,  'completed',   200.00, '2026-06-12 10:00:00'),
(5, 8,  'completed',   250.00, '2026-06-15 11:00:00'),
(7, 9,  'completed',   400.00, '2026-06-20 14:00:00'),
(9, 10, 'completed',   120.00, '2026-06-22 16:00:00'),
(2, 6,  'in_progress', 100.00, '2026-07-01 09:00:00'),
(4, 7,  'in_progress', 150.00, '2026-07-05 10:00:00'),
(6, 8,  'in_progress', 180.00, '2026-07-10 11:00:00'),
(8, 9,  'pending',     300.00, '2026-07-20 14:00:00'),
(10,10, 'cancelled',   350.00, '2026-07-25 16:00:00');

-- ----------------------------------------------------------------
-- PAYMENTS
-- ----------------------------------------------------------------
INSERT INTO PAYMENTS (order_id, amount, status, payment_date, method) VALUES
(1,  500.00, 'completed', '2026-06-10 09:05:00', 'card'),
(2,  200.00, 'completed', '2026-06-12 10:05:00', 'paypal'),
(3,  250.00, 'completed', '2026-06-15 11:05:00', 'card'),
(4,  400.00, 'completed', '2026-06-20 14:05:00', 'card'),
(5,  120.00, 'completed', '2026-06-22 16:05:00', 'paypal'),
(6,  100.00, 'pending',   '2026-07-01 09:05:00', 'card'),
(7,  150.00, 'pending',   '2026-07-05 10:05:00', 'card'),
(8,  180.00, 'pending',   '2026-07-10 11:05:00', 'card'),
(9,  300.00, 'pending',   '2026-07-20 14:05:00', 'paypal'),
(10, 350.00, 'refunded',  '2026-07-25 16:05:00', 'card');

-- ----------------------------------------------------------------
-- REVIEWS (only for completed orders 1-5)
-- These will fire the trigger and populate avg_rating on USERS
-- ----------------------------------------------------------------
INSERT INTO REVIEWS (order_id, rating, comment, review_date) VALUES
(1, 5, 'Alex delivered an outstanding web app. Clean code, on time, and great communication!', '2026-06-18 12:00:00'),
(2, 5, 'Sofia is an incredible designer. The UI is exactly what I envisioned. Highly recommended!', '2026-06-20 13:00:00'),
(3, 4, 'Marcus did a solid SEO audit. Already seeing improvements in rankings.', '2026-06-23 10:00:00'),
(4, 5, 'Priya built an amazing ML model. Very thorough analysis and great report.', '2026-06-28 15:00:00'),
(5, 4, 'Liam edited my video professionally. Fast delivery and great quality.', '2026-06-30 11:00:00');

-- ----------------------------------------------------------------
-- TRUST_TIERS (INSERT IGNORE — already seeded inline in schema.sql)
-- Running again here is safe; IGNORE prevents duplicate-key errors.
-- ----------------------------------------------------------------
INSERT IGNORE INTO TRUST_TIERS
    (tier_name, min_trust_score, commission_rate, trial_price_cap, trial_orders_required)
VALUES
    ('New',          0.00, 0.1000, 1500.00, 3),
    ('Trusted',     40.00, 0.1500,    NULL, 0),
    ('Established', 75.00, 0.0800,    NULL, 0);

-- ----------------------------------------------------------------
-- SKILL_ASSESSMENTS
-- Mix of passed and failed to give realistic score diversity.
-- Freelancer user_ids: Alex=1, Sofia=2, Marcus=3, Priya=4, Liam=5
-- skill_ids: React=1, Node.js=2, UI/UX Design=3, Photoshop=4, SEO=5
--            Python=6, Data Analysis=7, Copywriting=8, Video Editing=9
-- ----------------------------------------------------------------
INSERT INTO SKILL_ASSESSMENTS (user_id, skill_id, score, passed, taken_at) VALUES
-- Alex Rivera: React passed (92), Node.js passed (85)
(1, 1, 92.00, 1, '2026-06-01 10:00:00'),
(1, 2, 85.00, 1, '2026-06-02 10:00:00'),
-- Sofia Chen: UI/UX passed (88), Photoshop failed (58 < 70 threshold)
(2, 3, 88.00, 1, '2026-06-01 11:00:00'),
(2, 4, 58.00, 0, '2026-06-02 11:00:00'),
-- Marcus Johnson: SEO passed (76), Copywriting failed (62)
(3, 5, 76.00, 1, '2026-06-03 09:00:00'),
(3, 8, 62.00, 0, '2026-06-03 10:00:00'),
-- Priya Patel: Python passed (95), Data Analysis passed (91)
(4, 6, 95.00, 1, '2026-06-01 14:00:00'),
(4, 7, 91.00, 1, '2026-06-02 14:00:00'),
-- Liam O Brien: Video Editing passed (79)
(5, 9, 79.00, 1, '2026-06-04 09:00:00');

-- ----------------------------------------------------------------
-- Recalculate trust scores for seeded freelancers.
-- Since we can't call the stored procedure easily before orders
-- exist with is_trial flags, we set realistic approximations
-- directly. The trigger/procedure will maintain accuracy from here.
-- Formula approximation for established freelancers (they have
-- real ratings from the review seeds above):
--
--   Alex   : A=100% pass, C=5.0*20=100 → score ~60 (Trusted tier)
--   Sofia  : A=50% pass, C=5.0*20=100 → score ~45 (Trusted tier)
--   Marcus : A=50% pass, C=4.0*20=80  → score ~39 (stays New)
--   Priya  : A=100% pass, C=5.0*20=100 → score ~60 (Trusted tier)
--   Liam   : A=100% pass, C=4.0*20=80  → score ~54 (Trusted tier)
-- ----------------------------------------------------------------
UPDATE USERS SET trust_score = 60.00, trust_tier_id = 2, trial_orders_completed = 1 WHERE user_id = 1; -- Alex  → Trusted
UPDATE USERS SET trust_score = 45.00, trust_tier_id = 2, trial_orders_completed = 0 WHERE user_id = 2; -- Sofia → Trusted
UPDATE USERS SET trust_score = 39.00, trust_tier_id = 1, trial_orders_completed = 0 WHERE user_id = 3; -- Marcus→ New
UPDATE USERS SET trust_score = 60.00, trust_tier_id = 2, trial_orders_completed = 0 WHERE user_id = 4; -- Priya → Trusted
UPDATE USERS SET trust_score = 54.00, trust_tier_id = 2, trial_orders_completed = 0 WHERE user_id = 5; -- Liam  → Trusted

-- ----------------------------------------------------------------
-- Mark the gigs of Marcus (user_id=3, still in 'New' tier) as
-- trial gigs so the demo flow works out of the box.
-- ----------------------------------------------------------------
UPDATE GIGS SET is_trial = 1 WHERE freelancer_id = 3;

-- ----------------------------------------------------------------
-- DISPUTES
-- Two demo rows:
--   1. Open dispute on order 5 (Liam, completed video order) —
--      client raised it after delivery, still pending resolution.
--   2. Resolved dispute on order 3 (Marcus SEO order) resolved
--      in favour of the freelancer.
-- ----------------------------------------------------------------
INSERT INTO DISPUTES (order_id, raised_by, reason, status, resolved_at) VALUES
-- Order 5: client ava@client.dev (user 10) raises dispute — open
(5, 10, 'Video delivered was lower quality than the samples shown in the gig.', 'open', NULL),
-- Order 3: dispute resolved in freelancer favour (Marcus vindicated)
(3,  8, 'SEO results not visible after 1 week.', 'resolved_for_freelancer', '2026-07-01 09:00:00');

