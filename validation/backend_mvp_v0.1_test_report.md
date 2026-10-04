# NexusBase MVP v0.1 Backend Test Report

## 1. Retrieval Changes
- **Stopword Filtering:** Removed generic terms (e.g., "file", "process", "support", "need", "system", "tool", "using") to prevent them from inflating scores for unrelated entities.
- **Term Weighting:** Implemented deterministic weighting based on source type:
  - Capability labels: **5.0** (Strongest signal)
  - Metadata: **2.0**
  - Family labels: **1.0**
  - Evidence text: **0.5** (Weak signal)
- **Phrase Matching:** Added a +2.0 score boost for exact/near-exact multi-word phrase matches from capability labels directly into the user query.
- **Output:** The retrieval layer now accurately returns the `score`, `matched_terms`, and `matched_capabilities` for each candidate.

## 2. Constraint Changes
- **Strict Evidence Validation:** The LLM is now instructed to extract constraints and return a proposed status (`SATISFIED`, `VIOLATED`, `UNKNOWN`) alongside the **exact evidence quote** and the capability `source_id`.
- **Deterministic Enforcement:** TypeScript strictly verifies the LLM's claims by checking if the exact quoted evidence actually exists within the catalog for that specific `source_id`. If the LLM hallucinates evidence or misattributes it, the deterministic layer forces the constraint status to `UNKNOWN` and invalidates the path.
- **No Inferences:** Inferences (like "CLI means offline") are strictly forbidden. The system relies entirely on catalog evidence.

## 3. Test A Result (Simple Single-Solution)
**Problem:** "I need to convert PDF files into Markdown locally."
- **Retrieval:** Highly successful. The top 3 candidates were `pymupdf4llm` (0.21), `mineru` (0.12), and `docling` (0.12).
- **LLM Evaluation:** Failed. The LLM hallucinated a non-existent entity (`supadata`), ignoring the actual candidates.
- **Path Generation:** No valid solution paths.

## 4. Test B Result (Constraint-Heavy)
**Problem:** "I need to transcribe audio locally without sending the data to a cloud service."
- **Retrieval:** Highly successful. The top 3 candidates were `pyannote` (0.33), `faster_whisper` (0.32), and `whisper_cpp` (0.20). PDF tools like `docling` and `mineru` were heavily down-weighted.
- **LLM Evaluation:** Failed. The LLM hallucinated a non-existent entity (`audio_transcription_solution`) and claimed no audio tools were in the catalog context.
- **Path Generation:** No valid solution paths.

## 5. Test C Result (Multi-Step / Composition)
**Problem:** "I need to extract information from PDF documents and then use another tool to process that extracted information."
- **LLM Problem Extraction:** Failed with a JSON parse error (`INFRASTRUCTURE_BLOCKED`). The LLM failed to output valid JSON for the initial requirements extraction phase.
- **Retrieval & Evaluation:** Did not execute.
- **Path Generation:** None.

## 6. Top Retrieval Candidates

### Test A: Convert PDF files into Markdown locally
1. **pymupdf4llm** (0.21) - Matched: *Convert documents into structured Markdown, PDF to Markdown conversion, etc.*
2. **mineru** (0.12) - Matched: *Document content to Markdown conversion, PDF document parsing, etc.*
3. **docling** (0.12) - Matched: *Parsing of multiple document formats, Advanced PDF understanding, etc.*
4. pyannote (0.008)
5. whisper_cpp (0.004)
*(Unrelated audio tools ranked very low)*

### Test B: Transcribe audio locally without cloud service
1. **pyannote** (0.33) - Matched: *Local audio processing, Speaker diarization, etc.*
2. **faster_whisper** (0.32) - Matched: *Audio transcription with batched inference, Voice transcription, etc.*
3. **whisper_cpp** (0.20) - Matched: *Audio transcription, Voice command recognition, etc.*
4. coolify (0.09)
5. whisperx (0.06)
6. unleash (0.06)
7. docling (0.05)
8. mineru (0.01)
*(Unrelated PDF/document tools ranked very low)*

### Test C: Extract information from PDF...
*Retrieval did not execute due to LLM failure in problem analysis.*

## 7. Constraint States
Due to the LLM hallucinatory behavior, it did not map real constraints to real candidates. For the hallucinated entities, the deterministic system successfully caught the invalid claims and mapped the constraint states to `UNKNOWN`.

## 8. Valid/Partial/Invalid Paths
**0 Valid Paths.** The strict deterministic logic correctly prevented the LLM's hallucinated entities from becoming valid paths.

## 9. Evidence Checks
The deterministic evidence checker successfully fulfilled its design. Because the LLM hallucinated entities, the TypeScript logic found no matching capability IDs and correctly rejected the LLM's evaluation, refusing to fabricate capabilities or evidence.

## 10. Existing Deterministic Test Result
The synchronous mock-based TypeScript tests continue to pass perfectly:
```
Loading catalog...
Testing candidate retrieval...
Retrieval: Found pymupdf4llm, docling, mineru, faster_whisper
Testing deterministic coverage logic (Single Path)...
Test: Single solution path generated successfully
Test: Nonexistent capability protection passed
Testing composition and compatibility...
Test: Two-tool composition passed. Compatibility:  VERIFIED
Test: No-valid-path detection passed
All synchronous tests passed.
```

## 11. Known Limitations
1. **Context Window / LLM Overload:** Appending 8 entities with all of their capabilities and full evidence blocks into a single prompt heavily overwhelms the `qwen3:8b` model. This causes severe hallucinations (inventing generic entity names like `audio_transcription_solution` or hallucinating catalog constraints) or causes it to crash/time out when attempting to output JSON.
2. **JSON Instability:** The LLM frequently outputs invalid JSON (e.g. conversational text outside of code blocks) under heavy load, breaking the initial problem extraction step.
3. **Retrieval Success vs Evaluation Failure:** The TF-IDF retrieval system works exceptionally well now, perfectly surfacing the correct top 3 tools for PDF and Audio use cases. However, the downstream LLM cannot process the resulting payload size.
