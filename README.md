# 🌐 NexusBase
### A Full-Stack Freelance Services Marketplace

> **DBMS Capstone Project** — demonstrating relational design, stored procedures, triggers, views, and indexes through a production-quality web application.

`MySQL 8.x` &nbsp;·&nbsp; `Node.js 18+` &nbsp;·&nbsp; `Express 4.x` &nbsp;·&nbsp; `Next.js 16` &nbsp;·&nbsp; `JWT + bcrypt`

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

**NexusBase** is a full-stack freelance services marketplace — similar to Fiverr — that connects **clients** who need work done with **freelancers** who offer gigs. The platform handles the complete order lifecycle: browsing → ordering → delivery → review.

This project is built as a **DBMS capstone**, where correct relational design, normalization, and the use of advanced database features (stored procedures, triggers, views, indexes) are as important as the working application itself.

### Core Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Authentication** | Stateless auth with role-based guards (client / freelancer) |
| 🛍️ **Gig Marketplace** | Browse, search, and filter 10+ categories of freelance services |
| 📦 **Order Lifecycle** | `pending → in_progress → completed` status flow |
| 💳 **Payments** | 1:1 payment record per order with status tracking |
| ⭐ **Reviews & Ratings** | Star rating system with automatic average recalculation |
| 📊 **Role Dashboards** | Freelancers manage gigs + order queue; clients track order history |
| 🏆 **Leaderboard** | Top freelancers ranked by rating via a SQL view |
| 🎬 **Cinematic Hero** | Full-viewport space video background with glassmorphism UI on homepage |

---

## 🎬 Live Demo Flow

The following end-to-end flow was verified via automated browser testing:

```
Sign up as freelancer → Post a gig → Sign up as client → Browse gigs
→ Place order (stored proc) → Freelancer accepts → Client marks complete
→ Leave review (fires trigger) → avg_rating updated → View leaderboard
```

**Demo Credentials** — all passwords: `Password123!`

| Role | Email |
|------|-------|
| Freelancer | alex@nexus.dev |
| Freelancer | sofia@nexus.dev |
| Client | emma@client.dev |
| Client | james@client.dev |

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                      │
│         Next.js 16 · React 19 · CSS             │
│  Cinematic video hero · Glassmorphism UI        │
│  Liquid-glass components · Responsive design    │
└────────────────────┬────────────────────────────┘
                     │  HTTP / REST
┌────────────────────▼────────────────────────────┐
│                   BACKEND                       │
│      Node.js 18 · Express 4 · JWT Auth          │
│     bcrypt passwords · Role-based guards        │
└────────────────────┬────────────────────────────┘
                     │  mysql2 connection pool
┌────────────────────▼────────────────────────────┐
│                  DATABASE                       │
│              MySQL 8 · InnoDB                   │
│  Trigger · Stored Procedure · View · Indexes    │
└─────────────────────────────────────────────────┘
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
  │                 └──── REVIEWS   (1:1)
  │
  └── (client_id on ORDERS)
```

### Tables at a Glance

| Table | PK | Key Columns | Relationships |
|-------|----|-------------|---------------|
| **USERS** | `user_id` | name, email, password_hash, role, avg_rating | Parent of GIGS, ORDERS |
| **SKILLS** | `skill_id` | skill_name | M:M with USERS via USER_SKILLS |
| **USER_SKILLS** | (user_id, skill_id) | — | Junction table |
| **CATEGORIES** | `category_id` | category_name | Parent of GIGS |
| **GIGS** | `gig_id` | title, price, delivery_days | Child of USERS, CATEGORIES |
| **ORDERS** | `order_id` | status, amount, order_date | Child of GIGS, USERS |
| **PAYMENTS** | `payment_id` | amount, method, status | 1:1 child of ORDERS |
| **REVIEWS** | `review_id` | rating, comment, review_date | 1:1 child of ORDERS |

### Full DDL Summary

```sql
-- Run to set up everything:
Get-Content database\schema.sql | mysql -u root "-pYOUR_PASSWORD"
Get-Content database\seed.sql   | mysql -u root "-pYOUR_PASSWORD"
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

