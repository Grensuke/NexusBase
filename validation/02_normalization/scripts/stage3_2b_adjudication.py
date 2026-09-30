import json
from pathlib import Path

# Dictionary mapping lowercase labels to (Classification, Reason, Confidence)
ADJUDICATIONS = {
    "remote api usage check": ("B", "Describes checking quota/usage limits, a deployment/metadata property.", "HIGH"),
    "installation recommendation for uv": ("B", "Deployment/environment recommendation, not a software capability.", "HIGH"),
    "file forgetting without deletion": ("A", "Explicit user-facing command to wipe database records without deleting source files.", "HIGH"),
    "support for multiple model engines": ("B", "Configuration choice of backend model engines.", "HIGH"),
    "support for custom installation of model engines": ("B", "Deployment and configuration property.", "HIGH"),
    "model download size varies by engine (0.8 gb to 3 gb)": ("B", "Resource requirement/deployment metadata.", "HIGH"),
    "ram requirements vary by model engine (2 gb to 16 gb)": ("B", "Resource requirement/deployment metadata.", "HIGH"),
    "support for cpu and gpu/mps accelerators": ("B", "Deployment/hardware configuration property.", "HIGH"),
    "document content retrieval": ("A", "Core user-facing function: retrieving parsed content.", "HIGH"),
    "support for page/block continuation in long documents": ("A", "Distinct user-facing function for navigating/resuming long documents.", "HIGH"),
    "user choice-based recovery paths for errors": ("B", "Runtime error handling configuration.", "HIGH"),
    "document format conversion": ("D", "Generic description of overall purpose rather than a specific atomic feature.", "HIGH"),
    "agent continuation by page or block": ("A", "Navigation feature allowing agents to resume reading.", "HIGH"),
    "citation support through locators": ("A", "Feature that provides stable locators for citing specific blocks.", "HIGH"),
    "forget a file or folder without deleting it": ("A", "Duplicate of file forgetting: explicit user command.", "HIGH"),
    "targeted content retrieval using locators": ("A", "User-facing function to retrieve specific content blocks.", "HIGH"),
    "support for different model engines with additional features": ("B", "Configuration property regarding model engines.", "HIGH"),
    "command-line entrypoint usage": ("C", "Implementation detail describing how the CLI is invoked.", "HIGH"),
    "document summarization": ("D", "Downstream use case (the tool parses, the downstream agent summarizes).", "MEDIUM"),
    "document quoting": ("D", "Downstream use case / generic description.", "MEDIUM"),
    "document citing": ("D", "Downstream use case / generic description.", "MEDIUM"),
    "document question answering": ("D", "Downstream use case (the tool parses, downstream does QA).", "MEDIUM"),
    "support for nvidia gpu with `mineru[full]`": ("B", "Hardware deployment/installation configuration.", "HIGH"),
    "webui interface support": ("A", "Distinct user-facing interface delivery.", "HIGH"),
    "default limit to first 10 pdf pages": ("B", "Runtime configuration / default setting behavior.", "HIGH"),
    "document conversion": ("D", "Too generic; high-level description.", "HIGH"),
    "application integration": ("D", "Broad marketing statement.", "HIGH"),
    "support for multiple rendering formats": ("A", "Meaningful user-facing outcome (rendering into 9 formats).", "MEDIUM"),
    "pdf cache invalidation": ("A", "Explicit user command to invalidate cache for a file.", "HIGH"),
    "remote failure fallback to local execution": ("B", "Runtime configuration/behavior property.", "HIGH"),
    "document locator support": ("A", "Feature generating and using stable identifiers for content.", "HIGH"),
    "watched directories support": ("A", "Distinct user-facing functionality (watching folders for auto-processing).", "HIGH"),
    "page/block continuation locators": ("A", "Feature providing locators for resuming reads.", "HIGH"),
    "result invalidation support": ("A", "Explicit user function to invalidate cache.", "HIGH"),
    "user-controlled document upload": ("B", "Privacy/operational behavior property.", "HIGH"),
    "unified toolset for integration and interaction": ("D", "Broad marketing statement.", "HIGH"),
    "pdf page selection across multiple interfaces": ("A", "User-facing capability to select specific pages to parse.", "HIGH"),
    "support for multiple document formats": ("D", "Generic description; specific formats are extracted elsewhere.", "HIGH"),
    "support for scanned pdfs": ("A", "Explicit format support capability.", "HIGH"),
    "support for academic papers": ("D", "Downstream use case / generic description.", "MEDIUM"),
    "support for office document formats": ("A", "Explicit format support capability.", "HIGH"),
    "support for html documents": ("A", "Explicit format support capability.", "HIGH"),
    "support for csv and tsv files": ("A", "Explicit format support capability.", "HIGH"),
    "model downloading by tier": ("B", "Configuration / deployment command.", "HIGH"),
    "model verification by tier": ("B", "Configuration / deployment command.", "HIGH"),
    "file content display": ("A", "Explicit user command to display parsed content.", "HIGH"),
    "document scanning": ("D", "Generic or downstream use case.", "MEDIUM"),
    "detection and preservation of bold, italic, monospace, and code blocks": ("A", "Explicit parsed layout element preservation.", "HIGH"),
    "detection and inclusion of references to vector graphic elements": ("A", "Explicit parsed layout element preservation.", "HIGH"),
    "processing a subset of pages via the `pages` parameter": ("A", "Explicit user-facing parameter.", "HIGH"),
    "page count retrieval": ("A", "Metadata feature returned by the parser.", "HIGH"),
    "file path retrieval": ("C", "Implementation detail (returning the path passed in).", "HIGH"),
    "llamaindex and langchain compatibility": ("A", "Explicitly supported framework integration.", "HIGH"),
    "document loading integration with llamaindex and langchain": ("A", "Explicitly supported framework integration.", "HIGH")
}

