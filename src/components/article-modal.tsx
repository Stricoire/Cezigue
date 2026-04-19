"use client";

import { useState } from "react";
import { Lightbulb, Info, X } from "lucide-react";
import Link from "next/link";

export default function ArticleInsightModal({ insightText, articleId, premium = false }: { insightText: string; articleId?: string; premium?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse insight: "RESUME|||DETAIL|||MARCHE"
  const parts = insightText.split("|||");
  const resume = parts[0] || "Analyse en attente...";
  const detail = parts[1] || "Pas de note détaillée supplémentaire disponible pour ce signal.";
  const marche = parts[2]; // Opportunité de marché optionnelle

  return (
    <>
      <div 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }}
        className="bg-primary/5 hover:bg-primary/15 border border-primary/20 rounded-xl p-3 mb-4 mt-2 flex gap-3 text-primary-foreground cursor-pointer transition-colors group/modal"
      >
        <Lightbulb className="w-5 h-5 text-primary shrink-0 group-hover/modal:animate-pulse" />
        <div className="flex-1">
          <span className={`text-[9px] block mb-1 uppercase tracking-widest ${premium ? 'text-purple-600 font-black' : 'text-secondary'}`}>
            L'idée de Marina {premium && <span className="bg-purple-100 px-1 py-[1px] rounded ml-1">Pro</span>}
          </span>
          <p className="text-xs font-bold text-foreground leading-relaxed">
            {resume}
          </p>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); }}>
          <div 
            className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-primary/20 overflow-hidden relative cursor-default" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-muted-foreground/10 bg-primary/5 shrink-0">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                <h3 className="font-black text-foreground uppercase tracking-widest text-sm">Note Stratégique Interne</h3>
              </div>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {detail}
              </p>

              {marche && (
                <div className="mt-6 bg-secondary/5 border border-secondary/20 rounded-xl p-4">
                  <h4 className="font-black text-secondary uppercase tracking-widest text-[10px] mb-3 flex items-center gap-2">
                    <Lightbulb className="w-3 h-3" />
                    Opportunité Startup & Marché
                  </h4>
                  <div 
                    className="text-xs text-foreground/90 font-medium leading-relaxed space-y-2 [&>strong]:text-foreground [&>strong]:font-bold"
                    dangerouslySetInnerHTML={{ __html: marche.replace(/\n/g, '<br/>') }}
                  />
                </div>
              )}
              
              <div className="flex gap-3 mt-6">
                {articleId && (
                  <a 
                    href={`/incubator/pitch?id=${articleId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm"
                  >
                    <Lightbulb className="w-4 h-4" /> Proposer cette idée de Startup
                  </a>
                )}
                
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); }}
                  className="w-1/3 py-2.5 bg-muted/50 hover:bg-muted text-foreground font-bold rounded-xl transition-colors text-sm"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
