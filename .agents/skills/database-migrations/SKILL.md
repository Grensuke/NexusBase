---
name: database-migrations
description: >-
  Use this skill to safe, repeatable schema evolution. Do not use for other responsibilities.
---

# Database Migrations

## Execution Guidelines
1. **Version Control**: Every schema change must be represented as a versioned, repeatable migration script.
2. **Safety**: Never manually edit the production schema outside of the migration system.
3. **Forward-Safe**: Design migrations to be forward-safe (e.g., add columns before dropping old ones during transitions).
4. **Rollbacks**: Always consider the rollback strategy (down migrations) when writing a new migration.
5. **Synchronization**: Keep the schema definition and migrations perfectly synchronized.
