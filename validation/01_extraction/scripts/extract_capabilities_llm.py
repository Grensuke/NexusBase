#!/usr/bin/env python3
"""
NexusBase capability extractor v0.2.

Source resolution:
  Entity IDs and repo metadata come from benchmark.json — the extractor never
  sees hand-authored capability labels or benchmark viable lists.
  Source URLs are resolved from repository metadata.

  V0.2 supports:
    - GitHub README files (constructed from repo metadata)
    - Supplemental documentation URLs (configurable per entity)
  The architecture supports extending to PyPI/npm pages, official docs
  crawlers, release notes, etc.

Evidence requirements:
  Every extracted capability must contain:
    capability_id, source_url, exact contiguous evidence quote/span,
    evidence_type, extraction confidence.
  Capabilities are rejected if the evidence span cannot be located exactly.

Confidence policy:
  Generic fragments like "Python", "JavaScript", "disable_ocr" are NOT
  accepted as high-confidence evidence. A capability requires an explicit
  capability statement or sufficiently strong surrounding evidence.

Environment:
  NEXUSBASE_LLM_BASE_URL  (default: https://api.openai.com/v1)
  NEXUSBASE_LLM_API_KEY   required for live extraction
  NEXUSBASE_LLM_MODEL     required for live extraction

Modes:
  --dry-run    Resolve sources, validate pipeline, skip LLM calls.
  (default)    Full extraction with LLM API calls.
"""
from __future__ import annotations
import argparse, json, os, re, sys, time, urllib.request, urllib.error
from pathlib import Path
from datetime import datetime, timezone

HERE = Path(__file__).parent
PROMPT_PATH = HERE / '01_extraction/inputs/NexusBase_capability_extraction_prompt_v0.2.md'
PROMPT_STAGE2_PATH = HERE / '02_normalization/inputs/NexusBase_capability_normalization_prompt_v0.2.md'
BENCHMARK_PATH = HERE / '04_benchmark/inputs/benchmark.json'
DEFAULT_OUT = HERE / '01_extraction/outputs/NexusBase_extracted_capabilities_v0.2.json'
DEFAULT_REPORT = HERE / '01_extraction/reports/NexusBase_extraction_report_v0.2.md'


# ---------------------------------------------------------------------------
# Source resolution
# ---------------------------------------------------------------------------

README_NAMES = ['README.md', 'readme.md', 'README.rst', 'README']

# Supplemental documentation sources for entities where the GitHub README is
# insufficient or unavailable.  Keyed by entity ID.
SUPPLEMENTAL_SOURCES: dict[str, list[tuple[str, str]]] = {
    'pg_fts': [
        ('https://www.postgresql.org/docs/current/textsearch.html', 'official_docs'),
    ],
    'opentofu': [
        ('https://opentofu.org/docs/intro/', 'official_docs'),
    ],
}


def resolve_sources(entity_id: str, repo: str) -> list[tuple[str, str]]:
    """Return ordered list of (url, source_type) to try.

    V0.2 resolves from repo metadata; future versions can add PyPI/npm
    pages, scraped docs, release notes, etc.
    """
    sources = []
    for name in README_NAMES:
        sources.append((
            f'https://raw.githubusercontent.com/{repo}/HEAD/{name}',
            'readme',
        ))
    for url, stype in SUPPLEMENTAL_SOURCES.get(entity_id, []):
        sources.append((url, stype))
    return sources


# ---------------------------------------------------------------------------
# HTTP fetching
# ---------------------------------------------------------------------------

def github_raw(url: str) -> str:
    """Convert GitHub blob URLs to raw URLs."""
    url = url.split('?')[0]
    m = re.match(r'https://github\.com/([^/]+)/([^/]+)/blob/([^/]+)/(.+)$', url)
    if m:
        return (f'https://raw.githubusercontent.com/'
                f'{m.group(1)}/{m.group(2)}/{m.group(3)}/{m.group(4)}')
    return url


def fetch(url: str, timeout: int = 30) -> str:
    target = github_raw(url)
    req = urllib.request.Request(
        target, headers={'User-Agent': 'nexusbase-capability-extractor/0.2'})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode('utf-8', 'replace')


def fetch_first_source(entity_id: str, repo: str
                       ) -> tuple[str | None, str | None, str | None, list[str]]:
    """Try sources in priority order.  Return (url, source_type, text, errors)."""
    sources = resolve_sources(entity_id, repo)
    errors: list[str] = []
    for url, source_type in sources:
        try:
            text = fetch(url)
            if len(text) < 100:
                errors.append(f'{url}: too short ({len(text)} chars)')
                continue
            return url, source_type, text, errors
        except Exception as exc:
            errors.append(f'{url}: {type(exc).__name__}')
    return None, None, None, errors


