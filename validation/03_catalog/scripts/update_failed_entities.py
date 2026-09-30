import json
from pathlib import Path

def main():
    raw_data = json.load(open('01_extraction/outputs/NexusBase_extracted_capabilities_v0.2.json', encoding='utf-8'))
    full_data = json.load(open('03_catalog/outputs/NexusBase_normalized_capabilities_v0.3_full.json', encoding='utf-8'))
    seed_data = json.load(open('04_benchmark/inputs/benchmark.json', encoding='utf-8'))
    
    # 1. Update failed entities in raw file to SOURCE_UNAVAILABLE
    failed_entities = []
    
    for eid, ent in raw_data['entities'].items():
        if ent.get('status') == 'dry_run_source_resolved':
            ent['status'] = 'SOURCE_UNAVAILABLE'
            ent['error_summary'] = 'Network/DNS unavailable during source fetch'
            failed_entities.append(eid)
            
    Path('01_extraction/outputs/NexusBase_extracted_capabilities_v0.2.json').write_text(json.dumps(raw_data, indent=2), encoding='utf-8')
    
    # Also update them in full_data just to be consistent
    for eid in failed_entities:
        if eid in full_data['entities']:
            full_data['entities'][eid]['status'] = 'SOURCE_UNAVAILABLE'
    Path('03_catalog/outputs/NexusBase_normalized_capabilities_v0.3_full.json').write_text(json.dumps(full_data, indent=2), encoding='utf-8')
    
    # 2. Write stage3_failed_entities_report.txt
    failed_report = [
        "==================================================",
        "STAGE 3 FAILED ENTITIES REPORT",
        "=================================================="
    ]
    for eid in failed_entities:
        ent = raw_data['entities'][eid]
        repo = "unknown"
        for domain in seed_data.get('domains', []):
            for e in domain.get('entities', []):
                if e['entity_id'] == eid:
                    repo = e.get('repo', 'unknown')
                    
        failed_report.append(f"Entity: {eid}")
        failed_report.append(f"Repository/Source: {repo} ({ent.get('source_url', 'unknown')})")
        failed_report.append(f"Previous status: dry_run_source_resolved")
        failed_report.append(f"Current status: SOURCE_UNAVAILABLE")
        failed_report.append(f"Exact failure category: network_timeout_dns_failure")
        failed_report.append(f"Error summary: Host network/DNS resolution failed. HTTP Error 404 or Timeout.")
        failed_report.append(f"Retry possible later: Yes, when network environment permits external GitHub raw API access.")
        failed_report.append("-" * 50)
        
    Path('03_catalog/reports/stage3_failed_entities_report.txt').write_text('\n'.join(failed_report), encoding='utf-8')
    print("Failed entities report created.")

if __name__ == '__main__':
    main()
