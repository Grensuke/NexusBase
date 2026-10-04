# NexusBaseV2 - Detailed Project Context & Development History

This document serves as the absolute source of truth for the NexusBaseV2 project's current state, historical context, architectural decisions, and immediate next steps. It is specifically formatted to provide context to LLM assistants (like ChatGPT or Claude) acting as planning or implementation partners.

## 1. Project Overview & Identity
**NexusBaseV2** is a rigorous analytical discovery engine designed to bridge the gap between user problems and specific software capabilities. It is a completely new codebase built from scratch (clean rebuild, strictly no legacy code).

The core product experience follows a strict, verifiable analytical flow:
`User problem → Problem understanding → Requirements → Solution discovery → Candidate evaluation → Evidence → Trade-offs → Viable solution paths`

**Product Tone & Aesthetic:**
It is **NOT** a generic AI chatbot wrapper, nor a cookie-cutter SaaS dashboard. It must feel:
- Premium, intelligent, technical, calm, precise, editorial, trustworthy, and research-oriented.
- Highly intentional, using structural whitespace, asymmetric/editorial split-pane layouts, and a refined geometric sans-serif + precise monospace font pairing.

## 2. Verified Architecture & Tech Stack
- **Backend:** Node.js, Express, TypeScript.
- **Frontend:** React, Vite, TypeScript. (Strictly Client-Side SPA. **Next.js and SSR are explicitly forbidden**).
- **Database:** MySQL (schema planning stage).
- **UI Components & Styling:** `shadcn/ui` and Tailwind CSS.
- **AI / LLM Integration:** Local Ollama running `qwen3:8b` via an OpenAI-compatible REST endpoint (`http://localhost:11434/v1/chat/completions`).

## 3. Detailed Development History: What We Have Accomplished

### Phase 1: Data Pipeline & Benchmarking (The `validation/` directory)
Before building the product, we constructed a strict validation pipeline to prove the concept:
1. **Source Blocking & Evidence:** We artificially limited raw document source text from direct semantic retrieval to force strict "atomic capability" mapping. We enforce tracking exact capability extraction evidence for provenance (zero hallucinated evidence).
2. **Capability Extraction & Normalization:**
   - Evaluated chunking vs. full-document extraction due to `qwen3:8b` context limitations.
   - Introduced the concept of "Atomic Capabilities" mapping to a "Capability Family". Deduplication must be deterministic.
   - Built a quality gate (`stage3_1_quality_gate.py`) to aggressively drop marketing noise.
3. **Benchmark v0.1 & v0.2 Execution:**
   - Ran 15 standardized scenarios against the capability pipeline.
   - Identified and handled `INFRASTRUCTURE_BLOCKED` errors.
   - **Key Findings (v0.2):** Candidate Discovery/Retrieval is the primary bottleneck. Feeding massive context payloads to `qwen3:8b` caused severe hallucinations. We proved that Candidate Retrieval must be separated from pure LLM reasoning.

### Phase 2: Backend MVP Implementation (`backend/` directory)
We implemented a working backend vertical slice (`POST /api/discover`):
1. **Context Optimization:** Replaced massive entity payloads with a compact "candidate-card architecture" (dropping context size from 20,000+ chars down to ~4,800 chars), stabilizing the LLM.
2. **LLM Schema Enforcement & Robustness:**
   - Initially, the LLM returned malformed JSON (e.g., omitting arrays like `capability_ids` when empty), causing TypeScript crashes (`TypeError: Cannot read properties of undefined`).
   - **The Fix:** We rewrote the prompt schema to enforce a flat, canonical JSON structure: `{"selected_candidates": [{"entity_id": "...", "requirements_covered": [...], "capability_ids": [...]}]}`.
   - **Defensive Boundary:** Added a runtime validation layer in `compositionService.ts`. If the LLM hallucinates IDs or breaks schema, the composition engine intercepts it, marking the path as `LLM_OUTPUT_INVALID` and failing gracefully rather than crashing.
3. **Deterministic Constraints & Evidence:**
   - Constraint checks (e.g., "offline", "local") use deterministic keyword heuristics against raw evidence. Hard assertions are kept away from the LLM.
   - **Tests A, B, and C** (End-to-End API tests) now pass flawlessly, returning true viable solution paths with zero TypeScript crashes and zero hallucinated entities.

