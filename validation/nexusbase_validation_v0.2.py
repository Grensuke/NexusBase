#!/usr/bin/env python3
"""
NexusBase validation pipeline v0.2

Purpose:
  1) Use ONLY the LLM-extracted capability catalog as the primary dataset.
     The hand-authored catalog is kept as a reference/audit dataset only.
  2) Evaluate every indexed entity against every benchmark scenario.
  3) Separate capability fit from constraint fit and evidence completeness.
  4) Use benchmark viable list ONLY after matching for evaluation scoring.

Inputs:
  - benchmark.json      scenario definitions and entity metadata
  - seed_index.json     license / cost metadata from the adapter
  - extracted catalog   LLM-extracted capabilities (from extract_capabilities_llm.py)

Outputs:
  - all-37 × all-scenarios matching matrix (JSON)
  - final validation report (Markdown)
"""
import json, re, sys
from collections import Counter, defaultdict
from pathlib import Path
from datetime import datetime, timezone

HERE = Path(__file__).parent
BENCHMARK_PATH  = HERE / 'benchmark.json'
SEED_INDEX_PATH = HERE / 'seed_index.json'
DEFAULT_CATALOG = HERE / 'NexusBase_extracted_capabilities_v0.2.json'
HAND_CATALOG    = HERE / 'NexusBase_capability_catalog_v0.1.json'

OUT_MATRIX = HERE / 'NexusBase_all_entity_matching_matrix_v0.2.json'
OUT_REPORT = HERE / 'NexusBase_validation_report_v0.2.md'


# ---------------------------------------------------------------------------
# Requirement → capability mapping  (decision 8: generic concepts only)
# ---------------------------------------------------------------------------
# Every alias is a plausible capability ID any LLM extractor might produce for
# any tool that satisfies the requirement.  No entity-specific feature names.

