const fs = require('fs');
const path = require('path');

const demoCatalog = { entities: {} };

function add(id, name, modality, domain, capabilities, urls) {
  demoCatalog.entities[id] = {
    entity_id: id,
    name: name,
    status: 'success',
    modality: modality,
    domain: domain,
    atomic_capabilities: capabilities.map(c => ({
      capability_id: c.id,
      label: c.label,
      evidence: [{
        source_url: urls.official_url || urls.repository_url || 'https://example.com',
        quote: c.quote,
        evidence_type: "explicit_statement"
      }]
    })),
    metadata_capabilities: [],
    ...urls
  };
}

// PDF to Markdown
add('pymupdf4llm', 'PyMuPDF4LLM', 'local_library', 'pdf_to_markdown', [
  { id: 'pdf_to_markdown', label: 'PDF to Markdown conversion', quote: 'PyMuPDF4LLM is a Python library to extract PDF text as Markdown for LLM use.' },
  { id: 'offline_operation', label: 'Offline operation', quote: 'Runs entirely locally on your device without internet access.' }
], { official_url: 'https://github.com/pymupdf/pymupdf4llm', repository_url: 'https://github.com/pymupdf/pymupdf4llm', install_url: 'https://pypi.org/project/PyMuPDF4LLM/' });

add('docling', 'Docling', 'local_library', 'pdf_to_markdown', [
  { id: 'pdf_to_markdown', label: 'PDF to Markdown conversion', quote: 'Docling parses document formats (PDF, DOCX) and converts them to Markdown.' },
  { id: 'offline_operation', label: 'Offline operation', quote: 'Runs locally for parsing documents.' }
], { official_url: 'https://github.com/docling-project/docling', repository_url: 'https://github.com/docling-project/docling', install_url: 'https://pypi.org/project/docling/' });

add('marker', 'Marker', 'local_tool', 'pdf_to_markdown', [
  { id: 'pdf_to_markdown', label: 'PDF to Markdown conversion', quote: 'Marker converts PDF to markdown quickly and accurately.' },
  { id: 'offline_operation', label: 'Offline operation', quote: 'Runs locally on CPU or GPU without external API calls.' }
], { official_url: 'https://github.com/datalab-to/marker', repository_url: 'https://github.com/datalab-to/marker', install_url: 'https://github.com/datalab-to/marker#installation' });

add('cloudconvert', 'CloudConvert', 'web_application', 'pdf_to_markdown', [
  { id: 'pdf_to_markdown', label: 'PDF to Markdown conversion', quote: 'Online document converter. Converts PDF to MD.' }
], { official_url: 'https://cloudconvert.com/pdf-to-md', website_url: 'https://cloudconvert.com/pdf-to-md' });

add('to_markdown_pdf', 'To-Markdown PDF Converter', 'web_application', 'pdf_to_markdown', [
  { id: 'pdf_to_markdown', label: 'PDF to Markdown conversion', quote: 'Convert PDF files to Markdown files directly in your browser.' }
], { official_url: 'https://pdf.to-markdown.com/', website_url: 'https://pdf.to-markdown.com/' });

// Audio to Text
add('turboscribe', 'TurboScribe', 'web_application', 'audio_to_text', [
  { id: 'audio_transcription', label: 'Audio transcription', quote: 'TurboScribe is an AI transcription service. Transcribe audio and video to text.' }
], { official_url: 'https://turboscribe.ai/', website_url: 'https://turboscribe.ai/' });

add('whisper_cpp', 'whisper.cpp', 'local_tool', 'audio_to_text', [
  { id: 'audio_transcription', label: 'Audio transcription', quote: 'High-performance inference of OpenAI\'s Whisper automatic speech recognition model.' },
  { id: 'offline_operation', label: 'Offline operation', quote: 'Plain C/C++ implementation without dependencies, runs locally on CPU/GPU.' }
], { official_url: 'https://github.com/ggml-org/whisper.cpp', repository_url: 'https://github.com/ggml-org/whisper.cpp' });

add('faster_whisper', 'faster-whisper', 'local_library', 'audio_to_text', [
  { id: 'audio_transcription', label: 'Audio transcription', quote: 'faster-whisper is a reimplementation of OpenAI\'s Whisper model using CTranslate2 for faster transcription.' },
  { id: 'offline_operation', label: 'Offline operation', quote: 'Runs locally on your own hardware.' }
], { official_url: 'https://github.com/SYSTRAN/faster-whisper', repository_url: 'https://github.com/SYSTRAN/faster-whisper', install_url: 'https://pypi.org/project/faster-whisper/' });

add('openai_whisper', 'OpenAI Whisper', 'local_library', 'audio_to_text', [
  { id: 'audio_transcription', label: 'Audio transcription', quote: 'Robust Speech Recognition via Large-Scale Weak Supervision. Transcribes speech to text.' },
  { id: 'offline_operation', label: 'Offline operation', quote: 'Can be installed and run locally via Python.' }
], { official_url: 'https://github.com/openai/whisper', repository_url: 'https://github.com/openai/whisper', install_url: 'https://github.com/openai/whisper#setup' });

