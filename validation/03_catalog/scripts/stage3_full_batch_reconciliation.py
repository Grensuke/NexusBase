import json
from pathlib import Path

def main():
    raw_data = json.load(open('01_extraction/outputs/NexusBase_extracted_capabilities_v0.2.json', encoding='utf-8'))
    full_data = json.load(open('03_catalog/outputs/NexusBase_normalized_capabilities_v0.3_full.json', encoding='utf-8'))
    
    out = []
    out.append("==================================================")
    out.append("1. RECONCILIATION TABLE")
    out.append("==================================================")
    out.append(f"{'Entity':<15} | {'Raw':<5} | {'Atomic':<6} | {'Meta':<4} | {'Disc':<4} | {'SumDest':<7} | {'Diff':<5}")
    out.append("-" * 65)
    
    total_raw = 0
    total_atomic = 0
    total_meta = 0
    total_disc = 0
    total_sumdest = 0
    
    for eid, ent in full_data['entities'].items():
        if ent.get('status') in ['extracted', 'success']:
            # Count from raw
            raw_ent = raw_data['entities'][eid]
            raw_caps = raw_ent.get('capabilities', [])
            raw_deps = raw_ent.get('deployment_models', [])
            raw_count = len(raw_caps) + len(raw_deps)
            
            # Count from full
            atomic = ent.get('atomic_capabilities', [])
            meta = ent.get('metadata_capabilities', [])
            disc = ent.get('discarded', [])
            
            atomic_count = len(atomic)
            meta_count = len(meta)
            disc_count = len(disc)
            
            # For merged records, atomic capability corresponds to MULTIPLE raw capabilities.
            # So sum_dest = sum of len(normalized_from) for atomic + meta + disc
            # Wait, the user said: "Verify: raw_count = atomic_count + metadata_count + discarded_count"
            # But if there was a true merge, multiple raw records become ONE atomic record.
            # Does `atomic_count` mean number of atomic records, or number of raw capabilities mapped to atomic?
            # Let's count both.
            
            sum_dest = atomic_count + meta_count + disc_count
            diff = raw_count - sum_dest
            
            out.append(f"{eid:<15} | {raw_count:<5} | {atomic_count:<6} | {meta_count:<4} | {disc_count:<4} | {sum_dest:<7} | {diff:<5}")
            
            total_raw += raw_count
            total_atomic += atomic_count
            total_meta += meta_count
            total_disc += disc_count
            total_sumdest += sum_dest

    out.append("-" * 65)
    out.append(f"{'TOTAL':<15} | {total_raw:<5} | {total_atomic:<6} | {total_meta:<4} | {total_disc:<4} | {total_sumdest:<7} | {total_raw - total_sumdest:<5}")
    
    out.append("\n==================================================")
    out.append("2. INVESTIGATING DISCREPANCY")
    out.append("==================================================")
    # Check for merges
    for eid, ent in full_data['entities'].items():
        if ent.get('status') in ['extracted', 'success']:
            merges = 0
            for ac in ent.get('atomic_capabilities', []):
                norm_from = ac.get('normalized_from', [])
                if len(norm_from) > 1:
                    merges += len(norm_from) - 1
            if merges > 0:
                out.append(f"[{eid}] Has {merges} merged raw capabilities (which reduces atomic count).")
                
            # Check duplicate capability IDs in raw
            raw_ent = raw_data['entities'][eid]
            raw_caps = raw_ent.get('capabilities', []) + raw_ent.get('deployment_models', [])
            raw_ids = [c.get('capability_id', '') for c in raw_caps]
            unique_raw_ids = set(raw_ids)
            if len(raw_ids) != len(unique_raw_ids):
                out.append(f"[{eid}] Has duplicate capability IDs in raw!")
                
            # Check for any missing from destinations
            dest_ids = []
            for ac in ent.get('atomic_capabilities', []):
                dest_ids.extend(ac.get('normalized_from', []))
            for mc in ent.get('metadata_capabilities', []):
                dest_ids.append(mc.get('capability_id', ''))
            for dc in ent.get('discarded', []):
                orig = dc.get('original_capability', {})
                dest_ids.append(orig.get('capability_id', ''))
                
            missing = unique_raw_ids - set(dest_ids)
            if missing:
                out.append(f"[{eid}] Missing {len(missing)} raw IDs from destinations: {missing}")

    Path('03_catalog/reports/stage3_full_batch_reconciliation.txt').write_text('\n'.join(out), encoding='utf-8')

if __name__ == '__main__':
    main()
