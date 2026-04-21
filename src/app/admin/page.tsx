import { createClient } from '@/utils/supabase/server'
import { FileText, ExternalLink, Lightbulb, Users, Phone, Calendar } from "lucide-react";
import RegionSelector from "@/components/region-selector";
import ArticleInsightModal from "@/components/article-modal";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const supabase = await createClient()

  const params = await searchParams;
  const region = params.region || "Toutes";

  let query = supabase
    .from('articles_veille')
    .select('*')
    .order('created_at', { ascending: false });

  if (region !== "Toutes") {
    query = query.contains('tags', [region]).limit(12);
  } else {
    query = query.limit(50); // Marge pour le shuffle
  }

  const { data: rawArticles, error } = await query;

  // Fetch CRM Pitches
  const { data: pitches } = await supabase
    .from('startup_pitches')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  let articles = rawArticles || [];
  if (region === "Toutes" && articles.length > 0) {
    articles = articles.sort(() => Math.random() - 0.5).slice(0, 12);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">QG Global</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Supervision de l'infrastructure Cezigue & Intelligence Artificielle.
          </p>
        </div>
        <span className="text-sm font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full whitespace-nowrap">
          Base de Données Connectée
        </span>
      </div>

      <div className="h-px w-full bg-border/50 my-2"></div>

      {/* Section CRM Incubateur - NOUVEAU */}
      {pitches && pitches.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-foreground">
            <Users className="w-5 h-5 text-secondary" />
            Dossiers d'Incubation (CRM)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pitches.map((pitch: any) => (
              <div key={pitch.id} className="bg-secondary/5 border border-secondary/20 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-secondary/10 pb-3">
                  <span className="font-bold text-foreground flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-secondary"/> {pitch.phone || "Non renseigné"}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(pitch.created_at).toLocaleDateString("fr-FR", {day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit"})}</span>
                </div>
                <p className="text-sm font-medium text-foreground mb-4">"{pitch.notes}"</p>
                
                <div className="bg-background rounded-lg p-3 text-[10px] text-muted-foreground border border-muted-foreground/10 overflow-hidden relative">
                  <div className="font-bold text-foreground mb-1">Ciblage Marché :</div>
                  <div dangerouslySetInnerHTML={{ __html: pitch.insight || "N/A" }} className="line-clamp-3 leading-relaxed [&>strong]:text-foreground" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-px w-full bg-border/50 mt-8 mb-2"></div>
        </div>
      )}

      {/* Section Intelligence (Agent Marlowe) */}
      <h2 className="text-xl font-bold flex items-center gap-2 mt-4 text-foreground">
        <FileText className="w-5 h-5 text-primary" />
        Intelligence Terroir (Marlowe) : {region}
      </h2>
      <p className="text-sm text-muted-foreground mb-4">Les dernières remontées sectorielles chassées automatiqument par l'IA.</p>

      <RegionSelector />

      {error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl font-bold text-sm">
          Erreur de connexion à la table Supabase : La table `articles_veille` n'existe probablement pas encore.
        </div>
      ) : articles && articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article: any) => (
            <div key={article.id} className="p-6 rounded-2xl bg-card border border-muted-foreground/20 shadow-md hover:border-primary/50 transition-colors flex flex-col gap-3 relative group hover:shadow-xl block">
              <div className="flex flex-wrap gap-2 mb-1">
                {article.tags?.map((tag: string, i: number) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 uppercase font-bold tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="font-bold text-foreground leading-snug line-clamp-2">
                {article.titre}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
                {article.contenu}
              </p>

              {(article.marlowe_insight_premium || article.marlowe_insight) && (
                <div className="mt-2 mb-2">
                  <ArticleInsightModal insightText={article.marlowe_insight_premium || article.marlowe_insight} articleId={article.id} premium={!!article.marlowe_insight_premium} />
                </div>
              )}

              {article.source_url && (
                <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-bold mt-auto pt-2 flex items-center hover:underline w-fit">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Source : {article.source_nom || "Lien Externe"}
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 border border-dashed border-muted-foreground/30 rounded-2xl text-center flex flex-col items-center justify-center">
          <p className="text-muted-foreground font-medium">Aucune extraction d'information par Marlowe pour le moment.</p>
          <span className="text-xs mt-2 text-muted-foreground/60">En attente de ping sur /api/veille</span>
        </div>
      )}
    </div>
  );
}