// Error Tracking
add('sentry', 'Sentry', 'hosted_service', 'error_tracking', [
  { id: 'error_tracking', label: 'Error tracking', quote: 'Sentry provides open-source error tracking that shows you every crash in your stack as it happens.' },
  { id: 'bug_detection', label: 'Bug detection', quote: 'Identify, triage, and prioritize bugs and errors across your entire application.' }
], { official_url: 'https://sentry.io/product/error-monitoring/', website_url: 'https://sentry.io/', documentation_url: 'https://docs.sentry.io/' });

add('glitchtip', 'GlitchTip', 'self_hosted', 'error_tracking', [
  { id: 'error_tracking', label: 'Error tracking', quote: 'GlitchTip collects errors and exceptions from your projects.' },
  { id: 'open_source', label: 'Open source', quote: 'Open source, Sentry-compatible error tracking.' }
], { official_url: 'https://glitchtip.com/', repository_url: 'https://gitlab.com/glitchtip/glitchtip', documentation_url: 'https://glitchtip.com/documentation' });

add('bugsink', 'Bugsink', 'self_hosted', 'error_tracking', [
  { id: 'error_tracking', label: 'Error tracking', quote: 'Sentry-compatible error tracking, self-hosted and simple.' }
], { official_url: 'https://www.bugsink.com/', documentation_url: 'https://www.bugsink.com/docs/' });

// Website Monitoring
add('uptimerobot', 'UptimeRobot', 'hosted_service', 'website_monitoring', [
  { id: 'website_monitoring', label: 'Website monitoring', quote: 'The world\'s leading uptime monitoring service. Monitor your website, API, port, and ping.' },
  { id: 'downtime_alerts', label: 'Downtime alerts', quote: 'Get notified immediately when your website goes down.' }
], { official_url: 'https://uptimerobot.com/', website_url: 'https://uptimerobot.com/' });

add('better_stack', 'Better Stack', 'hosted_service', 'website_monitoring', [
  { id: 'website_monitoring', label: 'Website monitoring', quote: 'Website monitoring, incident management, and status pages.' },
  { id: 'downtime_alerts', label: 'Downtime alerts', quote: 'Call alerts and incident management.' }
], { official_url: 'https://betterstack.com/website-monitoring', website_url: 'https://betterstack.com/' });

add('uptime_kuma', 'Uptime Kuma', 'self_hosted', 'website_monitoring', [
  { id: 'website_monitoring', label: 'Website monitoring', quote: 'A fancy self-hosted monitoring tool. Monitor HTTP(s) / TCP / HTTP(s) Keyword / Ping / DNS Record.' },
  { id: 'downtime_alerts', label: 'Downtime alerts', quote: 'Notifications for uptime and downtime via various providers.' }
], { official_url: 'https://github.com/louislam/uptime-kuma', repository_url: 'https://github.com/louislam/uptime-kuma', documentation_url: 'https://github.com/louislam/uptime-kuma/wiki' });

add('gatus', 'Gatus', 'self_hosted', 'website_monitoring', [
  { id: 'website_monitoring', label: 'Website monitoring', quote: 'Automated developer-driven health dashboard. Monitor your services.' }
], { official_url: 'https://gatus.io/', repository_url: 'https://github.com/TwiN/gatus' });

// API Documentation
add('scalar', 'Scalar', 'local_library', 'api_documentation', [
  { id: 'api_documentation', label: 'API documentation generation', quote: 'Beautiful open-source API references from Swagger/OpenAPI.' },
  { id: 'openapi_support', label: 'OpenAPI support', quote: 'First-class support for OpenAPI 3.1, 3.0, and Swagger 2.0.' }
], { official_url: 'https://scalar.com/solutions/openapi-documentation', repository_url: 'https://github.com/scalar/scalar', documentation_url: 'https://docs.scalar.com/' });

add('redoc', 'Redoc', 'local_library', 'api_documentation', [
  { id: 'api_documentation', label: 'API documentation generation', quote: 'OpenAPI/Swagger-generated API Reference Documentation.' }
], { official_url: 'https://redocly.com/redoc', repository_url: 'https://github.com/Redocly/redoc', install_url: 'https://www.npmjs.com/package/redoc' });

add('swagger_ui', 'Swagger UI', 'local_library', 'api_documentation', [
  { id: 'api_documentation', label: 'API documentation generation', quote: 'Swagger UI allows anyone to visualize and interact with the API’s resources without having any of the implementation logic in place.' }
], { official_url: 'https://swagger.io/open-source/swagger-ui/', repository_url: 'https://github.com/swagger-api/swagger-ui', documentation_url: 'https://swagger.io/docs/open-source/swagger-ui/' });

const outPath = path.join(__dirname, 'nexusbase_demo_catalog.json');
fs.writeFileSync(outPath, JSON.stringify(demoCatalog, null, 2));
console.log('Created catalog at', outPath);
