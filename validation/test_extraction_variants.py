import os, json, time, urllib.request

def fetch_source():
    url = "https://raw.githubusercontent.com/coollabsio/coolify/HEAD/README.md"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode('utf-8')

prompt = """Extract software capabilities from the provided text.
Return a JSON object with a 'capabilities' list. Each capability should have:
- 'capability_id': string snake_case identifier
- 'label': human readable string
- 'confidence': 'high', 'medium', or 'low'
- 'evidence': object with 'quote' (exact contiguous substring from text), 'evidence_type' (e.g. 'explicit_statement', 'fragment', 'descriptive_context').
Do not invent capabilities without evidence.
"""

def validate_evidence(quote, full_text):
    if not quote or quote not in full_text:
        return False, "evidence quote not found as exact contiguous span"
    words = quote.split()
    if len(words) <= 3 and not any(p in quote for p in ['.', ',', ':', ';', '\n']):
        return False, "standalone generic heading, product name, or generic tech word"
    return True, "valid"

def run_extraction(body, endpoint='/v1/chat/completions'):
    url = f"http://localhost:11434{endpoint}"
    req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'),
                                 headers={'Content-Type': 'application/json'}, method='POST')
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            dur = time.time() - start
            return data, dur, None
    except Exception as e:
        dur = time.time() - start
        return None, dur, str(e)

def parse_openai_res(res):
    try:
        content = res['choices'][0]['message']['content']
        return json.loads(content).get('capabilities', [])
    except:
        return []

def parse_ollama_res(res):
    try:
        content = res['message']['content']
        return json.loads(content).get('capabilities', [])
    except:
        return []

source = fetch_source()

print("Variant A: v1 endpoint, reasoning_effort='none'")
body_a = {
    'model': 'qwen3:8b', 'temperature': 0, 'response_format': {'type': 'json_object'},
    'reasoning_effort': 'none',
    'messages': [{'role': 'system', 'content': prompt}, {'role': 'user', 'content': json.dumps({'source_text': source[:24000]})}]
}
res_a, dur_a, err_a = run_extraction(body_a)
caps_a = parse_openai_res(res_a) if res_a else []

print("Variant B: v1 endpoint, omit reasoning_effort")
body_b = {
    'model': 'qwen3:8b', 'temperature': 0, 'response_format': {'type': 'json_object'},
    'messages': [{'role': 'system', 'content': prompt}, {'role': 'user', 'content': json.dumps({'source_text': source[:24000]})}]
}
res_b, dur_b, err_b = run_extraction(body_b)
caps_b = parse_openai_res(res_b) if res_b else []

print("Variant C: native /api/chat")
body_c = {
    'model': 'qwen3:8b', 'format': 'json', 'stream': False,
    'options': {'temperature': 0},
    'messages': [{'role': 'system', 'content': prompt}, {'role': 'user', 'content': json.dumps({'source_text': source[:24000]})}]
}
res_c, dur_c, err_c = run_extraction(body_c, endpoint='/api/chat')
caps_c = parse_ollama_res(res_c) if res_c else []

print("Variant D: Chunking with reasoning_effort='none'")
chunk_size = 7000
overlap = 1000
chunks = []
idx = 0
while idx < len(source):
    chunks.append(source[idx:idx+chunk_size])
    idx += (chunk_size - overlap)

caps_d = []
dur_d = 0
for i, chunk in enumerate(chunks):
    body_chunk = {
        'model': 'qwen3:8b', 'temperature': 0, 'response_format': {'type': 'json_object'},
        'reasoning_effort': 'none',
        'messages': [{'role': 'system', 'content': prompt}, {'role': 'user', 'content': json.dumps({'source_text': chunk})}]
    }
    res_chunk, d_chunk, err_chunk = run_extraction(body_chunk)
    dur_d += d_chunk
    if res_chunk:
        caps_d.extend(parse_openai_res(res_chunk))

# Process capabilities
def process(caps, full_text):
    accepted = []
    rejected = []
    seen = set()
    for c in caps:
        qid = c.get('capability_id')
        if qid in seen: continue
        seen.add(qid)
        quote = c.get('evidence', {}).get('quote', '')
        valid, reason = validate_evidence(quote, full_text)
        if valid:
            accepted.append(c)
        else:
            rejected.append(c)
    return accepted, rejected

acc_a, rej_a = process(caps_a, source)
acc_b, rej_b = process(caps_b, source)
acc_c, rej_c = process(caps_c, source)
acc_d, rej_d = process(caps_d, source)

def pt(var, name, acc, rej, dur, err):
    emp = "Yes" if len(acc)==0 and len(rej)==0 else "No"
    if err: emp = "ERROR"
    print(f"{var} | {name:<30} | {dur:>5.1f}s | {len(acc):>8} | {len(rej):>8} | {emp}")

print("\nVariant | Reasoning/Chunking               | Time   | Accepted | Rejected | Empty?")
print("-" * 85)
pt("A", "reasoning_effort='none'", acc_a, rej_a, dur_a, err_a)
pt("B", "omit reasoning_effort", acc_b, rej_b, dur_b, err_b)
pt("C", "native /api/chat", acc_c, rej_c, dur_c, err_c)
pt("D", "chunked + reasoning_effort='none'", acc_d, rej_d, dur_d, None)
