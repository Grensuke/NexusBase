# NexusBase Engineering Validation Log v1.0

## 1. Purpose
This log is the permanent human-readable record of all engineering validation, experiments, and architectural checkpoints performed to test the conceptual viability of the NexusBase discovery pipeline before drafting the Product Requirements Document (PRD).

## 2. Validation Period
The engineering-validation phase represented by this document covers the initial project inception up to the completion of Benchmark v0.2.

## 3. Environment
**VERIFIED ENVIRONMENT:**
- Local AI validation environment
- Hardware: RTX 4060 Laptop GPU
- Inference Server: Ollama
- Base Model: `qwen3:8b`
- Custom scripting stack: Python 3.13, local Git repository

## 4. Project Agent/Skills Setup
**VERIFIED SETTINGS:**
- Configured via `.agents/` structured agent rules.
- Contains custom project rules prioritizing clean rebuild, architecture, zero legacy code, and security.
- Custom local skills (`playwright-skill`, `ui-ux-pro-max`, `shadcn`, `systematic-debugging`, `rbac-permissions-builder`, `web-design-guidelines`, etc.) locked into `skills-lock.json`.
- Repository portability verified as an intact Antigravity IDE workspace.

## 5. Stage 1 — Source Blocking / Evidence Architecture
**VERIFIED:**
- **Source Blocking:** Raw source document texts were artificially limited/blocked from direct semantic passage retrieval to force strict atomic capability mapping, preventing hallucinated solution matches based on marketing buzzwords.
- **Evidence Preservation:** The architecture mandates mapping exact capability extraction evidence for provenance. 
- **LLM Quotes:** Exact LLM quote reproduction was dropped because raw capabilities are heavily summarized/interpreted during generation; strict string quotes would frequently mismatch or fail extraction. 

## 6. Stage 2 — Capability Extraction
**TESTED/OBSERVED:**
- **Original Approach:** Extracting all capabilities directly from a large product context in a single shot.
- **Large-document failures:** The local `qwen3:8b` context window struggled with extreme lengths, leading to truncation and hallucination. 
- **Chunking Experiment:** Documents were split into logical chunks before sending to the LLM. 
- **Final Chunked Approach:** Extracted capabilities sequentially and safely via prompt configurations (`NexusBase_capability_extraction_prompt_v0.2.md`).
- **Known Limitations:** The context length and reasoning limitations of `qwen3:8b` meant some nuanced capabilities were dropped entirely during extraction if buried inside long dense marketing text.

## 7. Stage 3 — Normalization Experiments
**TESTED/OBSERVED:**
- **Initial string similarity approach:** Resulted in over-aggressive merges where conceptually distinct capabilities with similar keywords (e.g., "export to CSV", "export to PDF") were falsely merged.
- **Embedding experiment:** Used `all-MiniLM-L6-v2` embeddings for semantic deduplication.
- **Why embeddings were not used:** Semantic vectors lacked the precision required to differentiate critical technical nuances (e.g., asynchronous vs synchronous processing). Pure vector distance was too risky for automated merging.
- **Final Architecture:** The concept of "Atomic Capability" mapping to a "Capability Family" was introduced. Merges must be highly conservative and deterministic.

## 8. Stage 3.1 — Quality Gate
**VERIFIED:**
- **Deterministic Noise Filtering:** Scripts (`stage3_1_quality_gate.py`) applied to strictly drop marketing noise, ambiguous language, or non-functional capabilities.
- **Metadata Separation:** Categorized non-functional properties (like licenses, OSI status, platform targets) separately from functional atomic capabilities.
- **Regression Preservation:** Ensuring quality filters did not break previously matched requirements.

## 9. Stage 3.2 — Capability Fitness Audit
**VERIFIED:**
- The capabilities were audited into classes A, B, C, D, and E to gauge functional independence. 
- **Ambiguous capability handling:** Class E (ambiguous) required source-evidence manual adjudication. 

## 10. Stage 3.2B — Adjudication
**VERIFIED:**
- Conducted evidence-based adjudication of 54 ambiguous Class-E capabilities.
- Converted them conservatively to A/B/C/D based solely on whether the source demonstrated a distinct, user-visible functional outcome.

## 11. Stage 3 Finalization
**VERIFIED ACCOUNTING:**
- Raw Stage 2: 209 records for the original two-entity (MinerU, PyMuPDF4LLM) validated baseline.
- Final Normalized:
  - 168 atomic
  - 15 metadata/configuration
  - 26 discarded
- *(Note: An earlier report claiming 193 atomic capabilities was a reporting error and is not an authoritative result.)*

