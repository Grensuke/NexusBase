# NexusBase Validation Architecture

This directory contains the engineering scripts, datasets, and reports used to validate the NexusBase capability extraction and discovery system.

## Directory Structure

The validation directory is organized chronologically by the pipeline stages of data processing:

### `01_extraction/`
- **Purpose**: Validated the extraction of unstructured product descriptions into raw capabilities using local LLMs.
- **Contents**: Extraction scripts, prompt templates, and the resulting raw JSON datasets.
- **Important Artifacts**: `NexusBase_extracted_capabilities_v0.2.json` (Raw capabilities output).

### `02_normalization/`
- **Purpose**: Validated the merging and filtering of raw capabilities into atomic capabilities, including duplicate removal and quality gating.
- **Contents**: Normalization scripts, quality gate filters, regression testing scripts, and normalized intermediate datasets.
- **Important Artifacts**: `NexusBase_normalized_capabilities_v0.2.json`, `stage3_1_quality_gate.py`.
- **Note**: The normalization flow was heavily experimented on here (e.g. embeddings vs semantic merge vs deterministic).

### `03_catalog/`
- **Purpose**: Validated the canonical tracking, reproducibility, and source evidence provenance for the finalized catalog.
- **Contents**: Reconciliation scripts, entity checkers, canonical builders, and the final pre-benchmark full catalog datasets.
- **Important Artifacts**: `NexusBase_normalized_capabilities_v0.3_full_reproducible.json` (The authoritative benchmark catalog).

### `04_benchmark/`
- **Purpose**: Validated the LLM's candidate discovery and requirement matching logic against a rigid set of 15 scenarios.
- **Contents**: Benchmark runner scripts, scenarios/baselines definitions, and metric reports.
- **Important Artifacts**: `benchmark.json`, `benchmark_v0.2_report.md` (The final un-leaked evaluation).

### `05_shared/`
- **Purpose**: Helper scripts, parsers, and utilities used across multiple validation phases.
- **Contents**: LLM adapters, shared input seeds (`seed_index.json`), report generation utilities.

### `archive/`
- **Purpose**: Archived and temporary debug artifacts that were kept for historical context.
- **Contents**: `test_out.json`, `check_out.txt`.

## Usage Notes

- **Working Directory**: All scripts in this directory were historically executed with `validation/` as the current working directory.
- **Data Mutation**: Do NOT modify the output `.json` files or benchmark results casually. These act as fixed, validated checkpoints.
- **Network Dependency**: Most of these scripts require the local `qwen3:8b` Ollama endpoint to run correctly.
