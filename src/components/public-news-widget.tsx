import { createClient } from "@supabase/supabase-js";
import { Zap, ArrowRight, Lightbulb } from "lucide-react";
import Link from "next/link";
import MiniRegionSelector from "./mini-region-selector";
import ArticleInsightModal from "./article-modal";

export default async function PublicNewsWidget({ region = "Toutes" }: { region?: string }) {
  // On utilise le contournement côté SERVEUR avec la clé Secrète 
  // pour que les visiteurs anonymes puissent voir le contenu.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let query = supabase
    .from('articles_veille')
    .select('*')
    .order('created_at', { ascending: false });

  if (region !== "Toutes") {
    query = query.contains('tags', [region]).limit(4);
  } else {
    query = query.limit(40); // Prends large pour mélanger
  }

  const { data: rawArticles, error } = await query;

  let articles = [];
  if (rawArticles) {
    const seenThemes = new Set();
    for (const article of rawArticles) {
      // Use the premium insight as the unique key for the theme. 
      // If it doesn't exist, fallback to the basic insight or title to avoid dropping unanalyzed ones.
      const themeKey = article.marlowe_insight_premium || article.marlowe_insight || article.titre;
      if (!seenThemes.has(themeKey)) {
        seenThemes.add(themeKey);
        articles.push(article);
        if (articles.length >= 4) break;
      }
    }
  }

  if (error || !articles || articles.length === 0) return null;

  return (
    <div className="flex-1 w-full bg-white/40 dark:bg-black/30 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden flex flex-col z-20">
      <Link href="/radar" className="p-4 bg-primary/5 hover:bg-primary/20 transition-colors border-b border-black/5 dark:border-white/5 flex items-center justify-between group">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
          <span className="font-black text-xs uppercase tracking-widest text-primary truncate">Le Radar Intelligence</span>
        </div>
        <ArrowRight className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
      </Link>

      <div className="px-4 py-2 bg-background border-b border-muted-foreground/10">
        <MiniRegionSelector currentRegion={region} />
      </div>

      <div className="flex flex-col p-4 gap-4 bg-background/50 backdrop-blur-md">
        {articles.map((article: any) => (
          <div key={article.id} className="group flex flex-col gap-1 border-b border-muted-foreground/10 pb-4 last:border-0 last:pb-0">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">{article.source_nom}</span>
            <div className="flex flex-col mb-1">
              <h4 className="text-sm font-bold text-foreground leading-snug hover:text-primary transition-colors line-clamp-2">
                {article.titre}
              </h4>
              <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:underline w-fit mt-1">Lire l&apos;article source ↗</a>
            </div>
            {article.marlowe_insight || article.marlowe_insight_premium ? (
              <div className="mt-1">
                <ArticleInsightModal insightText={article.marlowe_insight_premium || article.marlowe_insight} articleId={article.id} premium={!!article.marlowe_insight_premium} />
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-1 opacity-50">
                <Lightbulb className="w-3 h-3 text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground italic">Analyse en cours...</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
