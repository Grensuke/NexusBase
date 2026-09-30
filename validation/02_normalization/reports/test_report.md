# NexusBase Extraction & Evidence Validation Report v0.2

Generated: 2026-09-29T18:18:32+00:00
Mode: live_extraction
Model: qwen3:8b

## Summary
- Entities processed: **2**
- Entities with capabilities: **2**
- Entities with no source: **0**
- Total accepted capabilities: **209**
- Total rejected: **0**

## Confidence Distribution
- high: **203**
- medium: **6**

## Evidence Type Distribution
- descriptive_context: **73**
- explicit_statement: **135**
- fragment: **1**

## Per-Entity Detail
### mineru
- Status: extracted
- Source: readme — https://raw.githubusercontent.com/opendatalab/MinerU/HEAD/README.md
- Accepted: 162, Rejected: 0
  - ✅ `remote_api_usage_check` (high): "11. User asks for Remote API usage or limits: use `mineru usage --json`.
"
  - ✅ `recommendation_based_on_user_goal` (high): "  - In either case, recommend one option based on the user's goal and environmen"
  - ✅ `visual_inspection_support` (high): "- Retrieve page or block images for visual inspection.
"
  - ✅ `local_file_reading` (high): "Use `mineru parse` for the first active read from a local file path.
"
  - ✅ `search_multiple_query_types` (high): "```bash
mineru search "revenue recognition"
mineru search "transformer architect"
  - ✅ `search_with_filters` (high): "```bash
mineru search "revenue recognition"
mineru search "transformer architect"
  - ✅ `search_with_output_format` (high): "```bash
mineru search "revenue recognition"
mineru search "transformer architect"
  - ✅ `document_to_markdown_conversion` (high): "- Convert document content into Markdown for analysis.
"
  - ✅ `local_parse_server_support` (high): "Use a local parse server when the user wants `basic`, `standard`, or `advanced` "
  - ✅ `ocr_text_processing` (high): "MinerU is especially useful when documents contain OCR text, tables, formulas, f"
  - ✅ `table_extraction` (high): "MinerU is especially useful when documents contain OCR text, tables, formulas, f"
  - ✅ `formula_recognition` (high): "MinerU is especially useful when documents contain OCR text, tables, formulas, f"
  - ✅ `figure_identification` (high): "MinerU is especially useful when documents contain OCR text, tables, formulas, f"
  - ✅ `complex_layout_handling` (high): "MinerU is especially useful when documents contain OCR text, tables, formulas, f"
  - ✅ `local_document_parsing` (high): "- By default, `mineru` parses documents locally. A document is sent for remote p"
  - ✅ `installation_recommendation_for_uv` (high): "If `uv`, `pipx`, `pip`, and `pip3` are all unavailable, or none of them can inst"
  - ✅ `server_control` (high): "```bash
mineru server stop
mineru server status --json
```
"
  - ✅ `file_forget_functionality` (high): "Use `forget` to forget a file or folder from MinerU without deleting source file"
  - ✅ `document_location_referencing` (high): "- Keep stable references to document locations using `doc:{short_id}/tier:{tier}"
  - ✅ `independent_model_configuration` (high): "- **Independent model configuration**: ONNX or Torch for small models; llama.cpp"
  - ✅ `fallback_parser_authorization` (high): "  - Explicitly authorize fallback to a non-MinerU parser.
"
  - ✅ `document_search_functionality` (high): "6. User asks to search inside known indexed documents: use `mineru search`.
"
  - ✅ `omit_tier_flag_for_normal_quality` (high): "- Omit `--tier` when the user wants normal reading quality.
"
  - ✅ `document_search_by_filename` (high): "5. User asks to find a document by filename: use `mineru find`.
"
  - ✅ `visual_inspection_support` (high): "Use image output only when the user needs visual inspection, layout evidence, cr"
  - ✅ `pdf_document_parsing` (high): "```bash
