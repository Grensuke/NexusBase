# NexusBase Documentation

This repository structure organizes documentation according to the exact engineering purpose.

## Directory Structure

### `product/`
What NexusBase is and what the product requires.
- `product-definition/`: Authoritative definitions of the product (e.g., `NexusBase_Product_Definition_v1_0.md`).
- `prd/`: The primary Product Requirements Documents.
- `decisions/`: Important product-level decisions with reasons and consequences.

### `architecture/`
How the system is designed technically.
- `overview/`: High-level system architecture diagrams and flow.
- `data-model/`: Database schemas, entity relationships, and metadata structures.
- `discovery/`: The search, inference, and capability matching architecture.
- `source-adapters/`: Specifications for adapters that pull from varying remote sources.
- `composition/`: The architecture behind joining atomic capabilities into viable solution paths.
- `evidence/`: Requirements and provenance mapping for LLM and structured evidence.
- `api/`: API contracts and routing.

### `engineering/`
How we build, test, validate, and operate the platform.
- `validation/`: Engineering validation logs containing the historical context of what has been tested.
- `testing/`: QA strategies, unit/integration testing policies, E2E test documentation.
- `development/`: Developer onboarding, coding standards, environment setup.
- `operations/`: DevOps, deployment, CI/CD, and scaling guides.

### `research/`
Experiments, prototypes, rejected approaches, and technical findings.
- `experiments/`: Spikes and isolated tests.
- `evaluations/`: Third-party tool/library evaluations.
- `notes/`: Informal research logs.

### `benchmarks/`
Benchmark methodology and results.
- `plans/`: Benchmark scenario definitions.
- `results/`: Processed metric reports.
- `methodology/`: The math and reasoning behind benchmark scoring.

## Guidelines
- Do not mix implementation logs into the PRD.
- Do not put temporary experiment outputs in product documents.
- Use exact measured values where available.
- Classify project states clearly (DONE, VALIDATED, PARTIALLY VALIDATED, NOT YET BUILT).
