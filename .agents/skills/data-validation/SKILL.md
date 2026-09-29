---
name: data-validation
description: >-
  Use this skill to input/schema validation and validation boundaries. Do not use for other responsibilities.
---

# Data Validation

## Execution Guidelines
1. **API Boundary**: Validate all incoming requests at the very edge of the API (controllers) before passing to services.
2. **Schema Validation**: Use robust validation libraries (e.g., Zod, Joi) to verify types and structures.
3. **Frontend Symmetry**: Ensure frontend forms validate data locally before submission to prevent unnecessary API roundtrips.
