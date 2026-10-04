import { Entity, getEntity } from './catalogService';
import { ProblemAnalysis } from './llmService';

export interface ConstraintState {
  constraint: string;
  status: 'SATISFIED' | 'VIOLATED' | 'UNKNOWN';
  evidence: string | null;
  reason: string;
  source_entity: string;
  source_block?: string;
}

export interface CandidateMeta {
  entity_id: string;
  name: string;
  modality?: string;
  official_url?: string;
  website_url?: string;
  repository_url?: string;
  documentation_url?: string;
  install_url?: string;
  download_url?: string;
}

export interface SolutionPath {
  solutions: string[];
  candidates_meta: CandidateMeta[];
  requirements_covered: string[];
  requirements_missing: string[];
  must_have_status: 'VALID' | 'INVALID';
  constraints_states: ConstraintState[];
  evidence: any[];
  trade_offs: Record<string, string>;
  compatibility: 'VERIFIED' | 'UNVERIFIED' | 'INCOMPATIBLE' | 'N/A';
  status: 'VALID' | 'CONSTRAINT_VIOLATED' | 'PARTIAL' | 'UNKNOWN' | 'INSUFFICIENT_EVIDENCE' | 'LLM_OUTPUT_INVALID';
  modalities?: string[];
}

export const determineCompatibility = (entities: string[]): 'VERIFIED' | 'UNVERIFIED' | 'INCOMPATIBLE' | 'N/A' => {
  if (entities.length <= 1) return 'N/A';
  
  const entA = getEntity(entities[0]);
  const entB = getEntity(entities[1]);
  if (!entA || !entB) return 'UNVERIFIED';

  const hasIntegration = (a: Entity, b: Entity) => {
    return (a.metadata_capabilities || []).some(m => 
      m.label.toLowerCase().includes(b.entity_id.toLowerCase()) ||
      m.label.toLowerCase().includes('integration') ||
      m.label.toLowerCase().includes('api')
    );
  };

  if (hasIntegration(entA, entB) || hasIntegration(entB, entA)) {
    return 'VERIFIED';
  }
  return 'UNVERIFIED';
};

export const verifyConstraints = (analysis: ProblemAnalysis, ev: any, ent: Entity): ConstraintState[] => {
  const verifiedStates: ConstraintState[] = [];

  for (const reqConstraint of analysis.constraints) {
    const check = (ev.constraint_checks || []).find((c: any) => c.constraint === reqConstraint);

    if (!check || !check.source_id) {
      verifiedStates.push({
        constraint: reqConstraint,
        status: 'UNKNOWN',
        evidence: null,
        reason: 'Catalog evidence is insufficient to determine this constraint.',
        source_entity: ent.entity_id
      });
      continue;
    }

    let verified = false;
    let actualEvidenceText = null;
    let status: 'SATISFIED' | 'VIOLATED' | 'UNKNOWN' = 'UNKNOWN';
    let reason = 'Capability referenced, but no explicit evidence determines status.';

    const cap = ent.atomic_capabilities?.find(c => c.capability_id === check.source_id);
    if (cap && cap.evidence && cap.evidence.length > 0) {
      const evText = cap.evidence[0].quote || '';
      actualEvidenceText = evText;
      verified = true;
      
      const lowerEv = evText.toLowerCase();
      const lowerReq = reqConstraint.toLowerCase();
      
      if (lowerReq.includes('local') || lowerReq.includes('offline') || lowerReq.includes('cloud')) {
        if (lowerEv.includes('local') || lowerEv.includes('offline')) {
          status = 'SATISFIED';
          reason = `Supported by explicit catalog evidence in ${check.source_id}.`;
        } else if (lowerEv.includes('cloud') || lowerEv.includes('remote') || lowerEv.includes('server')) {
          status = 'VIOLATED';
          reason = `Contradicted by explicit catalog evidence in ${check.source_id}.`;
        }
      }
    }

    if (verified) {
      verifiedStates.push({
        constraint: reqConstraint,
        status,
        evidence: actualEvidenceText,
        reason,
        source_entity: ent.entity_id,
        source_block: check.source_id
      });
    } else {
      verifiedStates.push({
        constraint: reqConstraint,
        status: 'UNKNOWN',
        evidence: null,
        reason: 'INVALID_LLM_REFERENCE: Capability ID does not exist or has no evidence.',
        source_entity: ent.entity_id
      });
    }
  }

  return verifiedStates;
};

