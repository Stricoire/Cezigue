import { ComicBoard } from '@/components/ComicBoard';
import Link from 'next/link';
import { Activity } from "lucide-react";

const b2cPanels = [
  {
    imageSrc: "/b2c/b2c_hub_problem.png",
    alt: "Mobilité Complexe",
    caption: "Carburant cher, événements dispersés, transports imprévisibles."
  },
  {
    imageSrc: "/b2c/b2c_hub_solution.png",
    alt: "Le Hub Central",
    caption: "Cezigue aggrège toutes vos données locales en temps réel."
  },
  {
    imageSrc: "/b2c/b2c_hub_benefit.png",
    alt: "Mobilité Sereine",
    caption: "Vous naviguez intelligemment, économisez et profitez de votre territoire."
  }
];

export default function ServicesPage() {
  return (
    <main className="flex min-h-screen flex-col items-center relative bg-background w-full">
      {/* Background Pro & Pur (Cezigue) */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-background">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/5 to-transparent"></div>
      </div>

      <nav className="w-full flex items-center justify-between px-4 md:px-8 py-4 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl sticky top-0 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo Cezigue" className="h-7 w-7 object-contain drop-shadow-[0_0_4px_var(--color-primary)]" />
          <Link href="/" className="text-xl font-black tracking-tight text-foreground">Cezigue</Link>
        </div>
        
        <div className="flex items-center gap-8 text-sm font-bold text-muted-foreground hidden md:flex">
          <Link href="/news" className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Le Flux
          </Link>
          <Link href="/studio" className="hover:text-foreground cursor-pointer transition-colors">Startup Studio</Link>
          <span className="hover:text-foreground cursor-pointer transition-colors px-3 py-1.5 bg-muted text-foreground rounded-full border border-border/50">Flottes Pro</span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-bold hover:text-foreground/80 hidden sm:block">
            S'identifier
          </Link>
          <Link href="/login" className="rounded-full font-black px-6 py-2 shadow-md bg-foreground text-background hover:bg-foreground/90 transition-all">
            Accès Gratuit
          </Link>
        </div>
      </nav>

      <div className="w-full relative">
        <ComicBoard 
          title="Vos Micro-Services Locaux" 
          subtitle="Une suite d'outils gratuits pour simplifier votre quotidien péri-urbain." 
          panels={b2cPanels}
          ctaText="Activer mon Hub (Gratuit)"
          ctaHref="/login"
        />
      </div>

      <section className="py-24 px-4 bg-background w-full relative z-10 border-t border-border/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-foreground mb-12 text-center">Inclus dans le Hub Gratuit</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-card rounded-2xl shadow-sm border border-border/40 hover:border-border transition-colors">
              <h3 className="text-xl font-bold text-foreground mb-4">Radar Carburant</h3>
              <p className="text-muted-foreground">Visualisez les stations-services les moins chères autour de vous en temps réel. Mise à jour instantanée.</p>
            </div>
            
            <div className="p-8 bg-card rounded-2xl shadow-sm border border-border/40 hover:border-border transition-colors">
              <h3 className="text-xl font-bold text-foreground mb-4">Agenda DATAtourisme</h3>
              <p className="text-muted-foreground">Ne ratez plus aucun événement local. Marchés, brocantes, et festivités synchronisés avec votre mairie.</p>
            </div>
            
            <div className="p-8 bg-card rounded-2xl shadow-sm border border-border/40 hover:border-border transition-colors">
              <h3 className="text-xl font-bold text-foreground mb-4">Multimodalité</h3>
              <p className="text-muted-foreground">Horaires de bus, trains et disponibilité des vélos en libre-service unifiés sur une seule carte.</p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link href="/login" className="inline-block bg-emerald-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:bg-emerald-600 transition-colors">
            Activer mon radar gratuit
          </Link>
        </div>
      </section>
    </main>
  );
}
