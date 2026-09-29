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
PROMPT_PATH = HERE / 'NexusBase_capability_extraction_prompt_v0.2.md'
BENCHMARK_PATH = HERE / 'benchmark.json'
DEFAULT_OUT = HERE / 'NexusBase_extracted_capabilities_v0.2.json'
DEFAULT_REPORT = HERE / 'NexusBase_extraction_report_v0.2.md'


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


def find_span(source: str, quote: str):
    """Return (start, end, match_mode) or None.  Requires contiguous match."""
    i = source.find(quote)
    if i >= 0:
        return i, i + len(quote), 'exact'
    ns, nq = normalize_for_match(source), normalize_for_match(quote)
    i = ns.find(nq)
    if i >= 0:
        return i, i + len(nq), 'normalized'
    return None


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

def call_llm(source_url: str, entity_id: str, source_text: str,
             max_chars: int) -> dict:
    """Call the LLM.  Sends ONLY entity ID + raw source text."""
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
        'messages': [
            {'role': 'system', 'content': prompt},
            {'role': 'user', 'content': json.dumps({
                'entity': entity_id,
                'source_url': source_url,
                'source_text': source_text[:max_chars],
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
    with urllib.request.urlopen(req, timeout=120) as resp:
        payload = json.loads(resp.read().decode('utf-8'))
    return json.loads(payload['choices'][0]['message']['content'])


# ---------------------------------------------------------------------------
# Post-extraction validation  (decisions 4, 5)
# ---------------------------------------------------------------------------

def validate_extraction(entity_id: str, source_url: str, source_type: str,
                        source_text: str, extracted: dict) -> dict:
    """Validate extracted capabilities against source text.

    - Rejects claims whose quote is not an exact contiguous span.
    - Rejects/downgrades generic fragments.
    - Records evidence type and character offsets.
    """
    now = datetime.now(timezone.utc).isoformat(timespec='seconds')
    out: dict = {
        'entity_id': entity_id,
        'source_url': source_url,
        'source_type': source_type,
        'capabilities': [],
        'rejected': [],
    }
    seen: set[str] = set()

    for cap in extracted.get('capabilities', []):
        cid = cap.get('id', '').strip()
        label = cap.get('label', '').strip()
        quote = cap.get('evidence', {}).get('quote', '').strip()
        conf = cap.get('confidence')

        # Shape check
        if not cid or not label or not quote or conf not in ('high', 'medium'):
            out['rejected'].append({
                'capability_id': cid or '(empty)',
                'label': label,
                'reason': 'invalid output shape or missing fields',
                'quote': quote,
            })
            continue

        # Duplicate check
        if cid in seen:
            out['rejected'].append({
                'capability_id': cid, 'label': label,
                'reason': 'duplicate capability id', 'quote': quote,
            })
            continue
        seen.add(cid)

        # Span verification — reject if not contiguous
        span = find_span(source_text, quote)
        if span is None:
            out['rejected'].append({
                'capability_id': cid, 'label': label,
                'reason': 'evidence quote not found as exact contiguous span',
                'quote': quote, 'confidence': conf,
            })
            continue

        # Confidence gating — reject / downgrade generic fragments
        gated_conf, rejection = gate_confidence(quote, conf)
        if gated_conf == 'rejected':
            out['rejected'].append({
                'capability_id': cid, 'label': label,
                'reason': rejection, 'quote': quote,
                'original_confidence': conf,
            })
            continue

        start, end, match_mode = span
        out['capabilities'].append({
            'capability_id': cid,
            'label': label,
            'confidence': gated_conf,
            'evidence': {
                'source_url': source_url,
                'evidence_type': classify_evidence_type(quote),
                'quote': quote,
                'start': start,
                'end': end,
                'match_mode': match_mode,
            },
            'validated_at': now,
        })

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

    for eid, entity in entities.items():
        if eid not in selected:
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
            extracted = call_llm(url, eid, text, args.max_chars)
            validated = validate_extraction(eid, url, source_type,
                                            text, extracted)
            validated['name'] = name
            validated['status'] = 'extracted'
            results['entities'][eid] = validated
            n_acc = len(validated['capabilities'])
            n_rej = len(validated['rejected'])
            print(f'  [ok] Extracted: {n_acc} accepted, {n_rej} rejected')
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
