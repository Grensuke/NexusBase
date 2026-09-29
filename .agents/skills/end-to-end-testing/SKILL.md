---
name: end-to-end-testing
description: >-
  Use this skill to realistic user/system workflows. Do not use for other responsibilities.
---

# End To End Testing

## Execution Guidelines
1. **Workflows**: Define realistic user workflows for NexusBaseV2.
2. **Delegation**: Delegate the actual Playwright implementation details and browser automation methodologies to `playwright-skill`.
3. **Resilience**: Focus tests on user-visible behavior rather than fragile implementation details (e.g. test by role/text, not by CSS class).