mineru parse "report.pdf" --wait 180 --json
```
"
  - ✅ `document_search` (high): "- Search documents MinerU has already indexed.
"
  - ✅ `hardware_support` (high): "| Hardware | Recommended startup tier | Model engines | Extra |
|---|---|---|---"
  - ✅ `model_engine_support` (high): "| Hardware | Recommended startup tier | Model engines | Extra |
|---|---|---|---"
  - ✅ `custom_installation_support` (high): "| Hardware | Recommended startup tier | Model engines | Extra |
|---|---|---|---"
  - ✅ `remote_document_parsing` (high): "  - Use remote parsing with `--remote`, which uploads the document and requires "
  - ✅ `custom_installation_options` (high): "| Extra | Model engines installed | How to install |
|---|---|---|
| (base) | ON"
  - ✅ `document_library_management` (high): "- **Document library and agent reading**: discover files, cache results, search "
  - ✅ `file_discovery` (high): "- **Document library and agent reading**: discover files, cache results, search "
  - ✅ `content_search` (high): "- **Document library and agent reading**: discover files, cache results, search "
  - ✅ `pagination_support` (high): "- **Document library and agent reading**: discover files, cache results, search "
  - ✅ `citation_locator_preservation` (high): "- **Document library and agent reading**: discover files, cache results, search "
  - ✅ `model_engine_support` (high): "| Tier | Model engines | Model download | Min RAM required | Accelerator |
|---|"
  - ✅ `model_download_size` (high): "| Tier | Model engines | Model download | Min RAM required | Accelerator |
|---|"
  - ✅ `ram_requirements` (high): "| Tier | Model engines | Model download | Min RAM required | Accelerator |
|---|"
  - ✅ `accelerator_support` (high): "| Tier | Model engines | Model download | Min RAM required | Accelerator |
|---|"
  - ✅ `python_version_management` (high): "```bash
command -v uv
uv python find 3.12
uv python find 3.13
uv python find 3.1"
  - ✅ `document_search_with_filters` (high): "```bash
mineru search "liquidated damages" --min-tier basic --json
mineru read ""
  - ✅ `document_content_retrieval` (high): "```bash
mineru search "liquidated damages" --min-tier basic --json
mineru read ""
  - ✅ `plain_text_content_reading` (high): "1. User provided a file path and wants content: read plain-text formats directly"
  - ✅ `file_format_parsing` (high): "1. User provided a file path and wants content: read plain-text formats directly"
  - ✅ `search_for_documents` (high): "```bash
mineru find "annual report"
mineru find "contract" --ext pdf
mineru find"
  - ✅ `search_with_file_type_filter` (high): "```bash
mineru find "annual report"
mineru find "contract" --ext pdf
mineru find"
  - ✅ `search_with_output_format` (high): "```bash
mineru find "annual report"
mineru find "contract" --ext pdf
mineru find"
  - ✅ `multiple_input_format_support` (high): "- **Multiple input formats**: PDF, images, DOC/DOCX, PPT/PPTX, XLS/XLSX, RTF, OD"
  - ✅ `four_parsing_tiers` (high): "- **Four parsing tiers**: Flash for fast previews and indexing, Basic for OCR an"
  - ✅ `managed_local_parse_server` (high): "Then, enable managed local parse server for the startup tier.
"
  - ✅ `page_block_continuation` (high): "- Work with long documents using page/block continuation instead of loading the "
  - ✅ `user_choice_based_recovery` (high): "- When a recoverable engine or configuration error requires a quality, privacy, "
  - ✅ `watched_folder_management` (high): "8. User asks to add or refresh a watched folder: use `mineru watch` or `mineru s"
  - ✅ `document_parsing_quality_speed` (high): "| Tier | Chinese name | Quality and speed | Use for |
|---|---|---|---|
| `flash"
  - ✅ `document_parsing_use_cases` (high): "| Tier | Chinese name | Quality and speed | Use for |
|---|---|---|---|
| `flash"
  - ✅ `document_format_conversion` (high): "```bash
uv pip install -U "mineru>=4.0,<5"
mineru-kit parse document.pdf -o docu"
  - ✅ `telemetry_status_check` (high): "```bash
