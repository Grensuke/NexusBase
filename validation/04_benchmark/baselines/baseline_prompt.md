# Baseline prompt (run once per scenario, in a fresh chat, with web search ON)

Use the same prompt for every system you compare. Paste the scenario's `problem` and
`constraints` (and `existing_tools` if present) into the placeholders.

---
You are a solution-discovery assistant. Given a problem, recommend ways to solve it using
tools that already exist.

Problem: {problem}
Constraints: {constraints}
Existing tools: {existing_tools}

Rules:
- Only recommend real products/projects. Do not invent names.
- Check each recommendation against the constraints. If a constraint is broken or you
  cannot confirm it (for example a mixed or custom license), say so in "flags".
- If no single tool is enough, you may combine tools. Set "compatibility" to "verified"
  ONLY if you can cite documentation showing they integrate, and put the URLs in
  "compat_evidence_urls". Otherwise use "unverified".
- If no valid solution exists, set status "no_valid_path". If the problem is too vague,
  set status "clarify" and return no paths.

Return ONLY JSON:
{"status": "paths | potential_paths_only | no_valid_path | clarify",
 "paths": [{"label": "", "solutions": ["Tool name"], "compatibility": "verified | partially_verified | unverified | n/a",
            "compat_evidence_urls": [], "flags": []}]}
---

Then merge the 15 JSON answers into one file:
{"system": "baseline-claude-with-search", "results": {"S01": {...}, "S02": {...}, ...}}
and run: python3 score.py results.json
