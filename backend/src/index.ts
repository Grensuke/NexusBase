import express, { Request, Response } from 'express';
import cors from 'cors';
import { extractProblem, evaluateCandidates } from './services/llmService';
import { retrieveCandidates } from './services/retrievalService';
import { createSolutionPaths } from './services/compositionService';
import { loadCatalog } from './services/catalogService';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize index on startup
loadCatalog();

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

app.post('/api/discover', async (req: Request, res: Response) => {
  try {
    const { problem } = req.body;
    if (!problem) {
      return res.status(400).json({ error: "Missing 'problem' in request body." });
    }

    // Step 1: Problem Understanding
    const analysis = await extractProblem(problem);
    if (!analysis) {
      return res.status(500).json({ status: 'INFRASTRUCTURE_BLOCKED', error: 'LLM failed to analyze problem.' });
    }

    // Step 2: Retrieval
    const retrievalResults = retrieveCandidates(problem, analysis.requirements, analysis.constraints, 8);
    if (retrievalResults.length === 0) {
      return res.json({
        problem_analysis: analysis,
        candidates: [],
        solution_paths: [],
        status: 'NO_SUITABLE_SOLUTION'
      });
    }

    const candidates = retrievalResults.map(r => r.entity);

    // Step 3: Evaluation
    const evaluation = await evaluateCandidates(analysis, candidates);
    if (!evaluation || (!evaluation.evaluations && !evaluation.selected_candidates)) {
      return res.status(500).json({ status: 'INFRASTRUCTURE_BLOCKED', error: 'LLM failed to evaluate candidates.' });
    }

    // Step 4: Composition & Validation
    console.log("EVALUATION:", JSON.stringify(evaluation, null, 2));
    const evals = evaluation.selected_candidates || evaluation.evaluations || [];
    const solutionPaths = createSolutionPaths(analysis, evals, candidates);

    // Determine final status
    let status = 'NO_VALID_SOLUTION_PATH';
    if (solutionPaths.some(p => p.status === 'LLM_OUTPUT_INVALID')) {
      status = 'LLM_OUTPUT_INVALID';
    } else if (solutionPaths.some(p => p.status === 'VALID')) {
      status = 'VALID_PATHS_FOUND';
    } else if (solutionPaths.some(p => p.status === 'PARTIAL')) {
      status = 'PARTIAL_COVERAGE';
    }

    res.json({
      problem_analysis: analysis,
      candidates: retrievalResults.map(r => ({
        entity_id: r.entity.entity_id,
        name: r.entity.entity_id, // fallback since name doesn't exist
        score: r.score,
        matched_terms: r.matched_terms,
        matched_capabilities: r.matched_capabilities
      })),
      solution_paths: solutionPaths,
      status
    });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`NexusBase MVP Backend running on port ${PORT}`);
});