def main():
    data = json.load(open('02_normalization/outputs/NexusBase_quality_gated_capabilities_v0.2.json', encoding='utf-8'))
    
    # Reload the 54 E items from the previous audit logic
    # We can just re-run the previous heuristic to identify them, then use ADJUDICATIONS
    
    counts = {'A': 0, 'B': 0, 'C': 0, 'D': 0}
    
    out = []
    out.append("==================================================")
    out.append("STAGE 3.2B ADJUDICATION REPORT")
    out.append("==================================================")
    
    insufficient = []
    low_confidence = []
    needs_review = []
    
    for eid in ['mineru', 'pymupdf4llm']:
        if eid not in data['entities']: continue
        ent = data['entities'][eid]
        
        unclassified_ids = set()
        for f in ent.get('capability_families', []):
            if f['family_label'] == "Unclassified functionality":
                for mid in f['member_capability_ids']:
                    unclassified_ids.add(mid)
                    
        for c in ent.get('atomic_capabilities', []):
            if c['capability_id'] in unclassified_ids:
                lbl = c['label'].lower()
                q = c['evidence'][0].get('quote', '') if c.get('evidence') else ''
                
                # Use previous heuristic to determine if it was an E
                def was_e(label):
                    lbl_lower = label.lower()
                    if any(w in lbl_lower for w in ['parse', 'parsing', 'extract', 'extraction', 'discover', 'continue by page', 'citation locator', 'configurable exclusion']):
                        if 'parsing' == lbl_lower or 'document parsing' == lbl_lower: return False
                        return False
                    if any(w in lbl_lower for w in ['by default', 'configuration', 'deploy', 'local document parsing by default', 'independent model configuration']):
                        return False
                    if any(w in lbl_lower for w in ['authorization', 'fallback parser', 'python document library integration', 'accelerated build of torch', 'gpu build', 'default install', 'anonymous usage']):
                        return False
                    if any(w in lbl_lower for w in ['llm-ready', 'rag pipelines', 'vector embeddings', 'easy data preparation']):
                        return False
                    return True
                
                if was_e(c['label']):
                    # Adjudicate
                    adj = ADJUDICATIONS.get(lbl)
                    if not adj:
                        # Fallback if label mismatch
                        adj = ("D", "Unmapped ambiguous item mapped to generic noise", "LOW")
                        
                    cls, reason, conf = adj
                    counts[cls] += 1
                    
                    if conf == "LOW": low_confidence.append(c['label'])
                    if cls == "E": needs_review.append(c['label'])
                    
                    concise_quote = q.replace('\n', ' ')
                    if len(concise_quote) > 80:
                        concise_quote = concise_quote[:77] + '...'
                        
                    out.append(f"- Entity: {eid}")
                    out.append(f"  ID: {c['capability_id']}")
                    out.append(f"  Label: {c['label']}")
                    out.append(f"  Class: {cls}")
                    out.append(f"  Block ID: {c['evidence'][0].get('evidence_blocks', ['Unknown'])[0]}")
                    out.append(f"  Evidence: {concise_quote}")
                    out.append(f"  Reason: {reason}")
                    out.append(f"  Confidence: {conf}")
                    out.append("")
                    
    out.append("==================================================")
    out.append("QUALITY METRICS")
    out.append("==================================================")
    out.append(f"A total: {counts['A']}")
    out.append(f"B total: {counts['B']}")
    out.append(f"C total: {counts['C']}")
    out.append(f"D total: {counts['D']}")
    out.append(f"Former E total: {sum(counts.values())}")
    out.append("")
    out.append("==================================================")
    out.append("FLAGGED ITEMS")
    out.append("==================================================")
    out.append(f"Insufficient evidence: {len(insufficient)}")
    out.append(f"LOW confidence: {len(low_confidence)}")
    for l in low_confidence: out.append(f" - {l}")
    out.append(f"Needs manual review: {len(needs_review)}")
    
    Path('02_normalization/reports/stage3_2b_adjudication_report.txt').write_text('\n'.join(out), encoding='utf-8')
    print(f"Adjudication Complete. Processed {sum(counts.values())} items.")

if __name__ == '__main__':
    main()
