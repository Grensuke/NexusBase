import json
import sys
import uuid
import argparse
from pathlib import Path
from difflib import SequenceMatcher

def similar(a, b):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def is_impl_detail(label, quote):
    impl_keywords = ['onnx', 'pytorch', 'vllm', 'llama.cpp', 'ubuntu', 'centos', 'mac os', 'windows 10']
    lbl = label.lower()
    q = quote.lower()
    for kw in impl_keywords:
        if kw in lbl: return True
    if 'install' in lbl and 'how to' in q: return True
    return False

def is_marketing(label):
    lbl = label.lower()
    if any(w in lbl for w in ['significant', 'optimized', 'fast', 'powerful', 'lightweight', 'reduction', 'marketing', 'time']):
        return True
    return False

def categorize(label):
    lbl = label.lower()
    # Categorization to help generate family labels
    if any(w in lbl for w in ['read', 'import', 'input', 'ingest', 'pdf format', 'xps', 'epub', 'docx', 'xlsx']):
        return 'Format ingestion and input parsing'
    if any(w in lbl for w in ['write', 'export', 'output', 'save', 'convert', 'to markdown', 'to json']):
        return 'Output conversion and generation'
    if any(w in lbl for w in ['table', 'formula', 'image', 'figure', 'heading', 'layout', 'reading order']):
        return 'Complex layout element extraction'
    if any(w in lbl for w in ['search', 'query', 'filter']):
        return 'Search and query configuration'
    if any(w in lbl for w in ['command line', 'cli']):
        return 'Command-line management'
    if any(w in lbl for w in ['ocr']):
        return 'OCR interpretation'
    if any(w in lbl for w in ['monitor', 'inspect', 'log', 'status', 'metrics', 'telemetry']):
        return 'Observability and telemetry'
    if any(w in lbl for w in ['manage', 'deploy', 'provision', 'start', 'stop']):
        return 'Operations and management'
    if any(w in lbl for w in ['chunk']):
        return 'Chunking mechanisms'
    return 'Miscellaneous functionality'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--in-file', type=Path, default='01_extraction/outputs/NexusBase_extracted_capabilities_v0.2.json')
    parser.add_argument('--out-file', type=Path, default='02_normalization/outputs/NexusBase_normalized_capabilities_v0.2.json')
    parser.add_argument('--entity', action='append')
    args = parser.parse_args()

    if not args.in_file.exists():
        print(f"Error: {args.in_file} not found.")
        sys.exit(1)

    data = json.load(args.in_file.open(encoding='utf-8'))
    out_data = {
        "version": "v0.2-atomic-families",
        "generated_at": data.get("generated_at"),
        "entities": {}
    }

    test_entities = args.entity if args.entity else data['entities'].keys()

    for eid in test_entities:
        if eid not in data['entities']:
            continue
            
        entity = data['entities'][eid]
        caps = entity.get('capabilities', [])
        deps = entity.get('deployment_models', [])
        
        atomic_caps = []
        families = []
        discarded_caps = []
        metadata_caps = []
        
        filtered = []
        
        # 1. First Pass: Discards and Metadata
        for c in caps:
            lbl = c['label']
            q = c['evidence'].get('quote', '')
            
            if is_impl_detail(lbl, q):
                discarded_caps.append({
                    "original_capability": c,
                    "decision": "discard",
                    "reason": "Implementation detail"
                })
            elif is_marketing(lbl):
                discarded_caps.append({
                    "original_capability": c,
                    "decision": "discard",
                    "reason": "Marketing/Performance statement"
                })
            elif 'self-host' in lbl.lower() or 'cloud' in lbl.lower() or 'kubernetes' in lbl.lower():
                metadata_caps.append({
                    "original_capability": c,
                    "decision": "metadata",
                    "reason": "Deployment property"
                })
            else:
                filtered.append(c)

        # 2. Second Pass: True Merges (Extremely Conservative)
        merged_groups = []
        used = set()
        for i in range(len(filtered)):
            if i in used: continue
            current_group = [filtered[i]]
            used.add(i)
            
            for j in range(i+1, len(filtered)):
                if j in used: continue
                # True merge ONLY if almost exact string match (> 0.92) and same block
                b1 = set(filtered[i]['evidence'].get('evidence_blocks', []))
                b2 = set(filtered[j]['evidence'].get('evidence_blocks', []))
                
                if (b1 & b2) and similar(filtered[i]['label'], filtered[j]['label']) > 0.92:
                    current_group.append(filtered[j])
                    used.add(j)
                    
            merged_groups.append(current_group)
            
        # Register atomic capabilities
        for g in merged_groups:
            primary = g[0]
            new_atomic = {
                "capability_id": str(uuid.uuid4()),
                "label": primary['label'],
                "normalized_from": [c['capability_id'] for c in g],
                "decision": "keep" if len(g) == 1 else "merge",
                "normalization_reason": "Independent capability" if len(g) == 1 else "True merge of identical strings",
                "source_blocks": primary['evidence'].get('evidence_blocks', []),
                "evidence": [c['evidence'] for c in g],
                "original_capability": primary
            }
            atomic_caps.append(new_atomic)
            
        # 3. Third Pass: Families
        # Group atomic capabilities by category
        family_map = {}
        for ac in atomic_caps:
            cat = categorize(ac['label'])
            if cat not in family_map:
                family_map[cat] = []
            family_map[cat].append(ac)
            
        for cat_label, members in family_map.items():
            if len(members) > 1:
                families.append({
                    "family_id": str(uuid.uuid4()),
                    "family_label": cat_label,
                    "member_capability_ids": [m['capability_id'] for m in members],
                    "grouping_reason": f"Groups functionally related atomic capabilities within {cat_label}"
                })

        # Save to output schema
        out_data['entities'][eid] = {
            "entity_id": eid,
            "status": entity.get("status"),
            "atomic_capabilities": atomic_caps,
            "capability_families": families,
            "discarded": discarded_caps,
            "deployment_models": deps + metadata_caps
        }

    args.out_file.write_text(json.dumps(out_data, indent=2), encoding='utf-8')

if __name__ == '__main__':
    main()
