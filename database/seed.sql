-- =============================================================
--  NexusBase — Seed Data
--  5 clients, 5 freelancers, 10 gigs, 10 orders, payments, reviews
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
