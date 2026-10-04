# UI/UX Skill Audit Report

## 1. Local Skill Inventory

1. **ui-ux-pro-max**
   - **Local Path:** `.agents/skills/ui-ux-pro-max`
   - **SKILL.md Exists:** Yes
   - **Name:** `ui-ux-pro-max`
   - **Description:** UI/UX design intelligence for web, mobile, and desktop...
   - **Version:** Not declared in frontmatter.
   - **Author/Source:** Not declared in frontmatter.
   - **License:** Not declared.
   - **Supporting Files:** `scripts/search.py`, `references/quick-reference.md`, `references/pro-rules.md`, and CSV datasets.
   - **Self-Contained:** Yes (includes its own datasets and Python script).
   - **Upstream Reference:** None explicit in SKILL.md.

2. **ui-ux-design**
   - **Local Path:** `.agents/skills/ui-ux-design`
   - **SKILL.md Exists:** Yes
   - **Name:** `ui-ux-design`
   - **Description:** Use this skill to user experience and visual interaction decisions.
   - **Version/Author/License:** None declared.
   - **Supporting Files:** None.
   - **Self-Contained:** Yes.
   - **Upstream Reference:** None.

3. **design-system**
   - **Local Path:** `.agents/skills/design-system`
   - **SKILL.md Exists:** Yes
   - **Name:** `design-system`
   - **Description:** Use this skill to reusable visual/component/token consistency.
   - **Version/Author/License:** None declared.
   - **Supporting Files:** None.
   - **Self-Contained:** Yes.
   - **Upstream Reference:** None.

4. **shadcn**
   - **Local Path:** `.agents/skills/shadcn`
   - **SKILL.md Exists:** Yes
   - **Name:** `shadcn`
   - **Description:** Manages shadcn components and projects.
   - **Version/Author/License:** None declared.
   - **Supporting Files:** `rules/*.md`, `cli.md`, `registry.md`, `customization.md`.
   - **Self-Contained:** Yes.
   - **Upstream Reference:** None.

5. **frontend-development**
   - **Local Path:** `.agents/skills/frontend-development`
   - **SKILL.md Exists:** Yes
   - **Name:** `frontend-development`
   - **Description:** Implementation of React/Vite/TypeScript frontend.
   - **Version/Author/License:** None declared.
   - **Supporting Files:** None.
   - **Self-Contained:** Yes.
   - **Upstream Reference:** None.

6. **web-design-guidelines**
   - **Local Path:** `.agents/skills/web-design-guidelines`
   - **SKILL.md Exists:** Yes
   - **Name:** `web-design-guidelines`
   - **Version:** `1.0.0`
   - **Author:** `vercel`
   - **License:** None declared.
   - **Supporting Files:** Relies on a remote Vercel GitHub URL for rules.
   - **Self-Contained:** No.
   - **Upstream Reference:** `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`

7. **accessibility**
   - **Local Path:** `.agents/skills/accessibility`
   - **SKILL.md Exists:** Yes
   - **Name:** `accessibility`
   - **Description:** Accessible implementation and auditing.
   - **Version/Author/License:** None declared.
   - **Supporting Files:** None.
   - **Self-Contained:** Yes.
   - **Upstream Reference:** None.

8. **vercel-react-best-practices**
   - **Local Path:** `.agents/skills/vercel-react-best-practices`
   - **SKILL.md Exists:** Yes
   - **Name:** `vercel-react-best-practices`
   - **Version:** `1.0.0`
   - **Author:** `vercel`
   - **License:** `MIT`
   - **Supporting Files:** Local rule files in `rules/`, `AGENTS.md`.
   - **Self-Contained:** Yes.
   - **Upstream Reference:** Vercel Engineering (implied).

---

## 2. UI/UX Pro Max Upstream Comparison

The upstream source (`https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`) was analyzed against the local copy:

- **Version:** Upstream `skill.json` declares **v2.13.0**. The local copy has no version tracking.
- **Content & Support:** Upstream natively supports 19+ platforms via distinct templates (including an `antigravity.json` build profile). The local `SKILL.md` hardcodes `python "${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/scripts/search.py"`.
- **Workflow & Execution:** The local copy's hardcoded execution path is configured exclusively for a Claude desktop environment. Running this inside Antigravity (which uses `.gemini` paths) will fail unless the agent manually rewrites the bash commands.
- **Conclusion:** **`LOCAL_OUTDATED`** (and incorrectly configured for the current agent platform).

---

## 3. Provenance Findings

Based on file contents, references to `NexusBaseV2`, and ecosystem patterns:

