import json
import sys
import uuid
from pathlib import Path

def is_suspicious(label, evidence_quote):
    lbl = label.lower()
    q = evidence_quote.lower()
    
    # 1. Prompt leakage / instruction
    if "recommend one option based on" in q or "recommendation based on user goal" in lbl:
        return True, "Prompt leakage / workflow instruction"
        
    # 2. Marketing generic / downstream use cases
    if "llm-ready" in lbl or "llm-ready" in q:
        return True, "Generic downstream marketing (LLM-ready)"
    if "for rag pipelines" in lbl or "rag pipelines" in lbl:
        return True, "Generic downstream use case (RAG)"
    if "vector embeddings" in lbl:
        return True, "Generic downstream use case (embeddings)"
    if "llm ingestion" in lbl:
        return True, "Generic downstream use case (LLM ingestion)"
        
    # 3. Generic derived from API name
    if "document loading and parsing" in lbl and ("load_data" in q or "reader =" in q):
        return True, "Generic API example name"
        
    return False, ""

def recategorize(label, old_category):
    lbl = label.lower()
    
    # "Image saving to disk" -> Output conversion
    if "image saving" in lbl or "image save" in lbl:
        return "Output conversion and generation"
        
    # "Natural reading order reconstruction" -> Complex layout element extraction
    if "reading order" in lbl:
        return "Complex layout element extraction"
        
    if old_category == "Miscellaneous functionality":
        return "Unclassified functionality"
        
    return old_category

def main():
    in_file = Path('02_normalization/outputs/NexusBase_normalized_capabilities_v0.2.json')
    out_file = Path('02_normalization/outputs/NexusBase_quality_gated_capabilities_v0.2.json')
    
    if not in_file.exists():
        print("Missing input file")
        sys.exit(1)
        
    data = json.load(in_file.open(encoding='utf-8'))
    out_data = {
        "version": "v0.2-stage3.1-quality-gated",
        "generated_at": data.get("generated_at"),
        "entities": {}
    }
    
    report_data = {
        "before_atomic": 0,
        "after_atomic": 0,
        "new_discards": [],
        "existing_discards": 0,
        "families_before": 0,
        "families_after": 0,
        "unclassified_count": 0,
        "suspicious_decisions": [],
        "family_moves": [],
        "unclassified_members": []
    }
    
    # The five targeted items
    targeted = [
        "Recommendation based on user goal and environment",
        "Convert documents into LLM-ready data",
        "Support for vector embeddings",
        "Support for LLM ingestion",
        "Document loading and parsing"
    ]
    
    for eid in ['mineru', 'pymupdf4llm']:
        if eid not in data['entities']: continue
        
        ent = data['entities'][eid]
        old_atomic = ent.get('atomic_capabilities', [])
        old_families = ent.get('capability_families', [])
        old_discarded = ent.get('discarded', [])
        deps = ent.get('deployment_models', [])
        
        report_data["before_atomic"] += len(old_atomic)
        report_data["existing_discards"] += len(old_discarded)
        report_data["families_before"] += len(old_families)
        
        new_atomic = []
        new_discarded = list(old_discarded)
        
        for c in old_atomic:
            lbl = c['label']
            q = c['evidence'][0].get('quote', '') if c.get('evidence') else ''
            
            is_susp, reason = is_suspicious(lbl, q)
            
            # Log targeted decisions
            if any(t in lbl for t in targeted) or is_susp:
                # Store decision
                if lbl not in [x['label'] for x in report_data["suspicious_decisions"]]:
                    report_data["suspicious_decisions"].append({
                        "label": lbl,
                        "decision": "DISCARD" if is_susp else "KEEP",
                        "reason": reason if is_susp else "No deterministic rule matched"
                    })
                    
            if is_susp:
                new_discarded.append({
                    "original_capability": c.get('original_capability', c),
                    "decision": "discard",
                    "reason": reason
                })
                report_data["new_discards"].append(f"[{eid}] {lbl} -> {reason}")
            else:
                new_atomic.append(c)
                
        report_data["after_atomic"] += len(new_atomic)
        
        # Rebuild families based on potentially new classifications
        atomic_map = {c['capability_id']: c for c in new_atomic}
        new_family_map = {}
        
        for f in old_families:
            for mid in f['member_capability_ids']:
                if mid in atomic_map:
                    c = atomic_map[mid]
                    old_cat = f['family_label']
                    new_cat = recategorize(c['label'], old_cat)
                    
                    if old_cat != new_cat and old_cat != "Miscellaneous functionality":
                        report_data["family_moves"].append(f"{c['label']} : {old_cat} -> {new_cat}")
                        
                    if new_cat not in new_family_map:
                        new_family_map[new_cat] = []
                    new_family_map[new_cat].append(mid)
                    
                    if new_cat == "Unclassified functionality":
                        report_data["unclassified_members"].append(f"[{eid}] {c['label']}")
                        
        new_families = []
        for cat_label, members in new_family_map.items():
            if len(members) > 1:
                new_families.append({
                    "family_id": str(uuid.uuid4()),
                    "family_label": cat_label,
                    "member_capability_ids": members,
                    "grouping_reason": f"Groups functionally related atomic capabilities within {cat_label}"
                })
                
        report_data["families_after"] += len(new_families)
        if "Unclassified functionality" in new_family_map:
            report_data["unclassified_count"] += len(new_family_map["Unclassified functionality"])
            
        out_data['entities'][eid] = {
            "entity_id": eid,
            "status": ent.get("status"),
            "atomic_capabilities": new_atomic,
            "capability_families": new_families,
            "discarded": new_discarded,
            "deployment_models": deps
        }
        
    out_file.write_text(json.dumps(out_data, indent=2), encoding='utf-8')
    Path('02_normalization/reports/stage3_1_report_data.json').write_text(json.dumps(report_data, indent=2), encoding='utf-8')
    print("Stage 3.1 Quality Gate Complete")

if __name__ == '__main__':
    main()
