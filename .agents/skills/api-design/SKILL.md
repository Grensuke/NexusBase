---
name: api-design
description: >-
  Use this skill to API contracts, resources, responses, errors, pagination, versioning, etc.. Do not use for other responsibilities.
---

# Api Design

## Execution Guidelines
1. **REST Conventions**: Design strictly RESTful endpoints. Use proper HTTP methods (GET, POST, PUT, PATCH, DELETE) and noun-based URLs.
2. **Status Codes**: Return semantically correct HTTP status codes (200, 201, 400, 401, 403, 404, 500).
3. **Consistency**: Maintain a predictable request and response envelope structure across all endpoints.
4. **Error Structure**: Return a standardized JSON error format containing error codes and human-readable messages.
5. **Data Handling**: Implement standardized pagination, filtering, and sorting for list endpoints.
6. **Boundaries**: Clearly define authentication and authorization boundaries per endpoint.
7. **Versioning**: Plan for a clean API versioning strategy (e.g. `/api/v1/`).
