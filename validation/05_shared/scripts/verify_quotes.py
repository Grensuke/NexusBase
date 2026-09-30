import json, os, re, urllib.request, urllib.error, collections, sys

HERE = os.path.dirname(os.path.abspath(__file__))
cat = json.load(open(os.path.join(HERE, "03_catalog/outputs/NexusBase_capability_catalog_v0.1.json")))

def raw_candidates(url):
    url = url.split("?")[0]
    m = re.match(r"https://github\.com/([^/]+)/([^/]+)/blob/([^/]+)/(.+)", url)
    if m: return [f"https://raw.githubusercontent.com/{m[1]}/{m[2]}/{m[3]}/{m[4]}"]
    m = re.match(r"https://github\.com/([^/]+)/([^/]+)/?$", url)
    if m: return [f"https://raw.githubusercontent.com/{m[1]}/{m[2]}/HEAD/{n}" for n in ("README.md","readme.md","README.rst","README")]
    if "raw.githubusercontent.com" in url: return [url]
    return [url]

cache = {}
def fetch(url):
    if url in cache: return cache[url]
    body = None
    for u in raw_candidates(url):
        try:
            req = urllib.request.Request(u, headers={"User-Agent":"verify"})
            with urllib.request.urlopen(req, timeout=20) as r:
                body = r.read().decode("utf-8","replace"); break
        except Exception as e:
            continue
    cache[url] = body
    return body

def norm(s):
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s)   # md links -> text
    s = re.sub(r"[*_`#>|\\]", " ", s)
    s = re.sub(r"[^\w\s]", " ", s.lower())
    return re.sub(r"\s+", " ", s).strip()

rows = []
for eid, ent in cat["entities"].items():
    for c in ent["capabilities"]:
        url, q, conf = c["evidence"]["url"], c["evidence"]["quote"], c["confidence"]
        body = fetch(url)
        if body is None:
            status = "unfetchable"
        else:
            nb = norm(body)
            parts = [norm(p) for p in re.split(r"\.\.\.|…", q) if norm(p)]
            status = "verbatim" if parts and all(p in nb for p in parts) else "not_found"
        rows.append((eid, c["id"], conf, len(q.split()), status, q, url))

tot = collections.Counter(r[4] for r in rows)
print("TOTAL capability claims:", len(rows), dict(tot))
print("\nBy entity (not_found/unfetchable):")
by = collections.defaultdict(list)
for r in rows: by[r[0]].append(r)
for e, rs in by.items():
    bad = [r for r in rs if r[4] != "verbatim"]
    if bad: print(f"  {e}: {len(bad)}/{len(rs)}")
short = [r for r in rows if r[3] <= 3]
print(f"\nQuotes <=3 words: {len(short)}; of those marked 'high': {sum(1 for r in short if r[2]=='high')}")
print("\nExamples of 'not_found' or 'unfetchable':")
for r in [r for r in rows if r[4] != "verbatim"][:40]:
    print(f"  [{r[4]}] {r[0]}/{r[1]} conf={r[2]} :: \"{r[5][:90]}\"")
print("\nShort high-confidence quotes:")
for r in short:
    if r[2]=="high": print(f"  {r[0]}/{r[1]} :: \"{r[5]}\"")
json.dump([dict(zip(["entity","cap","conf","words","status","quote","url"], r)) for r in rows], open(os.path.join(HERE, "05_shared/reports/verify_results.json"),"w"), indent=1)
