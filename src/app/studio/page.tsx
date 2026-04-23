import { createClient } from "@supabase/supabase-js";
import Link from 'next/link';
import { Activity } from "lucide-react";
import { StudioClient, MarinaIdeasList } from "./studio-client";

export const dynamic = 'force-dynamic';

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const initialIdeaId = typeof params?.idea === 'string' ? params.idea : undefined;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch the 50 most recent articles to extract recent ideas
  const { data: articles } = await supabase
    .from('articles_veille')
    .select('*')
    .not('marlowe_insight_premium', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  // Group by premium insight
  const ideasMap = new Map();
  if (articles) {
    articles.forEach(article => {
      const insight = article.marlowe_insight_premium;
      if (!ideasMap.has(insight)) {
        ideasMap.set(insight, { insight, articles: [] });
      }
      ideasMap.get(insight).articles.push(article);
    });
  }
  
  // Convert map to array and take top 6 ideas
  const ideas = Array.from(ideasMap.values()).slice(0, 6);

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
          <Link href="/studio" className="text-foreground cursor-pointer transition-colors">Startup Studio</Link>
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

      <StudioClient />

      <MarinaIdeasList ideas={ideas} initialIdeaId={initialIdeaId} />

      <section className="py-24 px-4 bg-background w-full relative z-10 border-t border-border/40">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground mb-4">Un modèle clair et transparent</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Nous agissons comme votre "CTO as a Service". Nos tarifs couvrent exclusivement la prestation technique logicielle pour vous lancer rapidement.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Offre POC */}
          <div className="bg-card rounded-3xl p-8 shadow-sm border-2 border-border/40 hover:border-border transition-all flex flex-col">
            <h3 className="text-2xl font-black text-foreground">Proof Of Concept (P.O.C)</h3>
            <p className="text-muted-foreground mt-2">Idéal pour tester une idée auprès de votre cible.</p>
            <div className="my-8">
              <span className="text-5xl font-black text-foreground">500€</span>
              <span className="text-muted-foreground ml-2">/ projet</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">✓</span>
                <span className="text-foreground">Prototype fonctionnel basique</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">✓</span>
                <span className="text-foreground">Tests d'utilisabilité</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">✓</span>
                <span className="text-foreground">Intégration de la charte graphique</span>
              </li>
            </ul>
            <Link href="/incubator/pitch" className="w-full text-center bg-muted text-foreground font-bold py-4 rounded-xl hover:bg-border transition-colors">
              Commencer un P.O.C
            </Link>
          </div>

          {/* Offre MVP */}
          <div className="bg-foreground rounded-3xl p-8 shadow-xl border-2 border-primary transform md:-translate-y-4 flex flex-col relative">
            <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Recommandé
            </div>
            <h3 className="text-2xl font-black text-background">Minimum Viable Product</h3>
            <p className="text-background/80 mt-2">L'application complète prête à la commercialisation.</p>
            <div className="my-8">
              <span className="text-5xl font-black text-background">2 000€</span>
              <span className="text-background/80 ml-2">/ projet</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">✓</span>
                <span className="text-background/90">Tout le pack P.O.C inclus</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">✓</span>
                <span className="text-background/90">Base de données & API sur-mesure</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">✓</span>
                <span className="text-background/90">Dashboard Administrateur complet</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">✓</span>
                <span className="text-background/90">Déploiement en production (Cloud)</span>
              </li>
            </ul>
            <Link href="/incubator/pitch" className="w-full text-center bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:bg-primary/90 transition-colors shadow-lg">
              Lancer mon M.V.P
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
