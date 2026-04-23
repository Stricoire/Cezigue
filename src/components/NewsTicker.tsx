"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Zap, TrendingUp, X } from "lucide-react";

export default function NewsTicker() {
  const supabase = createClient();
  const [items, setItems] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      // Fetch latest raw news (last 5)
      const { data: news } = await supabase
        .from('articles_veille')
        .select('id, titre, source_nom, source_url')
        .order('created_at', { ascending: false })
        .limit(8);

      // Fetch latest ideas from Marina (last 3 unique insights)
      const { data: ideasData } = await supabase
        .from('articles_veille')
        .select('id, marlowe_insight_premium, marlowe_insight')
        .not('marlowe_insight_premium', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      // Extract unique ideas
      const uniqueIdeasMap = new Map();
      if (ideasData) {
        ideasData.forEach(d => {
          if (d.marlowe_insight_premium && !uniqueIdeasMap.has(d.marlowe_insight)) {
            uniqueIdeasMap.set(d.marlowe_insight, d);
          }
        });
      }
      const topIdeas = Array.from(uniqueIdeasMap.values()).slice(0, 3);

      const mixedItems = [
        ...(news || []).map(n => ({ type: 'news', title: n.titre, source: n.source_nom, url: n.source_url })),
        ...topIdeas.map(i => {
          const title = i.marlowe_insight_premium.split('|||')[0] || "Nouvelle Opportunité";
          return { type: 'idea', title, source: 'Marina (IA)', url: '/studio?idea=' + i.id };
        })
      ];

      // Shuffle or interleave them
      const shuffled = mixedItems.sort(() => 0.5 - Math.random());
      setItems(shuffled);
    };

    fetchLatest();
  }, [supabase]);

  if (items.length === 0 || !isVisible) return null;

  return (
    <div className="w-full bg-background border-b border-border/40 py-2 overflow-hidden relative flex items-center group">
      {/* Bouton Fermer */}
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-background/80 hover:bg-muted text-muted-foreground rounded-full transition-colors"
        title="Fermer le bandeau"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Ombre sur les côtés pour adoucir le défilement avec la couleur bg-background */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none"></div>
      
      {/* On utilise group-hover sur le wrapper parent pour mettre en pause tout le conteneur */}
      <div className="flex animate-marquee whitespace-nowrap items-center group-hover:[animation-play-state:paused]">
        {/* On duplique les items 3 fois pour s'assurer que l'animation infinie fonctionne sans saut visuel */}
        {[...items, ...items, ...items].map((item, idx) => (
          <a
            key={idx}
            href={item.url}
            target={item.type === 'news' ? "_blank" : "_self"}
            className={`inline-flex flex-col justify-center min-w-[280px] max-w-[280px] h-20 mx-3 p-3 rounded-xl border transition-all shadow-sm ${
              item.type === 'idea' 
                ? 'bg-muted border-indigo-100 hover:bg-muted/80 hover:border-indigo-300' 
                : 'bg-muted/80 border-slate-200 hover:bg-muted hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider">
              {item.type === 'idea' ? (
                <><Zap className="w-3 h-3 text-indigo-400" /> <span className="text-indigo-400">{item.source}</span></>
              ) : (
                <><TrendingUp className="w-3 h-3 text-slate-400" /> <span className="text-slate-400">{item.source}</span></>
              )}
            </div>
            <span className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight whitespace-normal">
              {item.title}
            </span>
          </a>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
      `}} />
    </div>
  );
}