# ---------------------------------------------------------------------------
# Span verification
# ---------------------------------------------------------------------------

def normalize_for_match(text: str) -> str:
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    return re.sub(r'[ \t]+', ' ', text)


def generate_blocks(text: str) -> tuple[str, dict[str, dict]]:
    """Splits text into deterministic blocks, returns (blocked_text, block_map)."""
    block_map = {}
    lines = text.splitlines(keepends=True)
    result_pieces = []
    i = 0
    block_id_counter = 1
    while i < len(lines):
        line = lines[i]
        if line.strip() == '':
            result_pieces.append(line)
            i += 1
            continue
            
        block_start_idx = sum(len(l) for l in lines[:i])
        block_lines = [line]
        
        j = i + 1
        while j < len(lines):
            next_line = lines[j]
            if next_line.strip() == '':
                break
            if re.match(r'^\s*([-*+]|\d+\.)\s', next_line) or re.match(r'^\s*#+\s', next_line):
                break
            block_lines.append(next_line)
            j += 1
            
        block_text_val = "".join(block_lines)
        b_id = f"B{block_id_counter:03d}"
        block_id_counter += 1
        
        block_map[b_id] = {
            'start': block_start_idx,
            'end': block_start_idx + len(block_text_val),
            'text': block_text_val
        }
        
        result_pieces.append(f"[{b_id}] " + block_text_val)
        i = j
        
    return "".join(result_pieces), block_map


# ---------------------------------------------------------------------------
# Confidence gating  (decision 5)
# ---------------------------------------------------------------------------

GENERIC_FRAGMENTS = {
    'python', 'javascript', 'java', 'go', 'rust', 'typescript', 'android',
    'ios', 'c', 'c++', 'ruby', 'php', 'swift', 'kotlin', 'node', 'react',
    'vue', 'angular', 'docker', 'linux', 'windows', 'macos',
}

CLI_FLAG_RE = re.compile(r'^--?[a-z_][a-z0-9_-]*$')
CODE_IDENT_RE = re.compile(r'^[a-z_][a-z0-9_.()\"]*$', re.I)

EXPLICIT_CUES = re.compile(
    r'\b(support|supports|provide|provides|platform|tool|library|server|'
    r'compatible|compatibility|deploy|deployment|monitor|monitoring|tracking|'
    r'search|convert|conversion|parse|parsing|run|runs|running|self[- ]host|'
    r'local|offline|sdk|api|webhook|export|generate|transcrib|diarization|'
    r'rollout|testing|queue|retry|retries|ranking|documentation|docs|'
    r'status|notification|alert|embedding|vector|feature flag|persistence|'
    r'extension|plugin|integration|diarization|recognition|detection)\b', re.I)


def gate_confidence(quote: str, original: str) -> tuple[str, str | None]:
    """Gate confidence for generic / short fragments.

    Returns (adjusted_confidence, rejection_reason_or_None).
    If rejection_reason is set and confidence is 'rejected', drop the claim.
    """
    norm = quote.strip().lower()
    words = norm.split()

    if len(words) <= 1 and norm in GENERIC_FRAGMENTS:
        return 'rejected', ('single generic language/technology name is not '
                            'capability evidence')

    if len(words) <= 1 and (CLI_FLAG_RE.match(norm) or CODE_IDENT_RE.match(norm)):
        if not EXPLICIT_CUES.search(norm):
            return 'rejected', ('CLI flag or code identifier alone is not '
                                'a capability statement')

    if len(words) <= 2 and not EXPLICIT_CUES.search(quote):
        return 'low', f'short quote without explicit capability cue; downgraded from {original}'

    return original, None


# ---------------------------------------------------------------------------
# Evidence-type classification (decision 4)
# ---------------------------------------------------------------------------

def classify_evidence_type(quote: str) -> str:
    """Classify the type of evidence a quote provides."""
    if EXPLICIT_CUES.search(quote):
        return 'explicit_statement'
    if len(quote.split()) > 5:
        return 'descriptive_context'
    return 'fragment'


# ---------------------------------------------------------------------------
# LLM call  (decision 2: no hand-authored labels sent)
# ---------------------------------------------------------------------------

