import { createClient } from "@supabase/supabase-js";
import { ExternalLink, Zap, ArrowLeft, Hexagon, Lightbulb } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import RegionSelector from "@/components/region-selector";
import ArticleInsightModal from "@/components/article-modal";

export const dynamic = "force-dynamic";

export default async function RadarPage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  // Utilisation de la clé Service Role pour autoriser la lecture anonyme au public
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const params = await searchParams;
  const region = params.region || "Toutes";

  let query = supabase
    .from('articles_veille')
    .select('*')
    .order('created_at', { ascending: false });

  if (region !== "Toutes") {
    // Filtrage strict : que des articles marqués pour cette région précise
    query = query.contains('tags', [region]).limit(48);
  } else {
    // On prend plus large pour pouvoir mélanger convenablement
    query = query.limit(100);
  }

  const { data: rawArticles, error } = await query;

  let articles = rawArticles || [];
  if (region === "Toutes" && articles.length > 0) {
    // Petit mix: On mélange (Shuffle) pour ne pas être dominé par une région si on a un biais temporel RSS
    articles = articles.sort(() => Math.random() - 0.5).slice(0, 48);
  }

  return (
    <main className="min-h-screen bg-background relative selection:bg-primary/30">

      {/* Background subtil */}
      <div className="absolute inset-0 bg-background pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-primary/5 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 blur-[150px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">

        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-muted-foreground/20 pb-8 mb-12 gap-6">
          <div className="flex flex-col gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="w-fit text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour au site d'accueil
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                Radar <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Intelligence</span>
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mt-2 font-medium">
              Alerte en temps réel sur l'actualité de la Mobilité, des Territoires Ruraux et des innovations sectorielles.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
              <Hexagon className="w-3 h-3 text-secondary animate-pulse" />
              Moteur Marlowe Actif
            </span>
            <span className="bg-card border border-muted-foreground/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              {articles?.length || 0} Articles captés pour {region}
            </span>
          </div>
        </div>

        {/* Composant de ciblage régional */}
        <RegionSelector />

        {/* Grille d'articles */}
        {error ? (
          <div className="p-8 text-center bg-red-500/10 text-red-500 rounded-xl border border-red-500/30">
            Une erreur de communication radar s'est produite. Impossible de récupérer le flux.
          </div>
        ) : !articles || articles.length === 0 ? (
          <div className="p-16 text-center bg-card border border-muted-foreground/20 text-muted-foreground rounded-2xl">
            Aucun article n'a été détecté par nos radars pour le moment.
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {articles.map((article: any) => (
              <a
                key={article.id}
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block break-inside-avoid bg-card border border-muted-foreground/20 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/50 transition-all group"
              >
                <div className="flex flex-wrap gap-2 mb-3">
                  {article.tags?.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase font-black tracking-widest"
                    >
                      {tag}
                    </span>
                  ))}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 uppercase font-bold tracking-wider">
                    {article.source_nom}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
                  {article.titre}
                </h3>

                {/* Insight d'Elianor / Marina via Modale */}
                {article.marlowe_insight ? (
                  <div className="mt-4">
                    <ArticleInsightModal insightText={article.marlowe_insight} articleId={article.id} />
                  </div>
                ) : (
                  <div className="bg-muted/30 border border-muted-foreground/10 rounded-xl p-2 mb-4 mt-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                    <span className="text-xs text-muted-foreground/60 italic font-medium">Analyse stratégique primaire en attente...</span>
                  </div>
                )}

                <p className="text-sm text-muted-foreground/80 leading-relaxed font-medium">
                  {article.contenu}
                </p>

                <div className="flex items-center gap-2 mt-6 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Lire l'analyse complète <ExternalLink className="w-3 h-3" />
                </div>
              </a>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
