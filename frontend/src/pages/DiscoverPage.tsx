import { useState, useEffect } from "react";
import { discoverProblem } from "../api/client";
import type { DiscoverResponse, SolutionPath } from "../types/discovery";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, CheckCircle2, XCircle, ChevronRight, Activity, RefreshCw, ExternalLink, GitBranch, ArrowRight, LayoutGrid, Columns3 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

function PathCard({ path, index }: { path: SolutionPath, index: number }) {
  const [expanded, setExpanded] = useState(false);
  
  const reqsTotal = (path.requirements_covered?.length || 0) + (path.requirements_missing?.length || 0);
  const reqsCovered = path.requirements_covered?.length || 0;
  
  const getStatusTreatment = (status: string) => {
     if (status === 'VALID' || status === 'SATISFIED') return "text-verified";
     if (status === 'UNKNOWN') return "text-unknown";
     if (status === 'VIOLATED' || status === 'CONSTRAINT_VIOLATED' || status === 'LLM_OUTPUT_INVALID') return "text-violated";
     if (status === 'PARTIAL') return "text-warning";
     return "text-primary-ink";
  };

  const getConstraintIcon = (status: string) => {
     if (status === 'SATISFIED') return <span className="text-verified font-mono text-[11px] font-semibold tracking-widest uppercase">✓ SATISFIED</span>;
     if (status === 'VIOLATED') return <span className="text-violated font-mono text-[11px] font-semibold tracking-widest uppercase">✕ VIOLATED</span>;
     return <span className="text-unknown font-mono text-[11px] font-semibold tracking-widest uppercase">○ UNKNOWN</span>;
  };

  const names = path.candidates_meta?.map(m => m.name).join(" + ") || path.solutions.join(" + ");
  const types = (path.modalities || []).filter(Boolean).map(m => m.replace(/_/g, ' ')).join(" + ");
  const techIds = path.solutions.join(" + ");
  const primaryCapability = path.evidence?.[0]?.capability || "Core Processing";
  
  return (
    <div className="mb-6 lg:mb-0 row-span-2 grid grid-rows-[subgrid] bg-surface border border-strong-border transition-all duration-500 animate-in fade-in" style={{ animationFillMode: "both", animationDelay: `${index * 50}ms` }}>
      <div className="p-5 md:p-6 flex flex-col h-full">
        {/* PATH IDENTITY */}
        <div className="flex flex-col gap-1.5 mb-4">
           <div className="flex items-center gap-2">
             <span className="text-[10px] font-mono font-semibold tracking-[0.15em] uppercase text-primary-ink">PATH {(index+1).toString().padStart(2, '0')}</span>
             <span className="text-[10px] font-mono tracking-widest uppercase text-secondary-ink truncate">{types}</span>
           </div>
           <h4 className="text-[20px] font-bold tracking-tight text-primary-ink leading-tight mt-1">
             {names}
           </h4>
           <div className="text-[13px] font-medium text-primary-ink">{primaryCapability}</div>
           <div className="text-[11px] font-mono text-muted-text mt-1">{techIds}</div>
        </div>
        <div className="w-full h-px bg-border mb-6" />

        {/* METRICS / REQUIREMENTS / CONSTRAINTS */}
        <div className="flex-1 flex flex-col gap-5">
          <div className="flex flex-col gap-3">
             <div className="text-[10px] font-mono font-semibold tracking-[0.15em] uppercase text-secondary-ink flex items-center justify-between">
                <span>Requirements</span>
                <span className="text-muted-text font-normal">{reqsCovered} / {reqsTotal}</span>
             </div>
             <div className="flex flex-col gap-2">
                {path.requirements_covered?.map((req, i) => (
                  <div key={`cov-${i}`} className="flex items-start gap-2 text-[13px] font-medium text-primary-ink leading-relaxed">
                    <span className="text-verified shrink-0 mt-0.5">✓</span>
                    <span>{req}</span>
                  </div>
                ))}
                {path.requirements_missing?.map((req, i) => (
                  <div key={`miss-${i}`} className="flex items-start gap-2 text-[13px] font-medium text-muted-text leading-relaxed opacity-75">
                    <span className="shrink-0 mt-0.5">○</span>
                    <span>{req}</span>
                  </div>
                ))}
             </div>
          </div>

          {(path.constraints_states?.length || 0) > 0 && (
             <div className="flex flex-col gap-2.5 pt-5 border-t border-border">
                <div className="text-[10px] font-mono font-semibold tracking-[0.15em] uppercase text-secondary-ink">Constraint</div>
                <div className="flex flex-col gap-1.5">
                  {path.constraints_states?.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12px] font-medium text-primary-ink leading-relaxed">
                      <span className={`shrink-0 mt-0.5 ${getStatusTreatment(c.status)}`}>
                        {c.status === 'SATISFIED' ? '✓' : c.status === 'VIOLATED' ? '✕' : '○'}
                      </span>
                      <span>{c.constraint}</span>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </div>

        {/* STATUS & ACTIONS */}
        <div className="mt-6 pt-5 border-t border-border flex flex-col gap-5">
           <div className="flex flex-col gap-1">
             <div className={`font-mono text-[11px] font-semibold tracking-[0.15em] uppercase ${getStatusTreatment(path.status)}`}>
                {path.status.replace(/_/g, ' ')}
             </div>
             <div className="text-[12px] font-medium text-secondary-ink">
                {path.status === 'VALID' ? `${reqsCovered} / ${reqsTotal} requirements` :
                 path.status === 'PARTIAL' ? `${reqsTotal - reqsCovered} requirement(s) unmet` :
                 path.status === 'CONSTRAINT_VIOLATED' ? 'Constraint violation' :
                 'Insufficient evidence'}
             </div>
           </div>

           <div className="flex flex-col gap-4 w-full">
              {/* Primary Actions */}
              {path.candidates_meta?.map((meta, i) => (
                <div key={i} className="flex flex-col gap-3">
                  {meta.modality === 'web_application' && meta.website_url ? (
                    <a href={meta.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[14px] font-bold text-primary-ink hover:text-primary transition-colors group">
                      Open Website <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  ) : (
                    <>
                      {meta.install_url && <a href={meta.install_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[14px] font-bold text-primary-ink hover:text-primary transition-colors group">Install <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></a>}
                      {meta.download_url && <a href={meta.download_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[14px] font-bold text-primary-ink hover:text-primary transition-colors group">Download <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></a>}
                      
                      <div className="flex flex-wrap items-center gap-4 mt-1">
                        {meta.documentation_url && <a href={meta.documentation_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-ink hover:text-primary-ink transition-colors group">Documentation <ExternalLink className="w-3 h-3 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" /></a>}
                        {meta.repository_url && <a href={meta.repository_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-ink hover:text-primary-ink transition-colors group">Repository <GitBranch className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></a>}
                        {meta.official_url && !meta.website_url && !meta.repository_url && <a href={meta.official_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-ink hover:text-primary-ink transition-colors group">Official Site <ExternalLink className="w-3 h-3 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" /></a>}
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {/* Secondary View Analysis Action */}
              <button 
                onClick={() => setExpanded(!expanded)} 
                className="text-[13px] font-bold text-secondary-ink hover:text-primary-ink transition-colors flex items-center group bg-transparent border-none p-0 cursor-pointer w-fit mt-2"
              >
                {expanded ? 'Hide Analysis' : 'View Analysis'} 
                <ChevronRight className={`w-3.5 h-3.5 ml-1.5 transition-transform duration-300 ${expanded ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
              </button>
           </div>
        </div>
      </div>
      
      {/* EXPANDED ANALYSIS (Inline) */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out bg-muted-surface ${expanded ? 'max-h-[3000px] opacity-100 border-t border-strong-border' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-5 md:p-6 space-y-8">
            
            {(path.constraints_states?.length || 0) > 0 && (
              <div>
                <div className="text-[10px] font-mono font-semibold tracking-[0.15em] uppercase text-secondary-ink mb-4 flex items-center gap-3">
                  <span className="w-4 h-px bg-strong-border" />
                  Constraint Verification
                </div>
                <div className="space-y-4">
                  {path.constraints_states?.map((c, i) => (
                    <div key={i} className="flex flex-col gap-1.5 pl-7 border-l-2 border-strong-border">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-[13px] font-semibold text-primary-ink leading-relaxed">{c.constraint}</span>
                        {getConstraintIcon(c.status)}
                      </div>
                      {c.reason && <p className="text-[11px] text-secondary-ink font-medium leading-relaxed font-mono">{c.reason}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-6">
                <div className="text-[10px] font-mono font-semibold tracking-[0.15em] uppercase text-secondary-ink flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <span className="w-4 h-px bg-strong-border" />
                     Source-Backed Evidence
                  </div>
                </div>
                
                <div className="space-y-8">
                  {path.evidence?.map((ev, i) => (
                    <div key={i} className="space-y-3 relative pl-7 border-l-2 border-strong-border">
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-secondary-ink uppercase tracking-widest">{ev.entity}</span>
                        <ChevronRight className="w-2.5 h-2.5 text-border" />
                        <span className="text-primary-ink uppercase font-semibold tracking-widest">{ev.capability}</span>
                      </div>
                      <div className="prose prose-sm max-w-none font-mono text-[12px] leading-[1.6] prose-p:my-1 prose-pre:my-0 prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-pre:p-3 prose-pre:rounded-none prose-pre:text-secondary-ink text-secondary-ink">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                          {ev.evidence}
                        </ReactMarkdown>
                      </div>
                      <div className="mt-2">
                         <span className="text-[9px] font-mono tracking-widest uppercase text-muted-text bg-surface border border-border px-1.5 py-0.5">SOURCE VERIFIED</span>
                      </div>
                    </div>
                  ))}
                  {(path.evidence?.length || 0) === 0 && (
                     <div className="text-xs text-muted-text italic pl-7 border-l-2 border-transparent">No specific capability evidence extracted.</div>
                  )}
                </div>
            </div>

          </div>
      </div>
    </div>
  );
}

function ComparisonTable({ data }: { data: DiscoverResponse }) {
  const allPaths = data.solution_paths || [];
  
  // Extract all unique requirements
  const allReqs = Array.from(new Set(allPaths.flatMap(p => [
    ...(p.requirements_covered || []),
    ...(p.requirements_missing || [])
  ])));
  
  // Extract all unique constraints
  const allConstraints = Array.from(new Set(allPaths.flatMap(p => 
    p.constraints_states?.map(c => c.constraint) || []
  )));

  const getStatusTreatment = (status: string) => {
     if (status === 'VALID' || status === 'SATISFIED') return "text-verified bg-verified-soft";
     if (status === 'UNKNOWN') return "text-unknown bg-unknown-soft";
     if (status === 'VIOLATED' || status === 'CONSTRAINT_VIOLATED' || status === 'LLM_OUTPUT_INVALID') return "text-violated bg-violated-soft";
     if (status === 'PARTIAL') return "text-warning bg-warning-soft";
     return "text-primary-ink bg-muted-surface";
  };

  return (
    <div className="w-full overflow-x-auto border border-strong-border bg-surface animate-in fade-in duration-500">
      <table className="w-full text-left text-[13px] min-w-[800px]">
        <thead>
          <tr>
            <th className="p-4 border-b border-r border-border bg-muted-surface w-[250px] font-mono text-[10px] uppercase tracking-widest text-secondary-ink font-semibold">Dimension</th>
            {allPaths.map((p, i) => (
              <th key={i} className="p-4 border-b border-border bg-surface">
                <div className="font-mono text-[10px] tracking-[0.15em] text-muted-text uppercase mb-1">Path {(i+1).toString().padStart(2, '0')}</div>
                <div className="font-bold text-primary-ink text-[15px] truncate max-w-[200px]">
                  {p.candidates_meta?.map(m => m.name).join(" + ") || p.solutions.join(" + ")}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Status Row */}
          <tr>
            <td className="p-4 border-b border-r border-border font-semibold text-primary-ink">Status</td>
            {allPaths.map((p, i) => (
              <td key={i} className="p-4 border-b border-border">
                <span className={`inline-flex font-mono text-[10px] font-semibold tracking-widest uppercase px-2 py-1 ${getStatusTreatment(p.status)}`}>
                  {p.status.replace(/_/g, ' ')}
                </span>
              </td>
            ))}
          </tr>

          {/* Requirements Rows */}
          {allReqs.map((req, reqIdx) => (
            <tr key={`req-${reqIdx}`}>
              <td className="p-4 border-b border-r border-border font-medium text-secondary-ink truncate max-w-[250px]" title={req}>{req}</td>
              {allPaths.map((p, pIdx) => {
                const isCovered = p.requirements_covered?.includes(req);
                return (
                  <td key={`req-${reqIdx}-${pIdx}`} className="p-4 border-b border-border">
                    {isCovered ? (
                      <CheckCircle2 className="w-4 h-4 text-verified" />
                    ) : (
                      <span className="text-muted-text font-semibold text-[11px] tracking-widest uppercase">○</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Constraints Rows */}
          {allConstraints.map((constraint, cIdx) => (
            <tr key={`c-${cIdx}`}>
              <td className="p-4 border-b border-r border-border font-medium text-secondary-ink truncate max-w-[250px]" title={constraint}>{constraint}</td>
              {allPaths.map((p, pIdx) => {
                const cState = p.constraints_states?.find(c => c.constraint === constraint);
                return (
                  <td key={`c-${cIdx}-${pIdx}`} className="p-4 border-b border-border">
                    {cState ? (
                      cState.status === 'SATISFIED' ? (
                        <CheckCircle2 className="w-4 h-4 text-verified" />
                      ) : cState.status === 'VIOLATED' ? (
                        <XCircle className="w-4 h-4 text-violated" />
                      ) : (
                        <span className="text-unknown font-semibold text-[11px] tracking-widest uppercase">○</span>
                      )
                    ) : (
                      <span className="text-border">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DiscoverPage() {
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DiscoverResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState(0);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      interval = setInterval(() => {
        setProgressStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  const handleDiscover = async () => {
    if (!problem.trim()) return;
    setProgressStep(0);
    setLoading(true);
    setError(null);
    setData(null);
    setIsComparing(false);

    try {
      const result = await discoverProblem(problem);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgressStep(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleDiscover();
    }
  };

  const reset = () => {
    setProblem("");
    setData(null);
    setError(null);
    setIsComparing(false);
  };

  const hasDataOrLoading = data !== null || loading;
  const inputHeightClass = hasDataOrLoading ? "min-h-[80px]" : "min-h-[160px] md:min-h-[200px]";
  
  const viableCount = data?.solution_paths?.filter(p => p.status !== 'CONSTRAINT_VIOLATED' && p.status !== 'LLM_OUTPUT_INVALID').length || 0;
  const violatedCount = (data?.solution_paths?.length || 0) - viableCount;

  return (
    <div className="flex-1 w-full flex flex-col font-sans bg-background min-h-screen">
      <div className="max-w-[1200px] mx-auto w-full px-6 md:px-8 py-12 md:py-16 space-y-12 md:space-y-16">
        
        {/* Editor Input Area */}
        <section className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-primary-ink mb-2">Analytical Workspace</h2>
              {!hasDataOrLoading && (
                 <p className="text-[15px] text-secondary-ink font-medium">Describe your architecture need, technical problem, or software requirement.</p>
              )}
            </div>
            {data && (
              <button onClick={reset} className="text-xs font-bold text-secondary-ink hover:text-primary-ink transition-colors flex items-center group uppercase tracking-widest font-mono shrink-0 mb-1">
                <RefreshCw className="w-3.5 h-3.5 mr-2 group-hover:rotate-180 transition-transform duration-500" /> New Discovery
              </button>
            )}
          </div>
          
          <div className="relative group flex flex-col">
            <Textarea
              placeholder="e.g., I need to convert PDF files into Markdown locally..."
              className={`${inputHeightClass} resize-none bg-surface text-base md:text-lg shadow-sm focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-6 leading-[1.6] border-strong-border transition-all duration-500 focus:border-primary-ink hover:border-primary-ink/50 text-primary-ink placeholder:text-muted-text`}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <div className={`absolute right-6 flex items-center gap-6 transition-all duration-500 ${hasDataOrLoading ? 'bottom-4' : 'bottom-6'}`}>
              <span className="text-[10px] text-muted-text hidden sm:inline-block font-mono tracking-widest uppercase">⌘ + ENTER</span>
              <Button 
                onClick={handleDiscover} 
                disabled={loading || !problem.trim()}
                className={`rounded-none bg-primary-ink text-surface hover:bg-primary-ink/90 shadow-none font-bold transition-all ${hasDataOrLoading ? 'px-6 h-10 text-[13px]' : 'px-8 h-12 text-[14px]'}`}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Analyze
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="p-6 bg-violated-soft border border-violated/20 text-violated text-sm flex items-start gap-4">
              <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-bold text-[15px]">Analysis Failed</p>
                <p className="font-mono text-xs">{error}</p>
              </div>
            </div>
          )}
        </section>

        {/* Loading Pipeline State */}
        {loading && (
          <section className="animate-in fade-in duration-300 flex flex-col items-start -mt-2 md:-mt-4">
            <div className="w-full max-w-[500px] border border-strong-border bg-surface p-5">
              <div className="text-[10px] font-mono font-semibold tracking-[0.15em] uppercase text-secondary-ink flex items-center gap-3 mb-4">
                <Activity className="w-3.5 h-3.5 text-primary animate-pulse" /> 
                <span>Analytical Pipeline</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 font-mono text-[11px] text-muted-text">
                {[
                  "Understanding problem",
                  "Extracting requirements",
                  "Retrieving candidates",
                  "Evaluating capabilities",
                  "Verifying evidence",
                  "Constructing paths"
                ].map((step, idx) => {
                   const normalizedIdx = Math.floor(idx * (5 / 6));
                   const isActive = progressStep === normalizedIdx;
                   const isDone = progressStep > normalizedIdx;
                   
                   return (
                    <div key={idx} className={`flex items-center gap-3 transition-all duration-200 ${isActive ? 'text-primary-ink' : isDone ? 'text-secondary-ink' : 'text-muted-text opacity-50'}`}>
                      {isActive ? (
                        <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" />
                      ) : isDone ? (
                        <CheckCircle2 className="w-3 h-3 text-verified shrink-0" />
                      ) : (
                        <div className="w-3 h-3 border border-strong-border rounded-none shrink-0" />
                      )}
                      <span className={isActive ? 'opacity-100 font-bold uppercase tracking-wider' : 'opacity-100 uppercase tracking-wider'}>{step}</span>
                    </div>
                   );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Results Workspace */}
        {data && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-10 md:space-y-12">
            
            {/* UNDERSTOOD - Compact Global Summary */}
            <section className="bg-muted-surface border border-border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                 <div className="text-[10px] font-mono font-semibold tracking-[0.15em] text-secondary-ink uppercase">Understood</div>
                 <div className="text-[14px] font-medium text-primary-ink leading-relaxed">
                   {data.problem_analysis.requirements?.map((req, i, arr) => (
                      <span key={i}>
                        {req}
                        {i < arr.length - 1 && <span className="text-border mx-2">·</span>}
                      </span>
                   ))}
                 </div>
              </div>
              <div className="flex flex-col md:items-end text-[12px] font-mono text-secondary-ink pt-2 md:pt-0">
                 <span>{data.problem_analysis.requirements?.length || 0} requirements · {(data.problem_analysis.must_have_requirements?.length || 0) + (data.problem_analysis.constraints?.length || 0)} constraints</span>
              </div>
            </section>

            {/* DISCOVERY RESULTS - Single horizontal baseline */}
            <section className="border-t border-b border-strong-border py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="text-[11px] font-mono font-semibold tracking-[0.15em] text-secondary-ink uppercase">Discovery Results</div>
               <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] font-medium text-secondary-ink">
                  <span className="text-primary-ink font-bold">{data.candidates?.length || 0}</span> candidates discovered
                  <span className="text-border mx-2">|</span>
                  <span className="text-primary-ink font-bold">{data.solution_paths?.length || 0}</span> paths
                  <span className="text-border mx-2">|</span>
                  <span className="text-verified font-bold">{viableCount}</span> viable
                  <span className="text-border mx-2">|</span>
                  <span className="text-violated font-bold">{violatedCount}</span> constraint-violating
               </div>
            </section>

            {/* SOLUTION PATHS - Core Delivery */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold tracking-tight text-primary-ink">Solution Paths</h3>
                
                {/* Compare Toggle */}
                {(data.solution_paths?.length || 0) > 1 && (
                  <div className="flex items-center bg-muted-surface border border-strong-border p-1">
                    <button 
                      onClick={() => setIsComparing(false)}
                      className={`flex items-center gap-2 px-4 py-2 text-[12px] font-bold transition-colors ${!isComparing ? 'bg-surface text-primary-ink shadow-sm border border-border' : 'text-secondary-ink hover:text-primary-ink'}`}
                    >
                      <Columns3 className="w-4 h-4" /> Cards
                    </button>
                    <button 
                      onClick={() => setIsComparing(true)}
                      className={`flex items-center gap-2 px-4 py-2 text-[12px] font-bold transition-colors ${isComparing ? 'bg-surface text-primary-ink shadow-sm border border-border' : 'text-secondary-ink hover:text-primary-ink'}`}
                    >
                      <LayoutGrid className="w-4 h-4" /> Compare
                    </button>
                  </div>
                )}
              </div>

              {(data.solution_paths?.length || 0) === 0 ? (
                <div className="py-24 text-center border border-strong-border bg-surface">
                  <XCircle className="w-8 h-8 text-muted-text mx-auto mb-4" />
                  <p className="font-bold text-lg text-primary-ink mb-2">No candidate paths found.</p>
                  <p className="text-[15px] font-medium text-secondary-ink">The discovery engine could not find any software matching all requirements and constraints.</p>
                </div>
              ) : isComparing ? (
                /* Matrix View */
                <ComparisonTable data={data} />
              ) : (
                /* Side-by-side Card View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
                  {data.solution_paths?.map((path, idx) => (
                    <PathCard key={idx} path={path} index={idx} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
