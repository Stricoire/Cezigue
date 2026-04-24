"use client";

import { ComicBoard } from '@/components/ComicBoard';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Activity, ChevronDown, ChevronUp, X, ExternalLink } from "lucide-react";

const foundersPanels = [
  {
    imageSrc: "/studio/founders_problem.png",
    alt: "Le cauchemar technique",
    caption: "L'entrepreneur bloqué dans le développement, face aux bugs et à la complexité technique."
  },
  {
    imageSrc: "/studio/founders_solution.png",
    alt: "CTO As A Service",
    caption: "Cezigue déploie une usine logicielle sur-mesure, générant votre application."
  },
  {
    imageSrc: "/studio/founders_benefit.png",
    alt: "Lancement Réussi",
    caption: "Votre produit est lancé. Des utilisateurs conquis et une croissance amorcée."
  }
];

const mairiesPanels = [
  {
    imageSrc: "/studio/mairies_problem.png",
    alt: "Le défi numérique",
    caption: "La collectivité face à l'obsolescence de ses services numériques locaux."
  },
  {
    imageSrc: "/studio/mairies_solution.png",
    alt: "CEO & Tech as a Service",
    caption: "Cezigue déploie une équipe et une technologie en marque blanche pour votre territoire."
  },
  {
    imageSrc: "/studio/mairies_benefit.png",
    alt: "Territoire Connecté",
    caption: "Des citoyens engagés et des services publics modernisés, sans effort interne."
  }
];

export function StudioClient() {
  const [activeTab, setActiveTab] = useState<'entrepreneur' | 'mairie'>('entrepreneur');

  return (
    <>
      <div className="pt-16 pb-8 flex justify-center z-50 relative w-full">
        <div className="bg-card/50 backdrop-blur p-1 rounded-full flex gap-2 shadow-inner border border-border/40">
          <button 
            onClick={() => setActiveTab('entrepreneur')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'entrepreneur' ? 'bg-primary shadow-md text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Vous êtes un Entrepreneur
          </button>
          <button 
            onClick={() => setActiveTab('mairie')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'mairie' ? 'bg-primary shadow-md text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Vous représentez un Territoire
          </button>
        </div>
      </div>

      <div className="w-full relative">
        <ComicBoard 
          title={activeTab === 'entrepreneur' ? "Le Startup Studio" : "Le Studio des Territoires"}
          subtitle={activeTab === 'entrepreneur' 
            ? "Nous construisons votre technologie. Vous bâtissez votre entreprise." 
            : "Nous modernisons vos services publics avec une technologie clé en main."}
          panels={activeTab === 'entrepreneur' ? foundersPanels : mairiesPanels}
          ctaText="Soumettre mon projet (POC/MVP)"
          ctaHref="/incubator/pitch"
        />
      </div>
    </>
  );
}

export function MarinaIdeasList({ ideas, initialIdeaId }: { ideas: any[], initialIdeaId?: string }) {
  const [selectedIdea, setSelectedIdea] = useState<any | null>(null);

  useEffect(() => {
    if (initialIdeaId && ideas && ideas.length > 0) {
      // Find the idea group that contains the article with initialIdeaId
      const targetIdea = ideas.find(idea => 
        idea.articles.some((art: any) => art.id === initialIdeaId || art.id.toString() === initialIdeaId)
      );
      if (targetIdea) {
        setSelectedIdea(targetIdea);
      }
    }
  }, [initialIdeaId, ideas]);

  if (!ideas || ideas.length === 0) return null;

  return (
    <section className="py-24 px-4 bg-slate-50 w-full relative z-40 border-t border-border/40">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">Les Idées de Marina</h2>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Notre IA Analyste décortique l'actualité territoriale tous les jours et vous propose des concepts de Startups B2B à lancer immédiatement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {ideas.map((idea, idx) => {
          const insights = idea.insight.split('|||');
          const headerTitle = insights[0] || "Tendance Marché";
          const contextStr = insights[1]?.replace("Note Stratégique :", "").trim() || "";
          const optHtml = insights[2] || "";

          const uniqueArticlesMap = new Map();
          idea.articles.forEach((art: any) => {
            uniqueArticlesMap.set(art.source_url || art.titre, art);
          });
          const uniqueArticles = Array.from(uniqueArticlesMap.values());

          return (
            <button 
              key={idx} 
              onClick={() => setSelectedIdea(idea)}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow text-left group"
            >
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    SaaS Idea
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{uniqueArticles.length} source(s)</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">{headerTitle}</h3>
                <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                  <strong className="text-indigo-600 font-bold">Idée SaaS : </strong>
                  {optHtml ? optHtml.replace(/<[^>]+>/g, '').split('L\'idée de Startup (SaaS/App) :').pop()?.trim() : contextStr}
                </p>
                <div className="mt-auto pt-4 border-t border-slate-100 text-xs font-bold text-indigo-600 flex items-center justify-between">
                  <span>Découvrir l'opportunité</span>
                  <span>→</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal / Popup pour l'idée complète */}
      {selectedIdea && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pt-20" onClick={() => setSelectedIdea(null)}>
          <div 
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">
                Analyse Premium
              </span>
              <button 
                onClick={() => setSelectedIdea(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Contenu Modal */}
            <div className="p-6">
              {(() => {
                const insights = selectedIdea.insight.split('|||');
                const headerTitle = insights[0] || "Tendance Marché";
                const contextStr = insights[1]?.replace("Note Stratégique :", "").trim() || "";
                const optHtml = insights[2] || "";

                // Dédoublonnage des sources
                const uniqueArticlesMap = new Map();
                selectedIdea.articles.forEach((art: any) => {
                  uniqueArticlesMap.set(art.source_url || art.titre, art);
                });
                const uniqueArticles = Array.from(uniqueArticlesMap.values());

                return (
                  <>
                    <h2 className="text-2xl font-black text-slate-900 mb-4 leading-tight">{headerTitle}</h2>
                    
                    <div className="bg-slate-50 border-l-4 border-indigo-300 p-4 rounded-r-xl mb-6 text-slate-700 italic text-sm">
                      {contextStr}
                    </div>

                    <div className="space-y-4 mb-8">
                      {optHtml.split('<br/><br/>').map((part: string, pIdx: number) => {
                        if (!part.trim()) return null;
                        const isIdea = part.includes("L'idée de Startup");
                        return (
                          <div 
                            key={pIdx} 
                            className={`p-4 rounded-xl text-sm leading-relaxed ${isIdea ? 'bg-indigo-50 border border-indigo-100 text-indigo-900 shadow-sm' : 'bg-white border border-slate-200 text-slate-700'}`} 
                            dangerouslySetInnerHTML={{ __html: part }} 
                          />
                        );
                      })}
                    </div>

                    {/* Sources */}
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Sources analysées ({uniqueArticles.length})</h4>
                      <div className="space-y-3">
                        {uniqueArticles.map((art: any, i: number) => (
                          <div key={i} className="flex flex-col bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <span className="font-semibold text-slate-800 text-sm mb-1">{art.titre}</span>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500">{art.source_nom}</span>
                              <a href={art.source_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                                Lire l'article <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA sticky en bas */}
                    <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end sticky bottom-0 bg-white py-4">
                      <Link 
                        href={`/incubator/pitch?id=${selectedIdea.articles[0].id}`} 
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg w-full text-center sm:w-auto"
                      >
                        Lancer ce projet avec Cezigue
                      </Link>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