The `amount` on `ORDERS` is copied from `GIGS.price` at order time rather than being computed via JOIN.

**Why?** Gig prices change. A freelancer could raise their price next week. The `ORDERS` table must preserve the **historical price the client agreed to pay** — not the current price. This is a deliberate, documented denormalization, not a design flaw.

---

## ⚙️ DBMS Features In-Depth

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

**Verified:** After the E2E test, `avg_rating = 5.00` appeared for "Test Freelancer" on the `/api/users/top/freelancers` endpoint immediately after review submission.

---

### 📦 Stored Procedure — `place_order`

```sql
DELIMITER $$
CREATE PROCEDURE place_order(
  IN  p_gig_id    INT,
  IN  p_client_id INT,
  IN  p_amount    DECIMAL(10,2),
  IN  p_method    VARCHAR(50),
  OUT p_order_id  INT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

    -- Validate gig exists
    IF (SELECT COUNT(*) FROM GIGS WHERE gig_id = p_gig_id) = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Gig not found';
    END IF;

    -- Create the order
    INSERT INTO ORDERS (gig_id, client_id, status, amount)
    VALUES (p_gig_id, p_client_id, 'pending', p_amount);

    SET p_order_id = LAST_INSERT_ID();

    -- Create the linked payment record
    INSERT INTO PAYMENTS (order_id, amount, method, status)
    VALUES (p_order_id, p_amount, p_method, 'pending');

  COMMIT;
END$$
DELIMITER ;
```

**What it does:** Creates an ORDER and its linked PAYMENT atomically inside a single transaction.

**Why a transaction?** If the PAYMENTS INSERT fails (constraint violation, disk error), the ORDERS INSERT is rolled back. An orphaned order without a payment record — or a payment without an order — would corrupt the data. The `DECLARE EXIT HANDLER FOR SQLEXCEPTION` guarantees cleanup on any error.

**Called from:** `POST /api/orders` → `CALL place_order(?, ?, ?, ?, @order_id)` → reads `SELECT @order_id`.

---

### 👁️ View — `top_freelancers`

```sql
CREATE VIEW top_freelancers AS
SELECT
  u.user_id,
  u.name,
  u.bio,
  u.avg_rating,
  COUNT(DISTINCT g.gig_id)                                         AS total_gigs,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.order_id END) AS completed_orders,
  COALESCE(AVG(r.rating), 0)                                       AS calculated_avg_rating
FROM USERS u
LEFT JOIN GIGS   g ON g.freelancer_id = u.user_id
LEFT JOIN ORDERS o ON o.gig_id        = g.gig_id
LEFT JOIN REVIEWS r ON r.order_id     = o.order_id
WHERE u.role = 'freelancer'
GROUP BY u.user_id, u.name, u.bio, u.avg_rating
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

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MySQL 8.x running locally
- npm ≥ 9

### Step 1 — Set up the Database

```powershell
# Load schema (tables, trigger, procedure, view, indexes)
Get-Content database\schema.sql | mysql -u root "-pYOUR_PASSWORD"

# Load seed data (10 users, 10 gigs, 10 orders, reviews)
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
node src/index.js
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

### Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/categories` | — | All categories |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/orders` | Client | Place order (calls `place_order` stored proc) |
| `GET` | `/api/orders` | JWT | Orders (role-filtered) |
| `GET` | `/api/orders/:id` | JWT | Single order detail |
| `PATCH` | `/api/orders/:id/status` | JWT | Update order status |

### Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/reviews/:order_id` | Client | Submit review (fires `after_review_insert` trigger) |
| `GET` | `/api/reviews/gig/:gig_id` | — | Reviews for a gig |

### Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/dashboard` | JWT | Role-aware dashboard data |

---

## 📁 Project Structure

