---
name: dependency-management
description: >-
  Use this skill to managing packages, updates, security of dependencies. Do not use for other responsibilities.
---

# Dependency Management

## Execution Guidelines
1. **Justification**: Require strict justification before adding any new NPM package.
2. **Evaluation**: Evaluate package quality, bundle size impact, and security history.
3. **Duplication**: Avoid duplicate libraries (e.g., don't add `moment` if `date-fns` is already used).
4. **Documentation**: Document meaningful dependency decisions in the project documentation.
