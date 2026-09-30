import json
from pathlib import Path

def main():
    report_data = json.load(open('02_normalization/reports/stage3_finalization_data.json', encoding='utf-8'))
    regression_text = Path('02_normalization/reports/stage3_regression_report.txt').read_text(encoding='utf-8')
    
    pos_res = ""
    neg_res = ""
    di_lines = []
    capture = False
    
    for line in regression_text.split('\n'):
        if line.startswith("1. Number of positive tests"):
            pos_res = line
        elif line.startswith("2. Number of negative tests"):
            neg_res = line
        elif line.startswith("8. Data-integrity"):
            capture = True
        elif line.startswith("9. Final"):
            capture = False
        elif capture and line.strip():
            di_lines.append(line.strip())
            
    out = []
    out.append("==================================================")
    out.append("STAGE 3 FINALIZATION REPORT")
    out.append("==================================================")
    out.append("1. Input catalog/version: NexusBase_quality_gated_capabilities_v0.2.json")
    out.append("2. Output catalog/version: NexusBase_normalized_capabilities_v0.3.json")
    out.append(f"3. Raw count: {report_data['raw_expected']}")
    out.append("4. Atomic count by entity:")
    for e, c in report_data['atomic_by_entity'].items():
        out.append(f"   - {e}: {c}")
    out.append(f"5. Total atomic count: {report_data['total_atomic']}")
    out.append(f"6. Metadata count: {report_data['metadata_count']}")
    out.append(f"7. Discarded count: {report_data['discarded_count']}")
    out.append("8. Count reconciliation:")
    
    total_acc = report_data['total_atomic'] + report_data['metadata_count'] + report_data['discarded_count']
    # Remember discards include the 7 initial + 6 quality gate + X new.
    # Actually wait, raw count was 209.
    out.append(f"   Raw Phase 2: {report_data['raw_expected']}")
    out.append(f"   Sum of Atomic+Metadata+Discarded: {total_acc}")
    if total_acc == report_data['raw_expected']:
        out.append("   Reconciliation: OK")
    else:
        out.append("   Reconciliation: MISMATCH")
        
    out.append(f"9. Number of families: {report_data['families_total']}")
    out.append(f"10. Empty families removed: {report_data['families_removed']}")
    
    out.append("\n11. Data-integrity checks:")
    for l in di_lines: out.append(f"   {l}")
        
    out.append(f"\n12. Positive regression result: {pos_res}")
    out.append(f"13. Negative regression result: {neg_res}")
    
    out.append("\n14. ADJUDICATED ITEMS LIST:")
    for item in report_data['items']:
        out.append(f"  - {item['label']} => [{item['class']}] Moved to: {item['destination']}")
        
    Path('02_normalization/reports/stage3_finalization_report.txt').write_text('\n'.join(out), encoding='utf-8')
    print("Report generated")

if __name__ == '__main__':
    main()