def call_llm_stage1(source_url: str, entity_id: str, chunk: str) -> dict:
    """Call the LLM.  Sends ONLY entity ID + raw chunk text."""
    api_key = os.environ.get('NEXUSBASE_LLM_API_KEY')
    base_url = os.environ.get('NEXUSBASE_LLM_BASE_URL',
                              'https://api.openai.com/v1').rstrip('/')
    model = os.environ.get('NEXUSBASE_LLM_MODEL')
    if not api_key or not model:
        raise RuntimeError(
            'Set NEXUSBASE_LLM_API_KEY and NEXUSBASE_LLM_MODEL.')

    prompt = PROMPT_PATH.read_text(encoding='utf-8')
    body = {
        'model': model,
        'temperature': 0,
        'response_format': {'type': 'json_object'},
        'reasoning_effort': 'none', # Disabling reasoning tokens to avoid timeout on local extraction
        'messages': [
            {'role': 'system', 'content': prompt},
            {'role': 'user', 'content': json.dumps({
                'entity': entity_id,
                'source_url': source_url,
                'source_text': chunk,
            }, ensure_ascii=False)},
        ],
    }
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(
        base_url + '/chat/completions', data=data,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'nexusbase-capability-extractor/0.2',
        },
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        payload = json.loads(resp.read().decode('utf-8'))
    return json.loads(payload['choices'][0]['message']['content'])


def call_llm_stage2(entity_id: str, block_text: str) -> dict:
    """Call the LLM for Stage 2 normalization."""
    api_key = os.environ.get('NEXUSBASE_LLM_API_KEY')
    base_url = os.environ.get('NEXUSBASE_LLM_BASE_URL',
                              'https://api.openai.com/v1').rstrip('/')
    model = os.environ.get('NEXUSBASE_LLM_MODEL')

    prompt = PROMPT_STAGE2_PATH.read_text(encoding='utf-8')
    body = {
        'model': model,
        'temperature': 0,
        'response_format': {'type': 'json_object'},
        'reasoning_effort': 'none',
        'messages': [
            {'role': 'system', 'content': prompt},
            {'role': 'user', 'content': json.dumps({
                'entity': entity_id,
                'source_block_text': block_text,
            }, ensure_ascii=False)},
        ],
    }
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(
        base_url + '/chat/completions', data=data,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'nexusbase-capability-extractor/0.2',
        },
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        payload = json.loads(resp.read().decode('utf-8'))
    return json.loads(payload['choices'][0]['message']['content'])


# ---------------------------------------------------------------------------
# Post-extraction validation  (decisions 4, 5)
# ---------------------------------------------------------------------------

def deduplicate_capabilities(caps: list[dict]) -> list[dict]:
    def simplify(s): return re.sub(r'[^a-z0-9]', '', str(s).lower())
    grouped = {}
    for cap in caps:
        cid = cap.get('capability_id') or cap.get('id', '')
        lbl = cap.get('label', '')
        key = simplify(cid) + '_' + simplify(lbl)
        if key not in grouped: grouped[key] = []
        grouped[key].append(cap)
    deduped = []
    for group in grouped.values():
        best = max(group, key=lambda c: len(str(c.get('evidence', {}).get('quote', ''))))
        deduped.append(best)
    return deduped

def is_heuristic_quality_passed(quote: str, label: str, entity_name: str) -> tuple[bool, str]:
    q_norm = quote.strip().lower()
    words = q_norm.split()
    if q_norm == entity_name.lower():
        return False, "only a product/entity name"
    if len(words) == 1 and q_norm in GENERIC_FRAGMENTS:
        return False, "only a generic technology word"
    GENERIC_HEADINGS = {'features', 'installation', 'quick start', 'getting started', 'overview', 'introduction', 'usage', 'configuration', 'documentation', 'license', 'support', 'about', 'requirements'}
    if q_norm in GENERIC_HEADINGS:
        return False, "only a generic heading with no capability-specific meaning"
    MARKETING_PHRASES = {'blazing fast', 'world class', 'industry leading', 'next generation', 'easy to use', 'simple to use', 'robust', 'powerful', 'flexible'}
    if q_norm in MARKETING_PHRASES:
        return False, "vague adjective or marketing phrase"
    if len(words) <= 3:
        lbl_w = set(re.findall(r'[a-z0-9]+', label.lower()))
        qt_w = set(re.findall(r'[a-z0-9]+', q_norm))
        if lbl_w and not (lbl_w & qt_w) and not EXPLICIT_CUES.search(q_norm):
            return False, "short quote does not explicitly support the capability label"
    return True, "valid"

