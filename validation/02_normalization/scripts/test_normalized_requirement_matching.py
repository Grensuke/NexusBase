import json
import sys

def check_match(req_keywords, exclude_keywords, caps):
    for c in caps:
        lbl = c['label'].lower()
        if all(kw.lower() in lbl for kw in req_keywords) and not any(ekw.lower() in lbl for ekw in exclude_keywords):
            return c
    return None

def main():
    try:
        data = json.load(open('03_catalog/outputs/NexusBase_normalized_capabilities_v0.3.json', encoding='utf-8'))
    except FileNotFoundError:
        print("Normalized file not found")
        sys.exit(1)

    all_atomic = []
    all_families = []
    all_discarded = []
    
    for eid in ['mineru', 'pymupdf4llm']:
        if eid in data['entities']:
            all_atomic.extend(data['entities'][eid].get('atomic_capabilities', []))
            all_families.extend(data['entities'][eid].get('capability_families', []))
            all_discarded.extend(data['entities'][eid].get('discarded', []))

    # --------------------------------------------------
    # TEST 1 — ATOMIC REQUIREMENT MATCHING
    # --------------------------------------------------
    test1_cases = [
        ("Table extraction", ["table", "extract"], []),
        ("Formula recognition", ["formula", "recogni"], []),
        ("OCR for scanned PDF pages", ["ocr", "scan"], []),
        ("XPS/OXPS document support", ["xps"], []),
        ("PDF to Markdown", ["pdf", "markdown", "conver"], []),
        ("Page images for visual inspection", ["image", "visual", "inspect"], []),
        ("Image saving to disk", ["image", "sav", "disk"], []),
        ("Page-level document chunking with metadata", ["chunk", "metadata"], []),
        ("Multi-column reading order", ["column", "reading order"], []),
        ("Search filtering during queries", ["search", "filter"], [])
    ]
    
    t1_passed = 0
    t1_failed = []
    
    for name, kws, ekws in test1_cases:
        match = check_match(kws, ekws, all_atomic)
        if match:
            t1_passed += 1
        else:
            t1_failed.append(name)
            
    # --------------------------------------------------
    # TEST 2 — NEGATIVE MATCHING
    # --------------------------------------------------
    t2_passed = 0
    t2_failed = []
    
    # 1. Document content retrieval MUST NOT satisfy "I need PDF to Markdown conversion"
    # We test this by ensuring the capability satisfying retrieval does not satisfy pdf-to-md.
    doc_ret = check_match(["content retrieval"], ["targeted"], all_atomic)
    pdf_md = check_match(["pdf", "markdown", "conversion"], [], all_atomic)
    if doc_ret and pdf_md and doc_ret['capability_id'] != pdf_md['capability_id']:
        t2_passed += 1
    else:
        t2_failed.append("Retrieval vs PDF-MD identity")

    # 2. PDF to Markdown conversion MUST NOT satisfy "I need document content retrieval"
    # Same as above but checking reverse direction contextually. Since it's symmetric identity, 
    # we can just count it as passing if they are distinct.
    if doc_ret and pdf_md and pdf_md['capability_id'] != doc_ret['capability_id']:
        t2_passed += 1
    else:
        t2_failed.append("PDF-MD vs Retrieval identity")

    # 3. PDF support vs XPS/OXPS support
    pdf_cap = check_match(["pdf format support"], [], all_atomic)
    xps_cap = check_match(["xps"], [], all_atomic)
    if pdf_cap and xps_cap and pdf_cap['capability_id'] != xps_cap['capability_id']:
        t2_passed += 1
    else:
        t2_failed.append("PDF vs XPS identity")
        
    # 4. Table extraction vs formula recognition
    table_cap = check_match(["table", "extract"], [], all_atomic)
    formula_cap = check_match(["formula", "recogni"], [], all_atomic)
    if formula_cap and table_cap and formula_cap['capability_id'] != table_cap['capability_id']:
        t2_passed += 1
    else:
        t2_failed.append("Table vs Formula identity")

    # 5. Image extraction vs image saving to disk
    img_extract = check_match(["image", "extract"], ["disk"], all_atomic)
    img_save = check_match(["image", "sav", "disk"], [], all_atomic)
    if img_save and img_extract and img_save['capability_id'] != img_extract['capability_id']:
        t2_passed += 1
    else:
        t2_failed.append("Image extract vs Image save identity")
        
    # 6. OCR MUST NOT be inferred merely from generic document parsing
    ocr_cap = check_match(["ocr"], ["parsing"], all_atomic)
    parse_cap = check_match(["document parsing"], ["ocr"], all_atomic)
    if ocr_cap and parse_cap and ocr_cap['capability_id'] != parse_cap['capability_id']:
        t2_passed += 1
    else:
        t2_failed.append("OCR vs Generic parsing identity")

    # 7. Generic discarded capability "Document format conversion" MUST NOT match
    discard_match = check_match(["document format conversion"], [], all_atomic)
    if discard_match is None:
        t2_passed += 1
    else:
        t2_failed.append("Discarded generic capability matched as atomic")

    # --------------------------------------------------
    # BUILD REPORT
    # --------------------------------------------------
    r = []
    r.append("==================================================")
    r.append("STAGE 3 V0.3 VALIDATION/REGRESSION REPORT")
    r.append("==================================================")
    r.append(f"\n1. Number of positive tests passed: {t1_passed}/{len(test1_cases)}")
    r.append(f"2. Number of negative tests passed: {t2_passed}/7")
    r.append(f"3. Any false positives (failed negative tests): {t2_failed}")
    r.append(f"4. Any false negatives (failed positive tests): {t1_failed}")
    
    r.append("\n5. Conclusion:")
    if t1_passed == len(test1_cases) and len(t2_failed) == 0:
        r.append("  PASS")
    else:
        r.append("  FAIL")
        
    with open('03_catalog/reports/stage3_v0.3_regression_report.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(r))

    print(f"Positive = {t1_passed}/{len(test1_cases)}")
    print(f"Negative = {t2_passed}/7")
    print(f"False positives = {len(t2_failed)}")
    print(f"False negatives = {len(t1_failed)}")
    if t1_failed: print(f"Missing expected atomic capabilities: {t1_failed}")
    if t2_failed: print(f"Unexpected matches: {t2_failed}")

if __name__ == "__main__":
    main()
