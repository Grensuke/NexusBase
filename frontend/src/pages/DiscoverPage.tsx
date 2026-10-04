import React, { useState, useEffect } from "react";
import { discoverProblem } from "../api/client";
import type { DiscoverResponse, SolutionPath } from "../types/discovery";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, HardDrive, CheckCircle2, XCircle, ChevronRight, Activity, RefreshCw, ExternalLink, Download, Book, GitBranch, Globe } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

function PathCard({ path, index, isRejected }: { path: SolutionPath, index: number, isRejected: boolean }) {
  const [expanded, setExpanded] = useState(false);
  
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
     if (status === 'SATISFIED') return <CheckCircle2 className="w-3.5 h-3.5 text-verified" />;
     if (status === 'VIOLATED') return <XCircle className="w-3.5 h-3.5 text-violated" />;
     return <div className="w-3.5 h-3.5 rounded-full border border-border flex shrink-0" />;
  };

  const names = path.candidates_meta?.map(m => m.name).join(" + ") || path.solutions.join(" + ");
  const types = (path.modalities || []).filter(Boolean).map(m => m.replace(/_/g, ' ')).join(" + ");
  const techIds = path.solutions.join(" + ");
  
  return (
    <div className={`border-t border-border py-8 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 ${isRejected ? 'opacity-60 grayscale-[30%]' : ''}`} style={{ animationFillMode: "both", animationDelay: `${index * 150}ms` }}>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 flex flex-col gap-1 pr-6">
           <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-secondary-ink">PATH {(index+1).toString().padStart(2, '0')}</span>
              <span className="text-[11px] font-mono tracking-widest uppercase text-muted-text">{types}</span>
           </div>
           <h4 className="text-[22px] font-semibold tracking-tight text-primary-ink leading-tight">
             {names}
           </h4>
           <div className="text-xs font-mono text-muted-text mt-2">{techIds}</div>
           
           <div className="mt-8 flex flex-col items-start gap-3">
               {path.candidates_meta?.map((meta, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-4">
                    {meta.modality === 'web_application' && meta.website_url ? (
                      <a href={meta.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-ink transition-colors"><Globe className="w-3.5 h-3.5" /> Open Website ↗</a>
                    ) : (
                      <>
                        {meta.documentation_url && <a href={meta.documentation_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-ink hover:text-primary-ink transition-colors"><Book className="w-3.5 h-3.5" /> Documentation ↗</a>}
                        {meta.install_url && <a href={meta.install_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-ink transition-colors"><Download className="w-3.5 h-3.5" /> Install ↗</a>}
                        {meta.download_url && <a href={meta.download_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-ink transition-colors"><Download className="w-3.5 h-3.5" /> Download ↗</a>}
                        {meta.repository_url && <a href={meta.repository_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-ink hover:text-primary-ink transition-colors"><GitBranch className="w-3.5 h-3.5" /> Repository ↗</a>}
                        {meta.official_url && !meta.website_url && !meta.repository_url && <a href={meta.official_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-ink hover:text-primary-ink transition-colors"><ExternalLink className="w-3.5 h-3.5" /> Official Site ↗</a>}
                      </>
                    )}
                  </div>
               ))}
           </div>
        </div>
        
        <div className="lg:col-span-4 flex flex-col">
           <div className="grid grid-cols-[120px_1fr] gap-y-4 text-[13px]">
              <div className="text-secondary-ink font-medium">Capabilities</div>
              <div className="font-semibold text-primary-ink">{capabilitiesCount} <span className="text-muted-text font-mono text-[10px] ml-1 uppercase">identified</span></div>
              
              <div className="text-secondary-ink font-medium">Requirements</div>
              <div className="font-semibold text-primary-ink">{reqsCovered} / {reqsTotal} <span className="text-muted-text font-mono text-[10px] ml-1 uppercase">covered</span></div>
              
              <div className="text-secondary-ink font-medium pt-1 border-t border-border">Constraints</div>
              <div className="pt-1 border-t border-border flex flex-col gap-2">
                {path.constraints_states?.slice(0, 3).map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="truncate pr-2 font-medium text-primary-ink">{c.constraint}</span>
                    <span className={`text-[10px] font-mono tracking-widest uppercase shrink-0 ${getStatusTreatment(c.status)}`}>{c.status}</span>
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
        
        <div className="lg:col-span-3 flex flex-col items-end gap-5">
           <div className={`font-mono text-[11px] font-semibold tracking-widest uppercase ${getStatusTreatment(path.status)}`}>
              {path.status.replace(/_/g, ' ')}
           </div>
           
           <button onClick={() => setExpanded(!expanded)} className="text-xs font-semibold text-secondary-ink hover:text-primary-ink transition-colors flex items-center group">
             {expanded ? 'Hide Analysis' : 'View Analysis'} <ChevronRight className={`w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5 ${expanded ? 'rotate-90' : ''}`} />
           </button>
        </div>
      </div>
      
      {expanded && (
         <div className="mt-10 pt-10 border-t border-strong-border grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-300">
           
           <div className="lg:col-span-5 space-y-10">
             <div>
               <div className="text-[11px] font-mono font-semibold tracking-widest uppercase text-secondary-ink mb-5">Constraint Verification</div>
               <div className="space-y-5">
                 {path.constraints_states?.map((c, i) => (
                   <div key={i} className="flex flex-col gap-2 border-l-2 border-strong-border pl-4">
                     <div className="flex items-start justify-between gap-4">
                       <div className="flex items-center gap-3">
                         {getConstraintIcon(c.status)}
                         <span className="text-[13px] font-semibold text-primary-ink">{c.constraint}</span>
                       </div>
                       <span className={`text-[10px] font-mono tracking-widest uppercase shrink-0 mt-0.5 ${getStatusTreatment(c.status)}`}>{c.status}</span>
                     </div>
                     {c.reason && <p className="text-xs text-secondary-ink font-medium leading-relaxed pl-6">{c.reason}</p>}
                   </div>
                 ))}
               </div>
             </div>
             
             {(path.requirements_missing?.length || 0) > 0 && (
               <div>
                 <div className="text-[11px] font-mono font-semibold tracking-widest uppercase text-secondary-ink mb-5">Unmet Requirements</div>
                 <ul className="space-y-3 pl-4 border-l-2 border-violated">
                   {path.requirements_missing.map((req, i) => (
                     <li key={i} className="text-[13px] font-medium text-violated">
                       {req}
                     </li>
                   ))}
                 </ul>
               </div>
             )}
           </div>
           
           <div className="lg:col-span-7 space-y-8">
              <div className="text-[11px] font-mono font-semibold tracking-widest uppercase text-secondary-ink flex items-center justify-between">
                <span>Source-Backed Evidence</span>
                <span className="text-muted-text font-normal">{path.evidence?.length || 0} excerpts</span>
              </div>
              
              <div className="space-y-8">
                {path.evidence?.map((ev, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-primary tracking-wider uppercase font-semibold">{ev.entity}</span>
                      <span className="text-strong-border">/</span>
                      <span className="text-primary-ink uppercase font-semibold truncate">{ev.capability}</span>
                    </div>
                    <div className="p-5 bg-muted-surface border border-border">
                       <div className="prose prose-sm max-w-none font-mono text-[12px] leading-relaxed prose-p:my-1 prose-pre:my-0 prose-pre:bg-transparent prose-pre:p-0 prose-pre:text-muted-text text-muted-text">
                         <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                           {ev.evidence}
                         </ReactMarkdown>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
           </div>
         </div>
      )}
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
    <div className="flex-1 w-full flex flex-col font-sans">
      <div className="max-w-[1200px] mx-auto w-full px-6 md:px-8 py-16 space-y-24">
        
        {/* Editor Input Area */}
        <section className="space-y-8">
          <div className="flex items-end justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-primary-ink">Analytical Workspace</h2>
              <p className="text-sm text-secondary-ink mt-1 font-medium">Define your architecture need, technical problem, or software requirement.</p>
            </div>
            {data && (
              <button onClick={reset} className="text-xs font-semibold text-secondary-ink hover:text-primary-ink transition-colors flex items-center group">
                <RefreshCw className="w-3.5 h-3.5 mr-2 group-hover:rotate-180 transition-transform duration-500" /> New Discovery
              </button>
            )}
          </div>
          
          <div className="relative group">
            <Textarea
              placeholder="e.g., I need to convert PDF files into Markdown locally..."
              className="min-h-[160px] resize-none bg-surface text-base shadow-sm focus-visible:ring-primary rounded-none p-6 leading-relaxed border-strong-border transition-colors group-hover:border-primary text-primary-ink placeholder:text-muted-text"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <div className="absolute bottom-6 right-6 flex items-center gap-4">
              <span className="text-[11px] text-muted-text hidden sm:inline-block font-mono tracking-widest">⌘ + ENTER</span>
              <Button 
                onClick={handleDiscover} 
                disabled={loading || !problem.trim()}
                className="rounded-none bg-primary-ink text-surface hover:bg-primary-ink/90 px-8 shadow-none font-semibold transition-all h-10"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Analyze
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="p-5 bg-violated/5 border-l-2 border-violated text-violated text-sm flex items-start gap-3">
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold">Analysis Failed</p>
                <p className="font-mono text-[11px]">{error}</p>
              </div>
            </div>
          )}
        </section>

        {/* Loading Pipeline State */}
        {loading && (
          <section className="py-12 animate-in fade-in duration-500">
            <div className="max-w-xl mx-auto space-y-8">
              <h3 className="text-[11px] font-mono font-semibold tracking-widest uppercase text-secondary-ink flex items-center gap-3">
                <Activity className="w-4 h-4 text-primary animate-pulse" /> Analytical Pipeline Running
              </h3>
              <div className="space-y-5 font-mono text-[13px] text-muted-text pl-2 border-l border-strong-border ml-2">
                {[
                  "Understanding problem",
                  "Extracting requirements & constraints",
                  "Retrieving candidates",
                  "Evaluating capabilities & evidence",
                  "Constructing solution paths"
                ].map((step, idx) => (
                  <div key={idx} className={`flex items-center gap-4 transition-all duration-500 ${progressStep === idx ? 'text-primary-ink scale-[1.02] origin-left' : progressStep > idx ? 'text-secondary-ink' : 'text-muted-text opacity-50'}`}>
                    {progressStep === idx ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                    ) : progressStep > idx ? (
                      <CheckCircle2 className="w-4 h-4 text-verified shrink-0" />
                    ) : (
                      <div className="w-4 h-4 border border-strong-border rounded-none shrink-0" />
                    )}
                    <span className={progressStep === idx ? 'opacity-100 font-semibold' : 'opacity-100'}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Results Workspace */}
        {data && !loading && (
          <div className="animate-in fade-in duration-700 space-y-24">
            
            {/* Requirements & Constraints */}
            <section className="space-y-8">
              <div className="text-[11px] font-mono font-semibold tracking-widest text-secondary-ink uppercase flex items-center gap-3">
                 <span className="w-8 h-[1px] bg-strong-border"></span>
                 Problem Understanding
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 border-t border-strong-border pt-8">
                <div className="space-y-6">
                  <div className="text-[11px] font-mono font-semibold text-secondary-ink uppercase tracking-widest">Requirements</div>
                  <div className="space-y-4">
                    {(data.problem_analysis.requirements || []).map((req, i) => {
                      const isMustHave = data.problem_analysis.must_have_requirements?.includes(req);
                      return (
                        <div key={i} className="flex items-start justify-between gap-4">
                          <span className="text-[14px] font-medium text-primary-ink leading-relaxed">
                            <span className="text-muted-text font-mono text-[11px] mr-3">{(i+1).toString().padStart(2, '0')}</span>
                            {req}
                          </span>
                          {isMustHave && (
                            <span className="shrink-0 text-[10px] font-mono font-semibold tracking-widest text-primary uppercase pt-1">MUST HAVE</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="text-[11px] font-mono font-semibold text-secondary-ink uppercase tracking-widest">Constraints</div>
                  <div className="space-y-4">
                    {(data.problem_analysis.constraints?.length || 0) > 0 ? (
                      (data.problem_analysis.constraints || []).map((c, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <HardDrive className="w-4 h-4 text-muted-text shrink-0" />
                          <span className="text-[14px] font-medium text-primary-ink">{c}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[14px] text-muted-text font-medium italic">No strict constraints detected.</div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Solution Paths Header */}
            <section>
              <div className="flex flex-col gap-10 mb-16">
                <div className="text-[11px] font-mono font-semibold tracking-widest text-secondary-ink uppercase flex items-center gap-3">
                   <span className="w-8 h-[1px] bg-strong-border"></span>
                   Discovery Summary
                </div>
                
                <div className="flex flex-wrap items-end gap-x-24 gap-y-10 border-t border-strong-border pt-8">
                  <div className="space-y-3">
                    <div className="text-[64px] font-medium tracking-tight text-primary-ink leading-none">{data.candidates?.length || 0}</div>
                    <div className="text-[11px] font-mono font-semibold tracking-widest uppercase text-secondary-ink">Candidates Discovered</div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-[64px] font-medium tracking-tight text-primary leading-none">{viablePaths.length}</div>
                    <div className="text-[11px] font-mono font-semibold tracking-widest uppercase text-primary">Viable Paths</div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-[64px] font-medium tracking-tight text-muted-text leading-none">{rejectedPaths.length}</div>
                    <div className="text-[11px] font-mono font-semibold tracking-widest uppercase text-muted-text">Alternatives</div>
                  </div>
                </div>
              </div>

              {(data.solution_paths?.length || 0) === 0 ? (
                <div className="py-24 text-center border-t border-strong-border">
                  <XCircle className="w-10 h-10 text-muted-text mx-auto mb-6" />
                  <p className="font-semibold text-lg text-primary-ink mb-2">No candidate paths found.</p>
                  <p className="text-[15px] font-medium text-secondary-ink">The discovery engine could not find any software matching all requirements and constraints.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {/* VIABLE PATHS */}
                  {viablePaths.length > 0 && (
                    <div className="flex flex-col border-b border-strong-border">
                      {viablePaths.map((path, pIdx) => (
                        <PathCard key={`viable-${pIdx}`} path={path} index={pIdx} isRejected={false} />
                      ))}
                    </div>
                  )}

                  {/* REJECTED PATHS */}
                  {rejectedPaths.length > 0 && (
                    <div className="pt-24">
                      <div className="text-[11px] font-mono font-semibold tracking-widest text-secondary-ink uppercase flex items-center gap-3 mb-8">
                         <span className="w-8 h-[1px] bg-strong-border"></span>
                         Rejected Alternatives
                      </div>
                      <div className="flex flex-col border-b border-strong-border border-t">
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
