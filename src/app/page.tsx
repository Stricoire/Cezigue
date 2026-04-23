import { Button } from "@/components/ui/button";
import { ArrowRight, Fuel, CalendarDays, Cog, Activity, Lightbulb, Compass } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import PublicNewsWidget from "@/components/public-news-widget";
import InteractiveHubStore from "@/components/InteractiveHubStore";
import NewsTicker from "@/components/NewsTicker";
import MicroServicesCarousel from "@/components/MicroServicesCarousel";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const params = await searchParams;
  const region = params.region || "Toutes";
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <main className="flex min-h-screen flex-col items-center relative overflow-x-hidden bg-background">
      
      {/* Background Pro & Pur (Cezigue) */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-background">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/5 to-transparent"></div>
      </div>

      {/* Header */}
      <nav className="w-full flex items-center justify-between px-4 md:px-8 py-4 z-20 border-b border-border/40 bg-background/70 backdrop-blur-xl sticky top-0 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo Cezigue" className="h-7 w-7 object-contain drop-shadow-[0_0_4px_var(--color-primary)]" />
          <span className="text-xl font-black tracking-tight text-foreground">Cezigue</span>
        </div>
        
        <div className="flex items-center gap-8 text-sm font-bold text-muted-foreground hidden md:flex">
          <Link href="/services" className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Les Micro-services
          </Link>
          <Link href="/products" className="hover:text-foreground cursor-pointer transition-colors">Les Offres Pro</Link>
          <Link href="/studio" className="hover:text-foreground cursor-pointer transition-colors">Le Startup Studio</Link>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <Link href="/services">
              <Button className="rounded-full tracking-wide font-black px-6 shadow-[0_4px_14px_0_rgba(20,20,20,0.39)] dark:shadow-[0_4px_14px_0_rgba(255,255,255,0.1)] bg-foreground text-background hover:bg-foreground/90 transition-all hover:scale-105">
                Mon Espace
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-bold hover:text-foreground/80 hidden sm:block">
                S'identifier
              </Link>
              <Link href="/login">
                <Button className="rounded-full tracking-wide font-black px-6 shadow-[0_4px_14px_0_rgba(20,20,20,0.39)] dark:shadow-[0_4px_14px_0_rgba(255,255,255,0.1)] bg-foreground text-background hover:bg-foreground/90 transition-all hover:scale-105">
                  Accès Gratuit
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Bandeau d'actualités en temps réel (Ticker) */}
      <NewsTicker />

      {/* Main Content Layout - Minimalist Hero */}
      <div className="w-full max-w-7xl px-4 pt-2 pb-6 md:pt-4 md:pb-10 z-10 flex flex-col gap-12">
        
        {/* SECTION 1 : Le Moteur de Recherche B2C (Interactive SPA) */}
        <InteractiveHubStore />

        {/* SECTION 2 : Présentation de l'Écosystème (Pédagogie Produit) */}
        <div className="w-full relative mt-4 border-t border-border/40 pt-10">
          <div className="mb-12 text-center max-w-2xl mx-auto">
             <h3 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                L'écosystème Cezigue
             </h3>
             <p className="text-muted-foreground mt-3 font-medium text-sm md:text-base">
               Un moteur unique qui propulse à la fois vos micro-services locaux gratuits et nos logiciels métiers de pointe. 
             </p>
          </div>
          
          <div className="flex flex-col gap-12 mb-16">
            
            {/* SOUS-SECTION A : B2C Micro-Services */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">1</span>
                <h4 className="text-xl font-bold text-foreground">Vos Micro-Services Locaux</h4>
                <Link href="/services/local" className="ml-auto text-sm font-bold text-primary hover:underline flex items-center gap-1">Voir les détails <ArrowRight className="w-4 h-4" /></Link>
              </div>
              <MicroServicesCarousel />
            </div>

            {/* SOUS-SECTION B : B2B Logiciels Métiers */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold">2</span>
                <h4 className="text-xl font-bold text-foreground">Nos Logiciels Professionnels</h4>
                <div className="h-px bg-border flex-1 ml-4 hidden sm:block"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Logiciel 1 : NouNou */}
                <Link href="/products/nounou" className="block bg-card border border-border/60 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-primary/50 group flex flex-col h-full overflow-hidden">
                  <div className="relative w-full h-40 bg-zinc-50 border-b border-border/40 overflow-hidden">
                     <Image src="/b2b/nounou_v2.png" alt="NouNou" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                     {/* Overlay Hover */}
                     <div className="absolute inset-0 bg-orange-600/95 backdrop-blur-sm flex flex-col justify-center p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                       <p className="text-white text-sm font-medium leading-relaxed text-center">
                         Supervision technique des véhicules en temps réel. Un atout indispensable pour les gestionnaires PME et les collectivités désirant maîtriser leurs coûts opérationnels.
                       </p>
                     </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">NouNou</h4>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                    <p className="text-sm font-semibold text-primary mb-3">Gestion de Flotte</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">Application de gestion de flotte en marque blanche pour un contrôle technique et opérationnel en temps réel.</p>
                  </div>
                </Link>

                {/* Logiciel 2 : MirePOI */}
                <Link href="/products/mirepoi" className="block bg-card border border-border/60 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-primary/50 group flex flex-col h-full overflow-hidden">
                  <div className="relative w-full h-40 bg-zinc-50 border-b border-border/40 overflow-hidden">
                     <Image src="/b2b/mirepoi_v2.png" alt="MirePOI" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                     {/* Overlay Hover */}
                     <div className="absolute inset-0 bg-orange-600/95 backdrop-blur-sm flex flex-col justify-center p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                       <p className="text-white text-sm font-medium leading-relaxed text-center">
                         Déploiement et cartographie experte des infrastructures locales (Bornes IRVE, parkings). Outil de gouvernance parfait pour les fédérations et l'aménagement territorial.
                       </p>
                     </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">MirePOI</h4>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                    <p className="text-sm font-semibold text-primary mb-3">Infrastructure & EV</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">Application experte de gestion de recharge, ravitaillement électrique (EV) et d'infrastructure territoriale.</p>
                  </div>
                </Link>

                {/* Logiciel 3 : Majordome */}
                <Link href="/products/majordome" className="block bg-card border border-border/60 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-primary/50 group flex flex-col h-full overflow-hidden">
                  <div className="relative w-full h-40 bg-zinc-50 border-b border-border/40 overflow-hidden">
                     <Image src="/b2b/majordome_v2.png" alt="Majordome" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                     {/* Overlay Hover */}
                     <div className="absolute inset-0 bg-orange-600/95 backdrop-blur-sm flex flex-col justify-center p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                       <p className="text-white text-sm font-medium leading-relaxed text-center">
                         Liaison temps réel entre la route et les utilisateurs. Spécialement taillé pour propulser l'efficacité des VTC, Artisans Taxis et acteurs du dernier kilomètre.
                       </p>
                     </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">Majordome</h4>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                    <p className="text-sm font-semibold text-primary mb-3">Dispatch & Opérations</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">Solution de dispatching à la demande facilitant la communication en temps réel entre le chauffeur et le passager.</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* SOUS-SECTION C : Ingénierie & Startup Studio */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold">3</span>
                <h4 className="text-xl font-bold text-foreground">Ingénierie & Startup Studio</h4>
                <div className="h-px bg-border flex-1 ml-4 hidden sm:block"></div>
              </div>
              
              <Link href="/studio" className="block bg-card border border-border/60 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-primary/50 group overflow-hidden">
                <div className="flex flex-col md:flex-row h-full">
                  <div className="relative w-full md:w-5/12 h-64 md:h-auto bg-muted overflow-hidden border-b md:border-b-0 md:border-r border-border/40">
                    <Image src="/b2b/startup_studio.png" alt="Startup Studio Cezigue" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    {/* Overlay Hover */}
                    <div className="absolute inset-0 bg-orange-600/95 backdrop-blur-sm flex flex-col justify-center p-8 md:p-12 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                      <h5 className="text-white font-black text-xl mb-3">Le Startup Studio Cezigue</h5>
                      <p className="text-orange-50 text-sm font-medium leading-relaxed mb-3">
                        Destiné aux forces vives du territoire (élus, citoyens) et aux entrepreneurs volontaires pour transformer leurs idées en solutions concrètes de mobilité.
                      </p>
                      <p className="text-orange-50 text-sm font-medium leading-relaxed">
                        Avec l'appui de nos partenaires, nous bâtissons plus que la technique : nous vous accompagnons de la création à la gestion opérationnelle et administrative, incluant un coaching dédié pour lancer votre entreprise.
                      </p>
                    </div>
                  </div>
                  <div className="p-8 md:w-7/12 flex flex-col justify-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-4 border border-purple-200">
                      <Lightbulb className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-sm font-semibold text-primary mb-2 tracking-wide uppercase">Startup Studio de Cezigue</p>
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="font-black text-2xl text-foreground group-hover:text-primary transition-colors">La Fabrique à Projets Locaux</h4>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-2" />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-3">Devenez acteur de votre mobilité (et vivez-en !)</p>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      Le Startup Studio de Cezigue est conçu pour vous permettre de devenir vous-mêmes les acteurs du changement. Nous vous accompagnons de A à Z dans la création de votre solution et de votre entreprise, afin d'améliorer ensemble, durablement, la mobilité de nos territoires.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="px-3 py-1 bg-background border border-border rounded-full text-foreground">Création MVP</span>
                      <span className="px-3 py-1 bg-background border border-border rounded-full text-foreground">Prototypage POC</span>
                      <span className="px-3 py-1 bg-background border border-border rounded-full text-foreground">Ingénierie B2B/B2G</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

          </div>
        </div>

        {/* SECTION 3 : L'Essentiel de l'Actualité (Below the fold) */}
        <div className="w-full relative mt-4 pt-10 border-t border-border/40">
          <div className="flex flex-col items-center justify-center mb-6 text-center">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border shadow-sm text-muted-foreground rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                En Direct
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
             </div>
             <h3 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                Vos actualités de mobilité
             </h3>
          </div>
          
          <div className="w-full max-w-5xl mx-auto min-h-[600px] mb-12">
             <PublicNewsWidget region={region} />
          </div>
        </div>

      </div>
    </main>
  );
}
