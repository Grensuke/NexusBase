# 📚 NexusBase — Team Viva Notes

> **How to use this file:** Read from top to bottom before your viva. Every section builds on the previous one. No prior DB experience assumed.

---

## 1. What Did We Build?

**NexusBase** is a website where:
- **Freelancers** post services called **Gigs** (e.g. "I will design your logo for $50")
- **Clients** browse those gigs and place **Orders**
- After the work is done, clients **pay** and leave a **Review**

Think of it like a simpler version of **Fiverr**.

### The 3 layers of the project

```
User's Browser  ──────►  Next.js Website (Frontend)
                               │
                               │ talks to
                               ▼
                         Express API (Backend)
                               │
                               │ reads/writes
                               ▼
                         MySQL Database
```

---

## 2. The Database — 8 Tables Explained Simply

### Why 8 tables? Why not just 1 or 2?

Because we follow **normalization rules** — each table should store information about ONE thing only.
Mixing everything into one table causes:
- Repeated data (e.g. writing the user's name 100 times for 100 orders)
- Update problems (change name in one row but miss others)
- Impossible queries (find all freelancers who know "React")

---

### Table 1: USERS

Stores every person on the platform.

```
user_id | name        | email             | role       | avg_rating
--------|-------------|-------------------|------------|----------
1       | Alex Rivera | alex@nexus.dev    | freelancer | 5.00
6       | Emma Clark  | emma@client.dev   | client     | NULL
```

**Key decisions:**
- `role` is either `'client'` or `'freelancer'` — one table for both (simpler than two separate tables)
- `avg_rating` is cached here and auto-updated by a **trigger** (explained later)

---

### Table 2: SKILLS

A simple lookup list of skills.

```
skill_id | skill_name
---------|----------
1        | React
2        | Python
3        | Photoshop
```

---

### Table 3: USER_SKILLS (Junction Table)

Links freelancers to their skills. This exists because of a **many-to-many relationship**:

- One freelancer → many skills
- One skill → many freelancers

```
user_id | skill_id
--------|--------
1       | 1         ← Alex knows React
1       | 2         ← Alex knows Python
2       | 1         ← Sofia also knows React
```

**Why not store skills as "React, Python" in a single column?**
That would violate **First Normal Form (1NF)** — columns must store single values, not lists.
You also couldn't search "find all React developers" efficiently.

---

### Table 4: CATEGORIES

```
category_id | category_name
------------|------------------
1           | Web Development
2           | Graphic Design
3           | Video Editing
```

**Why separate?** If we rename "Web Dev" → "Web Development", we change ONE row here, not every gig.

---

### Table 5: GIGS

A freelancer's service listing.

```
gig_id | freelancer_id | category_id | title                    | price  | delivery_days
-------|--------------|-------------|--------------------------|--------|-------------
1      | 1            | 1           | I will build a React app | 150.00 | 7
```

- `freelancer_id` is a **Foreign Key** → links to `USERS.user_id`
- `category_id` is a **Foreign Key** → links to `CATEGORIES.category_id`

---

### Table 6: ORDERS

When a client buys a gig, an order is created.

```
order_id | gig_id | client_id | status      | amount | order_date
---------|--------|-----------|-------------|--------|----------
1        | 1      | 6         | completed   | 150.00 | 2025-01-10
```

**Status lifecycle:**
```
pending  →  in_progress  →  completed
                         →  cancelled
```

**Why store `amount` here instead of reading from GIGS.price?**
Prices change over time. The order must record what the client **actually agreed to pay** when they placed it.
This is called **intentional denormalization**.

---

### Table 7: PAYMENTS (separate from ORDERS — 1:1 relationship)

```
payment_id | order_id | amount | method | status
-----------|----------|--------|--------|----------
1          | 1        | 150.00 | card   | completed
```

**Why not just add these columns to ORDERS?**

| Reason | Plain English |
|--------|--------------|
| Different lifecycle | An order can be "completed" but payment can be "refunded" — they change independently |
| Avoids NULL columns | Cancelled orders would have empty payment columns — messy |
| Future-proof | Payment systems grow: retry logic, invoices, partial refunds |
| DB-level guarantee | `UNIQUE(order_id)` means only ONE payment per order, enforced by MySQL itself |

---

### Table 8: REVIEWS (separate from ORDERS — 1:1 relationship)

```
review_id | order_id | rating | comment          | review_date
----------|----------|--------|------------------|----------
1         | 1        | 5      | Excellent work!  | 2025-01-15
```

**Why not add rating/comment columns to ORDERS?**

| Reason | Plain English |
|--------|--------------|
| Sparsity | Most rows would be NULL (not every order gets a review) |
| Independence | Reviews can have extra features (flagging, replies) without changing ORDERS |
| DB-level guarantee | `UNIQUE(order_id)` prevents submitting two reviews for the same order |

---

## 3. The Three Big DBMS Features

### 🔁 Feature 1: TRIGGER

**Name:** `after_review_insert`

**When does it fire?** Automatically, every time someone inserts a new row into the REVIEWS table.

**What does it do?**
1. Finds which freelancer the review is about (by tracing: REVIEWS → ORDERS → GIGS → freelancer)
2. Calculates the average of all that freelancer's ratings
3. Updates `avg_rating` on the USERS table

**Why is this useful?**
Without the trigger, you'd need to call a "recalculate rating" function in your code every time. With the trigger, MySQL does it automatically — even if someone inserts a review directly into the database.

**Simple analogy:**
> It's like an automatic scoreboard that updates itself the moment a player scores — you don't have to update it manually.

**Verify it works:**
```
http://localhost:5000/api/users/top/freelancers
→ Returns avg_rating values that were calculated by the trigger
```

---

### 📦 Feature 2: STORED PROCEDURE

**Name:** `place_order`

**What is a stored procedure?**
A saved SQL program stored inside MySQL that you can call by name. Like a function, but in the database.

**What does `place_order` do?**
```
Input:  gig_id, client_id, amount, payment_method
Output: the new order_id

Steps (inside a TRANSACTION):
  1. Check the gig exists (if not → throw error)
  2. INSERT into ORDERS
  3. INSERT into PAYMENTS (linked to the new order)
  4. If anything fails → ROLLBACK (undo everything)
  5. If all succeeds → COMMIT
```

**Why a transaction?**
Imagine step 2 succeeds (order created) but step 3 fails (payment not created).
You'd have an orphaned order with no payment record — corrupt data.
The transaction ensures **both succeed or both fail together**.

**Simple analogy:**
> It's like a vending machine — you put in money AND select an item together. If something goes wrong, you get your money back. You never lose money without getting the item.

**Called from:** `POST /api/orders` in the backend

---

### 👁️ Feature 3: VIEW

**Name:** `top_freelancers`

**What is a view?**
A virtual table. It's not stored on disk with actual data — it's a saved SQL query that you can use like a table.

**What does it show?**
```sql
SELECT * FROM top_freelancers;
```
Returns for each freelancer:
- Their name and bio
- How many gigs they have
- How many completed orders
- Their average rating

**Why useful?**
Instead of writing a long JOIN query every time you want the leaderboard, you just query the view.
The view also ensures everyone on the team uses the same query logic.

**Accessed at:** `GET /api/users/top/freelancers`

---

### 📈 Feature 4: INDEXES

**What is an index?**
A lookup structure MySQL builds on a column to make searches faster.
Without an index, MySQL reads every single row to find matches.
With an index, it jumps directly to the right rows.

**Our indexes:**
```sql
CREATE INDEX idx_gigs_category ON GIGS(category_id);
CREATE INDEX idx_gigs_title    ON GIGS(title);
```

| Index | Helps with |
|-------|-----------|
| `idx_gigs_category` | Filtering gigs by category on the browse page |
| `idx_gigs_title` | Searching gigs by keyword |

**Simple analogy:**
> Without an index: finding a word in a book by reading every page.
> With an index: finding a word using the index at the back of the book.

---

## 4. Key Concepts Your Examiner Will Ask About

### Normal Forms

| Form | Rule | Our schema |
|------|------|-----------|
| **1NF** | No repeating groups, atomic values only | ✅ Skills stored in USER_SKILLS, not a comma-list |
| **2NF** | No partial dependencies on composite key | ✅ All non-key columns depend on the full PK |
| **3NF** | No transitive dependencies | ✅ No non-key column depends on another non-key column |

---

### Foreign Keys

A **Foreign Key** is a column in one table that references the Primary Key of another table.

```
ORDERS.gig_id  ──────► GIGS.gig_id        (you can't order a gig that doesn't exist)
ORDERS.client_id ────► USERS.user_id      (you can't order as a user that doesn't exist)
GIGS.freelancer_id ──► USERS.user_id      (every gig must belong to a real user)
REVIEWS.order_id ────► ORDERS.order_id    (reviews must link to a real order)
PAYMENTS.order_id ───► ORDERS.order_id    (payments must link to a real order)
```

If you try to insert an order for a gig_id that doesn't exist, MySQL will **reject** the insert. This is referential integrity.

---

### 1:1 Relationships

PAYMENTS and REVIEWS both have a `UNIQUE(order_id)` constraint.
This means: **one order can only have one payment** and **one order can only have one review**.

The database enforces this — not just the application code.

---

### JWT Authentication

**JWT = JSON Web Token**

1. User logs in with email + password
2. Backend checks password hash (bcrypt) against the database
3. If correct, backend sends back a **token** (a long encoded string)
4. Frontend stores the token in localStorage
5. Every future API request includes the token in the header
6. Backend verifies the token to know who the user is and their role

**No session stored on the server** — the token itself contains the user info. This is called **stateless auth**.

---

## 5. The Order Lifecycle (Step-by-Step)

```
CLIENT                     BACKEND                    DATABASE
  │                           │                           │
  │── POST /api/orders ──────►│                           │
  │                           │── CALL place_order() ────►│
  │                           │                           │── INSERT ORDERS
  │                           │                           │── INSERT PAYMENTS
  │                           │                           │── COMMIT
  │◄── { order_id: 5 } ──────│◄── order_id returned ─────│
  │                           │                           │
  │                      [Freelancer logs in]             │
  │                           │                           │
  │── PATCH /orders/5/status ►│                           │
  │   { status: in_progress } │── UPDATE ORDERS ─────────►│
  │◄── 200 OK ───────────────│                           │
  │                           │                           │
  │── PATCH /orders/5/status ►│                           │
  │   { status: completed }   │── UPDATE ORDERS ─────────►│
  │◄── 200 OK ───────────────│── UPDATE PAYMENTS ────────►│
  │                           │                           │
  │── POST /api/reviews/5 ───►│                           │
  │   { rating: 5, comment }  │── INSERT REVIEWS ────────►│
  │                           │                           │◄── TRIGGER FIRES
  │                           │                           │    UPDATE avg_rating
  │◄── 201 Created ───────── │                           │
```

---

## 6. Quick Q&A for the Viva

**Q: What is the difference between a stored procedure and a trigger?**
> A **stored procedure** is called explicitly by your code when needed. A **trigger** fires automatically when a specific database event happens (INSERT/UPDATE/DELETE), with no code needed to call it.

**Q: Why did you use a stored procedure specifically for placing orders?**
> Because placing an order requires two inserts (ORDERS and PAYMENTS) that must both succeed or both fail. A stored procedure wraps them in a transaction, guaranteeing atomicity.

**Q: What happens if the PAYMENTS insert fails inside the stored procedure?**
> The `DECLARE EXIT HANDLER FOR SQLEXCEPTION` catches the error, executes `ROLLBACK`, and the ORDERS insert is also undone. No partial data is saved.

**Q: Why is USER_SKILLS a separate table and not just a column in USERS?**
> A freelancer has many skills and a skill belongs to many freelancers — this is a many-to-many relationship. You cannot represent this with a single column without violating 1NF. The USER_SKILLS junction table resolves it into two one-to-many relationships.

**Q: What does the trigger update and when?**
> After every INSERT into REVIEWS, it updates the `avg_rating` column on the USERS table for the freelancer who owns the reviewed gig. It traces: REVIEWS → ORDERS → GIGS → freelancer_id.

**Q: What is the `top_freelancers` view and when is it used?**
> It's a saved SQL query (a virtual table) that joins USERS, GIGS, ORDERS, and REVIEWS to show a leaderboard of freelancers with their stats. It's used on the homepage and the API endpoint `/api/users/top/freelancers`.

**Q: Why does ORDERS store `amount` instead of joining to GIGS.price?**
> Intentional denormalization. Gig prices can change over time. The order must permanently record the price the client agreed to when placing the order. Joining to the current price would give wrong historical data.

**Q: What is referential integrity?**
> It's a guarantee that foreign key values always point to a valid row in the referenced table. MySQL enforces this — you can't create an order for a gig that doesn't exist.

**Q: What is 3NF?**
> Third Normal Form: every non-key column must depend only on the primary key — not on other non-key columns. Our schema satisfies 3NF because no column depends transitively on another non-key column.

**Q: Why use JWT instead of sessions?**
> JWT is stateless — the server doesn't store session data. The token itself contains the user's ID and role. This scales better because any server can verify the token without checking a session database.

**Q: How does bcrypt work?**
> bcrypt hashes the password with a random salt and a configurable cost factor. Even if two users have the same password, their hashes are different. You can't reverse a bcrypt hash to get the original password — you can only verify by hashing the input and comparing.

**Q: What indexes did you create and why?**
> `idx_gigs_category` on GIGS(category_id) — speeds up browsing gigs by category (most common filter). `idx_gigs_title` on GIGS(title) — speeds up keyword search. Without these, MySQL would do a full table scan for every search.

---

## 7. File Map — Where Is What?

| If asked about... | Look in this file |
|-------------------|------------------|
| All table definitions | `database/schema.sql` |
| Trigger code | `database/schema.sql` (search: `after_review_insert`) |
| Stored procedure | `database/schema.sql` (search: `place_order`) |
| View definition | `database/schema.sql` (search: `top_freelancers`) |
| Sample data | `database/seed.sql` |
| Login / Signup API | `backend/src/routes/auth.js` |
| Placing an order | `backend/src/routes/orders.js` |
| JWT middleware | `backend/src/middleware/auth.js` |
| Database connection | `backend/src/config/db.js` |
| Frontend pages | `frontend/app/` |
| API calls from browser | `frontend/lib/api.js` |
| Environment config | `backend/.env` |

---

## 8. Start the Project (For Team Members)

```powershell
# Step 1: Load the database (one-time setup)
Get-Content database\schema.sql | mysql -u root "-pGreninja@143"
Get-Content database\seed.sql   | mysql -u root "-pGreninja@143"

# Step 2: Start the backend (Terminal 1)
cd backend
node src/index.js
# Should print: ✅ NexusBase API running on http://localhost:5000

# Step 3: Start the frontend (Terminal 2)
cd frontend
node node_modules/next/dist/bin/next dev --webpack
# Should print: ✓ Ready in ~900ms — http://localhost:3000
```

**Demo login** (password for all: `Password123!`)
- Freelancer: `alex@nexus.dev`
- Client: `emma@client.dev`

---

*NexusBase Team — DBMS Capstone Project*
