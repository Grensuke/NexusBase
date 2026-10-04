import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Search, FileText, Box, ShieldCheck, HardDrive, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";

// --- Types ---
type ProblemAnalysis = {
  interpreted_problem: string;
  requirements: string[];
  must_have_requirements: string[];
  constraints: string[];
};

type CandidateScore = {
  entity_id: string;
  score: number;
  matched_terms: string[];
  matched_capabilities: any[];
};

type ConstraintState = {
  constraint: string;
  status: 'SATISFIED' | 'VIOLATED' | 'UNKNOWN';
  evidence: string | null;
  reason: string;
  source_entity: string;
  source_block?: string;
};

type Evidence = {
  entity: string;
  capability: string;
  evidence: string;
};

type SolutionPath = {
  solutions: string[];
  requirements_covered: string[];
  requirements_missing: string[];
  must_have_status: 'VALID' | 'INVALID';
  constraints_states: ConstraintState[];
  evidence: Evidence[];
  trade_offs: Record<string, string>;
  compatibility: 'VERIFIED' | 'UNVERIFIED' | 'INCOMPATIBLE' | 'N/A';
  status: 'VALID' | 'PARTIAL' | 'INVALID' | 'LLM_OUTPUT_INVALID';
};

type DiscoverResponse = {
  problem_analysis: ProblemAnalysis;
  candidates: CandidateScore[];
  solution_paths: SolutionPath[];
  status: string;
  error?: string;
};