```
NexusBase/
│
├── 📂 database/
│   ├── schema.sql          # Full DDL — 8 tables, trigger, proc, view, indexes
│   └── seed.sql            # 10 users, 10 gigs, 10 orders, payments, reviews
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
│   │       ├── gigs.js         # CRUD + browse with search/filter
│   │       ├── categories.js   # lookup list
│   │       ├── orders.js       # place_order proc + status transitions
│   │       ├── reviews.js      # triggers avg_rating update
│   │       └── dashboard.js    # aggregated role-aware data
│   ├── index.js                # Express app entry
│   ├── .env                    # DB + JWT config
│   └── package.json
│
├── 📂 frontend/
│   ├── app/
│   │   ├── layout.js           # Root layout + AuthProvider
│   │   ├── globals.css         # Design system (CSS vars, glassmorphism, liquid-glass)
│   │   ├── page.js             # Homepage: video hero, categories, gigs, freelancers
│   │   ├── page.module.css     # Homepage styles: video, overlays, search, pills
│   │   ├── auth/
│   │   │   ├── login/          # Login page
│   │   │   └── signup/         # Signup with role toggle
│   │   ├── gigs/
│   │   │   ├── page.js         # Browse page (search + category filter)
│   │   │   ├── [id]/           # Gig detail + order sidebar
│   │   │   │   └── edit/       # Edit gig form
│   │   │   └── new/            # Create gig form
│   │   └── dashboard/          # Role-aware dashboard
│   ├── components/
│   │   ├── Navbar.js           # Transparent-on-hero nav, blurs on scroll
│   │   ├── GigCard.js          # Gig card with star ratings
│   │   └── ReviewForm.js       # Inline star picker + comment form
│   ├── context/
│   │   └── AuthContext.js      # Global auth state via React Context
│   ├── lib/
│   │   └── api.js              # Native fetch client (JWT interceptor)
│   ├── public/
│   │   └── spaceV.mp4          # Cinematic space video for homepage hero
│   ├── .env.local              # NEXT_PUBLIC_API_URL
│   └── package.json
│
└── README.md                   # You are here
```

---

## 📝 Viva Cheat Sheet

| Question | Answer |
|----------|--------|
| **Why is USER_SKILLS a separate table?** | Many-to-many between USERS and SKILLS. Storing multiple FKs in one column violates 1NF. Junction table with composite PK (user_id, skill_id) enforces uniqueness at DB level. |
| **Why is PAYMENTS separate from ORDERS?** | Different lifecycles: payment can be refunded after order completes. Separate table avoids NULL columns, enables independent growth, and enforces 1:1 via UNIQUE(order_id). |
| **Why is REVIEWS separate from ORDERS?** | Most orders won't have reviews (sparsity). Separate table avoids NULL columns and allows review-specific features without touching ORDERS. |
| **What does the trigger do?** | After INSERT on REVIEWS, traverses REVIEWS → ORDERS → GIGS to find the freelancer, then recalculates avg_rating on USERS as AVG of all their ratings. |
| **Why use a stored procedure for placing orders?** | Atomicity — creates ORDER + PAYMENT in one transaction. If PAYMENTS insert fails, the ORDER is rolled back. DECLARE EXIT HANDLER ensures cleanup on any error. |
| **What does the `top_freelancers` view return?** | Joins USERS/GIGS/ORDERS/REVIEWS to compute total_gigs, completed_orders, calculated_avg_rating per freelancer, ordered by rating descending. |
| **Why indexes on GIGS?** | `idx_gigs_category` makes `WHERE category_id = ?` an index scan instead of full scan. `idx_gigs_title` speeds up LIKE keyword searches. |
| **Why is `amount` stored on ORDERS instead of computed from GIGS.price?** | Gig prices can change after an order is placed. We record the historical price the client agreed to at order time — intentional, documented denormalization. |
| **What is 3NF?** | Third Normal Form: every non-key column depends only on the primary key (not on other non-key columns). Our schema satisfies 3NF across all tables. |
| **How is avg_rating kept consistent?** | Database trigger fires after every review insert and recalculates avg_rating directly — no application-layer code required, consistent even with concurrent writes. |

---

*Built with ❤️ as a DBMS Capstone Project — MySQL · Node.js · Express · Next.js · JWT*
