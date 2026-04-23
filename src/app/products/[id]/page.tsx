import { notFound } from 'next/navigation';
import { ComicBoard } from '@/components/ComicBoard';
import Link from 'next/link';
import { Activity } from "lucide-react";
import { createClient } from '@/utils/supabase/server';

// Base de données simulée pour les produits B2B
const productsDB = {
  nounou: {
    title: "NouNou",
    subtitle: "Reprenez le contrôle de votre flotte de véhicules artisans.",
    panels: [
      {
        imageSrc: "/b2b/nounou_problem.png",
        alt: "Le Chaos de la Gestion de Flotte",
        caption: "Véhicules en panne, plannings papier perdus : le chaos logistique."
      },
      {
        imageSrc: "/b2b/nounou_solution.png",
        alt: "La Solution NouNou",
        caption: "NouNou digitalise vos opérations. Assignation GPS, maintenance prédictive."
      },
      {
        imageSrc: "/b2b/nounou_benefit.png",
        alt: "Les Bénéfices NouNou",
        caption: "Zéro retard, zéro perte : une flotte fluide et rentable."
      }
    ]
  },
  mirepoi: {
    title: "MirePOI",
    subtitle: "Rendez votre territoire visible et dynamique.",
    panels: [
      {
        imageSrc: "/b2b/mirepoi_problem.png",
        alt: "Commerces et Infrastructures Invisibles",
        caption: "Les touristes passent sans s'arrêter, l'économie locale stagne."
      },
      {
        imageSrc: "/b2b/mirepoi_solution.png",
        alt: "La Solution MirePOI",
        caption: "MirePOI connecte vos données au monde. Borne IRVE, boulangerie, tout est mappé."
      },
      {
        imageSrc: "/b2b/mirepoi_benefit.png",
        alt: "Les Bénéfices MirePOI",
        caption: "Le centre-ville revit. Plus de visites, plus de revenus."
      }
    ]
  },
  majordome: {
    title: "Majordome",
    subtitle: "La logistique rurale intelligente du dernier kilomètre.",
    panels: [
      {
        imageSrc: "/b2b/majordome_problem.png",
        alt: "L'Isolement Rural",
        caption: "Des zones enclavées où les livreurs et taxis refusent d'aller."
      },
      {
        imageSrc: "/b2b/majordome_solution.png",
        alt: "La Solution Majordome",
        caption: "L'IA Majordome orchestre et optimise les trajets des transporteurs locaux."
      },
      {
        imageSrc: "/b2b/majordome_benefit.png",
        alt: "Les Bénéfices Majordome",
        caption: "Une communauté connectée, livrée et désenclavée."
      }
    ]
  }
};

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = productsDB[id as keyof typeof productsDB];

  if (!product) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

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
          <Link href="/services" className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Les Micro-services
          </Link>
          <Link href="/products" className="hover:text-foreground cursor-pointer transition-colors">Les Offres Pro</Link>
          <Link href="/studio" className="hover:text-foreground cursor-pointer transition-colors">Le Startup Studio</Link>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <Link href="/services">
              <button className="rounded-full font-black px-6 py-2 shadow-md bg-foreground text-background hover:bg-foreground/90 transition-all">
                Mon Espace
              </button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-bold hover:text-foreground/80 hidden sm:block">
                S'identifier
              </Link>
              <Link href="/login" className="rounded-full font-black px-6 py-2 shadow-md bg-foreground text-background hover:bg-foreground/90 transition-all">
                Accès Gratuit
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ComicBoard component injects the ScrollyTelling experience */}
      <div className="w-full relative">
        <ComicBoard 
          title={product.title} 
          subtitle={product.subtitle} 
          panels={product.panels}
          ctaText="Contactez-nous pour une démo"
          ctaHref="/incubator/pitch"
        />
      </div>

      {/* Placeholder pour la suite de la page de vente technique */}
      <section className="py-24 px-4 bg-background w-full relative z-10 border-t border-border/40">
        <div className="max-w-5xl mx-auto text-center">
          <span className="bg-zinc-100 text-zinc-600 font-bold px-4 py-1 rounded-full text-sm uppercase tracking-widest mb-4 inline-block">Architecture & Spécifications</span>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mb-8">La puissance de l'écosystème sous le capot.</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-16">
            Découvrez comment {product.title} s'intègre en marque blanche dans votre infrastructure territoriale. Spécifications techniques, sécurité des données et pricing B2G.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="p-8 border-2 border-border/40 rounded-3xl bg-card hover:border-border transition-colors shadow-sm">
               <h3 className="text-xl font-bold text-foreground mb-3">Déploiement Marque Blanche</h3>
               <p className="text-muted-foreground">L'interface UI s'adapte automatiquement à votre charte graphique territoriale (Variables CSS, Logo Mairie, Couleurs).</p>
            </div>
            <div className="p-8 border-2 border-border/40 rounded-3xl bg-card hover:border-border transition-colors shadow-sm">
               <h3 className="text-xl font-bold text-foreground mb-3">Sécurité & Multi-Tenant</h3>
               <p className="text-muted-foreground">Base de données PostgreSQL cloisonnée par locataire via Row Level Security (RLS) garantie par Supabase.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
