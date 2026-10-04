import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Search, ChevronRight, HardDrive, ShieldCheck, Zap, XCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col animate-in fade-in duration-700 font-sans">
      {/* Hero Section */}
      <section className="py-24 w-full border-b border-border bg-background relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-3">
               <span className="w-8 h-[1px] bg-strong-border"></span>
               <span className="text-xs font-mono font-medium tracking-[0.1em] text-secondary-ink uppercase">Analytical Software Discovery</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-medium tracking-tight text-primary-ink leading-[1.1]">
              Find software by the capabilities your problem actually requires.
            </h1>
            <p className="text-lg text-secondary-ink leading-relaxed max-w-2xl font-medium">
              NexusBase decomposes a technical problem into requirements,
              discovers relevant software capabilities, verifies evidence,
              checks constraints, and constructs solution paths.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link to="/discover">
                <Button size="lg" className="rounded-none bg-primary-ink text-surface hover:bg-primary-ink/90 px-8 h-12 text-base font-semibold transition-all">
                  Start a Discovery <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="ghost" size="lg" className="rounded-none text-secondary-ink hover:text-primary-ink px-8 h-12 text-base font-semibold">
                  See How It Works
                </Button>
              </a>
            </div>
          </div>
          
          {/* Technical Diagram UI */}
          <div className="flex-1 w-full max-w-md hidden lg:flex flex-col select-none border border-strong-border bg-surface shadow-sm overflow-hidden animate-in slide-in-from-right-8 duration-700 delay-150 fill-mode-both">
            <div className="p-6 border-b border-border bg-muted-surface relative">
              <div className="absolute top-0 right-0 p-4">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-surface border border-border text-secondary-ink px-2 py-1">Live Example</span>
              </div>
              <div className="text-[11px] font-mono text-secondary-ink uppercase tracking-widest mb-3 flex items-center gap-2">
                <Search className="w-3.5 h-3.5" /> Problem Query
              </div>
              <div className="text-base font-medium leading-relaxed text-primary-ink">
                "I need to convert PDF files into Markdown locally."
              </div>
            </div>
            
            <div className="p-0">
              <div className="text-[11px] font-mono font-semibold tracking-widest uppercase text-secondary-ink px-6 pt-6 pb-4">Discovered Modalities</div>
              
              <div className="space-y-0 pb-4">
                {/* PATH 01 */}
                <div className="px-6 py-4 transition-colors hover:bg-muted-surface group flex flex-col gap-2 border-l-2 border-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <span className="text-[11px] font-mono text-muted-text tracking-wider">PATH 01</span>
                       <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-secondary-ink">Web Application</span>
                    </div>
                    <XCircle className="w-4 h-4 text-destructive opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-semibold text-primary-ink">Web PDF Converter</span>
                    <span className="text-xs text-destructive font-mono">✕ Local constraint violated</span>
                  </div>
                </div>

                <div className="mx-6 h-px bg-border" />

                {/* PATH 02 */}
                <div className="px-6 py-4 transition-colors hover:bg-muted-surface group flex flex-col gap-2 border-l-2 border-primary bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <span className="text-[11px] font-mono text-primary/70 tracking-wider">PATH 02</span>
                       <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-primary">Local Library</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-semibold text-primary-ink">PyMuPDF4LLM</span>
                    <span className="text-xs text-primary font-mono">✓ Valid</span>
                  </div>
                </div>

                <div className="mx-6 h-px bg-border" />

                {/* PATH 03 */}
                <div className="px-6 py-4 transition-colors hover:bg-muted-surface group flex flex-col gap-2 border-l-2 border-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <span className="text-[11px] font-mono text-muted-text tracking-wider">PATH 03</span>
                       <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-secondary-ink">Desktop App</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-secondary-ink opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-semibold text-primary-ink">MinerU</span>
                    <span className="text-xs text-secondary-ink font-mono">✓ Valid</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Analytical Pipeline */}
      <section id="how-it-works" className="py-24 w-full border-b border-border bg-surface">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8">
          <div className="flex flex-col gap-6 max-w-3xl mb-16">
             <div className="text-[11px] font-mono font-semibold tracking-widest text-secondary-ink uppercase flex items-center gap-3">
               <span className="w-8 h-[1px] bg-strong-border"></span>
               How it works
             </div>
            <h2 className="text-3xl font-semibold tracking-tight text-primary-ink">An analytical approach to software discovery.</h2>
            <p className="text-secondary-ink text-lg leading-relaxed font-medium">A strict pipeline that eliminates hallucination and relies on source-backed technical evidence.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-0 border border-strong-border bg-surface">
             <PipelineStage 
               step="01" 
               icon={<Search className="w-5 h-5" />} 
               title="Problem" 
               desc="Describe the technical task." 
               delay={0}
             />
             <PipelineStage 
               step="02" 
               icon={<ShieldCheck className="w-5 h-5" />} 
               title="Requirements" 
               desc="Extract functional and operational needs." 
               delay={100}
             />
             <PipelineStage 
               step="03" 
               icon={<Zap className="w-5 h-5" />} 
               title="Capabilities" 
               desc="Match requirements to atomic software capabilities." 
               delay={200}
             />
             <PipelineStage 
               step="04" 
               icon={<HardDrive className="w-5 h-5" />} 
               title="Constraints" 
               desc="Verify hard requirements deterministically." 
               delay={300}
             />
             <PipelineStage 
               step="05" 
               icon={<CheckCircle2 className="w-5 h-5" />} 
               title="Paths" 
               desc="Construct viable solution approaches." 
               delay={400}
             />
          </div>
        </div>
      </section>

      {/* Trust & Evidence */}
      <section className="py-24 w-full border-b border-border bg-background">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="text-[11px] font-mono font-semibold tracking-widest text-secondary-ink uppercase flex items-center gap-3">
                 <span className="w-8 h-[1px] bg-strong-border"></span>
                 Verification
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-primary-ink">Generated reasoning vs. Source-backed evidence.</h2>
              <p className="text-lg text-secondary-ink leading-relaxed font-medium">
                Most AI assistants simply output a generated recommendation. NexusBase separates the reasoning from the facts. It links every requirement to a specific software capability, which is then backed by verbatim technical evidence.
              </p>
              <p className="text-lg text-secondary-ink leading-relaxed font-medium">
                If a constraint cannot be verified by evidence, it is marked as UNKNOWN, failing the solution path gracefully.
              </p>
            </div>
            
            {/* Example Evidence Block */}
            <div className="bg-surface border border-strong-border p-8 hover:border-primary-ink transition-colors">
              <div className="text-[11px] font-mono font-semibold text-secondary-ink uppercase tracking-widest mb-6 flex items-center gap-2">
                <span>PyMuPDF4LLM</span>
                <ChevronRight className="w-3.5 h-3.5 text-border" />
                <span className="text-primary-ink">PDF to Markdown conversion</span>
              </div>
              
              <div className="text-xs text-muted-text bg-muted-surface border border-border p-5 font-mono leading-relaxed mb-8">
                <div className="text-muted-text/70 mb-4"># Source-backed evidence</div>
                md = pymupdf4llm.to_markdown(<br/>
                &nbsp;&nbsp;"document.pdf",<br/>
                &nbsp;&nbsp;write_images=True<br/>
                )
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="text-[11px] font-mono font-semibold tracking-widest uppercase text-secondary-ink mb-2">Constraint Verification</div>
                <div className="flex items-center justify-between border border-border p-4 bg-surface">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-verified" />
                    <span className="font-mono text-xs font-semibold text-primary-ink">Local execution without internet dependency</span>
                  </div>
                  <span className="shrink-0 text-[10px] font-mono tracking-widest uppercase text-verified ml-4">
                    SATISFIED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 w-full text-center flex flex-col items-center bg-surface">
        <h2 className="text-3xl font-semibold tracking-tight text-primary-ink mb-8">Ready to find the right tool?</h2>
        <Link to="/discover">
          <Button size="lg" className="rounded-none bg-primary-ink text-surface hover:bg-primary-ink/90 px-10 h-14 text-base font-semibold shadow-none transition-all group">
            Start a Discovery <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </section>
    </div>
  );
}

function PipelineStage({ step, icon, title, desc, delay }: { step: string, icon: React.ReactNode, title: string, desc: string, delay: number }) {
  return (
    <div 
      className="p-8 flex flex-col gap-5 border-b md:border-b-0 md:border-r border-strong-border last:border-0 hover:bg-muted-surface transition-colors group cursor-default"
      style={{ animationFillMode: "both", animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between text-secondary-ink group-hover:text-primary transition-colors">
        {icon}
        <span className="font-mono text-xs font-semibold opacity-50 group-hover:opacity-100 transition-opacity">{step}</span>
      </div>
      <div>
        <h3 className="text-lg font-semibold tracking-tight mb-2 text-primary-ink group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm font-medium text-secondary-ink leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
