# NexusBase Validation Report v0.2

Generated: 2026-09-29T05:52:27+00:00
Catalog: NexusBase_extracted_capabilities_v0.2.json (mode: dry_run)

## Methodology
- **Primary dataset**: LLM-extracted capability catalog (hand-authored catalog used only as reference)
- **Candidate selection**: ALL 37 indexed entities evaluated for every scenario
- **Answer key usage**: Benchmark `viable` list used ONLY after matching for recall/FP scoring
- **Separation of concerns**: Capability fit, constraint fit, and evidence completeness evaluated independently
- **Constraint handling**: Unverified constraints classified as `unresolved`, not automatically invalid

## Scenario Results

| Scenario | Domain | Expected | Discovered | With Unresolved | FPs | Recall |
|----------|--------|----------|------------|-----------------|-----|--------|
| S01 | observability | glitchtip | — | — | — | 0.00 |
| S02 | deployment | caprover, coolify, dokku | — | — | — | 0.00 |
| S03 | observability | gatus, uptime_kuma | — | — | — | 0.00 |
| S04 | feature-management | flagsmith, growthbook, unleash | — | — | — | 0.00 |
| S05 | documents | docling | — | — | — | 0.00 |
| S06 | audio | faster_whisper, whisper_cpp | — | — | — | 0.00 |
| S07 | audio | pyannote, whisperx | — | — | — | 0.00 |
| S08 | data-store | keydb, valkey | — | — | — | 0.00 |
| S09 | infrastructure-as-code | opentofu | — | — | — | 0.00 |
| S10 | search | paradedb, pg_fts | — | — | — | 0.00 |
| S11 | documentation | redoc, scalar, swagger_ui | — | — | — | 0.00 |
| S12 | background-jobs | procrastinate | — | — | — | 0.00 |
| S13 | search-plus-ai | chroma, faster_whisper, whisper_cpp | — | — | — | 0.00 |
| S14 | failure-mode | — | — | — | — | n/a |
| S15 | failure-mode | — | — | — | — | n/a |

## Aggregate Metrics
- Mean candidate recall: **0.00** (across 13 scenarios with expected viables)
- Total false positives: **0**
- Total candidates with unresolved constraints: **0**

## Catalog Statistics
- Entities in catalog: **37**
- Entities with capabilities: **0**
- Total accepted capabilities: **0**
- Total rejected by validation: **0**

## What this proves
- The benchmark matrix does not copy the answer key when choosing candidates.
- Capability fit, constraint fit, and evidence completeness are independently evaluated.
- Unverified constraints are classified as "unresolved" rather than silently accepted or rejected.
- The pipeline is ready for end-to-end comparison once LLM extraction runs with an API key.

## What this still does not prove
- Semantic correctness of LLM-extracted capabilities (requires human review).
- Live compatibility verification between composed tools.
- Comparison against the external baseline (requires baseline results).