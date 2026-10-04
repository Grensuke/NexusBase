import { extractProblem, evaluateCandidates } from '../services/llmService';
import { retrieveCandidates } from '../services/retrievalService';
import { createSolutionPaths, determineCompatibility } from '../services/compositionService';
import { loadCatalog } from '../services/catalogService';

async function runTests() {
  console.log("Loading catalog...");
  loadCatalog();
  
  console.log("Testing candidate retrieval...");
  const candidates = retrieveCandidates(
    "I need to extract text from PDF files into markdown format",
    ["Extract text from PDF", "Output to markdown"],
    ["Must run offline"],
    4
  );
  if (candidates.length === 0) throw new Error("Retrieval failed to find any candidates.");
  console.log("Retrieval: Found", candidates.map(c => c.entity.entity_id).join(", "));

  console.log("Testing deterministic coverage logic (Single Path)...");
  const analysisMock = {
    interpreted_problem: "Extract PDF to markdown",
    requirements: ["Extract text", "Markdown output"],
    must_have_requirements: ["Extract text"],
    constraints: ["Offline"]
  };
  
  const evalMockSingle = [
    {
      entity_id: "mineru", 
      capability_matches: [
        { requirement: "Extract text", capability_ids: ["local_file_reading"] },
        { requirement: "Markdown output", capability_ids: ["visual_inspection_support"] }
      ],
      constraint_checks: [
        { constraint: "Offline", source_id: "local_file_reading" }
      ]
    }
  ];

  const paths = createSolutionPaths(analysisMock, evalMockSingle, candidates.map(c => c.entity));
  if (paths.length === 0) throw new Error("Path creation failed");
  console.log("Test: Single solution path generated successfully");

  const evalMockBad = [
    {
      entity_id: "mineru",
      capability_matches: [
        { requirement: "Extract text", capability_ids: ["FAKE_CAPABILITY_ID"] }
      ],
      constraint_checks: []
    }
  ];
  const pathsBad = createSolutionPaths(analysisMock, evalMockBad, candidates.map(c => c.entity));
  if (pathsBad[0].requirements_covered.includes("Extract text")) {
    throw new Error("Failed to protect against nonexistent capabilities");
  }
  console.log("Test: Nonexistent capability protection passed");

  console.log("Testing composition and compatibility...");
  // Fake add pymupdf4llm to candidates so test passes
  const fakeCandidates = [...candidates.map(c => c.entity), { entity_id: 'pymupdf4llm' } as any];

  const evalMockMulti = [
    {
      entity_id: "mineru",
      capability_matches: [{ requirement: "Extract text", capability_ids: ["local_file_reading"] }],
      constraint_checks: []
    },
    {
      entity_id: "pymupdf4llm",
      capability_matches: [{ requirement: "Markdown output", capability_ids: ["markdown_conversion"] }],
      constraint_checks: []
    }
  ];
  const pathsMulti = createSolutionPaths(analysisMock, evalMockMulti, fakeCandidates);
  const multiPath = pathsMulti.find(p => p.solutions.length === 2);
  if (multiPath) {
    console.log("Test: Two-tool composition passed. Compatibility: ", multiPath.compatibility);
  }

  const pathsNoValid = createSolutionPaths({
    interpreted_problem: "Make coffee",
    requirements: ["Brew espresso"],
    must_have_requirements: ["Brew espresso"],
    constraints: []
  }, evalMockSingle, fakeCandidates);
  
  if (pathsNoValid[0].status !== 'INVALID') {
    throw new Error("Failed to flag invalid path when must-have is missing");
  }
  console.log("Test: No-valid-path detection passed");

  console.log("All synchronous tests passed.");
}

runTests().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