mineru telemetry status
mineru telemetry enable
mineru telemetry disable"
  - ✅ `telemetry_enablement` (high): "```bash
mineru telemetry status
mineru telemetry enable
mineru telemetry disable"
  - ✅ `telemetry_disablement` (high): "```bash
mineru telemetry status
mineru telemetry enable
mineru telemetry disable"
  - ✅ `telemetry_preview` (high): "```bash
mineru telemetry status
mineru telemetry enable
mineru telemetry disable"
  - ✅ `telemetry_data_flush` (high): "```bash
mineru telemetry status
mineru telemetry enable
mineru telemetry disable"
  - ✅ `command_line_document_reader` (high): "MinerU is a command-line document reader for agents. It parses local documents i"
  - ✅ `document_content_extraction` (high): "MinerU is a command-line document reader for agents. It parses local documents i"
  - ✅ `agent_continuation_by_page` (high): "MinerU is a command-line document reader for agents. It parses local documents i"
  - ✅ `stable_locator_generation` (high): "MinerU is a command-line document reader for agents. It parses local documents i"
  - ✅ `citation_support` (high): "MinerU is a command-line document reader for agents. It parses local documents i"
  - ✅ `pdf_page_image_support` (high): "- PDF page image is supported for page locators.
"
  - ✅ `cached_result_retrieval` (high): "- For `mineru read doc:{short_id}`, MinerU reads the best cached result rather t"
  - ✅ `tool_ownership_identification` (high): "Before upgrading, determine which tool owns the resolved `mineru` executable. Ch"
  - ✅ `python_environment_identification` (high): "Before upgrading, determine which tool owns the resolved `mineru` executable. Ch"
  - ✅ `document_parsing` (high): "```bash
mineru parse "paper.pdf"
mineru parse "paper.pdf" --tier basic
mineru pa"
  - ✅ `document_format_extraction` (high): "- Extract content from PDFs, images, Word, PowerPoint, Excel, RTF, OpenDocument,"
  - ✅ `server_tier_deployment` (high): "  - For a managed parse-server-tier choice, explain that the server tier is a de"
  - ✅ `user_status_check` (high): "7. User asks for parse/file/doc status: use `mineru show` or `mineru list`.
"
  - ✅ `file_forget_without_deletion` (high): "9. User asks MinerU to forget a file or folder without deleting it: use `mineru "
  - ✅ `targeted_content_retrieval` (high): "4. User asks for a specific page or block after parsing: use `mineru read <locat"
  - ✅ `neural_network_parsing` (high): "MinerU use neural network models for local `basic`, `standard`, and `advanced` p"
  - ✅ `model_engine_support` (high): "MinerU use neural network models for local `basic`, `standard`, and `advanced` p"
  - ✅ `python_document_library_integration` (high): "`DoclibClient` drives the local document library from Python. Start the server f"
  - ✅ `pdf_to_json_conversion` (high): "```bash
mineru parse "report.pdf" --json
```
"
  - ✅ `config_management` (high): "```bash
mineru config get "<key>"
mineru config set "<key>" "<value>"
mineru con"
  - ✅ `fast_document_extraction` (high): "- [Magic-Doc (Fast speed ppt/pptx/doc/docx/pdf extraction tool)](https://github."
  - ✅ `command_line_entrypoint` (high): "- Use `mineru` as the command entrypoint.
"
  - ✅ `server_configuration_management` (high): "```bash
mineru config set parse_server.local.managed_tier <tier>
mineru config s"
  - ✅ `server_status_monitoring` (high): "```bash
mineru config set parse_server.local.managed_tier <tier>
mineru config s"
  - ✅ `document_inspection_and_analysis` (high): "- Read, inspect, summarize, quote, cite, or answer questions about a local docum"
  - ✅ `document_summarization` (high): "- Read, inspect, summarize, quote, cite, or answer questions about a local docum"
  - ✅ `document_quoting` (high): "- Read, inspect, summarize, quote, cite, or answer questions about a local docum"
  - ✅ `document_citing` (high): "- Read, inspect, summarize, quote, cite, or answer questions about a local docum"
  - ✅ `document_question_answering` (high): "- Read, inspect, summarize, quote, cite, or answer questions about a local docum"
  - ✅ `machine_readable_output_support` (high): "Use `--json` when an agent needs stable machine-readable fields.
