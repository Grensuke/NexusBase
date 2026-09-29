---
name: data-integrity
description: >-
  Use this skill to constraints, transactional consistency, invariants, referential integrity. Do not use for other responsibilities.
---

# Data Integrity

## Execution Guidelines
1. **Database Constraints**: Push referential integrity and constraint checks (NOT NULL, FKs, Checks) down to the MySQL database layer.
2. **Domain Invariants**: Enforce complex business logic invariants in the Application (Service) layer.
3. **Transactional Consistency**: Prevent impossible states by wrapping dependent operations in ACID transactions.
4. **Orphan Records**: Design cascading deletes or soft-deletes carefully to prevent data orphans.
