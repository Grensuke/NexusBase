import json
import re
from collections import defaultdict

data = json.load(open('archive/test_out.json', encoding='utf-8'))

def get_action_prefix(label):
    words = label.split()
    if len(words) >= 2:
        return ' '.join(words[:2]).lower()
    return label.lower()

def is_impl_detail(label, quote):
    impl_keywords = ['onnx', 'pytorch', 'vllm', 'llama.cpp', 'installation', 'pip install', 'ubuntu', 'centos']
    lbl = label.lower()
    q = quote.lower()
    for kw in impl_keywords:
        if kw in lbl: return True
    if 'install' in lbl and 'how to' in q: return True
    return False

def normalize(caps):
    # block_id -> action_prefix -> list of caps
    clusters = defaultdict(lambda: defaultdict(list))
    discarded = []
    retained = []
    
    for c in caps:
        lbl = c['label']
        q = c['evidence'].get('quote', '')
        b = c['evidence'].get('evidence_blocks', [''])[0]
        
        if is_impl_detail(lbl, q):
            discarded.append(c)
            continue
            
        action = get_action_prefix(lbl)
        
        # special CLI rule
        if 'command line' in lbl.lower() or 'cli' in lbl.lower() or '```bash' in q:
            action = 'command_line_tooling'
            
        # special Support for rule
        if lbl.lower().startswith('support for') or lbl.lower().startswith('optimized for'):
            action = 'feature_support'
            
        clusters[b][action].append(c)
        
    final_caps = []
    merged_examples = []
    
    for b, actions in clusters.items():
        for action, clist in actions.items():
            if len(clist) > 1:
                # Merge
                merged_label = 'Merged: ' + ', '.join(set(c['label'].split()[-1] for c in clist))
                if action == 'command_line_tooling': merged_label = 'Command-line utilities'
                elif action == 'feature_support': merged_label = 'Extended feature support (' + str(len(clist)) + ' items)'
                elif 'convert' in action: merged_label = 'Multi-format document conversion'
                
                merged_cap = clist[0].copy()
                merged_cap['label'] = merged_label
                final_caps.append(merged_cap)
                merged_examples.append((merged_label, [c['label'] for c in clist]))
            else:
                # Keep separate
                final_caps.append(clist[0])
                retained.append(clist[0])
                
    return final_caps, discarded, merged_examples, retained

print('=== Normalization Test ===')
for eid in ['mineru', 'pymupdf4llm']:
    caps = data['entities'][eid].get('capabilities', [])
    final, discarded, merged, retained = normalize(caps)
    print(f'\n{eid.upper()}: {len(caps)} -> {len(final)}')
    print(f'Discarded: {len(discarded)}, Merges: {len(merged)}')
    for m in merged[:5]:
        print(f'  Merged -> {m[0]}:\n    ' + '\n    '.join(m[1]))
    print('  ---')
    for r in retained[:5]:
        print(f'  Retained -> {r["label"]}')
    for d in discarded[:5]:
        print(f'  Discarded -> {d["label"]}')