"
  - ✅ `pdf_file_parsing` (high): "```bash
mineru parse "report.pdf" --no-wait --json
```
"
  - ✅ `onnx_cpu_inference` (high): "The default install works out of the box: small models run ONNX CPU inference an"
  - ✅ `vlm_llama_cpp_vulkan` (high): "The default install works out of the box: small models run ONNX CPU inference an"
  - ✅ `nvidia_gpu_support` (high): "The default install works out of the box: small models run ONNX CPU inference an"
  - ✅ `windows_gpu_torch_install` (high): "The default install works out of the box: small models run ONNX CPU inference an"
  - ✅ `macos_best_throughput` (high): "The default install works out of the box: small models run ONNX CPU inference an"
  - ✅ `non_nvidia_accelerated_torch` (high): "The default install works out of the box: small models run ONNX CPU inference an"
  - ✅ `vllm_lmdeploy_install` (high): "The default install works out of the box: small models run ONNX CPU inference an"
  - ✅ `citation_locator_preservation` (high): "- Preserve locators for citations and follow-up reads.
"
  - ✅ `webui_interface_support` (high): "```bash
uv pip install -U "mineru>=4.0,<5"
mineru-kit parse document.pdf -o docu"
  - ✅ `document_parsing` (high): "For the document library and agent reading, use `mineru parse document.pdf --jso"
  - ✅ `page_limitation` (high): "For the document library and agent reading, use `mineru parse document.pdf --jso"
  - ✅ `stateless_parsing` (high): "For the document library and agent reading, use `mineru parse document.pdf --jso"
  - ✅ `document_conversion` (high): "MinerU 4.0 brings document parsing, a local document library, and service tools "
  - ✅ `application_integration` (high): "MinerU 4.0 brings document parsing, a local document library, and service tools "
  - ✅ `agent_reading` (high): "MinerU 4.0 brings document parsing, a local document library, and service tools "
  - ✅ `structured_results_rendering` (high): "- **Structured results and rendering**: one document model supports nine renderi"
  - ✅ `force_reparse` (high): "10. User asks to force a reparse: use `mineru parse --force` or `mineru invalida"
  - ✅ `telemetry_status_inspection` (high): "Users can inspect telemetry status and explicitly enable or disable it. To preve"
  - ✅ `telemetry_enablement_control` (high): "Users can inspect telemetry status and explicitly enable or disable it. To preve"
  - ✅ `telemetry_data_removal` (high): "Users can inspect telemetry status and explicitly enable or disable it. To preve"
  - ✅ `document_parse_result_caching` (high): "MinerU caches parse results for the same document and tier.
"
  - ✅ `pdf_cache_invalidation` (high): "```bash
