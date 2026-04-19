import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp, Plus, Box, Cpu, Zap, MapPin } from "lucide-react";
import Link from "next/link";
import PublicNewsWidget from "@/components/public-news-widget";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const params = await searchParams;
  const region = params.region || "Toutes";
  return (
    <main className="flex min-h-screen flex-col items-center relative overflow-x-hidden">
      
      {/* Background : Lovable-style Mesh Gradient with Cezigue Colors */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-white dark:bg-background">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-70 animate-pulse duration-1000"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/20 blur-[150px] mix-blend-multiply dark:mix-blend-screen opacity-70"></div>
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-orange-400/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
      </div>

      {/* Optional: Public News Widget can float or remain at top if necessary */}
      <div className="absolute top-0 right-0 z-50">
         {/* Commented out or placed discreetly if it conflicts with the pure design, but keeping it per functionality */}
      </div>

      {/* Header : Clean, Lovable style */}
      <nav className="w-full flex items-center justify-between px-6 py-4 z-20">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="Logo Pieuvre Cezigue" 
            className="h-8 w-8 object-contain" 
          />
          <span className="text-xl font-bold tracking-tight text-foreground">
            Cezigue
          </span>
        </div>
        
        <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground hidden md:flex">
          <Link href="/news" className="hover:text-indigo-600 cursor-pointer transition-colors flex items-center gap-1 font-bold text-foreground">
             Veille & Stratégie
          </Link>
          <span className="hover:text-foreground cursor-pointer transition-colors">Flottes Utilitaires</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Taxis & Transports</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Collectivités</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/services" className="hidden sm:block">
             <Button variant="outline" className="rounded-full font-semibold px-5 shadow-sm border-neutral-200">
                <MapPin className="w-4 h-4 mr-2 text-indigo-500" />
                Tester le Hub
             </Button>
          </Link>
          <Link href="/login" className="text-sm font-medium hover:text-foreground/80 hidden sm:block">
            Se connecter
          </Link>
          <Link href="/login">
            <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold px-5 shadow-sm">
              Accès QG
            </Button>
          </Link>
        </div>
      </nav>

      <div className="w-full max-w-full">
         <PublicNewsWidget region={region} />
      </div>

      {/* Hero Section : Clean and Bold */}
      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-5xl pt-24 px-4 z-10 text-center">
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight max-w-4xl">
          Ne perdez plus votre temps à coordonner vos véhicules.
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 font-medium">
          Dites-nous ce qui coince au quotidien (ZFE, plannings, bornes en panne). Nous vous assemblons la solution exacte.
        </p>

        {/* PROMPT BOX : Lovable Style */}
        <div className="w-full max-w-3xl relative group mb-24">
          <div className="relative flex flex-col md:flex-row items-center bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 p-2 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.04)] gap-2">
            
            <div className="pl-4 text-muted-foreground/50">
              <Plus className="w-5 h-5" />
            </div>

            <Input 
              className="flex-1 border-0 bg-transparent text-base md:text-lg h-14 focus-visible:ring-0 shadow-none text-foreground placeholder:text-muted-foreground/60"
              placeholder="Ex : J'ai 15 camionnettes à Toulouse, comment éviter les amendes ZFE ?"
            />
            
            <Button size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-foreground hover:bg-foreground/80 text-background shrink-0 shadow-md transition-transform active:scale-95 mr-1">
              <ArrowUp className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          </div>
        </div>

        {/* Bottom Feature Cards - Retained per user request */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 mb-24 w-full">
          {[
            { 
              target: "Suivi Artisans & PME", 
              tag: "NouNou", 
              icon: <Cpu className="w-5 h-5" />, 
              desc: "Fini les carnets de bord illisibles et les vidanges zappées. Suivez vos camionnettes, anticipez l'entretien et baissez la facture de carburant." 
            },
            { 
              target: "Réseau Local", 
              tag: "MirePOI", 
              icon: <Zap className="w-5 h-5" />, 
              desc: "Trouvez les bornes qui marchent vraiment et qui acceptent vos utilitaires. Plus d'employé bloqué avec une carte refusée sur l'autoroute." 
            },
            { 
              target: "Organisation Quotidienne", 
              tag: "Majordome", 
              icon: <Box className="w-5 h-5" />, 
              desc: "Gérez le planning de vos véhicules partagés sans utiliser WhatsApp ou Excel. Un collaborateur réserve son créneau, vous suivez tout." 
            },
          ].map((app, i) => (
            <div key={i} className="relative bg-white/50 dark:bg-black/20 backdrop-blur-md border border-black/5 dark:border-white/5 p-6 text-left rounded-3xl hover:bg-white/80 dark:hover:bg-black/40 transition-colors shadow-sm flex flex-col gap-3 group">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 bg-background rounded-full text-foreground shadow-sm">
                  {app.icon}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-foreground">{app.tag}</h3>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{app.target}</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                {app.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