def validate_extraction(entity_id: str, entity_name: str, source_url: str, source_type: str,
                        source_text: str, extracted: dict, block_map: dict) -> dict:
    """Validate extracted capabilities against source text."""
    now = datetime.now(timezone.utc).isoformat(timespec='seconds')
    out: dict = {
        'entity_id': entity_id,
        'source_url': source_url,
        'source_type': source_type,
        'capabilities': [],
        'deployment_models': [],
        'rejected': [],
        'metrics': {}
    }
    caps = extracted.get('capabilities', [])
    deps = extracted.get('deployment_models', [])
    out['metrics']['candidates_generated'] = len(caps) + len(deps)

    def validate_items(items: list[dict], is_deployment: bool):
        accepted = []
        for cap in items:
            cid = str(cap.get('capability_id') or cap.get('id', '')).strip()
            label = str(cap.get('label', '')).strip()
            conf = str(cap.get('confidence', '')).strip()
            evidence_blocks = cap.get('evidence_blocks', [])

            if not cid or not label or not evidence_blocks or not isinstance(evidence_blocks, list) or conf not in ('high', 'medium', 'low'):
                out['rejected'].append({
                    'capability_id': cid or '(empty)', 'label': label,
                    'reason': 'invalid output shape or missing fields', 'quote': '',
                })
                continue

            prov_valid = True
            heur_passed = False
            
            quotes = []
            min_start = float('inf')
            max_end = -1
            rej_reason = ''
            
            for b_id in evidence_blocks:
                if b_id not in block_map:
                    prov_valid = False
                    rej_reason = f'invalid block reference: {b_id}'
                    break
                b_info = block_map[b_id]
                quotes.append(b_info['text'])
                min_start = min(min_start, b_info['start'])
                max_end = max(max_end, b_info['end'])
                
            if not prov_valid:
                quote = ''
            else:
                quote = source_text[min_start:max_end]
                if is_deployment:
                    sv, sr = True, "valid"
                else:
                    sv, sr = is_heuristic_quality_passed(quote, label, entity_name)
                
                if not sv:
                    rej_reason = sr
                else:
                    heur_passed = True

            if not prov_valid or not heur_passed:
                out['rejected'].append({
                    'capability_id': cid, 'label': label, 'reason': rej_reason,
                    'quote': quote if prov_valid else str(evidence_blocks), 'confidence': conf,
                    'provenance_valid': prov_valid, 'heuristic_quality_passed': heur_passed
                })
                continue

            if is_deployment:
                gated_conf, rejection = conf, None
            else:
                gated_conf, rejection = gate_confidence(quote, conf)
                
            if gated_conf == 'rejected':
                out['rejected'].append({
                    'capability_id': cid, 'label': label, 'reason': rejection,
                    'quote': quote if prov_valid else str(evidence_blocks), 'original_confidence': conf,
                    'provenance_valid': prov_valid, 'heuristic_quality_passed': heur_passed
                })
                continue

            accepted.append({
                'capability_id': cid, 'label': label, 'confidence': gated_conf,
                'evidence': {
                    'source_url': source_url, 'evidence_type': classify_evidence_type(quote),
                    'quote': quote, 'start': min_start, 'end': max_end, 'match_mode': 'block_derived',
                    'evidence_blocks': evidence_blocks,
                },
                'provenance_valid': prov_valid, 'heuristic_quality_passed': heur_passed,
                'validated_at': now,
            })
        return accepted

    out['capabilities'] = validate_items(caps, False)
    out['deployment_models'] = validate_items(deps, True)
    
    out['metrics']['candidates_passing_exact_span'] = len(out['capabilities']) + len(out['deployment_models'])
    out['metrics']['candidates_passing_validation_before_dedup'] = len(out['capabilities']) + len(out['deployment_models'])
    
    out['capabilities'] = deduplicate_capabilities(out['capabilities'])
    out['deployment_models'] = deduplicate_capabilities(out['deployment_models'])
    
    out['metrics']['final_accepted'] = len(out['capabilities'])
    out['metrics']['final_accepted_deployments'] = len(out['deployment_models'])
    out['metrics']['final_rejected'] = len(out['rejected'])

    return out


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------

