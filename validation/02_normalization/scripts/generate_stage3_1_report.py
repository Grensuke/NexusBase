import json
from pathlib import Path

def generate_report():
    report_data = json.load(open('02_normalization/reports/stage3_1_report_data.json', encoding='utf-8'))
    regression_text = Path('02_normalization/reports/stage3_regression_report.txt').read_text(encoding='utf-8')
    
    # Parse regression results
    pos_res = ""
    neg_res = ""
    data_int = ""
    
    for line in regression_text.split('\n'):
        if line.startswith("1. Number of positive tests"):
            pos_res = line
        elif line.startswith("2. Number of negative tests"):
            neg_res = line
        elif line.startswith("8. Data-integrity"):
            # The next line holds the actual result
            data_int = "See below"
            
    # Extract data integrity lines
    di_lines = []
    capture = False
    for line in regression_text.split('\n'):
        if line.startswith("8. Data-integrity"):
            capture = True
        elif line.startswith("9. Final"):
            capture = False
        elif capture and line.strip():
            di_lines.append(line.strip())

    out = []
    out.append("==================================================")
    out.append("STAGE 3.1 QUALITY GATE REPORT")
    out.append("==================================================")
    out.append(f"1. Before atomic count: {report_data['before_atomic']}")
    out.append(f"2. After atomic count: {report_data['after_atomic']}")
    out.append(f"3. New discards: {len(report_data['new_discards'])}")
    for d in report_data['new_discards']:
        out.append(f"   - {d}")
    out.append(f"4. Existing discards: {report_data['existing_discards']}")
    out.append(f"5. Families before: {report_data['families_before']}")
    out.append(f"6. Families after: {report_data['families_after']}")
    out.append(f"7. Number of items in Unclassified functionality: {report_data['unclassified_count']}")
    
    out.append("\n8. All 5 suspicious capabilities and final decisions:")
    for s in report_data['suspicious_decisions']:
        out.append(f"   [{s['decision']}] {s['label']}")
        out.append(f"       Reason: {s['reason']}")
        
    out.append("\n9. Any additional suspicious capabilities discovered:")
    # Anything in new discards that wasn't in the explicit list
    targeted = [
        "Recommendation based on user goal and environment",
        "Convert documents into LLM-ready data",
        "Support for vector embeddings",
        "Support for LLM ingestion",
        "Document loading and parsing"
    ]
    for d in report_data['new_discards']:
        if not any(t in d for t in targeted):
            out.append(f"   {d}")
            
    out.append("\n10. All family moves:")
    for fm in report_data['family_moves']:
        out.append(f"   - {fm}")
        
    out.append("\n11. Positive regression result:")
    out.append(f"   {pos_res}")
    
    out.append("\n12. Negative regression result:")
    out.append(f"   {neg_res}")
    
    out.append("\n13. Data-integrity result:")
    for l in di_lines:
        out.append(f"   {l}")
        
    out.append("\n--- COMPLETE MEMBERS OF UNCLASSIFIED FUNCTIONALITY ---")
    for u in report_data['unclassified_members']:
        out.append(f"  {u}")
        
    Path('02_normalization/reports/stage3_quality_gate_report.txt').write_text('\n'.join(out), encoding='utf-8')
    print("Stage 3.1 Report Generated.")

if __name__ == '__main__':
    generate_report()