- **ui-ux-pro-max:** B. Community/open-source project (Specifically, an outdated Claude-formatted export).
- **ui-ux-design:** D. Project-customized copy (Explicitly mentions `NexusBaseV2`).
- **design-system:** D. Project-customized copy (Explicitly mentions `NexusBaseV2`).
- **shadcn:** B. Community/open-source project (Standard extensive skill structure).
- **frontend-development:** D. Project-customized copy (Explicitly prohibits Next.js/SSR based on NexusBase architecture).
- **web-design-guidelines:** C. Vercel/official ecosystem (Author is Vercel, fetches from vercel-labs).
- **accessibility:** D. Project-customized copy (A short 6-rule list).
- **vercel-react-best-practices:** C. Vercel/official ecosystem (Author is Vercel).

---

## 4. Overlap Analysis

### Complementary Workflows
- `ui-ux-design` acts as a routing/delegation skill. Instead of holding design tokens, it explicitly instructs the agent to use `ui-ux-pro-max` for design systems and `web-design-guidelines` for broad audits.
- `design-system` sets the conceptual rule (use strict visual tokens), and `shadcn` provides the mechanical enforcement and CLI instructions to implement them.
- `accessibility` enforces a strict baseline (e.g., semantic HTML, ARIA limits) during implementation, while `web-design-guidelines` provides post-implementation automated auditing.

### Redundant / Conflicting Instructions
- **React vs Next.js Conflict:** `frontend-development` explicitly dictates a strict React/Vite/TS stack and forbids Next.js, SSR, and server components. However, it delegates performance optimization to `vercel-react-best-practices`, which is heavily geared towards Next.js App Router (e.g., `server-*` prefix rules, RSC, Server Actions). The agent must intentionally ignore the Server/Next.js rules in the Vercel skill to satisfy `frontend-development`.

---

## 5. Recommended Skill Stack Workflow for NexusBase

Based on the audit, Antigravity should operate the NexusBase frontend using this hierarchy:

- **PRIMARY DESIGN INTELLIGENCE:** 
  - Consult `ui-ux-pro-max` (via its search script) to generate the initial visual direction, typography, and color palettes.
- **UX / INTERACTION:** 
  - Follow `ui-ux-design` to enforce modern, clean UX, deferring to the Pro Max output.
- **DESIGN SYSTEM / COMPONENTS:** 
  - Enforce `design-system` consistency by building exclusively with `shadcn`. Use `shadcn` rules for layout composition and styling variants rather than raw Tailwind overrides.
- **IMPLEMENTATION:** 
  - Follow `frontend-development` to build a strict Client-Side SPA using React/Vite, isolating API calls.
- **REACT PERFORMANCE:** 
  - Apply client-side optimization rules (`client-*`, `rerender-*`, `js-*`) from `vercel-react-best-practices`, strictly ignoring its Next.js/SSR rules.
- **ACCESSIBILITY / REVIEW:** 
  - Write semantic markup using `accessibility`, then run `web-design-guidelines` for a final interface audit.

---

## 6. NexusBase Preliminary Design Direction

To communicate *"problem → understanding → solutions → evidence → trade-offs"* with a premium, technical, and calm aesthetic:

- **Typography:** A highly legible, geometric sans-serif (e.g., Inter, Geist) for general UI, paired with a precise monospace (e.g., Geist Mono, JetBrains Mono) for capabilities, evidence snippets, and JSON output.
- **Color Strategy:** A calm, monochrome foundation (Slate or Zinc) with a single, deliberate accent color (e.g., subdued indigo or deep teal). Accent colors are reserved strictly for "Verified/Matched" states and primary actions. Avoid generic gradient washes.
- **Layout:** An editorial split-pane or asymmetric structure. Problem and extracted requirements on one side; retrieved solutions, evidence, and deterministic checks dynamically populating on the other. 
- **Components:** Minimalist styling. Use 1px borders with low contrast. No heavy drop-shadows or flashy neon effects. Status indicators (e.g., SATISFIED/VIOLATED) should use subtle outline badges or icons rather than saturated background fills.
- **Motion:** Purposeful and calm. Standard fade-ins and layout shifts (e.g., `auto-animate`) to gently introduce new candidates. No bouncy spring physics or decorative staggering.

---

## 7. Installation / Update Recommendation

**Decision:** **B. UI/UX Pro Max should be updated.**

- **Exact Reason:** The current local copy is hardcoded for Claude Desktop (`${CLAUDE_PLUGIN_ROOT}/.claude/...`). Executing it in the Antigravity IDE requires path manipulation. The upstream repository explicitly supports an `antigravity` build which correctly scopes paths and instructions for the `.gemini` environment.
- **Exact Upstream Source:** `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`
- **Risk to Current Project-Local Setup:** **Low.** 
- **Modifications Lost:** None. The local `ui-ux-pro-max` folder contains no NexusBase-specific data; it is an unmodified, but stale and incorrectly targeted, export.

## 8. Conclusion
The skill stack is well-architected with clear delegation from project-specific rules to general libraries. The only action required before frontend implementation is updating `ui-ux-pro-max` to the Antigravity-native build and ensuring the agent filters out Next.js-specific rules from the Vercel performance skill.

*(End of Audit - No frontend changes or installations have been made)*
