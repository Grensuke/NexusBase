#!/usr/bin/env python3
"""GitHub source adapter (spike).

Builds seed_index.json in the NexusBase normalized Solution shape, using LIVE license
files from raw.githubusercontent.com (no API token or rate limit needed).
Optional: set GITHUB_TOKEN to also record stars / pushed_at / archived via the API.

Capabilities are intentionally NOT extracted here; that is the hard, unreliable step the
spike should test next (see README).
"""
import json, os, re, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
LICENSE_NAMES = ["LICENSE", "LICENSE.md", "LICENSE.txt", "LICENSE.rst", "COPYING", "LICENCE"]

# Ordered: first match wins. Source-available checks come before permissive ones
# because their texts often mention Apache/MIT as a "future license".
PATTERNS = [
    ("FSL",          "source_available", r"Functional Source License"),
    ("BUSL-1.1",     "source_available", r"Business Source License"),
    ("Polyform",     "source_available", r"Polyform"),
    ("SSPL",         "source_available", r"Server Side Public License"),
    ("RSAL",         "source_available", r"Redis Source Available License"),
    ("Elastic",      "source_available", r"Elastic License"),
    ("MPL-2.0",      "copyleft",         r"Mozilla Public License"),
    ("AGPL",         "copyleft",         r"GNU AFFERO GENERAL PUBLIC LICENSE"),
    ("LGPL",         "copyleft",         r"GNU LESSER GENERAL PUBLIC LICENSE"),
    ("GPL",          "copyleft",         r"GNU GENERAL PUBLIC LICENSE"),
    ("Apache-2.0",   "permissive",       r"Apache License"),
    ("MIT",          "permissive",       r"Permission is hereby granted, free of charge|\bMIT license\b"),
    ("BSD",          "permissive",       r"Redistribution and use in source and binary forms"),
    ("ISC",          "permissive",       r"Permission to use, copy, modify, and/or distribute"),
    ("PostgreSQL",   "permissive",       r"Permission to use, copy, modify, and distribute this software"),
]
CUSTOM_MARKERS = r"additional terms|subject to the additional|custom license"

def http_get(url, headers=None, timeout=20):
    req = urllib.request.Request(url, headers=headers or {"User-Agent": "nexusbase-spike"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:
        return 0, str(e)

def classify(text):
    """Return (spdx_guess, class, all_hits). Classes: permissive, copyleft,
    source_available, mixed, custom, unknown. 'mixed'/'custom' => constraint UNRESOLVED."""
    head = next((l.strip().lstrip("#* ").strip() for l in text.splitlines() if l.strip()), "")
    hits = [(s, c) for s, c, p in PATTERNS if re.search(p, text, re.I)]
    names = [h[0] for h in hits]
    # 1. the file's own title line is the strongest signal (GPL text mentions AGPL/MPL etc.)
    title = [(s, c) for s, c, p in PATTERNS if re.search(p, head, re.I)]
    if title and title[0][0] in ("FSL", "BUSL-1.1", "AGPL", "LGPL", "GPL", "MPL-2.0", "Apache-2.0"):
        if re.search(CUSTOM_MARKERS, text[:1500], re.I):
            return title[0][0] + "+custom", "custom", names
        return title[0][0], title[0][1], names
    # 2a. source-available terms co-occurring with another license family => mixed
    if len({c for _, c in hits}) >= 2 and "source_available" in {c for _, c in hits}:
        return " AND ".join(names[:3]), "mixed", names
    # 2b. short pointer-style files that name several licenses => mixed
    if len(text) < 3000 and len({n for n in names}) >= 2:
        return " AND ".join(names[:3]), "mixed", names
    if re.search(CUSTOM_MARKERS, text[:1500], re.I) and hits:
        return hits[0][0] + "+custom", "custom", names
    if not hits:
        return "unknown", "unknown", []
    return hits[0][0], hits[0][1], names

def fetch_license(repo, files):
    for name in files:
        url = f"https://raw.githubusercontent.com/{repo}/HEAD/{name}"
        code, body = http_get(url)
        if code == 200 and len(body) > 100:
            return url, body
    return None, ""

def gh_api(repo):
    tok = os.environ.get("GITHUB_TOKEN")
    if not tok:
        return None
    code, body = http_get(f"https://api.github.com/repos/{repo}",
                          {"User-Agent": "nexusbase-spike", "Authorization": f"Bearer {tok}"})
    if code != 200:
        return None
    j = json.loads(body)
    return {"stars": j.get("stargazers_count"), "pushed_at": j.get("pushed_at"),
            "archived": j.get("archived"), "default_branch": j.get("default_branch")}

def build():
    bench = json.load(open(os.path.join(HERE, "benchmark.json")))
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    out, mismatches = [], []
    for eid, e in bench["entities"].items():
        files = e.get("license_files") or LICENSE_NAMES
        url, text = fetch_license(e["repo"], files)
        evidence = []
        if url:
            spdx, cls, hits = classify(text)
            first_line = next((l.strip() for l in text.splitlines() if l.strip()), "")[:120]
            evidence.append({"type": "license_file", "url": url, "excerpt": first_line,
                             "all_pattern_hits": hits, "fetched_at": now})
        else:
            spdx, cls = "unverified", "unverified"
            evidence.append({"type": "license_file", "url": None,
                             "note": "no license file fetched (repo moved, non-GitHub host, or unusual filename)",
                             "fetched_at": now})
        meta = gh_api(e["repo"])
        rec = {
            "id": eid, "name": e["name"], "type": e["type"], "source": "github",
            "description": None,
            "license": spdx, "license_class": cls,
            "cost_model": "free_oss" if cls in ("permissive", "copyleft") else "unknown",
            "capabilities": [],
            "evidence": evidence,
            "last_verified_at": now,
            "extension": {"repo": e["repo"], "repo_note": e.get("repo_note"), "caveat": e.get("caveat"),
                          "github_api": meta},
        }
        out.append(rec)
        prior = e["prior"]
        ok = (prior == cls)
        if not ok:
            mismatches.append((e["name"], prior, cls, spdx))
        print(f"{e['name']:<30} prior={prior:<16} verified={cls:<16} {spdx}")
        time.sleep(0.15)
    json.dump({"generated_at": now, "solutions": out}, open(os.path.join(HERE, "seed_index.json"), "w"), indent=2)
    print("\nPrior vs verified mismatches:")
    for m in mismatches:
        print("  ", m)
    if not mismatches:
        print("   none")

if __name__ == "__main__":
    build()
