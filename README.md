# 🌐 NexusBase
### A Full-Stack Freelance Services Marketplace with a Trust & Commission System

> **DBMS Capstone Project** — demonstrating relational design, normalization, stored procedures, triggers, views, indexes, and a multi-tier trust system enforced entirely at the database layer.

`MySQL 8.x` &nbsp;·&nbsp; `Node.js 18+` &nbsp;·&nbsp; `Express 4.x` &nbsp;·&nbsp; `Next.js 16` &nbsp;·&nbsp; `React 19` &nbsp;·&nbsp; `JWT + bcrypt`

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Live Demo Flow](#-live-demo-flow)
3. [Tech Stack](#-tech-stack)
4. [Database Schema](#-database-schema)
5. [Schema Design Decisions](#-schema-design-decisions)
6. [DBMS Features In-Depth](#-dbms-features-in-depth)
7. [Quick Start](#-quick-start)
8. [API Reference](#-api-reference)
9. [Project Structure](#-project-structure)
10. [Viva Cheat Sheet](#-viva-cheat-sheet)

---

## 🎯 Project Overview

**NexusBase** is a freelance services marketplace where trust isn't just a label — it's **enforced at the database layer**. Clients hire freelancers across 10+ categories through a complete order lifecycle (browse → order → deliver → review), while a three-tier commission system backed by stored procedures, triggers, and escrow controls ensures that every freelancer earns their reputation before unlocking full platform access.

The distinguishing feature of this project is its **Trust & Commission System**: a database-enforced vetting mechanism that gates new freelancers behind skill assessments and trial orders before they earn full pricing access. Commission rates are locked at the database level and recorded on every order at the time of placement — not looked up at query time. Three tiers (New → Trusted → Established) are governed by a `TRUST_TIERS` lookup table, two triggers, and a stored procedure (`recalculate_trust_score`) that re-evaluates a freelancer's score after every assessment, trial completion, or dispute resolution.

This project is built as a **DBMS capstone**, where correct relational design, normalization, and the use of advanced database features (stored procedures, triggers, views, indexes) are as important as the working application itself.

### Core Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Authentication** | Stateless auth with role-based guards (client / freelancer) |
| 🛍️ **Gig Marketplace** | Browse, search, and filter 10+ categories of freelance services |
| 📦 **Order Lifecycle** | `pending → in_progress → completed \| cancelled` with enforced state machine transitions |
| 💳 **Payments** | 1:1 payment record per order; `escrow_status` for trust-tier hold/release |
| ⭐ **Reviews & Ratings** | Star rating system with automatic average recalculation |
| 📊 **Role Dashboards** | Freelancers manage gigs + order queue (Kanban); clients track order history |
| 🏆 **Leaderboard** | Top freelancers ranked by rating via a SQL view |
| 🎬 **Animated Hero** | Two-column hero with typing animation search bar and glassmorphism proof cards |
| 🛡️ **Trust & Commission System** | Three-tier freelancer vetting: skill assessments, trial orders, dispute resolution, and per-tier commission rates enforced at database level via `fee_transparency` view |
| ⚖️ **Disputes** | Escrow-backed dispute system — only on in-progress orders while funds are held |
| 💱 **Currency Toggle** | INR / USD display via `CurrencyContext` |

---

## 🎬 Live Demo Flow

The following flows were verified end-to-end:

**Core order lifecycle:**
```
Sign up as freelancer → Post a gig → Sign up as client → Browse gigs
→ Place order (stored proc) → Freelancer accepts → Client marks complete
→ Leave review (fires trigger) → avg_rating updated → View leaderboard
```

**Trust system lifecycle:**
```
New freelancer → Take skill assessment (POST /api/assessments/:skill_id)
→ recalculate_trust_score fires → Post a trial gig (price cap enforced)
→ Client orders → Freelancer completes → after_trial_order_complete trigger
→ trial_orders_completed++ → trust score recalculated → tier auto-promoted
→ Established tier: lower commission, full pricing unlocked
```

**Demo Credentials** — all passwords: `Password123!`

| Role | Email |
|------|-------|
| Freelancer | alex@nexus.dev |
| Freelancer | sofia@nexus.dev |
| Freelancer | marcus@nexus.dev |
| Freelancer | priya@nexus.dev |
| Freelancer | liam@nexus.dev |
| Client | emma@client.dev |
| Client | james@client.dev |
| Client | olivia@client.dev |
| Client | noah@client.dev |
| Client | ava@client.dev |

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────┐
│                     FRONTEND                        │
│       Next.js 16.3.0 · React 19.2.8                │
│  CSS Modules · CSS custom properties (globals.css) │
│  Glassmorphism UI · Responsive design              │
└──────────────────────┬──────────────────────────────┘
                       │  HTTP / REST (native fetch)
┌──────────────────────▼──────────────────────────────┐
│                     BACKEND                         │
│      Node.js 18 · Express 4.19 · JWT Auth           │
│     bcrypt passwords · Role-based guards            │
│     nodemon (dev) · mysql2 connection pool           │
└──────────────────────┬──────────────────────────────┘
                       │  mysql2 connection pool
┌──────────────────────▼──────────────────────────────┐
│                    DATABASE                         │
│                MySQL 8 · InnoDB                     │
│  3 Triggers · 2 Stored Procs · 2 Views · Indexes   │
└─────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Entity-Relationship Overview

```
USERS ──< USER_SKILLS >── SKILLS
  │
  ├──< GIGS >── CATEGORIES
  │       │
  │       └──< ORDERS >── PAYMENTS  (1:1)
  │                 │
  │                 ├──── REVIEWS   (1:1)
  │                 └──── DISPUTES  (0:1)
  │
  ├── TRUST_TIERS  (lookup, FK on USERS.trust_tier_id)
  └──< SKILL_ASSESSMENTS >── SKILLS
```

### Tables at a Glance

| Table | PK | Key Columns | Relationships |
|-------|----|-------------|---------------|
| **USERS** | `user_id` | name, email, role, avg_rating, **trust_score, trust_tier_id, trial_orders_completed** | Parent of GIGS, ORDERS, SKILL_ASSESSMENTS |
| **SKILLS** | `skill_id` | skill_name | M:M with USERS via USER_SKILLS |
| **USER_SKILLS** | (user_id, skill_id) | — | Junction table |
| **CATEGORIES** | `category_id` | category_name | Parent of GIGS |
| **GIGS** | `gig_id` | title, price, delivery_days, **is_trial** | Child of USERS, CATEGORIES |
| **ORDERS** | `order_id` | status, amount, **is_trial, commission_rate_applied, commission_amount** | Child of GIGS, USERS |
| **PAYMENTS** | `payment_id` | amount, method, status, **escrow_status** | 1:1 child of ORDERS |
| **REVIEWS** | `review_id` | rating, comment, review_date | 1:1 child of ORDERS |
| **TRUST_TIERS** | `tier_id` | tier_name, min_trust_score, commission_rate, trial_price_cap, trial_orders_required | Lookup — FK on USERS.trust_tier_id |
| **SKILL_ASSESSMENTS** | `assessment_id` | user_id, skill_id, score, passed | Child of USERS + SKILLS |
| **DISPUTES** | `dispute_id` | order_id, raised_by, reason, status, resolved_at | Child of ORDERS |

### Full DDL Summary

```sql
-- Fresh install: schema + seed (baseline + trust system migration folded in)
Get-Content database\schema.sql | mysql -u root "-pYOUR_PASSWORD"
Get-Content database\seed.sql   | mysql -u root "-pYOUR_PASSWORD"

-- Existing DB: run incremental migrations
SOURCE database/migrations/002_trust_system.sql;
SOURCE database/migrations/fix_place_order_trusted_amount.sql;
SOURCE database/migrations/fix_dispute_trigger_self_reference.sql;
```

---

## 🧠 Schema Design Decisions

### 1. Single USERS Table (not two separate tables)

Both clients and freelancers share one `USERS` table with a `role ENUM('client','freelancer')` column.

**Why not separate `CLIENTS` and `FREELANCERS` tables?**
- Avoids duplication of common columns (`name`, `email`, `password_hash`, `created_at`)
- Any user can theoretically switch roles without a migration
- Queries that need "any user" (e.g. for auth) hit one table, not a UNION
- The `avg_rating` column is only meaningful for freelancers — it remains NULL for clients (acceptable sparsity since it's a single column, not a block)

---

### 2. USER_SKILLS as a Junction Table (Many-to-Many)

A freelancer can have many skills; a skill can belong to many freelancers. This is a **many-to-many relationship**:

```
USERS (1) ──< USER_SKILLS (M) >── SKILLS (1)
```

**Why not store skills as a comma-separated string in USERS?**
- Violates **First Normal Form (1NF)** — each column must hold atomic values
- Impossible to query "find all freelancers with skill X" efficiently
- Impossible to enforce referential integrity on skill names

The composite PK `(user_id, skill_id)` automatically enforces uniqueness — no freelancer can be assigned the same skill twice.

---

### 3. CATEGORIES as a Separate Lookup Table

`category_name` is stored in its own table rather than as a string on `GIGS`.

**Benefits:**
- **Update anomaly prevention** — renaming "Web Dev" to "Web Development" requires one `UPDATE`, not touching every gig row
- **Referential integrity** — `FOREIGN KEY (category_id) REFERENCES CATEGORIES(category_id)` prevents orphaned gigs
- **Efficient filtering** — `WHERE category_id = ?` uses an index scan; `WHERE category_name = ?` on a varchar requires full scan

---

### 4. Why PAYMENTS is Separate from ORDERS (1:1)

At first glance, adding `payment_method`, `payment_status`, `gateway_ref` as columns on `ORDERS` seems simpler. **It isn't.**

| Reason | Explanation |
|--------|-------------|
| **Single Responsibility** | An `ORDER` records a work agreement. A `PAYMENT` records a financial transaction. They are different real-world entities with different lifecycles. |
| **Immutability** | A payment can be `refunded` after an order is `completed`. The two statuses change independently. |
| **Future-proofing** | Payment tables grow: gateway references, retry timestamps, invoice IDs, partial refunds. Keeping them separate prevents ORDERS from becoming a "god table." |
| **Nullability** | If payment columns lived on ORDERS, they'd be NULL for cancelled or draft orders — a design smell. A separate table with `UNIQUE(order_id)` enforces the 1:1 at the DB level, not just in application code. |

---

### 5. Why REVIEWS is Separate from ORDERS (1:1)

Same reasoning, different context:

| Reason | Explanation |
|--------|-------------|
| **Sparsity** | Only completed orders get reviews. Most orders would have NULL review columns — wasteful and misleading. |
| **Independence** | Review moderation (flagging, admin removal, helpful votes) can grow without touching ORDERS. |
| **DB-level enforcement** | `UNIQUE(order_id)` on REVIEWS guarantees one review per order — not just "we check in code." |
| **Clean schema** | ORDERS stays focused: it tracks work status. REVIEWS tracks client satisfaction. |

---

### 6. `amount` Denormalized on ORDERS (Intentional)

The `amount` on `ORDERS` is fetched from `GIGS.price` at order time by the `place_order` stored procedure rather than being computed via JOIN.

**Why?** Gig prices change. A freelancer could raise their price next week. The `ORDERS` table must preserve the **historical price the client agreed to pay** — not the current price. This is a deliberate, documented denormalization, not a design flaw. The stored procedure fetches the gig's price internally (`SELECT price INTO v_price FROM GIGS WHERE gig_id = p_gig_id`) to guarantee the amount is authoritative and cannot be manipulated by the caller.

---

### 7. TRUST_TIERS as a Lookup Table (not an ENUM)

The three tiers (New / Trusted / Established) are stored in their own `TRUST_TIERS` table rather than as an ENUM on USERS.

| Reason | Explanation |
|--------|-------------|
| **Data per tier** | Each tier carries `commission_rate`, `trial_price_cap`, `trial_orders_required`, `min_trust_score` — too much to pack into an ENUM |
| **No migration needed to change rates** | A `commission_rate` change is one `UPDATE` row; an ENUM change requires `ALTER TABLE` on every deployment |
| **FK-enforced integrity** | `FOREIGN KEY (trust_tier_id) REFERENCES TRUST_TIERS(tier_id)` prevents a user from being assigned a non-existent tier |
| **`fee_transparency` view** | The view JOINs `TRUST_TIERS` with live USERS counts — impossible with an ENUM |

---

### 8. SKILL_ASSESSMENTS Separate from USER_SKILLS

`USER_SKILLS` records *what* skills a freelancer claims. `SKILL_ASSESSMENTS` records *whether they passed a test* for that skill — a different fact with its own lifecycle (score, passed, taken_at, retakes).

Merging them would create a partial-dependency violation (the score depends on the assessment event, not on the (user_id, skill_id) pair itself) — breaking **2NF**.

---

### 9. `commission_rate_applied` Denormalized on ORDERS (Same Reasoning as `amount`)

Like `amount`, the commission rate is snapshotted onto the ORDER row at the time `place_order` fires. If the freelancer is later promoted to a cheaper tier, historical commission records remain accurate. The procedure also computes `commission_amount = amount × commission_rate` at INSERT time so reporting queries need no runtime arithmetic.

---


### 🔁 Trigger — `after_review_insert`

```sql
DELIMITER $$
CREATE TRIGGER after_review_insert
AFTER INSERT ON REVIEWS
FOR EACH ROW
BEGIN
  DECLARE v_freelancer_id INT;

  -- Trace: REVIEWS → ORDERS → GIGS → freelancer
  SELECT g.freelancer_id INTO v_freelancer_id
  FROM ORDERS o
  JOIN GIGS g ON g.gig_id = o.gig_id
  WHERE o.order_id = NEW.order_id;

  -- Recalculate and cache avg_rating on USERS
  UPDATE USERS
  SET avg_rating = (
    SELECT AVG(r2.rating)
    FROM REVIEWS r2
    JOIN ORDERS o2  ON o2.order_id  = r2.order_id
    JOIN GIGS   g2  ON g2.gig_id    = o2.gig_id
    WHERE g2.freelancer_id = v_freelancer_id
  )
  WHERE user_id = v_freelancer_id;
END$$
DELIMITER ;
```

**What it does:** Fires automatically on every `INSERT INTO REVIEWS`. Traces back through `ORDERS → GIGS` to find the freelancer, then recalculates their `avg_rating` as the mean of all their received ratings.

**Why it matters:** The rating is always accurate without application-layer code. No "refresh" endpoint needed — the database self-maintains the cache.

---

### 📦 Stored Procedure — `place_order`

```sql
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
  DECLARE v_commission_rate   DECIMAL(5,4)  DEFAULT 0.1000;
  DECLARE v_trial_price_cap   DECIMAL(10,2) DEFAULT NULL;
  DECLARE v_commission_amount DECIMAL(10,2) DEFAULT 0.00;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

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
  SELECT tt.commission_rate, tt.trial_price_cap
    INTO v_commission_rate, v_trial_price_cap
    FROM USERS u JOIN TRUST_TIERS tt ON tt.tier_id = u.trust_tier_id
   WHERE u.user_id = v_freelancer_id;

  -- Enforce trial price cap
  IF v_is_trial = 1 AND v_trial_price_cap IS NOT NULL
                   AND v_price > v_trial_price_cap THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Gig price exceeds trial price cap';
  END IF;

  SET v_commission_amount = ROUND(v_price * v_commission_rate, 2);

  START TRANSACTION;
    INSERT INTO ORDERS (gig_id, client_id, status, amount,
                        is_trial, commission_rate_applied, commission_amount)
    VALUES (p_gig_id, p_client_id, 'pending', v_price,
            v_is_trial, v_commission_rate, v_commission_amount);

    SET p_order_id = LAST_INSERT_ID();

    INSERT INTO PAYMENTS (order_id, amount, status, method, escrow_status)
    VALUES (p_order_id, v_price, 'pending', p_method, 'holding');
  COMMIT;
END$$
DELIMITER ;
```

**What it does:** Creates an ORDER and its linked PAYMENT atomically inside a single transaction. The procedure fetches the gig price internally from the `GIGS` table — it does **not** accept an amount from the caller, preventing price manipulation.

**Why a transaction?** If the PAYMENTS INSERT fails (constraint violation, disk error), the ORDERS INSERT is rolled back. An orphaned order without a payment record — or a payment without an order — would corrupt the data. The `DECLARE EXIT HANDLER FOR SQLEXCEPTION` guarantees cleanup on any error.

**Called from:** `POST /api/orders` → `CALL place_order(?, ?, ?, @order_id)` → reads `SELECT @order_id`.

---

### 👁️ View — `top_freelancers`

```sql
CREATE VIEW top_freelancers AS
SELECT
  u.user_id,
  u.name,
  u.email,
  u.bio,
  u.avatar_url,
  u.avg_rating,
  COUNT(DISTINCT g.gig_id)                                         AS total_gigs,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.order_id END) AS completed_orders,
  COALESCE(AVG(r.rating), 0)                                       AS calculated_avg_rating
FROM USERS u
LEFT JOIN GIGS   g ON g.freelancer_id = u.user_id
LEFT JOIN ORDERS o ON o.gig_id        = g.gig_id
LEFT JOIN REVIEWS r ON r.order_id     = o.order_id
WHERE u.role = 'freelancer'
GROUP BY u.user_id, u.name, u.email, u.bio, u.avatar_url, u.avg_rating
ORDER BY u.avg_rating DESC, completed_orders DESC;
```

**What it does:** Pre-joins USERS → GIGS → ORDERS → REVIEWS and computes per-freelancer leaderboard stats. Exposes both the cached `avg_rating` (from the trigger) and a live `calculated_avg_rating` for cross-verification.

**Used in:** Landing page "Top Rated Freelancers" section and `GET /api/users/top/freelancers`.

---

### 📈 Indexes

```sql
CREATE INDEX idx_gigs_category ON GIGS(category_id);
CREATE INDEX idx_gigs_title    ON GIGS(title);
```

| Index | Column | Query it optimizes |
|-------|--------|-------------------|
| `idx_gigs_category` | `GIGS.category_id` | `WHERE category_id = ?` — category filter on browse page |
| `idx_gigs_title` | `GIGS.title` | `WHERE title LIKE '%keyword%'` — keyword search |

Without `idx_gigs_category`, a browse-by-category query does a **full table scan** — O(n) regardless of how many gigs exist. With the index, MySQL jumps directly to matching rows — O(log n).

---

### 🧮 Stored Procedure — `recalculate_trust_score`

```sql
CREATE PROCEDURE recalculate_trust_score(IN p_user_id INT UNSIGNED)
BEGIN
  DECLARE v_pass_rate        DECIMAL(10,4) DEFAULT 0;
  DECLARE v_completion_ratio DECIMAL(10,4) DEFAULT 0;
  DECLARE v_avg_rating_comp  DECIMAL(10,4) DEFAULT 0;
  DECLARE v_dispute_penalty  DECIMAL(10,4) DEFAULT 0;
  DECLARE v_raw_score        DECIMAL(10,4) DEFAULT 0;
  DECLARE v_final_score      DECIMAL(5,2)  DEFAULT 0.00;
  -- ... (full formula documented in schema.sql)
  --  score = (pass_rate × 0.30) + (completion_ratio × 0.30)
  --        + (avg_rating_norm × 0.30) − (dispute_penalty × 0.10)
  --  clamped to [0, 100]
  UPDATE USERS SET trust_score = v_final_score WHERE user_id = p_user_id;
  -- Auto-promote tier when score crosses min_trust_score threshold
END$$
```

**Weight breakdown (for viva defence):**

| Component | Weight | Source column |
|-----------|--------|---------------|
| Skill assessment pass rate | 30% | `SKILL_ASSESSMENTS.passed` |
| Trial completion ratio | 30% | `USERS.trial_orders_completed` / trial attempts |
| Average client rating (0–5 → 0–100) | 30% | `USERS.avg_rating × 20` |
| Dispute penalty (resolved against freelancer) | −10% | `DISPUTES.status = 'resolved_for_client'` |

**Called from:** `after_trial_order_complete` trigger, `after_dispute_resolved` trigger, and directly by `POST /api/assessments/:skill_id`.

---

### 🔁 Trigger — `after_trial_order_complete`

**Fires:** `AFTER UPDATE ON ORDERS` when `status` transitions to `completed` AND `is_trial = 1`.

**What it does:**
1. Increments `USERS.trial_orders_completed` for the gig's freelancer
2. Calls `recalculate_trust_score(freelancer_id)`
3. The procedure compares new `trust_score` against `TRUST_TIERS.min_trust_score` and auto-promotes `trust_tier_id`
4. Updates `PAYMENTS.escrow_status` from `holding` → `released` and sets `status = 'completed'`

**Why this belongs in a trigger (not application code):** The state transition is an atomic fact — it must fire even if the status update arrives via a direct SQL command, not just through the API. A trigger guarantees this.

---

### 🔁 Trigger — `after_dispute_resolved`

**Fires:** `AFTER UPDATE ON DISPUTES` when `status` changes from `open` to a resolved value.

**Note:** The `resolved_at` timestamp is set by the backend's UPDATE statement that triggers this — not by the trigger itself — because MySQL forbids a trigger from modifying the same table that fired it.

**Branching logic:**
- `resolved_for_client` → refunds escrow (`escrow_status = 'refunded'`, `status = 'refunded'` on PAYMENTS), calls `recalculate_trust_score` (dispute count now included in penalty calculation)
- `resolved_for_freelancer` → if trial order and not yet completed, sets order status to `completed` (which cascades to fire `after_trial_order_complete`); otherwise calls `recalculate_trust_score` for a neutral recount

---

### 👁️ View — `fee_transparency`

```sql
CREATE VIEW fee_transparency AS
SELECT
  tt.tier_id, tt.tier_name, tt.min_trust_score,
  tt.commission_rate,
  ROUND(tt.commission_rate * 100, 2) AS commission_pct,
  tt.trial_price_cap, tt.trial_orders_required,
  COUNT(DISTINCT u.user_id) AS freelancers_in_tier
FROM TRUST_TIERS tt
LEFT JOIN USERS u ON u.trust_tier_id = tt.tier_id AND u.role = 'freelancer'
GROUP BY tt.tier_id, tt.tier_name, tt.min_trust_score,
         tt.commission_rate, tt.trial_price_cap, tt.trial_orders_required
ORDER BY tt.min_trust_score ASC;
```

**What it demonstrates:** Commission rates are provably enforced at database level — a SELECT on this view shows live freelancer distribution across tiers. The `/transparency` frontend page renders this view directly, so evaluators can verify numbers match.

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MySQL 8.x running locally
- npm ≥ 9

### Step 1 — Set up the Database

```powershell
# Load schema (tables, triggers, procedures, views, indexes)
Get-Content database\schema.sql | mysql -u root "-pYOUR_PASSWORD"

# Load seed data (10 users, 10+ gigs, orders, reviews, trust data)
Get-Content database\seed.sql   | mysql -u root "-pYOUR_PASSWORD"
```

### Step 2 — Configure the Backend

Edit `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=nexusbase

JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Step 3 — Start the Backend

```powershell
cd backend
npm install
npm run dev
# ✅  NexusBase API running on http://localhost:5000
```

### Step 4 — Start the Frontend

```powershell
cd frontend
npm install
npm run dev
# ▲ Next.js 16.3.0 — Ready on http://localhost:3000
```

### Step 5 — Open the App

Navigate to **http://localhost:3000** and sign in with a demo account.

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | — | Register a new user |
| `POST` | `/api/auth/login` | — | Login, returns JWT |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/users/me` | JWT | Get own profile |
| `PUT` | `/api/users/me` | JWT | Update bio / avatar |
| `PUT` | `/api/users/me/skills` | Freelancer | Replace skill set |
| `GET` | `/api/users/top/freelancers` | — | Top freelancers (from VIEW) |
| `GET` | `/api/users/:id` | — | Public profile |

### Gigs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/gigs` | — | Browse (search, category, page) |
| `GET` | `/api/gigs/:id` | — | Gig detail + reviews |
| `POST` | `/api/gigs` | Freelancer | Create gig |
| `PUT` | `/api/gigs/:id` | Freelancer | Update own gig |
| `DELETE` | `/api/gigs/:id` | Freelancer | Delete own gig |
| `GET` | `/api/gigs/freelancer/my` | Freelancer | Own gig list |

### Categories & Skills

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/categories` | — | All categories |
| `GET` | `/api/skills` | — | All skills (for autocomplete) |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/orders` | Client | Place order (calls `place_order` stored proc) |
| `GET` | `/api/orders` | JWT | Orders (role-filtered) |
| `GET` | `/api/orders/:id` | JWT | Single order detail (ownership-verified) |
| `PATCH` | `/api/orders/:id/status` | JWT | Update order status (state machine enforced) |

**Order Status Transitions (enforced):**
```
pending     → in_progress  (freelancer only)
in_progress → completed    (client only)
pending | in_progress → cancelled  (client or freelancer)
Terminal states (completed, cancelled) reject all transitions.
```

### Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/reviews/:order_id` | Client | Submit review (fires `after_review_insert` trigger) |
| `GET` | `/api/reviews/gig/:gig_id` | — | Reviews for a gig |

### Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/dashboard` | JWT | Role-aware dashboard data (all order statuses) |

### Trust

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/trust/tiers` | Public | `fee_transparency` view — all tier data live from DB |
| `GET` | `/api/trust/me` | JWT | Own trust score, tier, commission, trial progress |

### Assessments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/assessments/:skill_id` | Freelancer | Submit score → writes SKILL_ASSESSMENTS → calls `recalculate_trust_score` |
| `GET` | `/api/assessments/me` | Freelancer | Own assessment history with skill names |

### Disputes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/orders/:id/dispute` | JWT | Raise dispute (only on in-progress orders) |
| `PATCH` | `/api/orders/disputes/:id` | Freelancer | Resolve dispute (sets `resolved_at`) — `after_dispute_resolved` trigger fires |

---

## 📁 Project Structure

```
NexusBase/
│
├── 📂 database/
│   ├── schema.sql          # Full DDL — 11 tables, 3 triggers, 2 procs, 2 views, indexes
│   ├── seed.sql            # 10 users, 10+ gigs, orders, reviews + trust system seed rows
│   └── migrations/
│       ├── 002_trust_system.sql                    # Incremental: 3 new tables, 4 new cols, 2 procs, 2 triggers, 1 view
│       ├── fix_place_order_trusted_amount.sql       # Fix: procedure fetches gig price internally
│       └── fix_dispute_trigger_self_reference.sql   # Fix: removed self-referencing UPDATE in trigger
│
├── 📂 backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           # mysql2 connection pool
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT verify + requireRole guard
│   │   └── routes/
│   │       ├── auth.js         # signup / login
│   │       ├── users.js        # profiles, skills, top-freelancers
│   │       ├── gigs.js         # CRUD + browse; trial price-cap enforcement
│   │       ├── categories.js   # categories + skills lookup lists
│   │       ├── orders.js       # place_order proc + status (state machine) + dispute endpoints
│   │       ├── reviews.js      # triggers avg_rating update
│   │       ├── dashboard.js    # aggregated role-aware data (all statuses)
│   │       ├── assessments.js  # POST submit + GET history
│   │       └── trust.js        # GET tiers (fee_transparency) + GET me
│   ├── index.js                # Express app entry
│   ├── .env                    # DB + JWT config
│   └── package.json
│
├── 📂 frontend/
│   ├── app/
│   │   ├── layout.js           # Root layout + AuthProvider
│   │   ├── globals.css         # Design system (CSS vars, glassmorphism)
│   │   ├── page.js             # Homepage: video hero, categories, gigs, freelancers
│   │   ├── auth/
│   │   │   ├── login/          # Login page
│   │   │   └── signup/         # Signup with role toggle
│   │   ├── gigs/
│   │   │   ├── page.js         # Browse page (search + category filter)
│   │   │   ├── [id]/           # Gig detail + order sidebar
│   │   │   └── new/            # Create gig form (trial cap banner)
│   │   ├── dashboard/          # Role-aware dashboard (Kanban + Trust tab + dispute actions)
│   │   ├── assessment/         # Skill quiz: intro → 5 Qs → result + gauge
│   │   └── transparency/       # Public fee schedule page (fee_transparency view)
│   ├── components/
│   │   ├── Navbar.js           # Scroll-aware nav with user dropdown
│   │   ├── Footer.js           # Site footer with quick links
│   │   ├── GigCard.js          # Gig card + TierPill + Trial chip
│   │   ├── Icons.js            # SVG icon component library
│   │   ├── TrustBadge.js       # TierPill · TrialProgress · TrustWidget
│   │   ├── ReviewForm.js       # Inline star picker + comment form
│   │   └── Toast.js            # Toast notification system
│   ├── context/
│   │   ├── AuthContext.js      # Global auth state via React Context
│   │   └── CurrencyContext.js  # INR/USD currency toggle
│   ├── lib/
│   │   └── api.js              # Native fetch client (JWT interceptor + trust helpers)
│   └── package.json
│
├── VIVA_NOTES.md               # Viva preparation notes
└── README.md                   # You are here
```

---

## 📝 Viva Cheat Sheet

| Question | Answer |
|----------|--------|
| **Why is USER_SKILLS a separate table?** | Many-to-many between USERS and SKILLS. Storing multiple FKs in one column violates 1NF. Junction table with composite PK (user_id, skill_id) enforces uniqueness at DB level. |
| **Why is PAYMENTS separate from ORDERS?** | Different lifecycles: payment can be refunded after order completes. Separate table avoids NULL columns, enables independent growth, and enforces 1:1 via UNIQUE(order_id). |
| **Why is REVIEWS separate from ORDERS?** | Most orders won't have reviews (sparsity). Separate table avoids NULL columns and allows review-specific features without touching ORDERS. |
| **What does the `after_review_insert` trigger do?** | After INSERT on REVIEWS, traverses REVIEWS → ORDERS → GIGS to find the freelancer, then recalculates avg_rating on USERS as AVG of all their ratings. |
| **Why use a stored procedure for placing orders?** | Atomicity — creates ORDER + PAYMENT in one transaction. If PAYMENTS insert fails, the ORDER is rolled back. DECLARE EXIT HANDLER ensures cleanup on any error. The procedure also fetches the gig price internally to prevent caller manipulation. |
| **Why doesn't the stored procedure accept a price parameter?** | Defence-in-depth — the procedure fetches `price` from `GIGS` itself so no caller can pass a manipulated amount. The gig price is the single authoritative source. |
| **What does the `top_freelancers` view return?** | Joins USERS/GIGS/ORDERS/REVIEWS to compute total_gigs, completed_orders, calculated_avg_rating per freelancer, ordered by rating descending. |
| **Why indexes on GIGS?** | `idx_gigs_category` makes `WHERE category_id = ?` an index scan instead of full scan. `idx_gigs_title` speeds up LIKE keyword searches. |
| **Why is `amount` stored on ORDERS instead of computed from GIGS.price?** | Gig prices can change after an order is placed. We record the historical price the client agreed to at order time — intentional, documented denormalization. |
| **What is 3NF?** | Third Normal Form: every non-key column depends only on the primary key (not on other non-key columns). Our schema satisfies 3NF across all tables. |
| **How is avg_rating kept consistent?** | Database trigger fires after every review insert and recalculates avg_rating directly — no application-layer code required, consistent even with concurrent writes. |
| **What is the Trust System?** | A three-tier vetting system (New → Trusted → Established) that adjusts commission rates and unlocks full pricing as freelancers prove reliability via skill assessments, dispute-free trial orders, and client ratings. |
| **Why is TRUST_TIERS a separate table and not an ENUM?** | An ENUM can't carry per-tier data (commission rates, price caps, trial requirements). A lookup table allows rate changes via a single UPDATE row without ALTER TABLE migrations, and enables the `fee_transparency` view via JOIN. |
| **How is the trust score calculated?** | Weighted sum: assessment pass rate (30%) + trial completion ratio (30%) + avg_rating normalised 0–100 (30%) − dispute penalty 10% per resolved-against dispute. Clamped to [0, 100] and computed by the `recalculate_trust_score` stored procedure. |
| **Why is `commission_rate_applied` denormalised on ORDERS?** | Same reasoning as `amount` — if the freelancer is promoted to a cheaper tier later, historical commission records must reflect what was charged at order time. |
| **What does `after_trial_order_complete` do?** | Fires on ORDERS status → completed when is_trial=1. Increments trial_orders_completed, calls recalculate_trust_score, auto-promotes tier if threshold met, releases escrow on PAYMENTS (`holding` → `released`). |
| **What does `after_dispute_resolved` do?** | Fires on DISPUTES status change. If resolved_for_client: refunds escrow, calls recalculate_trust_score (penalty counted). If resolved_for_freelancer: completes the trial order (cascading to `after_trial_order_complete`) or does a neutral recount. Note: `resolved_at` is set by the backend UPDATE, not the trigger — MySQL forbids a trigger from modifying its own table. |
| **What is the `fee_transparency` view?** | JOINs TRUST_TIERS with live USERS counts per tier. Proves commission schedule is database-enforced, not just documented. Rendered on the public `/transparency` page. |
| **Where is the trial price cap enforced?** | Double-guarded: (1) `gigs.js POST` checks TRUST_TIERS before INSERT; (2) `place_order` stored procedure re-validates `v_price > v_trial_price_cap` at order time. Neither layer trusts the other. |
| **Why are SKILL_ASSESSMENTS separate from USER_SKILLS?** | USER_SKILLS records claimed skills; SKILL_ASSESSMENTS records test events (score, passed, taken_at). Merging them would create a partial-dependency violation (score depends on the assessment event, not on the (user_id, skill_id) pair) — breaking 2NF. |
| **How are order status transitions enforced?** | A state machine in the backend validates both the user's role AND the current order status before allowing transitions. Terminal states (completed, cancelled) reject all changes. `pending → in_progress` (freelancer only), `in_progress → completed` (client only), `pending\|in_progress → cancelled` (either). |
| **Why can disputes only be raised on in-progress orders?** | Once an order is completed, escrow is released to the freelancer — there are no funds to dispute. Cancelled orders are already refunded. Only in-progress orders have escrow in `holding` status. |

---

*Built with ❤️ as a DBMS Capstone Project — MySQL · Node.js · Express · Next.js · React · JWT*
