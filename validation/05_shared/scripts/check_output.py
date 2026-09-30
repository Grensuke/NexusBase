import sys, json

data = json.load(open('01_extraction/outputs/NexusBase_extracted_capabilities_v0.2.json', encoding='utf-8'))

entities = ['redis', 'sentry', 'whisperx', 'marker']
for e in entities:
    if e not in data['entities']:
        print(f"Skipping {e} - not found.")
        continue
    ent = data['entities'][e]
    m = ent.get('metrics', {})
    print(f"==== ENTITY: {e} ====")
    print('Stage 1 raw candidates (blocks):', m.get('stage1_raw_candidates'))
    print('valid block references:', m.get('stage1_valid_blocks'))
    print('invalid block references:', m.get('stage1_invalid_blocks'))
    print('Stage 2 capability candidates:', m.get('stage2_capability_candidates'))
    print('Final accepted capabilities:', m.get('final_accepted'))
    print('Final accepted deployments:', m.get('final_accepted_deployments'))
    print('Final rejected capabilities:', m.get('final_rejected'))

    print('\nAccepted capabilities:')
    for c in ent.get('capabilities', []):
        print(f"  {c['capability_id']} | {c['label']} | {c['evidence']['evidence_blocks']}")

    print('\nAccepted deployment models:')
    for d in ent.get('deployment_models', []):
        print(f"  {d['capability_id']} | {d['label']} | {d['evidence']['evidence_blocks']}")

    print('\nRejected reason counts:')
    reasons = {}
    for r in ent.get('rejected', []):
        rs = r.get('reason')
        if rs and 'invalid block reference' in rs:
            rs = 'invalid block reference'
        reasons[rs] = reasons.get(rs, 0) + 1
    for rs, count in reasons.items():
        print(f"  {rs}: {count}")
    print()
