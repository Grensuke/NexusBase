---
name: project-rules
description: Core principles and project-wide rules for NexusBaseV2
trigger: always_on
---

# NexusBaseV2 Project Rules

## Core Principles
1. **Clean Rebuild**: NexusBaseV2 is a completely new codebase.
2. **No Legacy Code**: Never copy old NexusBase implementation code. Reuse only product/domain ideas and lessons learned.
3. **Planning Required**: Do not start coding major features without a proper implementation plan.
4. **Separation of Concerns**: Keep frontend (React/Vite/TypeScript), backend (Node.js/Express/TypeScript), and database (MySQL) responsibilities strictly separated.
5. **Simplicity**: Prefer simple, modular architecture over unnecessary complexity.
6. **Maintainability**: Avoid giant files and tightly coupled modules.
7. **Dependency Discipline**: Do not introduce dependencies without a clear, justified reason.
8. **Verification**: Validate and test changes before considering them complete. Never claim a task is complete without verification.
9. **Security First**: Security must be considered throughout implementation.
10. **Documentation**: Keep documentation synchronized with meaningful architectural changes.
11. **Clean History**: Maintain a clean, logical Git history.
12. **No Premature Optimization**: Avoid premature optimization and unnecessary infrastructure.
13. **Technology Limits**: Do not introduce microservices, Kubernetes, event-driven architecture, CQRS, or other heavyweight patterns unless a later requirement genuinely justifies them.

## Verification Requirements
Always verify your work before concluding the task. Run the necessary checks, review the code, and ensure adherence to these rules.
