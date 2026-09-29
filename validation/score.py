#!/usr/bin/env python3
"""Score a system's output against benchmark.json + seed_index.json.

Usage:
  python3 score.py results.json      # score a real system (baseline LLM or NexusBase)
  python3 score.py --selftest        # prove the scorer separates careful vs overconfident output

results.json shape (same for every system so comparisons are apples to apples):
{
  "system": "baseline-llm-with-search",
  "results": {
    "S01": {
      "status": "paths | potential_paths_only | no_valid_path | clarify",
      "paths": [
        {"label": "...", "solutions": ["GlitchTip"],
         "compatibility": "verified | partially_verified | unverified | n/a",
         "compat_evidence_urls": [],
         "flags": ["free-text caveats, e.g. 'Sentry is source-available (FSL), not OSI'"]}
      ]
    }
  }
}
"""
import json, os, re, sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
bench = json.load(open(os.path.join(HERE, "benchmark.json")))
index = {s["id"]: s for s in json.load(open(os.path.join(HERE, "seed_index.json")))["solutions"]}

def norm(s): return re.sub(r"[^a-z0-9]", "", s.lower())
NAME2ID = {norm(e["name"]): eid for eid, e in bench["entities"].items()}
NAME2ID.update({norm(eid): eid for eid in bench["entities"]})

def license_state(constraint, cls):
    """satisfied | violated | unresolved  (constraint may be None)"""
    if not constraint:
        return "satisfied"
    if cls in ("mixed", "custom", "unverified", "unknown"):
        return "unresolved"
    if constraint == "osi_open_source":
        return "satisfied" if cls in ("permissive", "copyleft") else "violated"
    if constraint == "permissive":
        return "satisfied" if cls == "permissive" else "violated"
    return "satisfied"

def flagged(path, name):
    return any(norm(name) in norm(f) for f in path.get("flags", []))

def score_scenario(sc, res):
    out = defaultdict(int)
    out["scenario"] = sc["id"]
    status = res.get("status")
    paths = res.get("paths", []) or []
    out["status_ok"] = int(status == sc["expected_status"] or
                           (sc["expected_status"] == "potential_paths_only" and status == "paths"
                            and all(p.get("compatibility") != "verified" for p in paths if len(p.get("solutions", [])) > 1)))
    lic = sc["constraints"].get("license")
    seen_ids, unindexed = set(), []
    for p in paths:
        for name in p.get("solutions", []):
            eid = NAME2ID.get(norm(name))
            if not eid:
                unindexed.append(name); continue
            seen_ids.add(eid)
            st = license_state(lic, index[eid]["license_class"])
            fl = flagged(p, bench["entities"][eid]["name"])
            if eid in sc.get("constraint_violators", []):
                st = "violated"
            if st == "violated" and not fl:
                out["unflagged_violations"] += 1
            elif st == "unresolved" and not fl:
                out["unflagged_unresolved"] += 1
        for nv in sc.get("static_non_viable", []):
            if any(norm(nv["name"]) == norm(n) for n in p.get("solutions", [])):
                out["non_viable_hits"] += 1
        # composition honesty: 'verified' with no cited evidence
        if len(p.get("solutions", [])) > 1 and p.get("compatibility") == "verified" and not p.get("compat_evidence_urls"):
            out["unsupported_verified_compat"] += 1
        if sc.get("single_sufficient") and len(p.get("solutions", [])) > 1:
            out["over_composition"] += 1
    out["unindexed_names"] = unindexed  # need manual check: real-but-unindexed vs invented
    v = sc.get("viable", [])
    out["viable_recall"] = (len(set(v) & seen_ids) / len(v)) if v else None
    # failure-mode scenarios: any confident path is wrong
    if sc["expected_status"] in ("no_valid_path", "clarify") and paths:
        out["confident_path_on_failure_case"] = 1
    return out

def score(results):
    rows = []
    for sc in bench["scenarios"]:
        r = results["results"].get(sc["id"])
        if r is None:
            rows.append({"scenario": sc["id"], "missing": 1, "domain": sc["domain"]}); continue
        row = score_scenario(sc, r); row["domain"] = sc["domain"]; rows.append(row)
    return rows