### Phase 3: Frontend Skill Audit & UI/UX Preparation
Before writing any React code, we strictly audited the AI agent skill stack to ensure premium output:
1. **Skill Inventory & Pruning:** 
   - Audited the local `.agents/skills` directory.
   - Retained project-specific rule skills (`frontend-development`, `design-system`, `ui-ux-design`) and standard implementation tools (`shadcn`, `vercel-react-best-practices`).
2. **UI/UX Pro Max Update:** 
   - We identified our local `ui-ux-pro-max` skill was a stale Claude export. We updated it to the latest Antigravity-native build (v2.13.0) to serve as our primary Design Intelligence engine.
3. **Rejection of "AI Slop" Aesthetics:**
   - Evaluated the Vercel `frontend-design` skill but explicitly rejected it because it promotes maximalist chaos, noise textures, and generic generative-AI designs that conflict with NexusBase's required calm, analytical, and editorial UI.
4. **Responsibility Map Established:**
   - **Design Intelligence** → `ui-ux-pro-max` (visual direction, tokens).
   - **Component Architecture** → `shadcn` + `design-system`.
   - **Implementation** → `frontend-development` (strict React+Vite SPA).
   - **Performance & Audits** → `vercel-react-best-practices` (ignoring Next.js rules) + `accessibility` + `web-design-guidelines`.

### Phase 4: Frontend Execution & UI Integration (`frontend/` directory)
We successfully built the React/Vite SPA and integrated it with the backend MVP:
1. **Design System:** Generated custom Tailwind tokens using `ui-ux-pro-max`, establishing a premium, calm, editorial aesthetic (Slate/Zinc monochrome with Indigo primary accents).
2. **Component Architecture:** Initialized `shadcn/ui`. Replaced buggy custom scrollbar components with native `overflow-y-auto` for bulletproof responsiveness.
3. **Data Binding & Typography:** 
   - Wired the `/api/discover` endpoint to the React state.
   - Built an asymmetrical split-pane layout displaying requirements (left) and evidence-backed paths (right).
   - Integrated `react-markdown`, `remark-gfm`, and `remark-breaks` to perfectly render LLM capabilities, ensuring code snippets and tables maintain strict monospace technical formatting without layout gaps or raw string artifacts.
   - Fine-tuned typography (removed ALL-CAPS headers, compressed line heights in code blocks, colored constraint badges).

## 4. Exact Design Target Requirements
The interface must adhere to the following visual constraints:
- **Typography:** A highly legible, geometric sans-serif (e.g., Inter, Geist, Roboto) paired with a precise monospace (e.g., Geist Mono, JetBrains Mono) for capabilities, code, and JSON output.
- **Color Strategy:** A calm, monochrome foundation (Slate or Zinc) with a single, deliberate accent color (e.g., subdued indigo or deep teal). Accent colors are reserved strictly for "Verified/Matched" states and primary actions. NO purple AI gradients.
- **Layout:** Asymmetric, editorial split-pane. 
  - *Left Side:* The user problem and extracted requirements.
  - *Right Side:* Retrieved solutions, atomic evidence, and deterministic constraint checks dynamically populating as the backend streams or responds.
- **Components:** Minimalist styling. 1px borders with low contrast. No heavy drop-shadows. Status indicators (SATISFIED/VIOLATED) use subtle outline badges or icons rather than saturated background fills.
- **Motion:** Purposeful and calm. Standard fade-ins and layout shifts. No bouncy spring physics, meaningless animations, or decorative effects that reduce clarity.

## 5. What We Are Planned to Do Next
We have successfully completed the Backend MVP and the Frontend Execution Phase. The next major objective is the Database & Persistence Layer:

1. **Database Schema Design (MySQL):** 
   - Model the entities, capabilities, and constraints for persistent storage.
   - Ensure the database design maps perfectly to our existing TypeScript interfaces and the "candidate-card architecture".
2. **Backend Persistence Integration:**
   - Connect the Express backend to MySQL.
   - Replace the hardcoded/stubbed entities and capabilities with actual database queries.
3. **Expand Dataset:**
   - Begin importing real-world technical candidates into the database so the discovery engine can query a wider range of software solutions.
