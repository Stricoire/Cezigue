import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import { Activity } from "lucide-react";

const productsDB = {
  nounou: {
    id: "nounou",
    title: "NouNou",
    subtitle: "Gestion de Flotte & Opérations",
    description: "Digitalisez vos opérations. Assignation GPS, maintenance prédictive. Zéro retard, zéro perte : une flotte fluide et rentable.",
    panels: [
      { imageSrc: "/b2b/nounou_problem.png", alt: "Le Chaos de la Gestion de Flotte", caption: "Véhicules en panne, plannings papier perdus : le chaos logistique." },
      { imageSrc: "/b2b/nounou_solution.png", alt: "La Solution NouNou", caption: "NouNou digitalise vos opérations. Assignation GPS, maintenance prédictive." },
      { imageSrc: "/b2b/nounou_benefit.png", alt: "Les Bénéfices NouNou", caption: "Zéro retard, zéro perte : une flotte fluide et rentable." }
    ]
  },
  mirepoi: {
    id: "mirepoi",
    title: "MirePOI",
    subtitle: "Infrastructure & Territoire",
    description: "MirePOI connecte vos données au monde. Borne IRVE, boulangerie, tout est mappé pour faire revivre votre centre-ville.",
    panels: [
      { imageSrc: "/b2b/mirepoi_problem.png", alt: "Commerces et Infrastructures Invisibles", caption: "Les touristes passent sans s'arrêter, l'économie locale stagne." },
      { imageSrc: "/b2b/mirepoi_solution.png", alt: "La Solution MirePOI", caption: "MirePOI connecte vos données au monde. Borne IRVE, boulangerie, tout est mappé." },
      { imageSrc: "/b2b/mirepoi_benefit.png", alt: "Les Bénéfices MirePOI", caption: "Le centre-ville revit. Plus de visites, plus de revenus." }
    ]
  },
  majordome: {
    id: "majordome",
    title: "Majordome",
    subtitle: "Logistique du Dernier Kilomètre",
    description: "L'IA Majordome orchestre et optimise les trajets des transporteurs locaux pour désenclaver les territoires isolés.",
    panels: [
      { imageSrc: "/b2b/majordome_problem.png", alt: "L'Isolement Rural", caption: "Des zones enclavées où les livreurs et taxis refusent d'aller." },
      { imageSrc: "/b2b/majordome_solution.png", alt: "La Solution Majordome", caption: "L'IA Majordome orchestre et optimise les trajets des transporteurs locaux." },
      { imageSrc: "/b2b/majordome_benefit.png", alt: "Les Bénéfices Majordome", caption: "Une communauté connectée, livrée et désenclavée." }
    ]
  }
};

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <main className="flex min-h-screen flex-col items-center bg-background w-full">
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-4 md:px-8 py-4 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl sticky top-0 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo Cezigue" className="h-7 w-7 object-contain drop-shadow-[0_0_4px_var(--color-primary)]" />
          <Link href="/" className="text-xl font-black tracking-tight text-foreground">Cezigue</Link>
        </div>
        
        <div className="flex items-center gap-8 text-sm font-bold text-muted-foreground hidden md:flex">
          <Link href="/services" className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Les Micro-services
          </Link>
          <Link href="/products" className="text-foreground cursor-pointer transition-colors border-b-2 border-primary pb-1">Les Offres Pro</Link>
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

      {/* Hero Section */}
      <div className="w-full max-w-full mx-auto px-4 md:px-8 py-16 text-center">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-foreground mb-6">Les Offres Professionnelles</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-16">
          Découvrez nos solutions B2B intégrées pour la mobilité de demain. Cliquez sur une bande dessinée pour explorer la solution complète en détail.
        </p>

        {/* Liste des produits (BDs statiques) */}
        <div className="flex flex-col gap-24">
          {Object.values(productsDB).map((product) => (
            <Link key={product.id} href={`/products/${product.id}`} className="group block">
              <div className="flex flex-col items-center">
                
                {/* La BD (3 panels) */}
                <div className="flex flex-col md:flex-row gap-6 mb-8 w-full justify-center">
                  {/* Panel 1 */}
                  <div className="relative w-full md:w-1/3 rounded-2xl shadow-xl border-[8px] border-red-400 bg-white overflow-hidden transform -rotate-1 group-hover:-translate-y-2 transition-all duration-300">
                    <div className="relative aspect-[16/9]">
                      <Image src={product.panels[0].imageSrc} alt={product.panels[0].alt} fill className="object-cover" />
                    </div>
                    <div className="p-4 bg-red-50 border-t-2 border-red-100 flex flex-col items-center justify-center h-[90px]">
                      <span className="bg-red-200 text-red-900 text-[9px] sm:text-[10px] font-black px-3 py-1 rounded-full mb-1 uppercase tracking-wider shrink-0">1. LE PROBLÈME</span>
                      <p className="font-bold text-red-900 text-xs sm:text-sm text-center leading-tight line-clamp-2">{product.panels[0].caption}</p>
                    </div>
                  </div>

                  {/* Panel 2 */}
                  <div className="relative w-full md:w-1/3 rounded-2xl shadow-xl border-[8px] border-blue-400 bg-white overflow-hidden transform rotate-1 z-10 group-hover:-translate-y-2 transition-all duration-300">
                    <div className="relative aspect-[16/9]">
                      <Image src={product.panels[1].imageSrc} alt={product.panels[1].alt} fill className="object-cover" />
                    </div>
                    <div className="p-4 bg-blue-50 border-t-2 border-blue-100 flex flex-col items-center justify-center h-[90px]">
                      <span className="bg-blue-200 text-blue-900 text-[9px] sm:text-[10px] font-black px-3 py-1 rounded-full mb-1 uppercase tracking-wider shrink-0">2. LA SOLUTION</span>
                      <p className="font-bold text-blue-900 text-xs sm:text-sm text-center leading-tight line-clamp-2">{product.panels[1].caption}</p>
                    </div>
                  </div>

                  {/* Panel 3 */}
                  <div className="relative w-full md:w-1/3 rounded-2xl shadow-2xl border-[8px] border-emerald-400 bg-white overflow-hidden z-20 group-hover:-translate-y-2 transition-all duration-300">
                    <div className="relative aspect-[16/9]">
                      <Image src={product.panels[2].imageSrc} alt={product.panels[2].alt} fill className="object-cover" />
                    </div>
                    <div className="p-4 bg-emerald-50 border-t-2 border-emerald-100 flex flex-col items-center justify-center h-[90px]">
                      <span className="bg-emerald-200 text-emerald-900 text-[9px] sm:text-[10px] font-black px-3 py-1 rounded-full mb-1 uppercase tracking-wider shrink-0">3. LE RÉSULTAT</span>
                      <p className="font-bold text-emerald-900 text-xs sm:text-sm text-center leading-tight line-clamp-2">{product.panels[2].caption}</p>
                    </div>
                  </div>
                </div>

                {/* Le Descriptif */}
                <div className="bg-card border border-border/60 rounded-3xl p-8 shadow-sm group-hover:border-primary/50 transition-colors max-w-4xl w-full">
                  <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-wider">
                    {product.subtitle}
                  </div>
                  <h2 className="text-3xl font-black text-foreground mb-3 group-hover:text-primary transition-colors">{product.title}</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">{product.description}</p>
                </div>
                
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
