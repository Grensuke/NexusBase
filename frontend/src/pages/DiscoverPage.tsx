import { useState, useEffect, useRef } from "react";
import { discoverProblem } from "../api/client";
import type { DiscoverResponse, SolutionPath } from "../types/discovery";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, CheckCircle2, XCircle, ChevronRight, Activity, RefreshCw, ExternalLink, GitBranch, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

function PathCard({ path, index, isRejected }: { path: SolutionPath, index: number, isRejected: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const capabilitiesCount = path.evidence?.length || 0;
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
  
  return (
    <div className={`border-t border-strong-border py-12 transition-all duration-700 animate-in fade-in ${isRejected ? 'opacity-60 hover:opacity-100 grayscale hover:grayscale-0' : ''}`} style={{ animationFillMode: "both", animationDelay: `${index * 150}ms` }}>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
        {/* COLUMN 1: Candidate Identity */}
        <div className="lg:col-span-4 flex flex-col gap-1 pr-6">
           <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-mono font-semibold tracking-[0.15em] uppercase text-secondary-ink">PATH {(index+1).toString().padStart(2, '0')}</span>
              <span className="text-[10px] font-mono tracking-widest uppercase text-muted-text">{types}</span>
           </div>
           <h4 className="text-2xl md:text-[28px] font-bold tracking-tight text-primary-ink leading-tight mb-2">
             {names}
           </h4>
           <div className="text-xs font-mono text-muted-text">{techIds}</div>
        </div>
        
        {/* COLUMN 2: Metrics */}
        <div className="lg:col-span-5 flex flex-col">
           <div className="grid grid-cols-[120px_1fr] gap-y-4 text-[14px]">
              <div className="text-secondary-ink font-medium">Capabilities</div>
              <div className="font-semibold text-primary-ink">{capabilitiesCount} <span className="text-muted-text font-mono text-[10px] ml-2 tracking-widest uppercase">identified</span></div>
              
              <div className="text-secondary-ink font-medium">Requirements</div>
              <div className="font-semibold text-primary-ink">{reqsCovered} / {reqsTotal} <span className="text-muted-text font-mono text-[10px] ml-2 tracking-widest uppercase">covered</span></div>
              
              <div className="text-secondary-ink font-medium pt-3 border-t border-border mt-1">Constraints</div>
              <div className="pt-3 border-t border-border mt-1 flex flex-col gap-2">
                {path.constraints_states?.slice(0, 3).map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="truncate pr-4 font-medium text-primary-ink">{c.constraint}</span>
                    <span className={`text-[10px] font-mono font-semibold tracking-widest uppercase shrink-0 ${getStatusTreatment(c.status)}`}>
                      {c.status === 'SATISFIED' ? '✓' : c.status === 'VIOLATED' ? '✕' : '○'} {c.status}
                    </span>
                  </div>
                ))}
                {(path.constraints_states?.length || 0) === 0 && (
                  <span className="text-muted-text italic">None detected</span>
                )}
                {(path.constraints_states?.length || 0) > 3 && (
                  <div className="text-[10px] text-muted-text font-mono mt-1">+{path.constraints_states!.length - 3} more constraints</div>
                )}
              </div>
           </div>
        </div>
        
        {/* COLUMN 3: Status & Action */}
        <div className="lg:col-span-3 flex flex-col items-start lg:items-end gap-6 border-t border-border pt-4 lg:pt-0 lg:border-t-0">
           <div className={`font-mono text-[11px] font-semibold tracking-[0.15em] uppercase ${getStatusTreatment(path.status)}`}>
              {path.status.replace(/_/g, ' ')}
           </div>
           
           <button 
             onClick={() => setExpanded(!expanded)} 
             className="text-[13px] font-bold text-primary-ink hover:text-primary transition-colors flex items-center group bg-transparent border-none p-0 cursor-pointer"
           >
             {expanded ? 'Hide Analysis' : 'View Analysis'} 
             <ChevronRight className={`w-4 h-4 ml-1.5 transition-transform duration-300 ${expanded ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
           </button>

           <div className="flex flex-col items-start lg:items-end gap-3 mt-auto pt-6 w-full">
               {path.candidates_meta?.map((meta, i) => (
                  <div key={i} className="flex flex-wrap lg:flex-col lg:items-end gap-3 w-full">
                    {meta.modality === 'web_application' && meta.website_url ? (
                      <a href={meta.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-primary-ink hover:text-primary transition-colors group">
                        Open Website <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    ) : (
                      <>
                        {meta.documentation_url && <a href={meta.documentation_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-secondary-ink hover:text-primary-ink transition-colors group">Documentation <ExternalLink className="w-3.5 h-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" /></a>}
                        {meta.install_url && <a href={meta.install_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-primary-ink hover:text-primary transition-colors group">Install <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></a>}
                        {meta.download_url && <a href={meta.download_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-primary-ink hover:text-primary transition-colors group">Download <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></a>}
                        {meta.repository_url && <a href={meta.repository_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-secondary-ink hover:text-primary-ink transition-colors group">Repository <GitBranch className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></a>}
                        {meta.official_url && !meta.website_url && !meta.repository_url && <a href={meta.official_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-secondary-ink hover:text-primary-ink transition-colors group">Official Site <ExternalLink className="w-3.5 h-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" /></a>}
                      </>
                    )}
                  </div>
               ))}
           </div>
        </div>
      </div>
      
      {/* EXPANDED ANALYSIS */}
      <div 
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="min-h-0">
          <div className="mt-12 pt-12 border-t border-border grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16" ref={contentRef}>
            
            {/* Expanded Left Column: Requirements & Constraints */}
            <div className="lg:col-span-4 space-y-12 pr-6">
              {(path.requirements_missing?.length || 0) > 0 && (
                <div>
                  <div className="text-[11px] font-mono font-semibold tracking-[0.15em] uppercase text-secondary-ink mb-6 flex items-center gap-3">
                    <span className="w-6 h-px bg-strong-border" />
                    Unmet Requirements
                  </div>
                  <ul className="space-y-4 pl-8 border-l border-violated">
                    {path.requirements_missing.map((req, i) => (
                      <li key={i} className="text-[14px] font-medium text-violated leading-relaxed">
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <div className="text-[11px] font-mono font-semibold tracking-[0.15em] uppercase text-secondary-ink mb-6 flex items-center gap-3">
                  <span className="w-6 h-px bg-strong-border" />
                  Constraint Verification
                </div>
                <div className="space-y-6">
                  {path.constraints_states?.map((c, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-[14px] font-semibold text-primary-ink leading-relaxed">{c.constraint}</span>
                        {getConstraintIcon(c.status)}
                      </div>
                      {c.reason && <p className="text-xs text-secondary-ink font-medium leading-relaxed mt-1 font-mono">{c.reason}</p>}
                    </div>
                  ))}
                  {(path.constraints_states?.length || 0) === 0 && (
                    <div className="text-sm text-muted-text italic">No constraints verified for this path.</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Expanded Right Column: Evidence */}
            <div className="lg:col-span-8 space-y-12">
                <div className="text-[11px] font-mono font-semibold tracking-[0.15em] uppercase text-secondary-ink flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                     <span className="w-6 h-px bg-strong-border" />
                     Source-Backed Evidence
                  </div>
                  <span className="text-muted-text font-normal tracking-widest">{path.evidence?.length || 0} EXCERPTS</span>
                </div>
                
                <div className="space-y-12">
                  {path.evidence?.map((ev, i) => (
                    <div key={i} className="space-y-4 relative">
                      {/* Evidence Metadata */}
                      <div className="flex items-center gap-2 text-[11px] font-mono mb-2">
                        <span className="text-secondary-ink uppercase tracking-widest">{ev.entity}</span>
                        <ChevronRight className="w-3 h-3 text-border" />
                        <span className="text-primary-ink uppercase font-semibold tracking-widest">{ev.capability}</span>
                      </div>
                      
                      {/* Evidence Content (Editorial/Code Block) */}
                      <div className="pl-6 border-l-2 border-strong-border">
                         <div className="prose prose-sm max-w-none font-mono text-[13px] leading-[1.6] prose-p:my-2 prose-pre:my-0 prose-pre:bg-muted-surface prose-pre:border prose-pre:border-border prose-pre:p-4 prose-pre:rounded-none prose-pre:text-secondary-ink text-secondary-ink">
                           <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                             {ev.evidence}
                           </ReactMarkdown>
                         </div>
                      </div>
                      <div className="pl-6 mt-3">
                         <span className="text-[10px] font-mono tracking-widest uppercase text-muted-text bg-surface border border-border px-2 py-1">SOURCE VERIFIED</span>
                      </div>
                    </div>
                  ))}
                  {(path.evidence?.length || 0) === 0 && (
                     <div className="text-sm text-muted-text italic">No specific capability evidence extracted.</div>
                  )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DiscoverResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState(0);

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
  };

  const viablePaths = data?.solution_paths?.filter(p => p.status !== 'CONSTRAINT_VIOLATED' && p.status !== 'LLM_OUTPUT_INVALID') || [];
  const rejectedPaths = data?.solution_paths?.filter(p => p.status === 'CONSTRAINT_VIOLATED' || p.status === 'LLM_OUTPUT_INVALID') || [];

  return (
    <div className="flex-1 w-full flex flex-col font-sans bg-background min-h-screen">
      <div className="max-w-[1200px] mx-auto w-full px-6 md:px-8 py-16 md:py-24 space-y-24 md:space-y-32">
        
        {/* Editor Input Area */}
        <section className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-primary-ink mb-2">Analytical Workspace</h2>
              <p className="text-[15px] text-secondary-ink font-medium">Define your architecture need, technical problem, or software requirement.</p>
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
              className="min-h-[160px] md:min-h-[180px] resize-none bg-surface text-base md:text-lg shadow-sm focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-6 md:p-8 leading-[1.6] border-strong-border transition-colors focus:border-primary-ink hover:border-primary-ink/50 text-primary-ink placeholder:text-muted-text"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <div className="absolute bottom-6 right-6 flex items-center gap-6">
              <span className="text-[10px] text-muted-text hidden sm:inline-block font-mono tracking-widest uppercase">⌘ + ENTER</span>
              <Button 
                onClick={handleDiscover} 
                disabled={loading || !problem.trim()}
                className="rounded-none bg-primary-ink text-surface hover:bg-primary-ink/90 px-8 shadow-none font-bold transition-all h-12 text-[14px]"
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
          <section className="py-16 md:py-24 animate-in fade-in duration-500 flex justify-center">
            <div className="w-full max-w-lg space-y-10">
              <div className="text-[11px] font-mono font-semibold tracking-[0.15em] uppercase text-secondary-ink flex items-center justify-center gap-4">
                <span className="w-12 h-px bg-strong-border" />
                <Activity className="w-4 h-4 text-primary animate-pulse" /> 
                <span>Analytical Pipeline Running</span>
                <span className="w-12 h-px bg-strong-border" />
              </div>
              
              <div className="space-y-8 font-mono text-[13px] text-muted-text flex flex-col items-center">
                {[
                  "Understanding problem",
                  "Extracting requirements & constraints",
                  "Retrieving candidates",
                  "Evaluating capabilities & evidence",
                  "Constructing solution paths"
                ].map((step, idx) => (
                  <div key={idx} className={`flex items-center gap-5 transition-all duration-500 ${progressStep === idx ? 'text-primary-ink scale-[1.02]' : progressStep > idx ? 'text-secondary-ink' : 'text-muted-text opacity-40'}`}>
                    {progressStep === idx ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                    ) : progressStep > idx ? (
                      <CheckCircle2 className="w-4 h-4 text-verified shrink-0" />
                    ) : (
                      <div className="w-4 h-4 border border-strong-border rounded-none shrink-0" />
                    )}
                    <span className={progressStep === idx ? 'opacity-100 font-bold tracking-widest uppercase' : 'opacity-100 tracking-widest uppercase'}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Results Workspace */}
        {data && !loading && (
          <div className="animate-in fade-in duration-700 space-y-24 md:space-y-32">
            
            {/* Problem Understanding Section */}
            <section className="space-y-12">
              <div className="text-[11px] font-mono font-semibold tracking-[0.15em] text-secondary-ink uppercase flex items-center gap-4">
                 <span className="w-12 h-[1px] bg-strong-border"></span>
                 Problem Understanding
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 border-t border-strong-border pt-10 items-start">
                {/* Requirements Column */}
                <div className="space-y-8">
                  <div className="text-[11px] font-mono font-semibold text-secondary-ink uppercase tracking-widest">Requirements</div>
                  <div className="space-y-6">
                    {(data.problem_analysis.requirements || []).map((req, i) => {
                      const isMustHave = data.problem_analysis.must_have_requirements?.includes(req);
                      return (
                        <div key={i} className="flex items-start gap-4">
                          <span className="text-muted-text font-mono text-[11px] font-semibold mt-1 w-6 shrink-0">{(i+1).toString().padStart(2, '0')}</span>
                          <div className="flex flex-col gap-2">
                             <span className="text-[15px] font-medium text-primary-ink leading-relaxed">{req}</span>
                             {isMustHave && (
                               <span className="text-[10px] font-mono font-semibold tracking-widest text-primary uppercase">MUST HAVE</span>
                             )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Constraints Column */}
                <div className="space-y-8">
                  <div className="text-[11px] font-mono font-semibold text-secondary-ink uppercase tracking-widest">Constraints</div>
                  <div className="space-y-6">
                    {(data.problem_analysis.constraints?.length || 0) > 0 ? (
                      (data.problem_analysis.constraints || []).map((c, i) => (
                        <div key={i} className="flex items-start gap-4">
                          <span className="text-muted-text font-mono text-[11px] font-semibold mt-1 w-6 shrink-0">{(i+1).toString().padStart(2, '0')}</span>
                          <span className="text-[15px] font-medium text-primary-ink leading-relaxed">{c}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[15px] text-muted-text font-medium italic pl-10">No strict constraints detected.</div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Discovery Summary & Solution Paths */}
            <section className="space-y-16 md:space-y-24">
              
              {/* Discovery Summary - Vertical Flow */}
              <div className="flex flex-col items-center text-center gap-12 mb-16 border-t border-strong-border pt-16">
                 <div className="text-[11px] font-mono font-semibold tracking-[0.15em] text-secondary-ink uppercase flex items-center justify-center gap-4 w-full">
                    <span className="flex-1 h-px bg-border max-w-[100px]" />
                    Discovery Summary
                    <span className="flex-1 h-px bg-border max-w-[100px]" />
                 </div>
                 
                 <div className="flex flex-col items-center gap-12 w-full max-w-sm mx-auto relative">
                    <div className="absolute top-10 bottom-10 left-1/2 w-px bg-border -translate-x-1/2 -z-10" />
                    
                    <div className="bg-background px-6 py-2 flex flex-col items-center gap-2 relative z-10">
                      <div className="text-[56px] font-bold tracking-tight text-primary-ink leading-none">{data.candidates?.length || 0}</div>
                      <div className="text-[10px] font-mono font-semibold tracking-widest uppercase text-secondary-ink">Candidates Discovered</div>
                    </div>
                    
                    <div className="bg-background px-6 py-2 flex flex-col items-center gap-2 relative z-10">
                      <div className="text-[56px] font-bold tracking-tight text-primary leading-none">{viablePaths.length}</div>
                      <div className="text-[10px] font-mono font-semibold tracking-widest uppercase text-primary">Viable Paths</div>
                    </div>
                    
                    <div className="bg-background px-6 py-2 flex flex-col items-center gap-2 relative z-10">
                      <div className="text-[56px] font-bold tracking-tight text-muted-text leading-none">{rejectedPaths.length}</div>
                      <div className="text-[10px] font-mono font-semibold tracking-widest uppercase text-muted-text">Alternatives</div>
                    </div>
                 </div>
              </div>

              {/* Solution Paths Render */}
              {(data.solution_paths?.length || 0) === 0 ? (
                <div className="py-24 text-center border-t border-strong-border">
                  <XCircle className="w-12 h-12 text-muted-text mx-auto mb-6" />
                  <p className="font-bold text-xl text-primary-ink mb-3">No candidate paths found.</p>
                  <p className="text-[16px] font-medium text-secondary-ink">The discovery engine could not find any software matching all requirements and constraints.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {/* VIABLE PATHS */}
                  {viablePaths.length > 0 && (
                    <div className="flex flex-col">
                      <div className="text-[11px] font-mono font-semibold tracking-[0.15em] text-primary uppercase flex items-center gap-4 mb-6">
                         <span className="w-12 h-[1px] bg-primary"></span>
                         Viable Solutions
                      </div>
                      <div className="flex flex-col border-b border-strong-border">
                        {viablePaths.map((path, pIdx) => (
                          <PathCard key={`viable-${pIdx}`} path={path} index={pIdx} isRejected={false} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* REJECTED PATHS */}
                  {rejectedPaths.length > 0 && (
                    <div className="pt-32">
                      <div className="text-[11px] font-mono font-semibold tracking-[0.15em] text-secondary-ink uppercase flex items-center gap-4 mb-6">
                         <span className="w-12 h-[1px] bg-strong-border"></span>
                         Rejected Alternatives
                      </div>
                      <div className="flex flex-col border-b border-strong-border">
                        {rejectedPaths.map((path, pIdx) => (
                          <PathCard key={`rejected-${pIdx}`} path={path} index={viablePaths.length + pIdx} isRejected={true} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