## 12. Canonical Source / Provenance Recovery
**VERIFIED:**
- A raw snapshot mismatch occurred because the `v0.2` dataset lost some intermediate JSON outputs. 
- **Recovery:** Successfully rebuilt the canonical dataset from `test_out.json`.
- **Reproducibility:** A fully reproducible, provenanced pipeline rebuild was verified. The canonical snapshot guarantees tracking from initial raw source extraction to the final normalized output.

## 13. Full-Batch Processing
**TESTED/OBSERVED:**
- Processed 37 intended entities.
- 16 entities successfully processed.
- 21 marked `SOURCE_UNAVAILABLE` (e.g., failed to fetch, missing URLs, etc.).
- The system correctly produced NO fabricated capabilities for unavailable entities.
- New unclassified capability patterns were naturally discovered. 
- *(Note: This does not represent full 37-entity validation; merely an observation of pipeline stability).*

## 14. Benchmark v0.1
**OBSERVED:**
- Executed against the 15 benchmark scenarios. 
- Encountered a hard Ollama infrastructure failure (`WinError 10061`).
- The benchmark runner was modified to correctly intercept and label these as `INFRASTRUCTURE_BLOCKED` rather than silent product-performance failures. The results were archived as invalid for product performance.

## 15. Benchmark v0.2
**VERIFIED MEASURED RESULTS:**
- **Total Scenarios:** 15
- **Source Unavailable:** 5 (excluded from relevant denominators)
- **Actually Evaluated:** 10
- **Grounding Leakage Check:** PASS
- **Relevance / Viable Recall:** 4/14 (28.6%)
- **Must-have Coverage:** 8/15 (53.3%)
- **Unsupported Recommendations:** 0/16 (0.0%)
- **Valid Paths:** 1/6 (16.7%)
- **Honest Failure Accuracy:** 5/10 (50.0%)

*Disclaimer: These are measured benchmark results for the current implementation; they are not overall proof of product quality.*

## 16. Benchmark Diagnostic
**OBSERVED/HYPOTHESIS:**
The primary diagnostic findings driving the metrics:
1. **Candidate Discovery Failure** (Dominant bottleneck): The LLM frequently failed to retrieve the correct candidates even when they existed in the catalog context.
2. **Capability Matching Failure** (Secondary issue): The LLM struggled to accurately map abstract requirements (especially environment constraints like "runs offline") to the atomic capability labels.
3. **Source Unavailability** (Infrastructure): Hard block limiting the universe of evaluable paths. 

*Note: These are observed bottlenecks in the current specific `qwen3:8b` context setup, not permanent product conclusions.*

## 17. What Was Validated
**VERIFIED:**
- Atomic capability preservation logic.
- Family ≠ Coverage distinction.
- Evidence/provenance tracking structures.
- Canonical reproducible provenance pipelines.
- Requirement matching regression integrity.
- Grounding leakage boundaries (zero hallucinated evidence).
- Honest source-unavailable handling.
- Local LLM connectivity and fault tolerance.

## 18. What Was NOT Validated
**NOT YET BUILT/VERIFIED:**
- Internet-scale solution discovery.
- Full 37-entity capability coverage.
- Production-scale retrieval/RAG implementations.
- Final multi-agent composition quality.
- Production API or Frontend UI.
- Broad web/source-adapter extraction coverage.

## 19. Current Architecture Checkpoint
**CONCEPTUAL FLOW:**
User Problem → Problem Understanding → Requirements → Solution Discovery → Candidate Evaluation → Composition → Constraint Filtering → Solution Paths → User Choice.

**ENGINEERING INSIGHT:**
The validation phase has strongly suggested that Candidate Retrieval should eventually be separated from pure LLM reasoning due to context length/attention degradation. 

## 20. Current Known Bottlenecks
**KNOWN LIMITATIONS:**
- Limited solution universe.
- 21 unavailable source entities.
- Candidate discovery/retrieval reliability.
- Capability constraint matching accuracy.
- Multi-component composition validation.

## 21. Current Project Status
- **Extraction Architecture:** PARTIALLY VALIDATED
- **Normalization Architecture:** VALIDATED
- **Provenance Architecture:** VALIDATED
- **Benchmark Metrics:** VALIDATED (v0.2 Baseline)
- **Frontend/Backend/Database:** NOT YET BUILT

## 22. Checkpoint Before PRD
Engineering validation phase is successfully documented. The `NexusBase_Product_Definition_v1_0.md` remains authoritative. The next phase is the Product Requirements Document (PRD).
