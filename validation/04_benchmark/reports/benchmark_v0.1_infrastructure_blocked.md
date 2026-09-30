# NexusBase Benchmark v0.1 Report

## Execution Summary
- Scenarios executed: 15
- Scenarios fully blocked by SOURCE_UNAVAILABLE: 5
- Grounding Leakage Check: PASS

## Metrics
### A. Relevance (Viable Recall)
0 / 14 (0.0%)
### C. Must-have coverage
0 / 0 (N/A)
### F. Unsupported recommendation rate
0 / 0 (N/A)
### G. Candidate validity (Valid Paths)
0 / 0 (N/A)
### K. Honest failure accuracy
1 / 15 (6.7%)
Overconfident on failure scenarios: 0
### M. Source availability
Viable candidates dropped due to SOURCE_UNAVAILABLE: 12

## Infrastructure Limitations
The local Ollama instance (`qwen3:8b` at `http://localhost:11434/v1`) actively refused connections during execution (`WinError 10061`). Because the LLM was completely offline, discovery metrics evaluating inference logic are zeroes/empty. This accurately documents the infrastructure failure rather than silently replacing the expected pipeline environment.