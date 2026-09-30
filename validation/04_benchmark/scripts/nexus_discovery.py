import json
import re

def build_catalog_context(catalog):
    lines = []
    short_id_map = {}
    id_counter = 1
    
    for eid, ent in catalog['entities'].items():
        if ent.get('status') not in ['extracted', 'success']:
            continue
            
        lines.append(f"Entity: {eid}")
        
        # Add metadata properties
        meta_labels = [m['label'] for m in ent.get('metadata_capabilities', [])]
        if meta_labels:
            lines.append(f"  Metadata: {', '.join(meta_labels)}")
            
        lines.append("  Capabilities:")
        for cap in ent.get('atomic_capabilities', []):
            short_id = f"C{id_counter:04d}"
            short_id_map[short_id] = {
                'entity': eid,
                'capability_id': cap['capability_id'],
                'label': cap['label'],
                'evidence': cap.get('evidence', [])
            }
            id_counter += 1
            lines.append(f"    [{short_id}] {cap['label']}")
            
    return "\n".join(lines), short_id_map

import urllib.request

def query_llm(prompt):
    url = "http://localhost:11434/v1/chat/completions"
    payload = {
        "model": "qwen3:8b",
        "messages": [
            {"role": "system", "content": "You are the NexusBase Discovery Engine."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.0
    }
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req, timeout=120) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result['choices'][0]['message']['content']
    except Exception as e:
        print(f"LLM Error: {e}")
        return "INFRASTRUCTURE_BLOCKED"

def discover_solutions(problem, requirements, constraints, catalog_context):
    prompt = f"""You are the NexusBase Discovery Engine. Your job is to analyze a user's problem and recommend solutions ONLY using the capabilities listed in the catalog below.

<CATALOG>
{catalog_context}
</CATALOG>

<PROBLEM>
{problem}
</PROBLEM>

<CONSTRAINTS>
{json.dumps(constraints, indent=2)}
</CONSTRAINTS>

<REQUIREMENTS>
{json.dumps(requirements, indent=2)}
</REQUIREMENTS>

INSTRUCTIONS:
1. Evaluate which entities in the catalog best satisfy the requirements.
2. For each requirement, find the specific capability short IDs (e.g. C0015) that fulfill it. Do not invent short IDs.
3. Check if the entity satisfies the constraints (using its Metadata). If there is no explicit metadata for a constraint, assume it is UNKNOWN/UNVERIFIED.
4. Output your response as a valid JSON object matching this schema exactly:
{{
  "status": "paths | potential_paths_only | no_valid_path | clarify",
  "paths": [
    {{
      "solutions": ["entity_id1"],
      "capability_matches": [
        {{
          "requirement_name": "...",
          "short_ids": ["CXXXX"]
        }}
      ],
      "constraint_violations": ["reason 1"],
      "compatibility": "verified | unverified | n/a",
      "flags": ["any caveats"]
    }}
  ]
}}

Return ONLY the JSON inside a ```json block. Do not include markdown outside of it.
"""
    response_text = query_llm(prompt)
    if response_text == "INFRASTRUCTURE_BLOCKED":
        return {"status": "INFRASTRUCTURE_BLOCKED", "paths": [], "error": "LLM unavailable"}
    
    # Extract JSON
    match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except:
            pass
            
    # Try raw parse
    try:
        return json.loads(response_text)
    except:
        return {"status": "no_valid_path", "paths": [], "error": "LLM failed to output valid JSON"}
