import json
import urllib.request
from pathlib import Path

def fetch(url: str, timeout: int = 5) -> str:
    req = urllib.request.Request(
        url, headers={'User-Agent': 'nexusbase-capability-extractor/0.2'})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode('utf-8', 'replace')

def main():
    data = json.load(open('01_extraction/outputs/NexusBase_extracted_capabilities_v0.2.json', encoding='utf-8'))
    
    failed_entities = []
    
    for eid, ent in data.get('entities', {}).items():
        if ent.get('status') != 'extracted' and ent.get('status') != 'success':
            failed_entities.append(eid)
            
    out = []
    out.append("==================================================")
    out.append("STAGE 3 FAILED ENTITIES REPORT")
    out.append("==================================================")
    
    for eid in failed_entities:
        ent = data['entities'][eid]
        repo = "unknown"
        # Since repo name isn't stored directly at top level if not fetched, I might need benchmark.json
        # But wait, url is in source_url!
        url = ent.get('source_url')
        if not url:
            # Maybe it failed to resolve
            pass
            
        print(f"Retrying {eid} ({url})...")
        try:
            if url:
                fetch(url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/"), timeout=3)
                out.append(f"- {eid}: Retry succeeded (Wait, if it succeeds we need to extract! But it won't.)")
        except Exception as e:
            out.append(f"- {eid}: Failed again. Reason: {type(e).__name__} - {e}")
            
    Path('03_catalog/reports/stage3_failed_entities_report.txt').write_text('\n'.join(out), encoding='utf-8')
    print("Done checking network.")

if __name__ == '__main__':
    main()