export default function App() {
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DiscoverResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDiscover = async () => {
    if (!problem.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("http://localhost:3000/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to fetch");

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-lg tracking-tight">NexusBase</h1>
          <Badge variant="outline" className="ml-2 text-xs font-mono font-normal">v2.0-MVP</Badge>
        </div>
      </header>

      {/* Main Split Pane */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] overflow-hidden">
        
        {/* LEFT PANE: Input & Analysis */}
        <div className="w-full lg:w-[45%] flex flex-col border-r border-border bg-muted/20">
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="space-y-8">
              
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-medium tracking-tight mb-1">Analytical Discovery</h2>
                  <p className="text-sm text-muted-foreground">Describe your technical problem, architecture need, or software requirement.</p>
                </div>
                
                <div className="relative">
                  <Textarea
                    placeholder="e.g., I need to convert PDF files into Markdown locally without sending data to the cloud..."
                    className="min-h-[160px] resize-none bg-background text-base shadow-sm font-sans focus-visible:ring-primary/30 rounded-xl p-4 leading-relaxed"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    disabled={loading}
                  />
                  <div className="absolute bottom-4 right-4">
                    <Button 
                      onClick={handleDiscover} 
                      disabled={loading || !problem.trim()}
                      className="rounded-full px-6 shadow-sm font-medium transition-all"
                    >
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                      Analyze
                    </Button>
                  </div>
                </div>
                
                {error && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
                    <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="font-mono text-xs">{error}</p>
                  </div>
                )}
              </section>

              {/* Problem Analysis Results */}
              {data?.problem_analysis && (
                <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">Extracted Requirements</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {(data.problem_analysis.requirements || []).map((req, idx) => {
                      const isMustHave = data.problem_analysis.must_have_requirements?.includes(req);
                      return (
                        <div key={idx} className="p-4 bg-background border border-border rounded-lg shadow-sm">
                          <div className="flex justify-between items-start gap-4">
                            <p className="text-sm leading-relaxed">{req}</p>
                            {isMustHave && (
                              <Badge variant="secondary" className="shrink-0 text-[10px] font-mono tracking-tight bg-primary/10 text-primary hover:bg-primary/10 border-primary/20">MUST HAVE</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {(data.problem_analysis.constraints?.length || 0) > 0 && (
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center gap-2 mb-4">
                        <HardDrive className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold tracking-tight text-foreground">Constraints</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(data.problem_analysis.constraints || []).map((c, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs font-medium border-border/80 bg-background py-1.5 px-3">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Discovery & Evidence */}
        <div className="w-full lg:w-[55%] bg-background flex flex-col relative">
          {!data && !loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <Box className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Enter a problem to begin the discovery pipeline.</p>
            </div>
          ) : loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin opacity-50" />
              <div className="text-sm font-mono text-muted-foreground animate-pulse">Running retrieval and LLM evaluation...</div>
            </div>
          ) : data ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                
                {/* Viable Solution Paths */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-medium tracking-tight">Viable Solution Paths</h2>
                    <Badge 
                      variant="outline" 
                      className={`font-mono font-medium border ${
                        data.status === 'VALID_PATHS_FOUND' ? 'bg-primary/10 text-primary border-primary/30' : 
                        data.status === 'PARTIAL_COVERAGE' ? 'bg-accent/10 text-accent border-accent/30' : 
                        'bg-destructive/10 text-destructive border-destructive/30'
                      }`}
                    >
                      {data.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {(data.solution_paths?.length || 0) === 0 ? (
                    <div className="p-6 border border-dashed border-border rounded-xl text-center">
                      <p className="text-sm text-muted-foreground font-mono">No viable solution paths could be constructed.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(data.solution_paths || []).map((path, idx) => (
                        <Card key={idx} className="border-border/60 shadow-sm overflow-hidden">
                          <CardHeader className="bg-muted/10 border-b border-border/40 p-3.5">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              Path {idx + 1}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="p-5 border-b border-border/40">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-medium text-foreground flex items-center gap-2">
                                  {(path.solutions || []).join(" + ")}
                                </h4>
                                {path.compatibility && path.compatibility !== 'N/A' && (
                                  <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
                                    {path.compatibility}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="space-y-4">
                                {/* Evidence Section */}
                                {(path.evidence?.length || 0) > 0 && (
                                  <div>
                                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
                                      <FileText className="w-4 h-4" /> <span className="font-semibold tracking-tight text-foreground text-[13px]">Capabilities & Evidence</span>
                                    </div>
                                    <div className="space-y-2">
                                      {(path.evidence || []).map((ev, i) => (
                                        <div key={i} className="bg-muted/40 border border-border/50 rounded-md p-3">
                                          <div className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                                            <span className="text-primary font-semibold">{ev.entity}</span> 
                                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span>{ev.capability}</span>
                                          </div>
                                          <div className="text-[13px] text-muted-foreground bg-background rounded-md border border-border/40 p-3 mt-1.5 overflow-x-auto">
                                            <div className="prose prose-sm prose-slate max-w-none font-mono dark:prose-invert prose-p:my-1 prose-p:leading-normal prose-pre:my-1 prose-pre:bg-muted/50 prose-pre:text-foreground prose-table:my-2 prose-table:border-collapse prose-th:border prose-th:border-border prose-td:border prose-td:border-border prose-th:p-2 prose-td:p-2">
                                              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                                {ev.evidence}
                                              </ReactMarkdown>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Constraints Section */}
                                {(path.constraints_states?.length || 0) > 0 && (
                                  <div>
                                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
                                      <HardDrive className="w-4 h-4" /> <span className="font-semibold tracking-tight text-foreground text-[13px]">Deterministic Constraints</span>
                                    </div>
                                    <div className="space-y-2">
                                      {(path.constraints_states || []).map((ce, i) => (
                                        <div key={i} className={`flex items-start justify-between border rounded-md p-3 ${ce.status === 'SATISFIED' ? 'bg-primary/5 border-primary/20' : ce.status === 'VIOLATED' ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/30 border-border/50'}`}>
                                          <div className="flex items-center gap-2.5">
                                            {ce.status === 'SATISFIED' ? (
                                              <CheckCircle2 className="w-4 h-4 text-primary" />
                                            ) : ce.status === 'VIOLATED' ? (
                                              <XCircle className="w-4 h-4 text-destructive" />
                                            ) : (
                                              <div className="w-4 h-4 rounded-full bg-muted-foreground/30 flex shrink-0" />
                                            )}
                                            <span className="font-mono text-[13px] leading-tight text-foreground">{ce.constraint}</span>
                                          </div>
                                          <Badge variant="outline" className={`ml-4 shrink-0 text-[10px] font-mono tracking-wider uppercase ${ce.status === 'SATISFIED' ? 'text-primary border-primary/30' : ce.status === 'VIOLATED' ? 'text-destructive border-destructive/30' : 'text-muted-foreground border-border/50'}`}>
                                            {ce.status}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Path Warnings */}
                            {(path.requirements_missing?.length || 0) > 0 && (
                              <div className="bg-accent/5 p-4 border-t border-accent/20">
                                <div className="mb-2">
                                  <span className="text-xs font-semibold text-accent/80 uppercase tracking-wider block mb-1">Missing Requirements</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(path.requirements_missing || []).map(req => (
                                      <span key={req} className="text-[10px] font-mono bg-background border border-border px-2 py-1 rounded">{req}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
