---
name: frontend-development
description: >-
  Use this skill to implementation of React/Vite/TypeScript frontend. Do not use for other responsibilities.
---

# Frontend Development

## Execution Guidelines
1. **Stack**: Implement using React, Vite, and TypeScript. **Do NOT use Next.js, SSR frameworks, or server components.**
2. **Vercel Best Practices**: Explicitly delegate React rendering, performance, and composition guidance to `vercel-react-best-practices`.
3. **Organization**: Structure components by feature domain, not just strictly by file type (e.g., grouping hooks/components/utils per feature).
4. **Strict Typing**: Enforce strict TypeScript interfaces for all props and state.
5. **API Separation**: Isolate all backend API calls into dedicated API client layers or custom hooks.
6. **State Handling**: Implement robust loading, error, and empty states for all async operations.
7. **Modularity**: Avoid giant monolithic components. Break them down.
