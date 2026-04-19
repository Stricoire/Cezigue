import React from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import RegionSelector from "@/components/region-selector";
import SearchBar from "@/components/search-bar";

export const dynamic = 'force-dynamic'; // Bypass Next.js cache en Dev

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ region?: string, q?: string }> }) {
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
  
  query = query.limit(100);

  const { data: articles, error } = await query;

  if (error) {
    console.error("News fetch error:", error);
    return <div className="p-8 text-center text-red-500">Erreur lors de la récupération des données de veille.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-16 px-6 sm:px-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
          Intelligence Stratégique
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-600">
          Décryptage en temps réel des enjeux de mobilité et opportunités business locales. Propulsé par Marlowe, notre Analyste IA.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SearchBar />
        <RegionSelector />
        
        <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
          {articles?.map((article: any) => {
            // Split the premium insight into distinct parts
            const insights = (article.marlowe_insight_premium || article.marlowe_insight)?.split('|||') || [];
            const headerTitle = insights[0] || article.titre;
            const contextStr = insights[1]?.replace("Note Stratégique :", "").trim() || "";
            const opportunityHtml = insights[2] || "";

            return (
              <div key={article.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {/* Tags UI */}
                    {article.tags?.map((tag: string) => (
                      <span key={tag} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tag === 'Légal' ? 'bg-indigo-100 text-indigo-800' : tag === 'Subventions' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {tag}
                      </span>
                    ))}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                      {article.source_nom}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold leading-snug mb-3">
                    {headerTitle}
                  </h3>
                  
                  {contextStr && (
                    <div className="mb-4 text-sm text-slate-600 bg-slate-50 border-l-4 border-slate-300 p-3 italic">
                      {contextStr}
                    </div>
                  )}

                  <div className="text-sm text-slate-800 space-y-3" dangerouslySetInnerHTML={{ __html: opportunityHtml }} />
                  
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <Link href={`/?interest=${encodeURIComponent(headerTitle)}`} className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm text-sm font-bold transition-all">
                      Je lance un projet là-dessus
                    </Link>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                  <span>{new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center">
                    Source originale
                    <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {(!articles || articles.length === 0) && (
          <div className="text-center py-20 text-slate-500">
            <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Aucun bulletin intelligence n'a encore été assimilé par Marlowe.
          </div>
        )}
      </div>
    </div>
  );
}
