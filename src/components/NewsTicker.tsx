"use client";

import React, { useEffect, useState } from "react";
import { getLatestNewsAndIdeas } from "@/app/actions/news";
import { Zap, TrendingUp, X } from "lucide-react";

export default function NewsTicker() {
  const [items, setItems] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const mixedItems = await getLatestNewsAndIdeas();
        setItems(mixedItems);
      } catch (error) {
        console.error("Failed to fetch news ticker items:", error);
      }
    };

    fetchLatest();
  }, []);

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
