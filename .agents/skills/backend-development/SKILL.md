---
name: backend-development
description: >-
  Use this skill to implementation of Node/Express/TypeScript backend. Do not use for other responsibilities.
---

# Backend Development

## Execution Guidelines
1. **Stack**: Implement exclusively using Node.js, Express, and TypeScript.
2. **Layered Architecture**: Enforce a strict separation of concerns using Controllers (transport layer), Services (business logic), and Repositories (database access).
3. **Routing**: Avoid giant route files; organize routes by feature or resource domain.
4. **Middleware Boundaries**: Use Express middleware strictly for cross-cutting concerns (auth, validation, error handling), not business logic.
5. **Configuration**: Handle environment variables cleanly and inject them at startup.
6. **Simplicity**: Do not introduce microservices or external message brokers.
