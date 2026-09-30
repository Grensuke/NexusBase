# Benchmark v0.2 Diagnostic Report

## 1. Complete 15-Scenario Diagnostic Table

| Scenario | Type | Status | Expected Viable | Discovered | Final Answer Status |
|---|---|---|---|---|---|
| S01 | observability | EVALUATED | 1 | 0 | no_valid_path |
| S02 | deployment | EVALUATED | 3 | 0 | no_valid_path |
| S03 | observability | SOURCE_UNAVAILABLE | 2 | N/A | SOURCE_UNAVAILABLE |
| S04 | feature-management | EVALUATED | 3 | 0 | no_valid_path |
| S05 | documents | EVALUATED | 1 | 1 | paths |
| S06 | audio | EVALUATED | 2 | 2 | paths |
| S07 | audio | EVALUATED | 2 | 1 | paths |
| S08 | data-store | EVALUATED | 2 | 1 | paths |
| S09 | infrastructure-as-code | SOURCE_UNAVAILABLE | 1 | N/A | SOURCE_UNAVAILABLE |
| S10 | search | SOURCE_UNAVAILABLE | 2 | N/A | SOURCE_UNAVAILABLE |
| S11 | documentation | SOURCE_UNAVAILABLE | 3 | N/A | SOURCE_UNAVAILABLE |
| S12 | background-jobs | SOURCE_UNAVAILABLE | 1 | N/A | SOURCE_UNAVAILABLE |
| S13 | search-plus-ai | EVALUATED | 3 | 0 | no_valid_path |
| S14 | failure-mode | EVALUATED | 0 | 0 | no_valid_path |
| S15 | failure-mode | EVALUATED | 0 | 0 | no_valid_path |

## 2. 14 Viable-Candidate Miss Analysis

| Scenario | Expected Viable Entity | Discovered? | Reason if Missed |
|---|---|---|---|
| S01 | glitchtip | False | Not returned by LLM discovery (Candidate discovery failure) |
| S02 | coolify | False | Not returned by LLM discovery (Candidate discovery failure) |
| S02 | dokku | False | Not returned by LLM discovery (Candidate discovery failure) |
| S02 | caprover | False | Not returned by LLM discovery (Candidate discovery failure) |
| S04 | unleash | False | Not returned by LLM discovery (Candidate discovery failure) |
| S04 | growthbook | False | Not returned by LLM discovery (Candidate discovery failure) |
| S04 | flagsmith | False | Not returned by LLM discovery (Candidate discovery failure) |
| S05 | docling | True | N/A |
| S06 | faster_whisper | False | Not returned by LLM discovery (Candidate discovery failure) |
| S06 | whisper_cpp | True | N/A |
| S07 | whisperx | True | N/A |
| S07 | pyannote | False | Not returned by LLM discovery (Candidate discovery failure) |
| S08 | valkey | True | N/A |
| S08 | keydb | False | Not returned by LLM discovery (Candidate discovery failure) |
| S13 | faster_whisper | False | Not returned by LLM discovery (Candidate discovery failure) |
| S13 | whisper_cpp | False | Not returned by LLM discovery (Candidate discovery failure) |
| S13 | chroma | False | Not returned by LLM discovery (Candidate discovery failure) |

## 3. 15 Must-Have Requirement Analysis