mineru invalidate "report.pdf"
mineru invalidate "report.pdf" --tier sta"
  - ✅ `document_content_extraction` (high): "@article{wang2024mineru,
  title={Mineru: An open-source solution for precise do"
  - ✅ `remote_failure_local_fallback` (medium): "- Remote failure may fall back to local if the request can still be satisfied lo"
  - ✅ `local_parsing_preference` (high): "- Use local parsing first. If local parsing is not configured or cannot satisfy "
  - ✅ `document_locator_support` (high): "Use `mineru read` when a document has already been parsed or when the user gives"
  - ✅ `search_functionality` (high): "`DoclibClient` also covers search, watched directories, locators for
page/block "
  - ✅ `watched_directories_support` (high): "`DoclibClient` also covers search, watched directories, locators for
page/block "
  - ✅ `page_block_continuation_locators` (high): "`DoclibClient` also covers search, watched directories, locators for
page/block "
  - ✅ `result_invalidation_support` (high): "`DoclibClient` also covers search, watched directories, locators for
page/block "
  - ✅ `image_format_extraction` (high): "```bash
mineru read "doc:ab12cd3/tier:standard/page:4" --format image
mineru rea"
  - ✅ `document_locator_reading` (high): "2. User provided a `doc:...` locator: run `mineru read <locator>`.
"
  - ✅ `parsing_rule_configuration` (high): "```bash
mineru config parsing-rules add "*/papers/*" --tier standard --pages all"
  - ✅ `easy_data_preparation` (high): "- [Easy Data Preparation with latest LLMs-based Operators and Pipelines](https:/"
  - ✅ `pdf_content_extraction` (high): "```bash
mineru parse "report.pdf" --limit 12000
```
"
  - ✅ `remote_document_parsing` (high): "```bash
mineru parse "document.pdf" --remote
```
"
  - ✅ `local_parse_server_configuration` (medium): "  - Start or configure a local parse server if the hardware supports it, which m"
  - ✅ `user_document_upload_control` (high): "- Even if remote parsing is configured, do not upload a document until the user "
  - ✅ `document_parsing` (high): "client = DoclibClient()
submit = client.ensure_parse(ParseRequest(path="paper.pd"
  - ✅ `unified_tools` (high): "- **Unified tools**: Python SDK, V1 API, stateless batch conversion, multi-servi"
  - ✅ `pdf_page_range_parsing` (high): "```bash
mineru parse "report.pdf" --pages 1-10
mineru parse "report.pdf" --pages"
  - ✅ `full_pdf_parsing` (high): "```bash
mineru parse "report.pdf" --pages 1-10
mineru parse "report.pdf" --pages"
  - ✅ `ocr_scanned_pdfs_images` (high): "- OCR scanned PDFs or images.
"
  - ✅ `pdf_page_selection_across_interfaces` (high): "PDF page selection is shared across CLI, Doclib, API, Gradio and Python. See the"
  - ✅ `command_line_document_management` (high): "```bash
mineru list docs
mineru list files --ext pdf
mineru list parses --status"
  - ✅ `anonymous_usage_analysis` (high): "MinerU may collect anonymous, locally aggregated usage and diagnostic telemetry "
  - ✅ `diagnostic_telemetry_collection` (high): "MinerU may collect anonymous, locally aggregated usage and diagnostic telemetry "
  - ✅ `multi_format_support` (high): "| Type | Extensions |
|---|---|
| PDF | `.pdf`, including scanned PDFs and acade"
  - ✅ `scanned_pdf_support` (high): "| Type | Extensions |
|---|---|
| PDF | `.pdf`, including scanned PDFs and acade"
  - ✅ `academic_paper_support` (high): "| Type | Extensions |
|---|---|
| PDF | `.pdf`, including scanned PDFs and acade"
  - ✅ `image_format_support` (high): "| Type | Extensions |
|---|---|
| PDF | `.pdf`, including scanned PDFs and acade"
  - ✅ `office_document_support` (high): "| Type | Extensions |
|---|---|
| PDF | `.pdf`, including scanned PDFs and acade"
  - ✅ `epub_document_support` (high): "| Type | Extensions |
|---|---|
| PDF | `.pdf`, including scanned PDFs and acade"
  - ✅ `html_document_support` (high): "| Type | Extensions |
|---|---|
| PDF | `.pdf`, including scanned PDFs and acade"
  - ✅ `csv_tsv_support` (high): "| Type | Extensions |
|---|---|
| PDF | `.pdf`, including scanned PDFs and acade"
  - ✅ `model_downloading` (high): "```bash
mineru-kit models download --tier <tier>
mineru-kit models verify --tier"
  - ✅ `model_verification` (high): "```bash
mineru-kit models download --tier <tier>
mineru-kit models verify --tier"
  - ✅ `file_content_display` (high): "```bash
mineru show file "report.pdf"
mineru show file "report.pdf" --json
miner"
  - ✅ `file_content_json_output` (high): "```bash
mineru show file "report.pdf"
mineru show file "report.pdf" --json
miner"
  - ✅ `document_parse` (high): "```bash
mineru show file "report.pdf"
mineru show file "report.pdf" --json
miner"
  - ✅ `document_json_output` (high): "```bash
mineru show file "report.pdf"
mineru show file "report.pdf" --json
miner"
  - ✅ `document_scan` (high): "```bash
mineru show file "report.pdf"
mineru show file "report.pdf" --json
miner"
  - ✅ `scan_json_output` (high): "```bash
mineru show file "report.pdf"
mineru show file "report.pdf" --json
miner"
  - ✅ `pdf_and_image_support` (high): "PDF and images support every quality tier (`flash`, `basic`, `standard`, `advanc"
  - ✅ `local_parsing_for_office_files` (high): "PDF and images support every quality tier (`flash`, `basic`, `standard`, `advanc"
  - ✅ `whole_document_parsing_for_mhtml` (high): "PDF and images support every quality tier (`flash`, `basic`, `standard`, `advanc"
  - ✅ `direct_reading_of_plain_text_files` (high): "PDF and images support every quality tier (`flash`, `basic`, `standard`, `advanc"
  - ✅ `exact_command_execution` (high): "Run the suggested command exactly unless the user asks for a different page, blo"

### pymupdf4llm
- Status: extracted
- Source: readme — https://raw.githubusercontent.com/pymupdf/pymupdf4llm/HEAD/README.md
- Accepted: 47, Rejected: 0
  - ✅ `page_chunking_with_metadata` (high): "- **Page chunking** — chunk output by page with full metadata per chunk, ready f"
  - ✅ `markdown_conversion` (high): "md = pymupdf4llm.to_markdown(
    "document.pdf",
    write_images=True,        "
  - ✅ `image_extraction` (high): "md = pymupdf4llm.to_markdown(
    "document.pdf",
    write_images=True,        "
  - ✅ `image_saving` (high): "md = pymupdf4llm.to_markdown(
    "document.pdf",
    write_images=True,        "
  - ✅ `pdf_format_support` (high): "| Format | Notes |
|---|---|
| **PDF** | Full support including scanned pages (v"
  - ✅ `xps_oxps_support` (high): "| Format | Notes |
|---|---|
| **PDF** | Full support including scanned pages (v"
  - ✅ `epub_mobi_fb2_support` (high): "| Format | Notes |
|---|---|
| **PDF** | Full support including scanned pages (v"
  - ✅ `image_format_support` (high): "| Format | Notes |
|---|---|
| **PDF** | Full support including scanned pages (v"
  - ✅ `office_format_support` (medium): "| Format | Notes |
|---|---|
| **PDF** | Full support including scanned pages (v"
  - ✅ `selective_ocr_processing` (high): "PyMuPDF4LLM applies OCR selectively — only where it is actually needed. Rather t"
  - ✅ `optimized_ocr_performance` (high): "PyMuPDF4LLM applies OCR selectively — only where it is actually needed. Rather t"
  - ✅ `heading_hierarchy_extraction` (high): "- `#` – `######` headings derived from font size hierarchy
"
  - ✅ `llm_ready_data_conversion` (high): "**Turn PDF and other documents into clean, LLM-ready data — in one line of code."
  - ✅ `layout_analysis` (high): "| Feature | Description |
|---|---|
| **Layout analysis** | Reconstructs natural"
  - ✅ `table_detection` (high): "| Feature | Description |
|---|---|
| **Layout analysis** | Reconstructs natural"
  - ✅ `header_detection` (medium): "| Feature | Description |
|---|---|
| **Layout analysis** | Reconstructs natural"
  - ✅ `inline_formatting` (high): "| Feature | Description |
|---|---|
| **Layout analysis** | Reconstructs natural"
  - ✅ `image_extraction` (high): "| Feature | Description |
|---|---|
| **Layout analysis** | Reconstructs natural"
  - ✅ `vector_graphics_support` (high): "| Feature | Description |
|---|---|
| **Layout analysis** | Reconstructs natural"
  - ✅ `page_chunking` (medium): "| Feature | Description |
|---|---|
| **Layout analysis** | Reconstructs natural"
  - ✅ `hybrid_ocr` (high): "| Feature | Description |
|---|---|
| **Layout analysis** | Reconstructs natural"
  - ✅ `header_footer_removal` (high): "| Feature | Description |
|---|---|
| **Layout analysis** | Reconstructs natural"
  - ✅ `selective_page_processing` (high): "| Feature | Description |
|---|---|
| **Layout analysis** | Reconstructs natural"
  - ✅ `toc_driven_headers` (high): "| Feature | Description |
|---|---|
| **Layout analysis** | Reconstructs natural"
  - ✅ `multi_format_output` (high): "- **One import, three output formats** — Markdown, JSON, and plain text out of t"
  - ✅ `pdf_metadata_extraction` (high): "```python
{
    "metadata": {
        "format": "PDF 1.7",
        "title": "..."
  - ✅ `page_count_retrieval` (high): "```python
{
    "metadata": {
        "format": "PDF 1.7",
        "title": "..."
  - ✅ `file_path_retrieval` (high): "```python
{
    "metadata": {
        "format": "PDF 1.7",
        "title": "..."
  - ✅ `pdf_to_markdown_conversion` (high): "chunks = pymupdf4llm.to_markdown("document.pdf", page_chunks=True)
"
  - ✅ `smart_ocr_region_based` (high): "- **Smart OCR** — automatically OCRs only the regions that need it, skipping cle"
  - ✅ `page_specific_extraction` (high): "# Only extract pages 0, 1, and 5
md = pymupdf4llm.to_markdown("document.pdf", pa"
  - ✅ `structured_markdown_conversion` (high): "PyMuPDF4LLM is a lightweight extension for [PyMuPDF](https://github.com/pymupdf/"
  - ✅ `json_output_generation` (high): "PyMuPDF4LLM is a lightweight extension for [PyMuPDF](https://github.com/pymupdf/"
  - ✅ `plain_text_optimization` (high): "PyMuPDF4LLM is a lightweight extension for [PyMuPDF](https://github.com/pymupdf/"
  - ✅ `vector_embeddings_support` (high): "PyMuPDF4LLM is a lightweight extension for [PyMuPDF](https://github.com/pymupdf/"
  - ✅ `llm_ingestion_support` (high): "PyMuPDF4LLM is a lightweight extension for [PyMuPDF](https://github.com/pymupdf/"
  - ✅ `multi_column_layout_handling` (high): "PyMuPDF4LLM is a lightweight extension for [PyMuPDF](https://github.com/pymupdf/"
  - ✅ `table_extraction` (high): "PyMuPDF4LLM is a lightweight extension for [PyMuPDF](https://github.com/pymupdf/"
  - ✅ `image_processing` (high): "PyMuPDF4LLM is a lightweight extension for [PyMuPDF](https://github.com/pymupdf/"
  - ✅ `header_extraction` (high): "PyMuPDF4LLM is a lightweight extension for [PyMuPDF](https://github.com/pymupdf/"
  - ✅ `ocr_for_scanned_pages` (high): "PyMuPDF4LLM is a lightweight extension for [PyMuPDF](https://github.com/pymupdf/"
  - ✅ `ocr_for_unselectable_text_pages` (high): "# OCR is triggered automatically for pages with no selectable text.
"
  - ✅ `framework_integrations` (high): "- **Framework integrations** — drop-in support for LlamaIndex and LangChain
"
  - ✅ `document_loading_support` (high): "| Framework | Method |
|---|---|
| **LlamaIndex** | `pymupdf4llm.LlamaMarkdownRe"
  - ✅ `markdown_conversion` (high): "| Framework | Method |
|---|---|
| **LlamaIndex** | `pymupdf4llm.LlamaMarkdownRe"
  - ✅ `text_splitting_integration` (medium): "| Framework | Method |
|---|---|
| **LlamaIndex** | `pymupdf4llm.LlamaMarkdownRe"
  - ✅ `document_loading` (high): "reader = pymupdf4llm.LlamaMarkdownReader()
docs = reader.load_data("document.pdf"
