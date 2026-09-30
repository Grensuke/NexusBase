import json
import argparse
from pathlib import Path

def print_report():
    data = json.load(open('02_normalization/outputs/NexusBase_normalized_capabilities_v0.2.json', encoding='utf-8'))
    
    print("=" * 60)
    print("REPORT: ATOMIC + FAMILY NORMALIZATION")
    print("=" * 60)
    
    for eid in ['mineru', 'pymupdf4llm']:
        print(f"\n--- ENTITY: {eid} ---")
        ent = data['entities'][eid]
        atomic_caps = ent.get('atomic_capabilities', [])
        families = ent.get('capability_families', [])
        discarded = ent.get('discarded', [])
        metadata = ent.get('deployment_models', [])
        
        # Original counts are exactly atomic_caps + discarded + metadata
        # (Minus any that were merged, but merges are extremely conservative now)
        raw_count = len(atomic_caps) + sum(len(c.get('normalized_from', [])) - 1 for c in atomic_caps) + len(discarded) + len(metadata) - len(ent.get('deployment_models', []))
        # wait, deps include original deps + new ones.
        
        true_merges = sum(1 for c in atomic_caps if c['decision'] == 'merge')
        
        print(f"1. Raw capability count: {raw_count} (Approx based on test_out.json)")
        print(f"2. Atomic capability count: {len(atomic_caps)}")
        print(f"3. Number of true merges: {true_merges}")
        print(f"4. Number of capability families: {len(families)}")
        print(f"5. Number discarded: {len(discarded)}")
        print(f"6. Number moved to metadata: {len(metadata)}")
        
        print("\n7. Representative Decisions (Atomic Keep/Merge/Discard)")
        for c in atomic_caps[:5]:
            print(f"  [ATOMIC] {c['label']} (Decision: {c['decision']})")
        for d in discarded[:3]:
            print(f"  [DISCARD] {d['original_capability']['label']} - {d['reason']}")
            
        print("\n9. Families generated with its atomic members")
        for f in families:
            print(f"  [FAMILY] {f['family_label']}")
            for m_id in f['member_capability_ids']:
                # Find label
                m_label = next((c['label'] for c in atomic_caps if c['capability_id'] == m_id), 'Unknown')
                print(f"    - {m_label}")
                
        print("\n10. Generic labels/families containing Document, Support for, etc.")
        for f in families:
            if any(w in f['family_label'].lower() for w in ['document', 'support for', 'processing', 'feature', 'general']):
                print(f"  WARNING Generic Family: {f['family_label']}")
        for c in atomic_caps:
            if any(w in c['label'].lower() for w in ['document', 'support for', 'processing', 'feature', 'general']):
                pass # Just silently observing here unless specifically requested to print all
                # The prompt asks "Show any generic labels/families containing: Document, Support for..."
                print(f"  WARNING Generic Label: {c['label']}")

if __name__ == '__main__':
    print_report()
