import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search } from "lucide-react";

export default function HomePage() {
  const [demoStep, setDemoStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDemoStep((prev) => (prev < 4 ? prev + 1 : 4));
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col animate-in fade-in duration-700 font-sans">
      {/* Hero Section */}
      <section className="py-24 md:py-32 w-full border-b border-border bg-background relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: '150ms' }}>
               <span className="w-8 h-[1px] bg-strong-border"></span>
               <span className="text-[11px] font-mono font-bold tracking-[0.15em] text-secondary-ink uppercase">Analytical Software Discovery</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight text-primary-ink leading-[1.1] animate-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: '250ms' }}>
              Find software by the capabilities your problem actually requires.
            </h1>
            <p className="text-lg text-secondary-ink leading-relaxed max-w-2xl font-medium animate-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: '350ms' }}>
              NexusBase decomposes a technical problem into requirements,
              discovers relevant software capabilities, verifies evidence,
              checks constraints, and constructs solution paths.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-4 animate-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: '450ms' }}>
              <Link to="/discover">
                <Button size="lg" className="rounded-none bg-primary-ink text-surface hover:bg-primary-ink/90 px-8 h-12 text-[15px] font-bold transition-all group">
                  Start a Discovery <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="ghost" size="lg" className="rounded-none text-secondary-ink hover:text-primary-ink px-8 h-12 text-[15px] font-bold transition-colors">
                  See How It Works
                </Button>
              </a>
            </div>
          </div>
          
          {/* Technical Diagram UI */}
          <div className="flex-1 w-full max-w-md hidden lg:flex flex-col select-none border border-strong-border bg-surface shadow-sm overflow-hidden animate-in fade-in duration-1000 fill-mode-both" style={{ animationDelay: '300ms' }}>
            <div className="p-6 border-b border-border bg-muted-surface relative">
              <div className="absolute top-0 right-0 p-4">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-surface border border-border text-secondary-ink px-2 py-1">Live Demo</span>
              </div>
              <div className="text-[11px] font-mono font-semibold text-secondary-ink uppercase tracking-widest mb-3 flex items-center gap-2">
                <Search className="w-3.5 h-3.5" /> Problem Query
              </div>
              <div className="text-base font-semibold leading-relaxed text-primary-ink">
                "I need to convert PDF files into Markdown locally."
              </div>
            </div>
            
            <div className="p-0 bg-surface">
              <div className="px-6 py-6 space-y-5">
                
                {/* Stage 1: Requirements */}
                <div className={`transition-all duration-500 transform ${demoStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                   <div className="text-[10px] font-mono font-semibold tracking-widest uppercase text-secondary-ink mb-2">Requirements</div>
                   <div className="flex items-center gap-3">
                     <span className="text-xs font-medium text-primary-ink bg-muted-surface px-2 py-1 border border-border">PDF → Markdown</span>
                     <span className="text-xs font-medium text-primary-ink bg-muted-surface px-2 py-1 border border-border">Local execution</span>
                   </div>
                </div>

                {/* Stage 2: Discovery */}
                <div className={`transition-all duration-500 transform ${demoStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                   <div className="text-[10px] font-mono font-semibold tracking-widest uppercase text-secondary-ink mb-2">Discovery</div>
                   <div className="text-xs font-medium text-primary-ink flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 7 candidates evaluated
                   </div>
                </div>

                {/* Stage 3: Verification */}
                <div className={`transition-all duration-500 transform ${demoStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                   <div className="text-[10px] font-mono font-semibold tracking-widest uppercase text-secondary-ink mb-2">Verification</div>
                   <div className="flex flex-col gap-2">
                     <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-muted-text">web_pdf_converter</span>
                        <span className="text-violated font-mono text-[10px] uppercase tracking-widest">Violated</span>
                     </div>
                     <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-primary-ink">pymupdf4llm</span>
                        <span className="text-verified font-mono text-[10px] uppercase tracking-widest">Satisfied</span>
                     </div>
                   </div>
                </div>

                {/* Stage 4: Paths */}
                <div className={`transition-all duration-500 transform border-t border-border pt-4 mt-2 ${demoStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                   <div className="text-[10px] font-mono font-semibold tracking-widest uppercase text-secondary-ink mb-1">Solution Paths</div>
                   <div className="text-xl font-semibold text-primary-ink">2 viable paths found</div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Analytical Pipeline (Demoing actual product concepts) */}
      <section id="how-it-works" className="py-24 w-full border-b border-border bg-surface">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8">
          <div className="flex flex-col gap-6 max-w-3xl mb-16">
             <div className="text-[11px] font-mono font-semibold tracking-[0.15em] text-secondary-ink uppercase flex items-center gap-3">
               <span className="w-8 h-[1px] bg-strong-border"></span>
               How it works
             </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary-ink">An analytical approach to software discovery.</h2>
            <p className="text-secondary-ink text-lg leading-relaxed font-medium">A strict pipeline that eliminates hallucination and relies on source-backed technical evidence.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-0 border border-strong-border bg-surface">
             <PipelineStage 
               step="01" 
               title="PROBLEM" 
               desc="&quot;I need to convert PDFs locally.&quot;" 
             />
             <PipelineStage 
               step="02" 
               title="REQUIREMENTS" 
               desc="PDF → Markdown, Local execution" 
             />
             <PipelineStage 
               step="03" 
               title="CAPABILITIES" 
               desc="cap_pdf_to_markdown" 
             />
             <PipelineStage 
               step="04" 
               title="CONSTRAINTS" 
               desc="OFFLINE ✓ SATISFIED" 
             />
             <PipelineStage 
               step="05" 
               title="PATHS" 
               desc="2 viable paths constructed" 
             />
          </div>
        </div>
      </section>

      {/* From Problem To Decision - Transformation Section */}
      <section className="py-32 w-full border-b border-border bg-background">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8">
          <div className="text-center mb-20 space-y-6">
             <div className="text-[11px] font-mono font-semibold tracking-[0.15em] text-secondary-ink uppercase inline-flex items-center gap-3">
               <span className="w-8 h-[1px] bg-strong-border"></span>
               Transformation
               <span className="w-8 h-[1px] bg-strong-border"></span>
             </div>
             <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary-ink">From Problem To Decision</h2>
          </div>

          <div className="flex flex-col items-center max-w-2xl mx-auto space-y-8 relative">
            {/* Connection Line */}
            <div className="absolute left-1/2 top-8 bottom-8 w-px bg-strong-border -translate-x-1/2 z-0 hidden md:block"></div>

            {/* Step 1 */}
            <div className="bg-surface border border-border p-6 w-full max-w-md relative z-10 text-center">
              <div className="text-[10px] font-mono font-semibold tracking-widest text-secondary-ink uppercase mb-3">User Problem</div>
              <div className="text-sm font-semibold text-primary-ink">"I need to convert PDF files into Markdown locally."</div>
            </div>

            {/* Step 2 */}
            <div className="bg-surface border border-border p-6 w-full max-w-md relative z-10 text-center">
              <div className="text-[10px] font-mono font-semibold tracking-widest text-secondary-ink uppercase mb-3">Extracted Requirements</div>
              <div className="flex items-center justify-center gap-4 text-sm font-medium text-primary-ink">
                <span className="bg-muted-surface px-3 py-1 border border-border">PDF → Markdown</span>
                <span className="bg-muted-surface px-3 py-1 border border-border">Local execution</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-surface border border-border p-6 w-full max-w-md relative z-10 text-center">
              <div className="text-[10px] font-mono font-semibold tracking-widest text-secondary-ink uppercase mb-3">Discovered</div>
              <div className="text-sm font-medium text-secondary-ink space-x-3">
                <span>Web Application</span>
                <span className="text-strong-border">|</span>
                <span>Local Library</span>
                <span className="text-strong-border">|</span>
                <span>Desktop Tool</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-surface border border-border p-6 w-full max-w-md relative z-10 text-center">
              <div className="text-[10px] font-mono font-semibold tracking-widest text-secondary-ink uppercase mb-3">Verified</div>
              <div className="text-sm font-medium text-secondary-ink space-x-4">
                <span>Capabilities</span>
                <span className="text-strong-border">•</span>
                <span>Evidence</span>
                <span className="text-strong-border">•</span>
                <span>Constraints</span>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-surface border border-primary-ink p-8 w-full max-w-md relative z-10 text-center shadow-sm">
              <div className="text-[10px] font-mono font-semibold tracking-widest text-secondary-ink uppercase mb-3">Decision</div>
              <div className="text-2xl font-bold text-primary-ink mb-1">2 viable paths</div>
              <div className="text-xs font-mono text-muted-text">1 rejected alternative</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 w-full text-center flex flex-col items-center bg-surface">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary-ink mb-10">Ready to find the right tool?</h2>
        <Link to="/discover">
          <Button size="lg" className="rounded-none bg-primary-ink text-surface hover:bg-primary-ink/90 px-10 h-14 text-base font-bold shadow-none transition-all group">
            Start a Discovery <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </section>
    </div>
  );
}

function PipelineStage({ step, title, desc }: { step: string, title: string, desc: string }) {
  return (
    <div className="p-8 flex flex-col gap-5 border-b md:border-b-0 md:border-r border-strong-border last:border-0 bg-surface">
      <div className="font-mono text-[11px] font-semibold text-secondary-ink uppercase tracking-widest">{step}</div>
      <div>
        <h3 className="text-sm font-bold tracking-tight mb-2 text-primary-ink">{title}</h3>
        <p className="text-sm font-medium text-secondary-ink leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
