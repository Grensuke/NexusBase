import { Entity } from './catalogService';

const OLLAMA_URL = process.env.NEXUSBASE_LLM_BASE_URL || 'http://127.0.0.1:11434/v1/chat/completions';
const LLM_MODEL = process.env.NEXUSBASE_LLM_MODEL || 'qwen3:8b';

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'of', 'to', 'for', 'with', 
  'by', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out', 'against', 
  'during', 'without', 'before', 'under', 'around', 'among', 'i', 'need', 'want', 'tool', 
  'system', 'software', 'application', 'use', 'using', 'make', 'support', 'process', 'processing',
  'file', 'files', 'data', 'information', 'another', 'that', 'this', 'it', 'from', 'then'
]);

function tokenize(text: string): string[] {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

async function queryLLM(prompt: string, enforceJson: boolean = true): Promise<string> {
  const payload: any = {
    model: LLM_MODEL,
    messages: [
      { role: "system", content: "You are the NexusBase Discovery Engine. You only reply with strictly formatted valid JSON." },
      { role: "user", content: prompt }
    ],
    temperature: 0.0
  };

  if (enforceJson) {
    payload.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: any = await response.json();
    let content = data.choices[0].message.content;
    
    // Fallback cleanup if the model still wrapped in markdown despite json_object
    const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      content = match[1];
    }
    
    return content;
  } catch (error) {
    clearTimeout(timeout);
    console.error("LLM Error:", error);
    return "INFRASTRUCTURE_BLOCKED";
  }
}

export interface ProblemAnalysis {
  interpreted_problem: string;
  requirements: string[];
  must_have_requirements: string[];
  constraints: string[];
}

export const extractProblem = async (problem: string): Promise<ProblemAnalysis | null> => {
  const prompt = `Analyze the following problem and extract the requirements, must-have requirements, and constraints.
Do NOT invent details.
Output your response as a valid JSON object matching this schema exactly:
{
  "interpreted_problem": "Summary of the problem",
  "requirements": ["Req 1", "Req 2"],
  "must_have_requirements": ["Must have 1"],
  "constraints": ["Constraint 1"]
}

<PROBLEM>
${problem}
</PROBLEM>`;

  const responseText = await queryLLM(prompt, true);
  if (responseText === "INFRASTRUCTURE_BLOCKED") return null;

  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse LLM response:", responseText);
    return null;
  }
};

function scoreCapability(capLabel: string, queryTokens: string[], queryStr: string): number {
  let score = 0;
  const capTokens = tokenize(capLabel);
  
  // Exact phrase match boost
  if (queryStr.includes(capLabel.toLowerCase())) {
    score += 5.0;
  }

  for (const q of queryTokens) {
    if (capTokens.includes(q)) {
      score += 1.0;
    }
  }
  return score;
}

export const evaluateCandidates = async (
  analysis: ProblemAnalysis,
  candidates: Entity[]
): Promise<any | null> => {
  
  const queryTokens = tokenize([
    analysis.interpreted_problem,
    ...analysis.requirements,
    ...analysis.constraints
  ].join(' '));
  const queryStr = [analysis.interpreted_problem, ...analysis.requirements, ...analysis.constraints].join(' ').toLowerCase();

  let catalogContext = '';
  const MAX_CAPABILITIES_PER_ENTITY = 8;
  let totalCandidatesSize = 0;

  for (const ent of candidates) {
    catalogContext += `Entity: ${ent.entity_id}\n`;
    
    // Select most relevant metadata
    const metas = (ent.metadata_capabilities || []).map(m => m.label).slice(0, 5).join(', ');
    if (metas) catalogContext += `  Metadata: ${metas}\n`;
    
    // Rank and select atomic capabilities
    const scoredCaps = (ent.atomic_capabilities || []).map(cap => ({
      cap,
      score: scoreCapability(cap.label, queryTokens, queryStr)
    })).sort((a, b) => b.score - a.score).slice(0, MAX_CAPABILITIES_PER_ENTITY);

    catalogContext += `  Capabilities:\n`;
    for (const { cap } of scoredCaps) {
      catalogContext += `    [${cap.capability_id}] ${cap.label}\n`;
      // Optionally add a tiny summary if the score is very high (to save space, we omit full evidence)
    }
    catalogContext += '\n';
    totalCandidatesSize += JSON.stringify(scoredCaps).length;
  }
  
  console.log(`Compact Candidate Context Size: ${catalogContext.length} chars (for ${candidates.length} entities)`);

  const prompt = `You are the NexusBase Discovery Engine. Your job is to analyze a user's problem and recommend solutions ONLY using the capabilities listed in the catalog below.

<CATALOG>
${catalogContext}
</CATALOG>

<PROBLEM>
${analysis.interpreted_problem}
</PROBLEM>

<CONSTRAINTS>
${JSON.stringify(analysis.constraints, null, 2)}
</CONSTRAINTS>

<REQUIREMENTS>
${JSON.stringify(analysis.requirements, null, 2)}
</REQUIREMENTS>

INSTRUCTIONS:
1. Select which entities in the catalog match the core functional requirements of the problem. 
IMPORTANT: DO NOT omit or filter out an entity just because it violates an operational constraint (e.g., "locally", "offline", "free"). If an entity provides the core functionality (like converting a PDF), YOU MUST include it in the selected_candidates. The constraint system will independently mark it as violated later.
2. For each requirement, map it to the specific capability IDs from the selected entities. DO NOT invent IDs.
3. For constraints, identify the capability_id or metadata that is relevant to checking this constraint (or leave source_id empty if none exist).
4. Output your response as a valid JSON object matching this schema exactly:
{
  "selected_candidates": [
    {
      "entity_id": "Must exactly match an Entity from the catalog",
      "requirements_covered": ["List of requirements this entity satisfies"],
      "capability_ids": ["Must exactly match capability IDs from the catalog"],
      "constraint_checks": [
        {
          "constraint": "...",
          "source_id": "capability_id that is relevant to this constraint, or empty"
        }
      ],
      "reason": "..."
    }
  ]
}`;

  const responseText = await queryLLM(prompt, true);
  if (responseText === "INFRASTRUCTURE_BLOCKED") return null;

  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse LLM evaluation response:", responseText);
    return null;
  }
};