REQ_MAP = {
    'S01': {
        'capture exceptions from app SDKs': [
            'error_tracking', 'error_monitoring', 'exception_tracking',
            'crash_reporting', 'sdk_integration', 'error_capture',
        ],
        'stack traces with issue grouping': [
            'error_tracking', 'error_monitoring', 'issue_grouping',
            'stack_trace_analysis', 'error_grouping',
        ],
        'alerting': [
            'alerting', 'notifications', 'alert_integration',
            'webhook_notifications', 'email_notifications',
        ],
        'low operational footprint': [
            'self_hosted', 'lightweight_deployment', 'low_resource',
            'simple_deployment',
        ],
    },
    'S02': {
        'deploy from git or container image': [
            'git_deployment', 'git_push_deploy', 'container_deployment',
            'docker_deployment', 'application_deployment',
            'git_push_deployment',
        ],
        'runs on a single server': [
            'single_server', 'self_hosted', 'single_node_deployment',
            'single_server_deployment',
        ],
        'automatic TLS/domains': [
            'tls_automation', 'automatic_ssl', 'ssl_certificate',
            'domain_management', 'lets_encrypt', 'automatic_https',
            'https_support', 'domain_configuration',
        ],
    },
    'S03': {
        'HTTP/TCP uptime checks': [
            'http_monitoring', 'tcp_monitoring', 'uptime_monitoring',
            'health_check', 'endpoint_monitoring', 'http_tcp_monitoring',
        ],
        'notifications on failure': [
            'alerting', 'notifications', 'webhook_notifications',
            'failure_alerts', 'downtime_alerts',
        ],
        'public status page': [
            'status_page', 'public_status_page', 'uptime_dashboard',
            'status_pages',
        ],
    },
    'S04': {
        'boolean and percentage-rollout flags': [
            'feature_flags', 'feature_toggles', 'gradual_rollout',
            'percentage_rollout', 'feature_management', 'gradual_rollouts',
        ],
        'SDKs for common languages': [
            'sdk_integration', 'multi_language_sdk', 'client_sdk',
            'sdk_integrations', 'language_sdks',
        ],
        'A/B experiment analysis': [
            'ab_testing', 'experimentation', 'experiment_analysis',
            'split_testing',
        ],
    },
    'S05': {
        'PDF to Markdown/structured text': [
            'pdf_to_markdown', 'pdf_conversion', 'document_conversion',
            'pdf_parsing', 'document_parsing', 'pdf_extraction',
        ],
        'table extraction': [
            'table_extraction', 'table_recognition', 'table_detection',
            'table_parsing', 'table_formatting',
        ],
        'runs fully locally': [
            'local_execution', 'offline_capable', 'local_processing',
            'cpu_inference', 'local_acceleration',
        ],
    },
    'S06': {
        'speech-to-text with timestamps': [
            'speech_to_text', 'transcription', 'word_timestamps',
            'timestamp_output', 'segment_timestamps',
        ],
        'runs offline': [
            'local_execution', 'offline_capable', 'cpu_inference',
            'local_processing',
        ],
        'reasonable speed on CPU or consumer GPU': [
            'cpu_inference', 'gpu_inference', 'quantization',
            'fast_inference', 'gpu_acceleration',
        ],
    },
    'S07': {
        'speech-to-text with timestamps': [
            'speech_to_text', 'transcription', 'word_timestamps',
            'timestamp_output', 'segment_timestamps',
        ],
        'speaker diarization': [
            'speaker_diarization', 'speaker_identification',
            'diarization', 'speaker_labeling',
        ],
        'runs offline': [
            'local_execution', 'offline_capable', 'cpu_inference',
            'local_processing',
        ],
    },
    'S08': {
        'Redis protocol compatibility': [
            'redis_compatibility', 'redis_protocol', 'redis_compatible',
            'redis_client_compatibility', 'redis_protocol_compatibility',
        ],
        'OSI-approved license for the version recommended': ['__LICENSE__'],
    },
    'S09': {
        'Terraform-style declarative provisioning': [
            'infrastructure_as_code', 'declarative_provisioning',
            'terraform_compatible', 'terraform_workflow_compatibility',
        ],
        'existing Terraform provider ecosystem compatibility': [
            'provider_compatibility', 'terraform_provider',
            'provider_ecosystem', 'terraform_provider_support',
        ],
    },
    'S10': {
        'full-text search over Postgres data': [
            'full_text_search', 'text_search', 'search_index',
            'postgres_search', 'postgres_full_text_search',
        ],
        'no new service to run': [
            'postgres_extension', 'in_database', 'no_external_service',
            'no_additional_service', 'embedded_search',
        ],
        'relevance ranking': [
            'relevance_ranking', 'search_ranking', 'bm25',
            'bm25_ranking', 'scoring',
        ],
    },
    'S11': {
        'render OpenAPI spec as docs': [
            'openapi_documentation', 'api_documentation',
            'openapi_rendering', 'spec_rendering', 'openapi_docs',
            'api_spec_rendering', 'api_reference',
        ],
        'try-it-out / interactive requests': [
            'interactive_api', 'try_it_out', 'api_playground',
            'api_testing', 'interactive_api_testing', 'request_testing',
        ],
    },
    'S12': {
        'Python job queue with retries': [
            'task_queue', 'job_queue', 'background_jobs',
            'retry_support', 'task_retry', 'retries',
            'task_processing',
        ],
        'uses existing Postgres, no new broker': [
            'postgres_backend', 'postgres_broker', 'no_external_broker',
            'postgres_backed_queue', 'database_backed_queue',
        ],
        'scheduled/periodic jobs': [
            'scheduled_tasks', 'periodic_tasks', 'cron_jobs',
            'scheduled_jobs', 'task_scheduling',
        ],
    },
    'S13': {
        'speech-to-text': [
            'speech_to_text', 'transcription', 'audio_transcription',
        ],
        'semantic search over transcripts': [
            'semantic_search', 'vector_search', 'embedding_search',
            'similarity_search', 'embeddings', 'vector_database',
        ],
        'simple UI to browse and query': [
            'web_ui', 'dashboard', 'query_interface', 'search_ui',
        ],
    },
    'S14': {
        'automatic COBOL to Java translation': [],
        'guaranteed behavioral equivalence':   [],
    },
    'S15': {},
}

# Licensing caveats that make a nominally-satisfied license constraint
# "unresolved" (decision 7).
LICENSE_CAVEAT_TERMS = {
    'license', 'terms', 'commercial', 'additional terms',
    'weights', 'separate license', 'gated',
}


# ---------------------------------------------------------------------------
# Constraint evaluation  (decision 7: separate from capability fit)
# ---------------------------------------------------------------------------

