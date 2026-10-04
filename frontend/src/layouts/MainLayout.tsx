import { Link, Outlet, useLocation } from "react-router-dom";

export default function MainLayout() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-surface sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto w-full px-6 md:px-8 h-[72px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <h1 className="font-semibold text-lg tracking-tight text-primary-ink">NexusBase</h1>
            <span className="text-[10px] font-mono font-medium bg-muted-surface text-secondary-ink px-2 py-0.5 rounded">v2.0</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-primary-ink' : 'text-muted-text hover:text-primary-ink'}`}>Home</Link>
            <Link to="/discover" className={`text-sm font-medium transition-colors ${location.pathname.startsWith('/discover') ? 'text-primary-ink' : 'text-muted-text hover:text-primary-ink'}`}>Discover</Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full">
        <Outlet />
      </main>

      {/* Compact Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="max-w-[1200px] mx-auto w-full px-6 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-start gap-1">
            <span className="text-sm font-semibold text-primary-ink">NexusBase</span>
            <span className="text-xs text-muted-text">Analytical Software Discovery Engine</span>
          </div>
          <div className="text-[10px] text-secondary-ink font-mono tracking-[0.2em] uppercase">
            EVIDENCE-BACKED <span className="text-border mx-2">/</span> DETERMINISTIC <span className="text-border mx-2">/</span> LOCAL
          </div>
        </div>
      </footer>
    </div>
  );
}
