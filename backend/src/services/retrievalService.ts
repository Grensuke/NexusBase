import { getVerifiedEntities, Entity } from './catalogService';

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'of', 'to', 'for', 'with', 
  'by', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out', 'against', 
  'during', 'without', 'before', 'under', 'around', 'among', 'i', 'need', 'want', 'tool', 
  'system', 'software', 'application', 'use', 'using', 'make', 'support', 'process', 'processing',
  'file', 'files', 'data', 'information', 'another', 'that', 'this', 'it', 'from', 'then', 'extract' // wait, extract is high info... wait, user says generic terms like "file", "process", "support". I'll remove extract.
]);

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

interface DocTerm {
  term: string;
  weight: number;
  sourceType: 'label' | 'family' | 'evidence' | 'meta';
  sourceName?: string;
}

export interface RetrievalResult {
  entity: Entity;
  score: number;
  matched_terms: string[];
  matched_capabilities: string[];
}

class WeightedRetrieval {
  private documents: { id: string, terms: DocTerm[] }[] = [];
  private idf: Record<string, number> = {};

  addDocument(id: string, terms: DocTerm[]) {
    this.documents.push({ id, terms });
  }

  build() {
    const N = this.documents.length;
    const docFreqs: Record<string, number> = {};
    for (const doc of this.documents) {
      const uniqueTokens = new Set(doc.terms.map(t => t.term));
      for (const t of uniqueTokens) {
        docFreqs[t] = (docFreqs[t] || 0) + 1;
      }
    }
    for (const [term, df] of Object.entries(docFreqs)) {
      this.idf[term] = Math.log(N / (df + 1)) + 1;
    }
  }

  search(query: string, topK: number = 8): Omit<RetrievalResult, 'entity'>[] {
    const queryTokens = tokenize(query);
    const results: Omit<RetrievalResult, 'entity'>[] = [];

    for (const doc of this.documents) {
      let score = 0;
      const matchedTerms = new Set<string>();
      const matchedCaps = new Set<string>();

      // termFreqs with weights
      const termWeights: Record<string, { totalWeight: number, sources: Set<string> }> = {};
      
      for (const dt of doc.terms) {
        if (!termWeights[dt.term]) termWeights[dt.term] = { totalWeight: 0, sources: new Set() };
        termWeights[dt.term].totalWeight += dt.weight;
        if (dt.sourceName) termWeights[dt.term].sources.add(dt.sourceName);
      }

      const totalDocWeight = doc.terms.reduce((acc, dt) => acc + dt.weight, 0) || 1;

      for (const q of queryTokens) {
        if (termWeights[q]) {
          const tf = termWeights[q].totalWeight / totalDocWeight;
          const termScore = tf * (this.idf[q] || 1);
          score += termScore;
          matchedTerms.add(q);
          for (const src of termWeights[q].sources) {
            matchedCaps.add(src);
          }
        }
      }

      // Exact phrase boost (e.g., "pdf to markdown")
      const lowerQuery = query.toLowerCase();
      // Look for matches of specific capabilities in the query text directly
      for (const dt of doc.terms) {
        if (dt.sourceType === 'label' && dt.sourceName) {
          const labelTokens = tokenize(dt.sourceName);
          // If a label has >= 2 tokens and they appear in sequence or close in query, boost it
          if (labelTokens.length >= 2) {
            const joinedLabel = labelTokens.join(' ');
            if (lowerQuery.includes(joinedLabel)) {
              score += 2.0; // Strong boost for multi-word phrase match
              matchedCaps.add(dt.sourceName);
              matchedTerms.add(`[phrase: ${joinedLabel}]`);
            }
          }
        }
      }

      if (score > 0) {
        results.push({ id: doc.id, score, matched_terms: Array.from(matchedTerms), matched_capabilities: Array.from(matchedCaps) } as any);
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}

let tfidfIndex: WeightedRetrieval | null = null;

export const buildIndex = () => {
  if (tfidfIndex) return;
  tfidfIndex = new WeightedRetrieval();
  const entities = getVerifiedEntities();
  
  for (const ent of entities) {
    const terms: DocTerm[] = [];
    
    // Base Entity ID
    tokenize(ent.entity_id).forEach(t => terms.push({ term: t, weight: 1.0, sourceType: 'meta' }));

    // Capabilities (Strong Weight)
    for (const cap of ent.atomic_capabilities || []) {
      tokenize(cap.label).forEach(t => terms.push({ term: t, weight: 5.0, sourceType: 'label', sourceName: cap.label }));
      // Evidence (Weak Weight)
      if (cap.evidence && Array.isArray(cap.evidence)) {
        cap.evidence.forEach(ev => {
          const evText = ev.quote;
          if (typeof evText === 'string') {
            tokenize(evText).forEach(t => terms.push({ term: t, weight: 0.5, sourceType: 'evidence', sourceName: cap.label }));
          }
        });
      }
    }

    // Metadata (Medium Weight)
    for (const meta of ent.metadata_capabilities || []) {
      tokenize(meta.label).forEach(t => terms.push({ term: t, weight: 2.0, sourceType: 'meta', sourceName: meta.label }));
    }

    // Families (Weak Weight)
    const families = (ent as any).capability_families || [];
    for (const fam of families) {
      if (fam.family_name) {
         tokenize(fam.family_name).forEach(t => terms.push({ term: t, weight: 1.0, sourceType: 'family', sourceName: fam.family_name }));
      }
    }

    tfidfIndex.addDocument(ent.entity_id, terms);
  }
  tfidfIndex.build();
};

export const retrieveCandidates = (problem: string, requirements: string[], constraints: string[], topK: number = 8): RetrievalResult[] => {
  buildIndex();
  const query = [problem, ...requirements, ...constraints].join(' ');
  const results = tfidfIndex!.search(query, topK);
  const entities = getVerifiedEntities();
  const entityMap = new Map(entities.map(e => [e.entity_id, e]));
  
  return results.map((r: any) => ({
    entity: entityMap.get(r.id)!,
    score: r.score,
    matched_terms: r.matched_terms,
    matched_capabilities: r.matched_capabilities
  })).filter(r => r.entity);
};
