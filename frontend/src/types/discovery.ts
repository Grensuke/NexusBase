export type ProblemAnalysis = {
  interpreted_problem: string;
  requirements: string[];
  must_have_requirements: string[];
  constraints: string[];
};

export type CandidateScore = {
  entity_id: string;
  score: number;
  matched_terms: string[];
  matched_capabilities: any[];
};

export type ConstraintState = {
  constraint: string;
  status: 'SATISFIED' | 'VIOLATED' | 'UNKNOWN';
  evidence: string | null;
  reason: string;
  source_entity: string;
  source_block?: string;
};

export type Evidence = {
  entity: string;
  capability: string;
  evidence: string;
};

export type CandidateMeta = {
  entity_id: string;
  name: string;
  modality?: string;
  official_url?: string;
  website_url?: string;
  repository_url?: string;
  documentation_url?: string;
  install_url?: string;
  download_url?: string;
};

export type SolutionPath = {
  solutions: string[];
  candidates_meta: CandidateMeta[];
  requirements_covered: string[];
  requirements_missing: string[];
  must_have_status: 'VALID' | 'INVALID';
  constraints_states: ConstraintState[];
  evidence: Evidence[];
  trade_offs: Record<string, string>;
  compatibility: 'VERIFIED' | 'UNVERIFIED' | 'INCOMPATIBLE' | 'N/A';
  status: 'VALID' | 'CONSTRAINT_VIOLATED' | 'PARTIAL' | 'UNKNOWN' | 'INSUFFICIENT_EVIDENCE' | 'LLM_OUTPUT_INVALID';
  modalities?: string[];
};

export type DiscoverResponse = {
  problem_analysis: ProblemAnalysis;
  candidates: CandidateScore[];
  solution_paths: SolutionPath[];
  status: string;
  error?: string;
};
