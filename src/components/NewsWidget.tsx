"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ExternalLink, Star, Loader2, Search, Filter } from "lucide-react";

export default function NewsWidget({ region, user }: { region?: string, user?: any }) {
  const supabase = createClient();
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedThemes, setSavedThemes] = useState<string[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRegion, setFilterRegion] = useState("Toutes");
  const [filterType, setFilterType] = useState("Tous");

  // Options pour les select
  const [availableRegions, setAvailableRegions] = useState<string[]>(["Toutes"]);
  const availableTypes = ["Tous", "Opportunité SaaS", "Tendance de Fond"];

  useEffect(() => {
    if (themes.length > 0) {
      const tags = new Set<string>();
      themes.forEach(t => t.articles.forEach((a: any) => {
        if (a.tags) a.tags.forEach((tag: string) => tags.add(tag));
      }));
      setAvailableRegions(["Toutes", ...Array.from(tags).sort()]);
    }
  }, [themes]);

  useEffect(() => {
    if (user?.user_metadata?.saved_news) {
      setSavedThemes(user.user_metadata.saved_news);
    }
  }, [user]);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      let query = supabase
        .from('articles_veille')
        .select('*')
        .order('created_at', { ascending: false });

      if (region && region !== "Toutes") {
        query = query.contains('tags', [region]);
      }
      
      const { data: articles, error } = await query.limit(100);
      
      if (!error && articles) {
        const ideasMap = new Map();
        articles.forEach(article => {
          const insight = article.marlowe_insight_premium || article.marlowe_insight || article.titre;
          if (!ideasMap.has(insight)) {
            ideasMap.set(insight, { insight, articles: [] });
          }
          ideasMap.get(insight).articles.push(article);
        });
        setThemes(Array.from(ideasMap.values()));
      }
      setLoading(false);
    };

    fetchNews();
  }, [region, supabase]);

  const toggleSave = async (themeKey: string) => {
    if (!user) return;
    
    setSaving(themeKey);
    let newSaved = [...savedThemes];
    if (newSaved.includes(themeKey)) {
      newSaved = newSaved.filter(t => t !== themeKey);
    } else {
      newSaved.push(themeKey);
    }

    const { error } = await supabase.auth.updateUser({
      data: { saved_news: newSaved }
    });

    if (!error) {
      setSavedThemes(newSaved);
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-white/50 rounded-2xl">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Analyse des flux en cours par Marina...</p>
      </div>
    );
  }

  // Filtrage local
  const filteredThemes = themes.filter((cluster) => {
    const insights = cluster.insight.split('|||');
    const headerTitle = insights[0] || "";
    const contextStr = insights[1] || "";
    const opportunityHtml = insights[2] || "";
    
    // Filtre texte
    if (searchQuery && !headerTitle.toLowerCase().includes(searchQuery.toLowerCase()) && !contextStr.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filtre type
    if (filterType === "Opportunité SaaS" && !opportunityHtml) return false;
    if (filterType === "Tendance de Fond" && opportunityHtml) return false;

    // Filtre région
    if (filterRegion !== "Toutes") {
      const hasRegion = cluster.articles.some((art: any) => art.tags && art.tags.includes(filterRegion));
      if (!hasRegion) return false;
    }

    return true;
  });

  return (
    <div className="w-full flex flex-col gap-6 p-2">
      {/* Barre de filtrage */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher un thème, un marché..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={filterRegion} 
            onChange={(e) => setFilterRegion(e.target.value)}
            className="flex-1 sm:flex-none py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {availableRegions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-1 sm:flex-none py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {filteredThemes.map((cluster: any, idx: number) => {
        const insights = cluster.insight.split('|||');
        const headerTitle = insights[0] || "Actualité Sectorielle";
        const contextStr = insights[1]?.replace("Note Stratégique :", "").trim() || "";
        const opportunityHtml = insights[2] || "";
        
        // Dédoublonnage
        const uniqueArticlesMap = new Map();
        cluster.articles.forEach((art: any) => {
          uniqueArticlesMap.set(art.source_url || art.titre, art);
        });
        const uniqueArticles = Array.from(uniqueArticlesMap.values());
        const isSaved = savedThemes.includes(cluster.insight);

        return (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row gap-6 relative group overflow-hidden">
            {isSaved && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />}
            
            <div className="flex-1 flex flex-col">
              <div className="flex flex-wrap gap-2 mb-3 items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                    {opportunityHtml ? "Opportunité" : "Tendance de Fond"}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{uniqueArticles.length} source(s)</span>
                </div>
                
                {user && (
                  <button 
                    onClick={() => toggleSave(cluster.insight)}
                    disabled={saving === cluster.insight}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isSaved ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
                  >
                    {saving === cluster.insight ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className={`w-3.5 h-3.5 ${isSaved ? 'fill-yellow-500 text-yellow-500' : ''}`} />}
                    {isSaved ? "Sauvegardé" : "Favoris"}
                  </button>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug mb-3">
                {headerTitle}
              </h3>
              
              {contextStr && (
                <div className="mb-4 text-sm text-slate-600 bg-slate-50 border-l-2 border-indigo-200 pl-3 italic">
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
                        className={`p-3 rounded-xl text-sm leading-relaxed ${isIdea ? 'bg-indigo-50 border border-indigo-100 text-indigo-900 shadow-sm' : 'bg-slate-50 border border-slate-200 text-slate-700'}`} 
                        dangerouslySetInnerHTML={{ __html: part }} 
                      />
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="lg:w-72 bg-slate-50 rounded-xl p-4 flex flex-col shrink-0 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Sources de cette analyse</p>
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-48 pr-2 custom-scrollbar">
                {uniqueArticles.map((art: any) => (
                  <a key={art.id} href={art.source_url} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-1 group/link">
                    <span className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover/link:text-indigo-600 transition-colors">{art.titre}</span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span className="font-bold">{art.source_nom}</span>
                      <span>•</span>
                      <span>{new Date(art.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {filteredThemes.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-500 bg-white/50 rounded-2xl border border-dashed border-slate-300">
          Aucun résultat pour cette recherche ou région.
        </div>
      )}
    </div>
  );
}
