import json
import sys

def main():
    try:
        data = json.load(open('01_extraction/outputs/NexusBase_extracted_capabilities_v0.2.json', encoding='utf-8'))
    except FileNotFoundError:
        print("Raw catalog not found")
        sys.exit(1)
        
    all_entities = set(data['entities'].keys())
    
    success = []
    failed = []
    missing = []
    
    for eid in all_entities:
        if eid in data['entities']:
            ent = data['entities'][eid]
            status = ent.get('status')
            if status == 'extracted' or status == 'success':
                success.append(eid)
            else:
                failed.append(eid)
        else:
            missing.append(eid)
            
    print(f"Total Expected: {len(all_entities)}")
    print(f"Successful Extraction: {len(success)}")
    print(f"Failed Extraction: {len(failed)}")
    print(f"Missing: {len(missing)}")
    
    print("\nSuccessful Entities:")
    for eid in success:
        print(f" - {eid}")
        
    print("\nFailed/Incomplete Entities:")
    for eid in failed:
        status = data['entities'][eid].get('status', 'unknown')
        print(f" - {eid} (Status: {status})")
        
    print("\nMissing Entities:")
    for eid in missing:
        print(f" - {eid}")

if __name__ == '__main__':
    main()
