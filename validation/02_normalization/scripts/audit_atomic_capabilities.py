import json
from pathlib import Path

def classify_capability(label, quote):
    lbl = label.lower()
    q = quote.lower()
    
    # Heuristics based on prompt guidelines
    
    # A = Valid atomic capability
    if any(w in lbl for w in ['parse', 'parsing', 'extract', 'extraction', 'discover', 'continue by page', 'citation locator', 'configurable exclusion']):
        if 'parsing' == lbl or 'document parsing' == lbl:
            return 'D' # too generic
        return 'A'
        
    # B = Valid but config/deployment/metadata
    if any(w in lbl for w in ['by default', 'configuration', 'deploy', 'local document parsing by default', 'independent model configuration']):
        return 'B'
        
    # C = Likely implementation detail
    if any(w in lbl for w in ['authorization', 'fallback parser', 'python document library integration', 'accelerated build of torch', 'gpu build', 'default install', 'anonymous usage']):
        return 'C'
        
    # D = Marketing/downstream
    if any(w in lbl for w in ['llm-ready', 'rag pipelines', 'vector embeddings', 'easy data preparation']):
        return 'D'
        
    return 'E' # Ambiguous

def main():
    data = json.load(open('02_normalization/outputs/NexusBase_quality_gated_capabilities_v0.2.json', encoding='utf-8'))
    
    counts = {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0}
    
    out = []
    out.append("==================================================")
    out.append("FULL 97-ITEM AUDIT")
    out.append("==================================================")
    
    for eid in ['mineru', 'pymupdf4llm']:
        if eid not in data['entities']: continue
        ent = data['entities'][eid]
        
        # Find Unclassified functionality family members
        unclassified_ids = set()
        for f in ent.get('capability_families', []):
            if f['family_label'] == "Unclassified functionality":
                for mid in f['member_capability_ids']:
                    unclassified_ids.add(mid)
                    
        for c in ent.get('atomic_capabilities', []):
            if c['capability_id'] in unclassified_ids:
                q = c['evidence'][0].get('quote', '') if c.get('evidence') else ''
                cls = classify_capability(c['label'], q)
                
                counts[cls] += 1
                
                # Truncate quote for concise reporting
                concise_quote = q.replace('\n', ' ')
                if len(concise_quote) > 80:
                    concise_quote = concise_quote[:77] + '...'
                    
                reason = "Matches keyword heuristic"
                if cls == 'E': reason = "No heuristic matched; requires manual review"
                
                out.append(f"- Entity: {eid}")
                out.append(f"  ID: {c['capability_id']}")
                out.append(f"  Label: {c['label']}")
                out.append(f"  Class: {cls}")
                out.append(f"  Family: Unclassified functionality")
                out.append(f"  Block ID: {c['evidence'][0].get('evidence_blocks', ['Unknown'])[0]}")
                out.append(f"  Evidence: {concise_quote}")
                out.append(f"  Reason: {reason}")
                out.append("")
                
    out.append("==================================================")
    out.append("QUALITY METRICS")
    out.append("==================================================")
    out.append(f"A count: {counts['A']}")
    out.append(f"B count: {counts['B']}")
    out.append(f"C count: {counts['C']}")
    out.append(f"D count: {counts['D']}")
    out.append(f"E count: {counts['E']}")
    out.append("")
    out.append(f"- possible invalid atomic capabilities: {counts['D']}")
    out.append(f"- possible metadata/configuration items: {counts['B']}")
    out.append(f"- possible implementation noise: {counts['C']}")
    out.append(f"- possible marketing/use-case noise: {counts['D']}")
    out.append(f"- ambiguous items requiring manual review: {counts['E']}")

    Path('02_normalization/reports/stage3_2_audit_report.txt').write_text('\n'.join(out), encoding='utf-8')
    print("Audit Complete")

if __name__ == '__main__':
    main()
