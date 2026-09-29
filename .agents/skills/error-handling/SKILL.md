---
name: error-handling
description: >-
  Use this skill to backend/frontend error behavior and consistent error architecture. Do not use for other responsibilities.
---

# Error Handling

## Execution Guidelines
1. **Frontend**: Implement consistent React Error Boundaries to prevent entire app crashes.
2. **Backend**: Use centralized error middleware in Express to catch unhandled promise rejections and standardize error JSON.
3. **Granularity**: Distinguish between Operational errors (expected, like 404s) and Programmer errors (unexpected bugs).