def generate_report(results: dict, report_path: Path) -> None:
    lines = [
        '# NexusBase Extraction & Evidence Validation Report v0.2',
        '',
        f'Generated: {results["generated_at"]}',
        f'Mode: {results["mode"]}',
    ]
    if results.get('model'):
        lines.append(f'Model: {results["model"]}')
    lines.append('')

    total_caps = total_rej = entities_with = entities_no_source = 0
    conf_c: dict[str, int] = {}
    et_c: dict[str, int] = {}

    for ent in results['entities'].values():
        caps = ent.get('capabilities', [])
        rej  = ent.get('rejected', [])
        total_caps += len(caps)
        total_rej  += len(rej)
        if caps:
            entities_with += 1
        if ent.get('status') in ('no_source_fetched',):
            entities_no_source += 1
        for c in caps:
            k = c.get('confidence', 'medium')
            conf_c[k] = conf_c.get(k, 0) + 1
            e = c.get('evidence', {}).get('evidence_type', 'unknown')
            et_c[e] = et_c.get(e, 0) + 1

    lines += [
        '## Summary',
        f'- Entities processed: **{len(results["entities"])}**',
        f'- Entities with capabilities: **{entities_with}**',
        f'- Entities with no source: **{entities_no_source}**',
        f'- Total accepted capabilities: **{total_caps}**',
        f'- Total rejected: **{total_rej}**',
        '',
        '## Confidence Distribution',
    ]
    for k in ('high', 'medium', 'low'):
        if conf_c.get(k):
            lines.append(f'- {k}: **{conf_c[k]}**')
    lines += ['', '## Evidence Type Distribution']
    for k, v in sorted(et_c.items()):
        lines.append(f'- {k}: **{v}**')
    lines += ['', '## Per-Entity Detail']

    for eid in sorted(results['entities']):
        ent = results['entities'][eid]
        caps = ent.get('capabilities', [])
        rej  = ent.get('rejected', [])
        st   = ent.get('status', 'extracted')
        url  = ent.get('source_url', 'n/a')
        stype = ent.get('source_type', 'n/a')
        lines.append(f'### {eid}')
        lines.append(f'- Status: {st}')
        lines.append(f'- Source: {stype} — {url}')
        lines.append(f'- Accepted: {len(caps)}, Rejected: {len(rej)}')
        for c in caps:
            q = c['evidence']['quote'][:80]
            lines.append(f'  - ✅ `{c["capability_id"]}` ({c["confidence"]}): '
                         f'"{q}"')
        for r in rej:
            lines.append(f'  - ❌ `{r.get("capability_id","?")}`: {r["reason"]}')
        lines.append('')

    report_path.write_text('\n'.join(lines), encoding='utf-8')


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(
        description='NexusBase capability extractor v0.2')
    ap.add_argument('--dry-run', action='store_true',
                    help='Resolve sources, validate pipeline, skip LLM calls')
    ap.add_argument('--entity', action='append',
                    help='Extract only these entity IDs (repeatable)')
    ap.add_argument('--max-chars', type=int, default=24000,
                    help='Max source chars sent to LLM (default: 24000)')
    ap.add_argument('--out', type=Path, default=DEFAULT_OUT,
                    help='Output path for extracted catalog')
    ap.add_argument('--report', type=Path, default=DEFAULT_REPORT,
                    help='Output path for extraction report')
    ap.add_argument('--resume', action='store_true',
                    help='Resume extraction from the existing output file')
    args = ap.parse_args()

    # Entity discovery from benchmark.json — NOT from hand-authored catalog
    benchmark = json.loads(BENCHMARK_PATH.read_text(encoding='utf-8'))
    entities = benchmark['entities']
    selected = set(args.entity or entities.keys())

    mode  = 'dry_run' if args.dry_run else 'live_extraction'
    model = os.environ.get('NEXUSBASE_LLM_MODEL', '(not set)')

    results: dict = {
        'version': 'v0.2',
        'generated_at': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'mode': mode,
        'model': model if not args.dry_run else None,
        'source_resolution': ('benchmark.json repo metadata → README '
                              'fallback + supplemental docs'),
        'independence': ('No hand-authored capability labels or benchmark '
                         'viable lists were used as input'),
        'entities': {},
    }

    already_successful = set()
    if args.resume and args.out.exists():
        prev_data = json.loads(args.out.read_text(encoding='utf-8'))
        for eid, ent in prev_data.get('entities', {}).items():
            if ent.get('status') == 'extracted':
                already_successful.add(eid)
                results['entities'][eid] = ent
                
    pending = selected - already_successful
    
    if args.resume:
        print("--- RESUME MODE ---")
        print(f"Total target entities: {len(selected)}")
        print(f"Already successful (preserved): {len(already_successful)}")
        print(f"Pending/Retryable: {len(pending)}")
        print("-------------------\n")

    for eid, entity in entities.items():
        if eid not in pending:
            continue

        repo = entity['repo']
        name = entity['name']
        print(f'[{eid}] {name} (repo: {repo})')

        # ---- source resolution ----
        url, source_type, text, errors = fetch_first_source(eid, repo)

        if url is None:
            print(f'  [!] No source fetched')
            for e in errors:
                print(f'    {e}')
            results['entities'][eid] = {
                'entity_id': eid, 'name': name,
                'status': 'no_source_fetched',
                'source_errors': errors,
                'capabilities': [], 'rejected': [],
            }
            continue

        print(f'  [ok] Source: {source_type} ({len(text)} chars)')

        # ---- dry-run: stop after source resolution ----
        if args.dry_run:
            results['entities'][eid] = {
                'entity_id': eid, 'name': name,
                'status': 'dry_run_source_resolved',
                'source_url': url, 'source_type': source_type,
                'source_chars': len(text),
                'source_preview': text[:200].replace('\n', ' '),
                'capabilities': [], 'rejected': [],
            }
            continue

        # ---- live extraction ----
        try:
            blocked_text, block_map = generate_blocks(text)
            
            chunk_size = 7000
            overlap = 1000
            chunks = []
            idx = 0
            while idx < len(blocked_text):
                chunks.append(blocked_text[idx:idx+chunk_size])
                idx += (chunk_size - overlap)
                if idx >= len(blocked_text): break
            
            stage1_blocks = set()
            for i, chunk in enumerate(chunks):
                extracted = call_llm_stage1(url, eid, chunk)
                for eb in extracted.get('evidence_blocks', []):
                    b_id = eb.get('block_id', '').strip()
                    if b_id:
                        stage1_blocks.add(b_id)
            
            valid_blocks_for_stage2 = []
            invalid_block_ids = []
            for b_id in stage1_blocks:
                if b_id in block_map:
                    valid_blocks_for_stage2.append(b_id)
                else:
                    invalid_block_ids.append(b_id)
                    
            all_caps = []
            all_deps = []
            for b_id in valid_blocks_for_stage2:
                block_text = block_map[b_id]['text']
                extracted_caps = call_llm_stage2(eid, block_text)
                for c in extracted_caps.get('capabilities', []):
                    c['evidence_blocks'] = [b_id]
                    all_caps.append(c)
                for d in extracted_caps.get('deployment_models', []):
                    d['evidence_blocks'] = [b_id]
                    all_deps.append(d)
            
            combined_extracted = {'capabilities': all_caps, 'deployment_models': all_deps}

            validated = validate_extraction(eid, name, url, source_type,
                                            text, combined_extracted, block_map)
                                            
            validated['metrics']['stage1_raw_candidates'] = len(stage1_blocks)
            validated['metrics']['stage1_valid_blocks'] = len(valid_blocks_for_stage2)
            validated['metrics']['stage1_invalid_blocks'] = len(invalid_block_ids)
            validated['metrics']['stage2_capability_candidates'] = len(all_caps)
            validated['metrics']['stage2_deployment_candidates'] = len(all_deps)
            
            for b_id in invalid_block_ids:
                validated['rejected'].append({
                    'capability_id': b_id, 'label': '', 'reason': 'invalid block reference',
                    'quote': '', 'original_confidence': '', 'provenance_valid': False,
                    'heuristic_quality_passed': False
                })
                
            validated['metrics']['final_rejected'] = len(validated['rejected'])

            validated['name'] = name
            validated['status'] = 'extracted'
            results['entities'][eid] = validated
            n_acc = len(validated['capabilities'])
            n_rej = len(validated['rejected'])
            print(f'  [ok] Extracted: {n_acc} accepted, {n_rej} rejected (from {len(chunks)} chunks)')
        except Exception as exc:
            print(f'  [FAIL] Failed: {type(exc).__name__}: {exc}')
            results['entities'][eid] = {
                'entity_id': eid, 'name': name,
                'status': 'extraction_error',
                'error': str(exc),
                'source_url': url, 'source_type': source_type,
                'capabilities': [], 'rejected': [],
            }

        time.sleep(0.5)  # rate limiting

    args.out.write_text(
        json.dumps(results, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f'\nWrote catalog: {args.out}')

    generate_report(results, args.report)
    print(f'Wrote report:  {args.report}')


if __name__ == '__main__':
    main()
