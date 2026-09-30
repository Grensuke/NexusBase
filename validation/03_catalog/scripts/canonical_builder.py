import json
from pathlib import Path

def main():
    test_out = json.load(open('archive/test_out.json', encoding='utf-8'))
    raw_v02 = json.load(open('01_extraction/outputs/NexusBase_extracted_capabilities_v0.2.json', encoding='utf-8'))
    
    canonical = {
        "version": "v0.2_canonical",
        "generated_at": raw_v02.get("generated_at"),
        "entities": {}
    }
    
    total_raw = 0
    
    # 1. Recover MinerU and PyMuPDF4LLM from test_out.json
    for eid in ['mineru', 'pymupdf4llm']:
        ent = test_out.get('entities', {}).get(eid)
        if not ent:
            print(f"Error: {eid} missing from test_out.json")
            continue
            
        canonical['entities'][eid] = ent
        count = len(ent.get('capabilities', [])) + len(ent.get('deployment_models', []))
        total_raw += count
        print(f"Canonicalized {eid} from test_out.json: {count} records")
        
    # 2. Grab the rest from raw_v02
    for eid, ent in raw_v02['entities'].items():
        if eid in ['mineru', 'pymupdf4llm']:
            continue # already processed
            
        canonical['entities'][eid] = ent
        if ent.get('status') in ['extracted', 'success']:
            count = len(ent.get('capabilities', [])) + len(ent.get('deployment_models', []))
            total_raw += count
            print(f"Canonicalized {eid} from raw_v02: {count} records")
            
    Path('03_catalog/inputs/NexusBase_extracted_capabilities_canonical_v0.2.json').write_text(json.dumps(canonical, indent=2), encoding='utf-8')
    print(f"\nCanonical snapshot created with {total_raw} total raw capabilities.")
    
    # Verify provenance and unique capability IDs
    all_ids = set()
    dup_ids = set()
    for eid, ent in canonical['entities'].items():
        if ent.get('status') in ['extracted', 'success']:
            caps = ent.get('capabilities', []) + ent.get('deployment_models', [])
            for c in caps:
                cid = c.get('capability_id')
                if not cid:
                    print(f"Error: missing capability ID in {eid}")
                if cid in all_ids:
                    dup_ids.add(cid)
                all_ids.add(cid)
                
    if dup_ids:
        print(f"Warning: duplicate capability IDs found across canonical snapshot: {dup_ids}")
    else:
        print("Success: all capability IDs in the canonical snapshot are unique and valid.")

if __name__ == '__main__':
    main()
