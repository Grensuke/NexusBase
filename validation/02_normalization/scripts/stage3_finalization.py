import json
import re
from pathlib import Path

def main():
    # 1. Parse adjudication report
    report_text = Path('02_normalization/reports/stage3_2b_adjudication_report.txt').read_text(encoding='utf-8')
    adjudications = {}
    current_label = None
    current_class = None
    
    for line in report_text.split('\n'):
        if line.startswith("  Label: "):
            current_label = line.replace("  Label: ", "").strip()
        elif line.startswith("  Class: "):
            current_class = line.replace("  Class: ", "").strip()
            adjudications[current_label] = current_class
            
    # 2. Load v0.2
    data = json.load(open('02_normalization/outputs/NexusBase_quality_gated_capabilities_v0.2.json', encoding='utf-8'))
    
    out_data = {
        "version": "v0.3",
        "generated_at": data.get("generated_at"),
        "entities": {}
    }
    
    report = {
        "raw_expected": 209,
        "atomic_by_entity": {},
        "total_atomic": 0,
        "metadata_count": 0,
        "discarded_count": 0,
        "families_removed": 0,
        "families_total": 0,
        "items": []
    }
    
    for eid in ['mineru', 'pymupdf4llm']:
        if eid not in data['entities']: continue
        ent = data['entities'][eid]
        
        old_atomic = ent.get('atomic_capabilities', [])
        old_families = ent.get('capability_families', [])
        old_discarded = ent.get('discarded', [])
        deps = ent.get('deployment_models', [])
        old_metadata = ent.get('metadata_capabilities', []) # just in case
        
        new_atomic = []
        new_metadata = list(old_metadata)
        new_discarded = list(old_discarded)
        
        # Track counts
        report["discarded_count"] += len(old_discarded)
        report["metadata_count"] += len(old_metadata)
        
        for c in old_atomic:
            lbl = c['label']
            if lbl in adjudications:
                cls = adjudications[lbl]
                report["items"].append({"label": lbl, "class": cls, "destination": cls})
                
                if cls == 'A':
                    new_atomic.append(c)
                elif cls == 'B':
                    c_meta = dict(c)
                    c_meta['classification'] = 'B'
                    c_meta['adjudication_reason'] = "Adjudicated as Configuration / deployment / metadata property"
                    new_metadata.append(c_meta)
                    report["metadata_count"] += 1
                elif cls in ['C', 'D']:
                    c_disc = dict(c)
                    c_disc['classification'] = cls
                    c_disc['decision'] = "discard"
                    c_disc['reason'] = "Adjudicated as C/D (Implementation detail or Marketing)"
                    c_disc['adjudication_reason'] = "Adjudicated as C/D"
                    new_discarded.append(c_disc)
                    report["discarded_count"] += 1
            else:
                new_atomic.append(c)
                
        # Clean families
        new_families = []
        atomic_ids = {c['capability_id'] for c in new_atomic}
        
        for f in old_families:
            new_members = [mid for mid in f['member_capability_ids'] if mid in atomic_ids]
            if len(new_members) > 0:
                f['member_capability_ids'] = new_members
                new_families.append(f)
            else:
                report["families_removed"] += 1
                
        report["families_total"] += len(new_families)
        report["atomic_by_entity"][eid] = len(new_atomic)
        report["total_atomic"] += len(new_atomic)
        
        out_data['entities'][eid] = {
            "entity_id": eid,
            "status": ent.get("status"),
            "atomic_capabilities": new_atomic,
            "capability_families": new_families,
            "metadata_capabilities": new_metadata,
            "discarded": new_discarded,
            "deployment_models": deps
        }
        
    # Write output
    Path('03_catalog/outputs/NexusBase_normalized_capabilities_v0.3.json').write_text(json.dumps(out_data, indent=2), encoding='utf-8')
    Path('02_normalization/reports/stage3_finalization_data.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print("Finalization script completed")

if __name__ == '__main__':
    main()