def license_state(constraint, license_class, has_caveat=False):
    """satisfied | violated | unresolved"""
    if not constraint:
        return 'satisfied'
    if license_class in ('mixed', 'custom', 'unverified', 'unknown'):
        return 'unresolved'
    if has_caveat:
        return 'unresolved'
    if constraint == 'osi_open_source':
        return 'satisfied' if license_class in ('permissive', 'copyleft') else 'violated'
    if constraint == 'permissive':
        return 'satisfied' if license_class == 'permissive' else 'violated'
    return 'satisfied'


def hosting_state(capset, desired):
    """Evaluate hosting constraint against entity capabilities."""
    if desired in (None, 'any'):
        return 'satisfied'
    hosting_caps = {
        'self_hosted': {
            'self_hosted', 'self_hostable', 'single_server',
            'single_server_deployment', 'single_node_deployment',
        },
        'local': {
            'local_execution', 'offline_capable', 'cpu_inference',
            'gpu_inference', 'local_processing', 'local_acceleration',
        },
    }
    relevant = hosting_caps.get(desired, set())
    # Absence of evidence is not evidence of absence → unresolved, not violated
    return 'satisfied' if capset & relevant else 'unresolved'


def cost_state(seed_entry, desired):
    if desired != 'free':
        return 'satisfied'
    return ('satisfied'
            if seed_entry.get('cost_model') == 'free_oss'
            else 'unresolved')


# ---------------------------------------------------------------------------
# Requirement matching  (decision 6: all 37 entities)
# ---------------------------------------------------------------------------

def requirement_coverage(capset, aliases, lic_constraint, license_class,
                         has_license_caveat):
    """Check if an entity's capabilities cover a requirement.

    Returns (coverage, matched_capabilities).
    """
    if '__LICENSE__' in aliases:
        st = license_state(lic_constraint, license_class, has_license_caveat)
        return ('full' if st == 'satisfied' else st), ['license']
    if not aliases:
        return 'none', []
    hits = [a for a in aliases if a in capset]
    return ('full', hits) if hits else ('none', [])


# ---------------------------------------------------------------------------
# Evidence completeness
# ---------------------------------------------------------------------------

