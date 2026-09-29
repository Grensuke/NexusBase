---
name: database-development
description: >-
  Use this skill to SQL implementation, queries, transactions, database interactions. Do not use for other responsibilities.
---

# Database Development

## Execution Guidelines
1. **SQL Discipline**: Write clear, predictable SQL or use an approved query builder strictly avoiding arbitrary raw strings.
2. **Parameterization**: Always use parameterized queries to prevent SQL injection.
3. **Transactions**: Use database transactions for all multi-step mutations to guarantee atomicity.
4. **Connection Management**: Handle database connections/pools responsibly.
5. **Query Organization**: Keep database interaction code isolated (e.g., in Repositories or Data Access Objects), explicitly separated from business logic.
