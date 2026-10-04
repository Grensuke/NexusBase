# NexusBase MVP v0.2 Backend Test Report (Final Validation)

## 1. Context Size Before vs After
- **Before (v0.1):** Context payload exceeded **20,000+ characters**, causing severe LLM hallucinations.
- **After (v0.2):** Deterministic candidate-card filtering dropped the context size to roughly **~4,800 characters** for 8 entities, and **1,785 characters** for 3 entities.

## 2. Test C Output Schema Deviation Analysis
In early v0.2 testing, Test C ("I need to extract information from PDF documents and then use another tool to process that extracted information") generated a TypeScript crash:
```
TypeError: Cannot read properties of undefined (reading 'filter')
```
**Exact Deviation:** 
The Qwen model outputted the `capability_matches` array but failed to insert the `capability_ids` property when it couldn't find a matching capability for the second requirement. It outputted `" ": "capability_ids"` instead of an array.

## 3. Schema Fix
The LLM prompt schema was explicitly rewritten to use a flat canonical structure:
```json
{
  "selected_candidates": [
    {
      "entity_id": "Must exactly match an Entity from the catalog",
      "requirements_covered": ["List of requirements this entity satisfies"],
      "capability_ids": ["Must exactly match capability IDs from the catalog"]
    }
  ]
}
```

## 4. Invalid-Output Handling
A defensive runtime validation boundary was added to `compositionService.ts`. If the LLM produces:
- Malformed JSON
- Missing `capability_ids` array
- Missing `entity_id`
- Hallucinated `capability_ids` not belonging to the entity
The composition engine deterministically intercepts this and marks the path status as `LLM_OUTPUT_INVALID` instead of crashing. This status gracefully bubbles up to the REST API. An optional fallback parser remains to handle the legacy `capability_matches` shape safely if the LLM reverts.

## 5. Evidence Validation
The system continues to fetch exact evidence quotes securely via deterministic catalog lookup based solely on the `capability_ids` the LLM provides. The LLM never touches raw evidence text.

## 6. Constraint Validation
Constraint status uses deterministic keyword heuristics (`offline`, `local`, `cloud`) against the raw evidence. Hard assertions of constraint satisfaction are restricted from the LLM.

## 7. Composition Result
The engine supports multi-tool combinations. If an integration is found within the catalog metadata, compatibility is flagged as `VERIFIED`, otherwise `UNVERIFIED`. The deterministic logic enforces coverage checking.

## 8. Deterministic Test Result
```
Testing deterministic coverage logic (Single Path)...
Test: Single solution path generated successfully
INVALID_LLM_OUTPUT: Capability FAKE_CAPABILITY_ID not found in entity mineru
Test: Nonexistent capability protection passed
Testing composition and compatibility...
Test: No-valid-path detection passed
All synchronous tests passed.
```
Deterministic tests successfully caught fake IDs in mocked LLM outputs and verified path completeness.

## 9. Test A Execution
**Problem:** "I need to convert PDF files into Markdown locally."
- **Context Size:** 4,838 characters
- **Result:** VALID JSON. 
- **Valid Paths Found:** `mineru` successfully met the requirement using `document_to_markdown_conversion` and `local_file_reading`. Constraint evidence was deterministically extracted. Zero hallucinations.

## 10. Test B Execution
**Problem:** "I need to transcribe audio locally without sending the data to a cloud service."
- **Context Size:** 4,883 characters
- **Result:** VALID JSON.
- **Valid Paths Found:** `pyannote` and `whisper_cpp` satisfied the requirements using valid capabilities (`local_audio_processing`, `audio_transcription`). Zero PDF tools accepted. Zero hallucinations.

## 11. Test C Execution
**Problem:** "I need to extract information from PDF documents and then use another tool to process that extracted information."
- **Context Size:** 1,785 characters
- **Result:** VALID JSON.
- **Paths Found:** `PARTIAL_COVERAGE`. The LLM successfully selected `mineru`, `pymupdf4llm`, and `docling` for the PDF requirement, mapping real capability IDs (e.g. `pdf_document_parsing`). It correctly skipped the external tool requirement since no retrieved capability could fulfill it.
- **Zero Crashes.** The schema validation and flat requirement mapping perfectly processed the partial match, outputting missing requirements accurately. No fabricated compatibility was generated.

**SUCCESS CONDITIONS MET:** 
- Test A: PASS
- Test B: PASS
- Test C: PASS (Partial coverage detected correctly without crashes)
- Zero TypeScript crashes, hallucinated entities, or invented evidence.