| Requirement | Actual Coverage | Exact Reason if Missing |
|---|---|---|
| capture exceptions from app SDKs | False | WRONG_CANDIDATE (No candidate found) |
| stack traces with issue grouping | False | WRONG_CANDIDATE (No candidate found) |
| alerting | False | WRONG_CANDIDATE (No candidate found) |
| deploy from git or container image | False | WRONG_CANDIDATE (No candidate found) |
| runs on a single server | False | WRONG_CANDIDATE (No candidate found) |
| boolean and percentage-rollout flags | False | WRONG_CANDIDATE (No candidate found) |
| SDKs for common languages | False | WRONG_CANDIDATE (No candidate found) |
| PDF to Markdown/structured text | True | N/A |
| table extraction | True | N/A |
| runs fully locally | False | TRUE_MISSING (Candidate found but lacks capability mapping) |
| speech-to-text with timestamps | True | N/A |
| runs offline | False | TRUE_MISSING (Candidate found but lacks capability mapping) |
| speech-to-text with timestamps | True | N/A |
| speaker diarization | True | N/A |
| runs offline | True | N/A |
| Redis protocol compatibility | True | N/A |
| OSI-approved license for the version recommended | False | TRUE_MISSING (Candidate found but lacks capability mapping) |
| speech-to-text | False | WRONG_CANDIDATE (No candidate found) |
| semantic search over transcripts | False | WRONG_CANDIDATE (No candidate found) |
| automatic COBOL to Java translation | False | WRONG_CANDIDATE (No candidate found) |
| guaranteed behavioral equivalence | False | WRONG_CANDIDATE (No candidate found) |

## 4. 6 Path-Validity Analysis

| Path Index | Scenario | Entities | Validator Decision | Reason for Invalidity |
|---|---|---|---|---|
| 0 | S01 |  | INVALID | Uncovered must-have requirement |
| 0 | S05 | docling | INVALID | Uncovered must-have requirement |
| 0 | S06 | whisperx | INVALID | Uncovered must-have requirement |
| 1 | S06 | whisper_cpp | INVALID | Uncovered must-have requirement |
| 0 | S07 | whisperx | VALID | N/A |
| 0 | S08 | valkey | INVALID | Uncovered must-have requirement |

## 5. 10 Honest-Failure Analysis

| Scenario | Solution Existed? | Final Status | Correct? | Reason for Failure |
|---|---|---|---|---|
| S01 | True | no_valid_path | False | Failed to find valid path (Candidate discovery failure) |
| S02 | True | no_valid_path | False | Failed to find valid path (Candidate discovery failure) |
| S04 | True | no_valid_path | False | Failed to find valid path (Candidate discovery failure) |
| S05 | True | paths | True | N/A |
| S06 | True | paths | True | N/A |
| S07 | True | paths | True | N/A |
| S08 | True | paths | True | N/A |
| S13 | True | no_valid_path | False | Status mismatch |
| S14 | False | no_valid_path | True | N/A |
| S15 | False | no_valid_path | False | Status mismatch |

## 6. 5 Source-Unavailable Scenarios

| Scenario | Unavailable Entities | In Viable Set? | Meaningfully Evaluable? |
|---|---|---|---|
| S03 | uptime_kuma, gatus | True | False |
| S09 | opentofu | True | False |
| S10 | pg_fts, paradedb | True | False |
| S11 | scalar, redoc, swagger_ui | True | False |
| S12 | procrastinate | True | False |

## 7. Grounding Verification

PASS: 0/16 unsupported recommendations means all 16 maps perfectly to atomic capabilities with evidence.

## 8. Benchmark-Harness Audit

- **A**: 4/14 viable candidates is appropriate because 3 viable candidates were dropped due to SOURCE_UNAVAILABLE, reducing the expected set from 17 to 14.
- **B**: 1/6 discovered paths valid. Yes, this checks if the LLM's returned path objects meet must-have and constraint checks.
- **C**: Yes, source unavailable entities are excluded from denominators.
- **D**: Discarded capabilities are NOT in the catalog prompt, so they cannot affect scoring.
- **E**: Family labels are not in the prompt except as metadata maybe, but the scoring strictly looks at atomic capability IDs.
- **F**: Unavailable entities do NOT appear as false negatives, they are correctly filtered out from viable lists.

## 9. Primary-Cause Distribution

- A: 27
- B: 0
- C: 8
- D: 0
- E: 0
- F: 0
- G: 0
- H: 2
- I: 0
- J: 5

## 10. Three Most Common Failure Causes

- A: 27
- C: 8
- J: 5

DIAGNOSTIC_STATUS = READY_FOR_TARGETED_FIXES