import { ShieldCheck, Rocket, Zap, Box, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      
      {/* Sidebar / Menu de Commandement */}
      <aside className="w-64 border-r border-muted/50 bg-[#150f09] flex flex-col justify-between hidden md:flex relative overflow-hidden">
        
        {/* Subtle Glow */}
        <div className="absolute top-0 left-0 w-full h-32 bg-primary/5 blur-xl pointer-events-none"></div>

        <div className="p-6 relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <img src="/logo.png" alt="Cezigue" className="h-8 w-8 drop-shadow-[0_0_5px_var(--color-primary)]" />
            <span className="text-xl font-black text-foreground">BUNKER</span>
          </div>
          
          <nav className="flex flex-col gap-2">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2 pl-2">Opérations</div>
            <a href="/admin" className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 text-primary font-bold border border-primary/20">
              <ShieldCheck className="h-5 w-5" />
              Vue Globale
            </a>
            <a href="#" className="flex items-center gap-3 p-3 rounded-xl text-muted-foreground hover:bg-card hover:text-foreground font-semibold transition-colors">
              <Cpu className="h-5 w-5" />
              Flotte NouNou
            </a>
            <a href="#" className="flex items-center gap-3 p-3 rounded-xl text-muted-foreground hover:bg-card hover:text-foreground font-semibold transition-colors">
              <Zap className="h-5 w-5" />
              Réseau MirePOI
            </a>
          </nav>
        </div>

        <div className="p-6 relative z-10">
          <button className="flex items-center gap-3 text-muted-foreground hover:text-destructive font-bold transition-colors w-full p-2">
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 lg:p-12 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

// Icon non importé dans le scope du test, on triche :
const Cpu = (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>;
