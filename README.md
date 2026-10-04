# NexusBaseV2 - Analytical Discovery Engine

## Purpose
NexusBaseV2 is an analytical software discovery engine designed to bridge the gap between user problems and specific software capabilities. It uses a rigorous analytical flow to process technical problems, extract requirements, and evaluate software candidates based on atomic capabilities and deterministic constraints.

## Current Stage
**MVP Implementation Complete (Backend + Frontend)**
The project has successfully passed the MVP phase. We have built and integrated a full vertical slice:
- **Backend:** Node.js, Express, TypeScript. Integrated with a local Ollama instance (`qwen3:8b`) to parse problems and evaluate candidates against deterministic constraints.
- **Frontend:** React, Vite, TypeScript. Features a premium, technical, editorial UI built with `shadcn/ui` and custom Tailwind design tokens. The interface dynamically streams the analytical pipeline (Extracted Requirements, Constraints, and Evidence-backed Viable Solution Paths).

### Completed Features
- Built a context-optimized LLM composition engine that reliably avoids hallucinations.
- Strict schema enforcement via runtime validation.
- Responsive, aesthetic UI with perfect Markdown rendering for capabilities and code snippets.
- Deterministic constraint checking independent of LLM reasoning.

### Next Steps
- Implement the actual MySQL Database schema and persistence layer.
- Expand the entity and capabilities dataset.
- Refine ranking algorithms and performance.

## Project Scope
NexusBaseV2 is a clean rebuild designed around modular architecture, strict separation of concerns, and verifiable outputs. It explicitly avoids generic "AI chatbot" paradigms in favor of a trustworthy, evidence-based user experience.
