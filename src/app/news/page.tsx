import React from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import RegionSelector from "@/components/region-selector";
import SearchBar from "@/components/search-bar";
import { ChevronDown, ExternalLink } from "lucide-react";

export const dynamic = 'force-dynamic'; // Bypass Next.js cache en Dev

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ region?: string, q?: string }> }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const params = await searchParams;
  const region = params.region || "Toutes";
  const searchText = params.q;

  let query = supabase
    .from('articles_veille')
    .select('*')
    .order('created_at', { ascending: false });

  if (region !== "Toutes") {
    query = query.contains('tags', [region]);
  }
  
  if (searchText) {
    query = query.or(`titre.ilike.%${searchText}%,marlowe_insight.ilike.%${searchText}%,marlowe_insight_premium.ilike.%${searchText}%,contenu.ilike.%${searchText}%`);
  }
  
  query = query.limit(200);

  const { data: articles, error } = await query;

  if (error) {
    console.error("News fetch error:", error);
    return <div className="p-8 text-center text-red-500">Erreur lors de la récupération des données de veille.</div>;
  }

  // Grouper par note Premium (Thème)
  const ideasMap = new Map();
  if (articles) {
    articles.forEach(article => {
      const insight = article.marlowe_insight_premium || article.marlowe_insight || article.titre;
      if (!ideasMap.has(insight)) {
        ideasMap.set(insight, { insight, articles: [] });
      }
      ideasMap.get(insight).articles.push(article);
    });
  }
  const clusteredThemes = Array.from(ideasMap.values());

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-16 px-6 sm:px-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
          Le Flux d'Intelligence
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-600">
          Décryptage thématique des enjeux de mobilité et opportunités business locales. Propulsé par Marina, notre Analyste IA.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SearchBar />
        <RegionSelector />
        
        <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-2 mt-8">
          {clusteredThemes?.map((cluster: any, idx: number) => {
            const insights = cluster.insight.split('|||');
            const headerTitle = insights[0] || "Actualité Sectorielle";
            const contextStr = insights[1]?.replace("Note Stratégique :", "").trim() || "";
            const opportunityHtml = insights[2] || "";

            const uniqueArticlesMap = new Map();
            cluster.articles.forEach((art: any) => {
              uniqueArticlesMap.set(art.source_url || art.titre, art);
            });
            const uniqueArticles = Array.from(uniqueArticlesMap.values());

            return (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
                <div>
                  <div className="flex flex-wrap gap-2 mb-4 items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                      Tendance de Fond
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Basé sur {uniqueArticles.length} article(s)</span>
                  </div>

                  <h3 className="text-xl font-black leading-snug mb-3">
                    {headerTitle}
                  </h3>
                  
                  {contextStr && (
                    <div className="mb-4 text-sm text-slate-600 bg-slate-50 border-l-4 border-indigo-300 p-3 italic">
                      {contextStr}
                    </div>
                  )}

                  {opportunityHtml && (
                    <div className="space-y-3 mb-4">
                      {opportunityHtml.split('<br/><br/>').map((part: string, pIdx: number) => {
                        if (!part.trim()) return null;
                        const isIdea = part.includes("L'idée de Startup");
                        return (
                          <div 
                            key={pIdx} 
                            className={`p-4 rounded-xl text-sm leading-relaxed ${isIdea ? 'bg-indigo-50 border border-indigo-100 text-indigo-900 shadow-sm' : 'bg-slate-50 border border-slate-200 text-slate-700'}`} 
                            dangerouslySetInnerHTML={{ __html: part }} 
                          />
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Articles Sources :</p>
                    <div className="flex flex-col gap-2">
                      {uniqueArticles.slice(0, 3).map((art: any) => (
                        <a key={art.id} href={art.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 hover:text-indigo-600 flex items-start gap-2 group/link">
                          <ExternalLink className="w-4 h-4 shrink-0 mt-0.5 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                          <span className="line-clamp-2">{art.titre} <span className="text-xs text-slate-400">({art.source_nom})</span></span>
                        </a>
                      ))}
                      {uniqueArticles.length > 3 && (
                        <span className="text-xs text-slate-400 italic ml-6">+ {uniqueArticles.length - 3} autres articles</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{new Date(cluster.articles[0].created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <Link href={`/incubator/pitch?concept=${encodeURIComponent(headerTitle)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm text-sm font-bold transition-all">
                    S'inspirer de cette idée
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {(!clusteredThemes || clusteredThemes.length === 0) && (
          <div className="text-center py-20 text-slate-500">
            <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Aucun bulletin intelligence n'a encore été assimilé par Marina sur cette thématique.
          </div>
        )}
      </div>
    </div>
  );
}
