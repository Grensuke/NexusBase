import json
import sys
import urllib.request
import os

def call_llm(prompt):
    url = os.environ.get("NEXUSBASE_LLM_BASE_URL", "http://localhost:11434/v1") + "/chat/completions"
    headers = {"Content-Type": "application/json"}
    data = {
        "model": "qwen3:8b",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.0,
        "response_format": {"type": "json_object"}
    }
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=300) as response:
            result = json.loads(response.read().decode('utf-8'))
            return json.loads(result['choices'][0]['message']['content'])
    except Exception as e:
        print(f"LLM call failed: {e}")
        return None

def main():
    data = json.load(open('archive/test_out.json', encoding='utf-8'))
    
    PROMPT_TEMPLATE = """You are a post-normalization grouping assistant for NexusBase capabilities.
Given a list of extracted capability candidates for a software project, group them into meaningful NexusBase capability units.

A NexusBase capability is a distinct, user-visible functional outcome or substantial property that can independently fulfill a real-world software requirement.

Rules for grouping:
1. Merge CLI flags/options into the meaningful parent function (e.g. "List files", "List docs", "Filter by extension" -> "Command-line file management").
2. Merge output-format variants (JSON, Markdown, TXT) into one unified function (e.g. "Multi-format document conversion") UNLESS they are massive distinct sub-systems.
3. Merge lists of document elements (tables, images, formulas, headers) if they are part of one feature (e.g. "Complex layout extraction").
4. PRESERVE genuinely independent user-facing functions. Do NOT merge distinct tools just because they sound related. For example, "Manage servers" and "Inspect runtime logs" must remain separate capabilities.
5. Discard (do not include in output) candidates that are purely internal implementation details, tuning parameters, or marketing phrases.

Input candidates (JSON list of objects with 'id', 'label', 'quote'):
{candidates}

Output JSON format:
{
  "clusters": [
    {
      "merged_label": "The overarching meaningful capability label",
      "candidate_ids": ["id1", "id2"],
      "reason": "Brief explanation of why these were merged or kept separate"
    }
  ]
}
"""

    for eid in ['pymupdf4llm', 'mineru']:
        caps = data['entities'][eid].get('capabilities', [])
        # Assign IDs to caps for the prompt
        candidates = []
        for i, c in enumerate(caps):
            c['_temp_id'] = f"{eid}_{i}"
            candidates.append({
                "id": c['_temp_id'],
                "label": c['label'],
                "quote": c['evidence']['quote'][:100] + "..." # Truncate for prompt length
            })
            
        print(f"--- Processing {eid} ({len(candidates)} candidates) ---")
        
        # Batching might be needed if there are too many, but let's try all at once
        prompt = PROMPT_TEMPLATE.replace('{candidates}', json.dumps(candidates, indent=2))
        
        result = call_llm(prompt)
        if result:
            with open(f"stage3_{eid}.json", "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2)
            print(f"Saved {len(result.get('clusters', []))} clusters to stage3_{eid}.json")

if __name__ == '__main__':
    main()