export const createSolutionPaths = (
  analysis: ProblemAnalysis,
  evaluations: any[],
  retrievedCandidates: Entity[] = []
): SolutionPath[] => {
  const paths: SolutionPath[] = [];
  const candidateIds = new Set(retrievedCandidates.map(c => c.entity_id));

  for (const ev of evaluations) {
    // Validate schema robustly
    if (!ev || typeof ev !== 'object') {
      paths.push({ solutions: [], requirements_covered: [], requirements_missing: [], must_have_status: 'INVALID', constraints_states: [], evidence: [], trade_offs: {}, compatibility: 'N/A', status: 'LLM_OUTPUT_INVALID' });
      continue;
    }
    
    if (!ev.entity_id || !candidateIds.has(ev.entity_id)) {
      console.log(`INVALID_LLM_OUTPUT: Entity ${ev.entity_id} missing or not in shortlist.`);
      paths.push({ solutions: [], requirements_covered: [], requirements_missing: [], must_have_status: 'INVALID', constraints_states: [], evidence: [], trade_offs: {}, compatibility: 'N/A', status: 'LLM_OUTPUT_INVALID' });
      continue;
    }
    
    const ent = getEntity(ev.entity_id);
    if (!ent) {
      paths.push({ solutions: [], requirements_covered: [], requirements_missing: [], must_have_status: 'INVALID', constraints_states: [], evidence: [], trade_offs: {}, compatibility: 'N/A', status: 'LLM_OUTPUT_INVALID' });
      continue;
    }

    let rawCapIds: string[] = [];
    let rawReqs: string[] = [];
    
    // Legacy support alias if they used capability_matches
    if (ev.capability_matches && Array.isArray(ev.capability_matches)) {
      for (const m of ev.capability_matches) {
        if (m.requirement) rawReqs.push(m.requirement);
        if (m.capability_ids && Array.isArray(m.capability_ids)) {
          rawCapIds.push(...m.capability_ids);
        }
      }
    } else {
      if (!ev.capability_ids || !Array.isArray(ev.capability_ids)) {
        console.log(`INVALID_LLM_OUTPUT: capability_ids is missing or not an array for ${ev.entity_id}`);
        paths.push({ solutions: [ev.entity_id], requirements_covered: [], requirements_missing: [], must_have_status: 'INVALID', constraints_states: [], evidence: [], trade_offs: {}, compatibility: 'N/A', status: 'LLM_OUTPUT_INVALID' });
        continue;
      }
      rawCapIds = ev.capability_ids;
      if (ev.requirements_covered && Array.isArray(ev.requirements_covered)) {
        rawReqs = ev.requirements_covered;
      }
    }

    // Validate capability_ids against catalog
    let allValid = true;
    const verifiedCapIds: string[] = [];
    for (const cid of rawCapIds) {
      if (typeof cid !== 'string' || !(ent.atomic_capabilities || []).some(c => c.capability_id === cid)) {
        allValid = false;
        console.log(`INVALID_LLM_OUTPUT: Capability ${cid} not found in entity ${ent.entity_id}`);
        break;
      }
      verifiedCapIds.push(cid);
    }
    
    if (!allValid) {
      paths.push({ solutions: [ev.entity_id], requirements_covered: [], requirements_missing: [], must_have_status: 'INVALID', constraints_states: [], evidence: [], trade_offs: {}, compatibility: 'N/A', status: 'LLM_OUTPUT_INVALID' });
      continue;
    }

    const reqsCovered = new Set<string>(rawReqs);
    const evidenceList: any[] = [];
    
    if (verifiedCapIds.length > 0) {
      for (const cid of verifiedCapIds) {
        const cap = ent.atomic_capabilities?.find(c => c.capability_id === cid);
        if (cap) {
          evidenceList.push({
            entity: ent.entity_id,
            capability: cap.label,
            evidence: cap.evidence?.[0]?.quote || 'No explicit evidence provided'
          });
        }
      }
    }

    const missingReqs = analysis.requirements.filter(r => !reqsCovered.has(r));
    const mustHaveValid = analysis.must_have_requirements.every(r => reqsCovered.has(r));
    
    const constraintsStates = verifyConstraints(analysis, ev, ent);
    const requiredConstraintsValid = !constraintsStates.some(c => c.status === 'VIOLATED');

    let status: 'VALID' | 'CONSTRAINT_VIOLATED' | 'PARTIAL' | 'UNKNOWN' | 'INSUFFICIENT_EVIDENCE' = 'VALID';
    const hasViolatedConstraint = constraintsStates.some(c => c.status === 'VIOLATED');
    const hasUnknownConstraint = constraintsStates.some(c => c.status === 'UNKNOWN');
    const hasMissingReqs = missingReqs.length > 0;

    if (hasViolatedConstraint) {
      status = 'CONSTRAINT_VIOLATED';
    } else if (hasMissingReqs) {
      status = 'PARTIAL';
    } else if (hasUnknownConstraint) {
      status = 'UNKNOWN';
    } else {
      status = 'VALID';
    }
    
    // Add missing requirements to INSUFFICIENT_EVIDENCE if no capabilities mapped
    if (evidenceList.length === 0) {
       status = 'INSUFFICIENT_EVIDENCE';
    }

    const candidateMeta: CandidateMeta = {
      entity_id: ent.entity_id,
      name: ent.name,
      modality: ent.modality,
      official_url: ent.official_url,
      website_url: ent.website_url,
      repository_url: ent.repository_url,
      documentation_url: ent.documentation_url,
      install_url: ent.install_url,
      download_url: ent.download_url
    };

    paths.push({
      solutions: [ent.entity_id],
      candidates_meta: [candidateMeta],
      requirements_covered: Array.from(reqsCovered),
      requirements_missing: missingReqs,
      must_have_status: mustHaveValid ? 'VALID' : 'INVALID',
      constraints_states: constraintsStates,
      evidence: evidenceList,
      trade_offs: {
        coverage: `${reqsCovered.size}/${analysis.requirements.length}`,
        tools: '1',
        setup_complexity: 'UNKNOWN'
      },
      compatibility: 'N/A',
      status,
      modalities: ent.modality ? [ent.modality] : []
    });
  }

  // 2-tool compositions (Only for valid/partial paths, excluding invalid LLM output)
  const validSingles = paths.filter(p => p.status === 'VALID' || p.status === 'PARTIAL');
  for (let i = 0; i < validSingles.length; i++) {
    for (let j = i + 1; j < validSingles.length; j++) {
      const p1 = validSingles[i];
      const p2 = validSingles[j];
      
      const combinedCovered = new Set([...p1.requirements_covered, ...p2.requirements_covered]);
      const missingReqs = analysis.requirements.filter(r => !combinedCovered.has(r));
      const mustHaveValid = analysis.must_have_requirements.every(r => combinedCovered.has(r));
      
      if (combinedCovered.size <= Math.max(p1.requirements_covered.length, p2.requirements_covered.length)) continue;

      const comp = determineCompatibility([p1.solutions[0], p2.solutions[0]]);
      
      const mergedConstraints: ConstraintState[] = [];
      for (const reqConstraint of analysis.constraints) {
        const c1 = p1.constraints_states.find(c => c.constraint === reqConstraint);
        const c2 = p2.constraints_states.find(c => c.constraint === reqConstraint);
        
        if (c1?.status === 'VIOLATED' || c2?.status === 'VIOLATED') {
          mergedConstraints.push(c1?.status === 'VIOLATED' ? c1 : c2!);
        } else if (c1?.status === 'SATISFIED' && c2?.status === 'SATISFIED') {
           mergedConstraints.push({
             constraint: reqConstraint,
             status: 'SATISFIED',
             evidence: `Supported by both tools. (${p1.solutions[0]} / ${p2.solutions[0]})`,
             reason: 'Both tools satisfy the constraint',
             source_entity: 'composite'
           });
        } else if (c1?.status === 'SATISFIED' || c2?.status === 'SATISFIED') {
          mergedConstraints.push({
            constraint: reqConstraint,
            status: 'UNKNOWN',
            evidence: null,
            reason: `One tool satisfied, but ${c1?.status === 'UNKNOWN' ? p1.solutions[0] : p2.solutions[0]} is UNKNOWN.`,
            source_entity: 'composite'
          });
        } else {
          mergedConstraints.push({
            constraint: reqConstraint,
            status: 'UNKNOWN',
            evidence: null,
            reason: 'Catalog evidence is insufficient to determine this constraint.',
            source_entity: 'composite'
          });
        }
      }

      const requiredConstraintsValid = !mergedConstraints.some(c => c.status === 'VIOLATED');
      let status: 'VALID' | 'CONSTRAINT_VIOLATED' | 'PARTIAL' | 'UNKNOWN' | 'INSUFFICIENT_EVIDENCE' = 'VALID';
      
      const hasViolatedConstraint = mergedConstraints.some(c => c.status === 'VIOLATED');
      const hasUnknownConstraint = mergedConstraints.some(c => c.status === 'UNKNOWN');
      const hasMissingReqs = missingReqs.length > 0;
      
      if (hasViolatedConstraint) {
        status = 'CONSTRAINT_VIOLATED';
      } else if (hasMissingReqs) {
        status = 'PARTIAL';
      } else if (hasUnknownConstraint) {
        status = 'UNKNOWN';
      } else {
        status = 'VALID';
      }
      
      const cMeta1: CandidateMeta | undefined = p1.candidates_meta?.[0];
      const cMeta2: CandidateMeta | undefined = p2.candidates_meta?.[0];

      paths.push({
        solutions: [p1.solutions[0], p2.solutions[0]],
        candidates_meta: [cMeta1, cMeta2].filter(Boolean) as CandidateMeta[],
        requirements_covered: Array.from(combinedCovered),
        requirements_missing: missingReqs,
        must_have_status: mustHaveValid ? 'VALID' : 'INVALID',
        constraints_states: mergedConstraints,
        evidence: [...p1.evidence, ...p2.evidence],
        trade_offs: {
          coverage: `${combinedCovered.size}/${analysis.requirements.length}`,
          tools: '2',
          setup_complexity: 'Higher'
        },
        compatibility: comp,
        status,
        modalities: [p1.modalities?.[0] || '', p2.modalities?.[0] || ''].filter(Boolean)
      });
    }
  }

  return paths.sort((a, b) => {
    // 1. Web Application priority
    const aIsWeb = a.modalities?.includes('web_application');
    const bIsWeb = b.modalities?.includes('web_application');
    if (aIsWeb && !bIsWeb) return -1;
    if (bIsWeb && !aIsWeb) return 1;

    // 2. Validity priority
    const validityScore = (s: string) => {
      if (s === 'VALID') return 4;
      if (s === 'PARTIAL') return 3;
      if (s === 'UNKNOWN') return 2;
      if (s === 'INSUFFICIENT_EVIDENCE') return 1;
      return 0; // CONSTRAINT_VIOLATED, LLM_OUTPUT_INVALID
    };
    
    const aScore = validityScore(a.status);
    const bScore = validityScore(b.status);
    
    if (aScore !== bScore) {
      return bScore - aScore;
    }

    // 3. Coverage Priority
    if (a.requirements_covered.length !== b.requirements_covered.length) {
      return b.requirements_covered.length - a.requirements_covered.length;
    }
    
    // 4. Fewest tools
    return a.solutions.length - b.solutions.length;
  });
};