def report(system, rows):
    print(f"\n=== {system} ===")
    print(f"{'id':<5}{'domain':<24}{'status':>7}{'recall':>8}{'viol':>6}{'unres':>7}{'nonviab':>9}{'badcomp':>9}{'overcomp':>10}{'failcase':>9}  unindexed")
    tot = defaultdict(float); n = 0; rec_n = 0
    dom = defaultdict(lambda: defaultdict(float))
    for r in rows:
        if r.get("missing"):
            print(f"{r['scenario']:<5}{r['domain']:<24}  (no result)"); continue
        rc = r["viable_recall"]
        print(f"{r['scenario']:<5}{r['domain']:<24}{r['status_ok']:>7}{('-' if rc is None else f'{rc:.2f}'):>8}"
              f"{r['unflagged_violations']:>6}{r['unflagged_unresolved']:>7}{r['non_viable_hits']:>9}"
              f"{r['unsupported_verified_compat']:>9}{r['over_composition']:>10}{r['confident_path_on_failure_case']:>9}  "
              f"{', '.join(r['unindexed_names']) or ''}")
        n += 1
        for k in ("status_ok", "unflagged_violations", "unflagged_unresolved", "non_viable_hits",
                  "unsupported_verified_compat", "over_composition", "confident_path_on_failure_case"):
            tot[k] += r[k]; dom[r["domain"]][k] += r[k]
        if rc is not None: tot["recall"] += rc; rec_n += 1
    print("\nGLOBAL")
    print(f"  status correct        : {int(tot['status_ok'])}/{n}")
    print(f"  mean viable recall    : {tot['recall']/rec_n:.2f}" if rec_n else "  mean viable recall    : n/a")
    print(f"  unflagged violations  : {int(tot['unflagged_violations'])}   (constraint broken, no caveat given)")
    print(f"  unflagged unresolved  : {int(tot['unflagged_unresolved'])}   (mixed/custom license, no caveat given)")
    print(f"  non-viable hits       : {int(tot['non_viable_hits'])}")
    print(f"  unsupported 'verified': {int(tot['unsupported_verified_compat'])}   (claimed verified compat with no evidence URL)")
    print(f"  over-composition      : {int(tot['over_composition'])}")
    print(f"  confident on failure  : {int(tot['confident_path_on_failure_case'])}")
    print("  NOTE: 'unindexed' names are real-or-invented; check them by hand. They are NOT auto-counted as invented.")
    print("\nPER DOMAIN (bad events = violations + unresolved + non-viable + bad verified claims + failcase)")
    for d, v in sorted(dom.items()):
        bad = v["unflagged_violations"] + v["unflagged_unresolved"] + v["non_viable_hits"] + v["unsupported_verified_compat"] + v["confident_path_on_failure_case"]
        print(f"  {d:<24} bad events: {int(bad)}")

def selftest():
    P = lambda label, sols, comp="n/a", flags=(), urls=(): {"label": label, "solutions": sols, "compatibility": comp,
                                                            "flags": list(flags), "compat_evidence_urls": list(urls)}
    overconfident = {"system": "SELFTEST overconfident", "results": {
        "S01": {"status": "paths", "paths": [P("best", ["Sentry"]), P("light", ["Bugsink"]), P("invented", ["SentryLite Pro"])]},
        "S05": {"status": "paths", "paths": [P("fast", ["PyMuPDF4LLM"]), P("popular", ["MinerU"]), P("ok", ["Docling"])]},
        "S12": {"status": "paths", "paths": [P("classic", ["Celery"]), P("simple", ["RQ"])]},
        "S11": {"status": "paths", "paths": [P("stack", ["Scalar", "Redoc", "Swagger UI"], "verified")]},
        "S13": {"status": "paths", "paths": [P("full", ["faster-whisper", "Chroma"], "verified")]},
        "S14": {"status": "paths", "paths": [P("magic", ["Docling"])]},
        "S15": {"status": "paths", "paths": [P("everything", ["Coolify"])]}}}
    careful = {"system": "SELFTEST careful", "results": {
        "S01": {"status": "paths", "paths": [P("oss", ["GlitchTip"]), P("note", ["Sentry"], flags=["Sentry is FSL source-available, not OSI open source"])]},
        "S05": {"status": "paths", "paths": [P("permissive", ["Docling"]),
                                             P("caveat", ["MinerU"], flags=["MinerU adds custom commercial terms; license unresolved for permissive"])]},
        "S12": {"status": "paths", "paths": [P("pg", ["Procrastinate"]), P("tradeoff", ["Celery"], flags=["Celery needs a broker; violates no-new-service preference"])]},
        "S11": {"status": "paths", "paths": [P("one", ["Scalar"])]},
        "S13": {"status": "potential_paths_only", "paths": [P("glue", ["faster-whisper", "Chroma"], "unverified")]},
        "S14": {"status": "no_valid_path", "paths": []},
        "S15": {"status": "clarify", "paths": []}}}
    for r in (overconfident, careful):
        report(r["system"], score(r))

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--selftest":
        selftest()
    elif len(sys.argv) > 1:
        r = json.load(open(sys.argv[1])); report(r.get("system", "unnamed"), score(r))
    else:
        print(__doc__)
