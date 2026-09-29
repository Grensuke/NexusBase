---
name: authentication-authorization
description: >-
  Use this skill to identity, sessions/tokens, roles, permissions, ownership. Do not use for other responsibilities.
---

# Authentication Authorization

## Execution Guidelines
1. **Separation**: Distinguish between Authentication (who the user is) and Authorization (what they can do).
2. **Middleware First**: Protect endpoints using dedicated Express middleware, keeping authorization checks out of arbitrary route handlers.
3. **Role-Based Access**: Implement clear role and permission matrices (delegate matrix logic to `rbac-permissions-builder`).
4. **Ownership**: Enforce strict data ownership checks (e.g., User A cannot modify User B's resource).
5. **Session/Tokens**: Implement secure session or JWT token handling, respecting HTTP-only cookies where applicable.
