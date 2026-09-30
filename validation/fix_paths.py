import os
import re

moves = {
    "extract_capabilities_llm.py": "01_extraction/scripts/extract_capabilities_llm.py",
    "test_extraction_variants.py": "01_extraction/scripts/test_extraction_variants.py",
    "01_extraction/inputs/NexusBase_capability_extraction_prompt_v0.2.md": "01_extraction/inputs/NexusBase_capability_extraction_prompt_v0.2.md",
    "01_extraction/outputs/NexusBase_extracted_capabilities_v0.2.json": "01_extraction/outputs/NexusBase_extracted_capabilities_v0.2.json",
    "01_extraction/reports/NexusBase_extraction_report_v0.2.md": "01_extraction/reports/NexusBase_extraction_report_v0.2.md",
    "normalize_capabilities.py": "02_normalization/scripts/normalize_capabilities.py",
    "stage3_1_quality_gate.py": "02_normalization/scripts/stage3_1_quality_gate.py",
    "audit_atomic_capabilities.py": "02_normalization/scripts/audit_atomic_capabilities.py",
    "stage3_2b_adjudication.py": "02_normalization/scripts/stage3_2b_adjudication.py",
    "stage3_finalization.py": "02_normalization/scripts/stage3_finalization.py",
    "generate_stage3_1_report.py": "02_normalization/scripts/generate_stage3_1_report.py",
    "generate_finalization_report.py": "02_normalization/scripts/generate_finalization_report.py",
    "test_normalization.py": "02_normalization/scripts/test_normalization.py",
    "test_normalized_requirement_matching.py": "02_normalization/scripts/test_normalized_requirement_matching.py",
    "nexusbase_validation_v0.2.py": "02_normalization/scripts/nexusbase_validation_v0.2.py",
    "test_stage3.py": "02_normalization/scripts/test_stage3.py",
    "02_normalization/inputs/NexusBase_capability_normalization_prompt_v0.2.md": "02_normalization/inputs/NexusBase_capability_normalization_prompt_v0.2.md",
    "02_normalization/reports/NexusBase_all_entity_matching_matrix_v0.2.json": "02_normalization/reports/NexusBase_all_entity_matching_matrix_v0.2.json",
    "02_normalization/reports/NexusBase_capability_review_v0.2.json": "02_normalization/reports/NexusBase_capability_review_v0.2.json",
    "02_normalization/reports/NexusBase_validation_report_v0.2.md": "02_normalization/reports/NexusBase_validation_report_v0.2.md",
    "02_normalization/reports/stage3_1_report_data.json": "02_normalization/reports/stage3_1_report_data.json",
    "02_normalization/reports/stage3_2b_adjudication_report.txt": "02_normalization/reports/stage3_2b_adjudication_report.txt",
    "02_normalization/reports/stage3_2_audit_report.txt": "02_normalization/reports/stage3_2_audit_report.txt",
    "02_normalization/reports/stage3_finalization_data.json": "02_normalization/reports/stage3_finalization_data.json",
    "02_normalization/reports/stage3_finalization_report.txt": "02_normalization/reports/stage3_finalization_report.txt",
    "02_normalization/reports/stage3_quality_gate_report.txt": "02_normalization/reports/stage3_quality_gate_report.txt",
    "02_normalization/reports/stage3_regression_report.txt": "02_normalization/reports/stage3_regression_report.txt",
    "02_normalization/reports/stage3_report.txt": "02_normalization/reports/stage3_report.txt",
    "02_normalization/reports/stage3_test_run.txt": "02_normalization/reports/stage3_test_run.txt",
    "02_normalization/reports/stage3_test_run_embeddings.txt": "02_normalization/reports/stage3_test_run_embeddings.txt",
    "02_normalization/reports/test_report.md": "02_normalization/reports/test_report.md",
    "02_normalization/outputs/NexusBase_normalized_capabilities_v0.2.json": "02_normalization/outputs/NexusBase_normalized_capabilities_v0.2.json",
    "02_normalization/outputs/NexusBase_quality_gated_capabilities_v0.2.json": "02_normalization/outputs/NexusBase_quality_gated_capabilities_v0.2.json",
    "canonical_builder.py": "03_catalog/scripts/canonical_builder.py",
    "check_provenance.py": "03_catalog/scripts/check_provenance.py",
    "stage3_full_batch_reconciliation.py": "03_catalog/scripts/stage3_full_batch_reconciliation.py",
    "stage3_full_batch_reproducible.py": "03_catalog/scripts/stage3_full_batch_reproducible.py",
    "check_entity_availability.py": "03_catalog/scripts/check_entity_availability.py",
    "check_failed_entities.py": "03_catalog/scripts/check_failed_entities.py",
    "update_failed_entities.py": "03_catalog/scripts/update_failed_entities.py",
    "stage3_full_batch.py": "03_catalog/scripts/stage3_full_batch.py",
    "generate_integrity_report.py": "03_catalog/scripts/generate_integrity_report.py",
    "generate_prebenchmark_report.py": "03_catalog/scripts/generate_prebenchmark_report.py",
    "03_catalog/inputs/NexusBase_extracted_capabilities_canonical_v0.2.json": "03_catalog/inputs/NexusBase_extracted_capabilities_canonical_v0.2.json",
    "03_catalog/reports/canonical_prebenchmark_integrity_report.txt": "03_catalog/reports/canonical_prebenchmark_integrity_report.txt",
    "03_catalog/reports/final_stage3_report.txt": "03_catalog/reports/final_stage3_report.txt",
    "03_catalog/reports/stage3_baseline_provenance_report.txt": "03_catalog/reports/stage3_baseline_provenance_report.txt",
    "03_catalog/reports/stage3_failed_entities_report.txt": "03_catalog/reports/stage3_failed_entities_report.txt",
    "03_catalog/reports/stage3_full_batch_integrity_report.txt": "03_catalog/reports/stage3_full_batch_integrity_report.txt",
    "03_catalog/reports/stage3_full_batch_reconciliation.txt": "03_catalog/reports/stage3_full_batch_reconciliation.txt",
    "03_catalog/reports/stage3_full_batch_report.txt": "03_catalog/reports/stage3_full_batch_report.txt",
    "03_catalog/reports/stage3_full_reproducibility_report.txt": "03_catalog/reports/stage3_full_reproducibility_report.txt",
    "03_catalog/reports/stage3_new_patterns_report.txt": "03_catalog/reports/stage3_new_patterns_report.txt",
    "03_catalog/reports/stage3_v0.3_regression_report.txt": "03_catalog/reports/stage3_v0.3_regression_report.txt",
    "03_catalog/outputs/NexusBase_capability_catalog_v0.1.json": "03_catalog/outputs/NexusBase_capability_catalog_v0.1.json",
    "03_catalog/outputs/NexusBase_normalized_capabilities_v0.3.json": "03_catalog/outputs/NexusBase_normalized_capabilities_v0.3.json",
    "03_catalog/outputs/NexusBase_normalized_capabilities_v0.3_full.json": "03_catalog/outputs/NexusBase_normalized_capabilities_v0.3_full.json",
    "03_catalog/outputs/NexusBase_normalized_capabilities_v0.3_full_reproducible.json": "03_catalog/outputs/NexusBase_normalized_capabilities_v0.3_full_reproducible.json",
    "nexus_discovery.py": "04_benchmark/scripts/nexus_discovery.py",
    "run_benchmark.py": "04_benchmark/scripts/run_benchmark.py",
    "score.py": "04_benchmark/scripts/score.py",
    "generate_v0.2_diagnostic.py": "04_benchmark/scripts/generate_v0.2_diagnostic.py",
    "04_benchmark/baselines/baseline_prompt.md": "04_benchmark/baselines/baseline_prompt.md",
    "04_benchmark/inputs/benchmark.json": "04_benchmark/inputs/benchmark.json",
    "04_benchmark/reports/benchmark_v0.1_infrastructure_blocked.json": "04_benchmark/reports/benchmark_v0.1_infrastructure_blocked.json",
    "04_benchmark/reports/benchmark_v0.1_infrastructure_blocked.md": "04_benchmark/reports/benchmark_v0.1_infrastructure_blocked.md",
    "04_benchmark/reports/benchmark_v0.2_diagnostic_report.json": "04_benchmark/reports/benchmark_v0.2_diagnostic_report.json",
    "04_benchmark/reports/benchmark_v0.2_diagnostic_report.md": "04_benchmark/reports/benchmark_v0.2_diagnostic_report.md",
    "04_benchmark/reports/benchmark_v0.2_report.json": "04_benchmark/reports/benchmark_v0.2_report.json",
    "04_benchmark/reports/benchmark_v0.2_report.md": "04_benchmark/reports/benchmark_v0.2_report.md",
    "04_benchmark/scenarios/benchmark_v0.1_infrastructure_blocked_scenarios.json": "04_benchmark/scenarios/benchmark_v0.1_infrastructure_blocked_scenarios.json",
    "04_benchmark/scenarios/benchmark_v0.2_scenarios.json": "04_benchmark/scenarios/benchmark_v0.2_scenarios.json",
    "adapter.py": "05_shared/scripts/adapter.py",
    "check_output.py": "05_shared/scripts/check_output.py",
    "generate_report.py": "05_shared/scripts/generate_report.py",
    "generate_report_v2.py": "05_shared/scripts/generate_report_v2.py",
    "verify_quotes.py": "05_shared/scripts/verify_quotes.py",
    "05_shared/inputs/seed_index.json": "05_shared/inputs/seed_index.json",
    "05_shared/reports/verify_results.json": "05_shared/reports/verify_results.json",
    "archive/check_out.txt": "archive/check_out.txt",
    "archive/test_out.json": "archive/test_out.json",
}

# Add imports like `import score` to `from validation.04_benchmark.scripts import score`
# Actually, since python module paths don't allow `04_...`, we should fix python path or imports.
# Better to just replace strings with old basenames to new paths.
def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return

    # Replace string literals containing just the basename, or basename with relative paths.
    new_content = content
    for old_base, new_path in moves.items():
        if '.py' in old_base: continue
        # Find instances of 'basename' or "basename" and replace with new_path
        # Use regex to replace exact quoted string
        pattern = r"(['\"])(?:\./)?" + re.escape(old_base) + r"(['\"])"
        new_content = re.sub(pattern, r"\g<1>" + new_path.replace("\\", "/") + r"\g<2>", new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated paths in {filepath}")

for root, _, files in os.walk('.'):
    for f in files:
        if f.endswith('.py') or f.endswith('.md'):
            process_file(os.path.join(root, f))
