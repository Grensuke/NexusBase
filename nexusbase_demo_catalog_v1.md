# NexusBaseV2 Demo Catalog v1

A curated source-backed corpus for the five planned demo domains.

## Domains

- PDF → Markdown: 5 candidates
- Audio → Text: 4 candidates
- Error Tracking: 3 candidates
- Website Monitoring: 4 candidates
- API Documentation: 3 candidates

## Candidate fields

`entity_id`, `name`, `solution_type`, `domain`, `capabilities`, `deployment`,
`official_url`, `documentation_url`, `repository_url`, `install_url`, `download_url`, `evidence`.

## Important integration rule

Treat this catalog as trusted demo data. A candidate may still be rejected by
a user constraint, but capability/evidence and URLs must not be invented by the LLM.

## Verification sources

Official sources used include:

- PyMuPDF4LLM — https://github.com/pymupdf/pymupdf4llm
- Docling — https://github.com/docling-project/docling
- Marker — https://github.com/datalab-to/marker
- CloudConvert — https://cloudconvert.com/pdf-to-md
- To-Markdown PDF Converter — https://pdf.to-markdown.com/
- TurboScribe — https://turboscribe.ai/
- whisper.cpp — https://github.com/ggml-org/whisper.cpp
- faster-whisper — https://github.com/SYSTRAN/faster-whisper
- OpenAI Whisper — https://github.com/openai/whisper
- Sentry — https://sentry.io/product/error-monitoring/
- GlitchTip — https://glitchtip.com/
- Bugsink — https://www.bugsink.com/
- UptimeRobot — https://uptimerobot.com/
- Better Stack — https://betterstack.com/website-monitoring
- Uptime Kuma — https://github.com/louislam/uptime-kuma
- Gatus — https://gatus.io/
- Scalar — https://scalar.com/solutions/openapi-documentation
- Redoc — https://redocly.com/redoc
- Swagger UI — https://swagger.io/open-source/swagger-ui/

Total candidates: 19