def evidence_summary(entity_entry):
    caps = entity_entry.get('capabilities', [])
    if not caps:
        return {'total': 0, 'high': 0, 'medium': 0, 'low': 0, 'explicit': 0}
    conf = Counter(c.get('confidence', 'medium') for c in caps)
    types = Counter(
        c.get('evidence', {}).get('evidence_type', 'unknown') for c in caps)
    return {
        'total': len(caps),
        'high': conf.get('high', 0),
        'medium': conf.get('medium', 0),
        'low': conf.get('low', 0),
        'explicit': types.get('explicit_statement', 0),
    }


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run_pipeline(catalog_path: Path):
    benchmark   = json.loads(BENCHMARK_PATH.read_text(encoding='utf-8'))
    seed        = json.loads(SEED_INDEX_PATH.read_text(encoding='utf-8'))
    seed_by_id  = {s['id']: s for s in seed['solutions']}
    catalog     = json.loads(catalog_path.read_text(encoding='utf-8'))
    now         = datetime.now(timezone.utc).isoformat(timespec='seconds')

    # Build capability sets from extracted catalog
    capsets: dict[str, set[str]] = {}
    for eid in benchmark['entities']:
        ent = catalog.get('entities', {}).get(eid, {})
        caps = ent.get('capabilities', [])
        capsets[eid] = set(
            c.get('capability_id', c.get('id', '')) for c in caps)

    matrix = {
        'meta': {
            'version': 'v0.2',
            'generated_at': now,
            'catalog_source': catalog_path.name,
            'catalog_mode': catalog.get('mode', 'unknown'),
            'candidate_selection': ('ALL indexed entities; benchmark viable '
                                    'list used ONLY after matching for scoring'),
            'evidence_policy': ('Only LLM-extracted, span-verified '
                                'capabilities used for matching'),
            'separation': ('Capability fit, constraint fit, evidence '
                           'completeness, and compatibility evaluated independently'),
        },
        'scenarios': {},
    }

    all_eids = list(benchmark['entities'].keys())

    for sc in benchmark['scenarios']:
        sid = sc['id']
        lic_constraint  = sc.get('constraints', {}).get('license')
        host_constraint = sc.get('constraints', {}).get('hosting')
        cost_constraint = sc.get('constraints', {}).get('cost')

        candidates = []

        for eid in all_eids:
            bench_ent  = benchmark['entities'][eid]
            seed_ent   = seed_by_id.get(eid, {})
            catalog_ent = catalog.get('entities', {}).get(eid, {})
            license_class = seed_ent.get('license_class', 'unknown')

            # Check for license caveats  (decision 7)
            caveat = bench_ent.get('caveat', '')
            has_lcaveat = bool(caveat and any(
                t in caveat.lower() for t in LICENSE_CAVEAT_TERMS))

            # ── 1. Capability fit ──
            req_rows = []
            for req in sc.get('requirements', []):
                aliases = REQ_MAP.get(sid, {}).get(req['name'], [])
                cov, hits = requirement_coverage(
                    capsets[eid], aliases,
                    lic_constraint, license_class, has_lcaveat)
                req_rows.append({
                    'requirement': req['name'],
                    'priority':    req['priority'],
                    'coverage':    cov,
                    'matched_capabilities': hits,
                })

            must = [r for r in req_rows if r['priority'] == 'must_have']
            if sid == 'S15':
                capability_fit = 'not_applicable'
            elif not must:
                capability_fit = 'no_requirements'
            elif all(r['coverage'] == 'full' for r in must):
                capability_fit = 'full'
            else:
                met = sum(1 for r in must if r['coverage'] == 'full')
                capability_fit = f'partial_{met}/{len(must)}'

            # ── 2. Constraint fit  (separate from capability fit) ──
            constraint_states = {}
            if lic_constraint is not None:
                constraint_states['license'] = license_state(
                    lic_constraint, license_class, has_lcaveat)
            if host_constraint is not None:
                constraint_states['hosting'] = hosting_state(
                    capsets[eid], host_constraint)
            if cost_constraint is not None:
                constraint_states['cost'] = cost_state(
                    seed_ent, cost_constraint)

            has_violated   = any(v == 'violated'   for v in constraint_states.values())
            has_unresolved = any(v == 'unresolved' for v in constraint_states.values())
            if has_violated:
                constraint_fit = 'violated'
            elif has_unresolved:
                constraint_fit = 'unresolved'
            else:
                constraint_fit = 'satisfied'

            # ── 3. Evidence completeness ──
            ev = evidence_summary(catalog_ent)

            # ── 4. Eligibility  (three-state constraint handling, decision 7) ──
            must_met = capability_fit == 'full'
            if must_met and constraint_fit == 'satisfied':
                eligibility = 'eligible'
            elif must_met and constraint_fit == 'unresolved':
                eligibility = 'eligible_with_unresolved_constraints'
            else:
                eligibility = 'ineligible'

            candidates.append({
                'entity':            eid,
                'name':              bench_ent['name'],
                'capability_fit':    capability_fit,
                'constraint_fit':    constraint_fit,
                'constraint_states': constraint_states,
                'evidence_summary':  ev,
                'compatibility_fit': 'unverified',
                'eligibility':       eligibility,
                'requirements':      req_rows,
            })

        # ── Evaluation  (benchmark viable used ONLY here, after matching) ──
        discovered = [c['entity'] for c in candidates
                      if c['eligibility'] in ('eligible',
                                              'eligible_with_unresolved_constraints')]
        expected = set(sc.get('viable', []))

        matrix['scenarios'][sid] = {
            'domain':  sc['domain'],
            'problem': sc['problem'],
            'expected_viable': sorted(expected),
            'discovered_candidates': discovered,
            'discovered_with_unresolved': [
                c['entity'] for c in candidates
                if c['eligibility'] == 'eligible_with_unresolved_constraints'],
            'candidate_recall': (
                len(set(discovered) & expected) / len(expected)
                if expected else None),
            'false_positive_candidates': [
                e for e in discovered if e not in expected],
            'candidates': candidates,
        }

    OUT_MATRIX.write_text(
        json.dumps(matrix, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f'Wrote matrix: {OUT_MATRIX}')

    generate_validation_report(matrix, catalog, benchmark)

    print('\nScenario discovery:')
    for sid, s in matrix['scenarios'].items():
        ur = s.get('discovered_with_unresolved', [])
        print(f'{sid}  expected={s["expected_viable"]}  '
              f'discovered={s["discovered_candidates"]}  '
              f'unresolved={ur}  fp={s["false_positive_candidates"]}  '
              f'recall={s["candidate_recall"]}')


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------

def generate_validation_report(matrix, catalog, benchmark):
    lines = [
        '# NexusBase Validation Report v0.2',
        '',
        f'Generated: {matrix["meta"]["generated_at"]}',
        f'Catalog: {matrix["meta"]["catalog_source"]} '
        f'(mode: {matrix["meta"]["catalog_mode"]})',
        '',
        '## Methodology',
        '- **Primary dataset**: LLM-extracted capability catalog '
        '(hand-authored catalog used only as reference)',
        '- **Candidate selection**: ALL 37 indexed entities evaluated '
        'for every scenario',
        '- **Answer key usage**: Benchmark `viable` list used ONLY after '
        'matching for recall/FP scoring',
        '- **Separation of concerns**: Capability fit, constraint fit, '
        'evidence completeness, and compatibility evaluated independently',
        '- **Constraint handling**: Unverified constraints classified as '
        '`unresolved`, not automatically invalid',
        '',
    ]

    # ── scenario table ──
    recalls = []
    total_fp = 0
    total_unresolved = 0

    lines.append('## Scenario Results')
    lines.append('')
    lines.append('| Scenario | Domain | Expected | Discovered '
                 '| With Unresolved | FPs | Recall |')
    lines.append('|----------|--------|----------|----------'
                 '--|-----------------|-----|--------|')

    for sid, s in matrix['scenarios'].items():
        exp  = ', '.join(s['expected_viable']) or '—'
        disc = ', '.join(s['discovered_candidates']) or '—'
        ur   = ', '.join(s.get('discovered_with_unresolved', [])) or '—'
        fps  = ', '.join(s['false_positive_candidates']) or '—'
        rc   = (f'{s["candidate_recall"]:.2f}'
                if s['candidate_recall'] is not None else 'n/a')
        lines.append(f'| {sid} | {s["domain"]} | {exp} | {disc} '
                     f'| {ur} | {fps} | {rc} |')
        if s['candidate_recall'] is not None:
            recalls.append(s['candidate_recall'])
        total_fp += len(s['false_positive_candidates'])
        total_unresolved += len(s.get('discovered_with_unresolved', []))

    # ── aggregate metrics ──
    mean_rc = sum(recalls) / len(recalls) if recalls else 0
    lines += [
        '',
        '## Aggregate Metrics',
        f'- Mean candidate recall: **{mean_rc:.2f}** '
        f'(across {len(recalls)} scenarios with expected viables)',
        f'- Total false positives: **{total_fp}**',
        f'- Total candidates with unresolved constraints: '
        f'**{total_unresolved}**',
        '',
    ]

    # ── catalog stats ──
    if catalog.get('entities'):
        tc = sum(len(e.get('capabilities', []))
                 for e in catalog['entities'].values())
        tr = sum(len(e.get('rejected', []))
                 for e in catalog['entities'].values())
        ec = sum(1 for e in catalog['entities'].values()
                 if e.get('capabilities'))
        lines += [
            '## Catalog Statistics',
            f'- Entities in catalog: **{len(catalog["entities"])}**',
            f'- Entities with capabilities: **{ec}**',
            f'- Total accepted capabilities: **{tc}**',
            f'- Total rejected by validation: **{tr}**',
            '',
        ]

    lines += [
        '## What this proves',
        '- The benchmark matrix does not copy the answer key when '
        'choosing candidates.',
        '- Capability fit, constraint fit, and evidence completeness '
        'are independently evaluated.',
        '- Unverified constraints are classified as "unresolved" rather '
        'than silently accepted or rejected.',
        '- The pipeline is ready for end-to-end comparison once LLM '
        'extraction runs with an API key.',
        '',
        '## What this still does not prove',
        '- Semantic correctness of LLM-extracted capabilities '
        '(requires human review).',
        '- Live compatibility verification between composed tools.',
        '- Comparison against the external baseline '
        '(requires baseline results).',
    ]

    OUT_REPORT.write_text('\n'.join(lines), encoding='utf-8')
    print(f'Wrote report: {OUT_REPORT}')


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser(
        description='NexusBase validation pipeline v0.2')
    ap.add_argument('--catalog', type=Path, default=DEFAULT_CATALOG,
                    help='Path to extracted capability catalog')
    args = ap.parse_args()

    if not args.catalog.exists():
        print(f'ERROR: Catalog not found: {args.catalog}')
        print('Run extract_capabilities_llm.py first to generate the catalog.')
        sys.exit(1)

    run_pipeline(args.catalog)
