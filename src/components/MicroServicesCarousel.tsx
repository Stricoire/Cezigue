"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Activity, Fuel, CalendarDays, Compass, ChevronLeft, ChevronRight } from "lucide-react";

export default function MicroServicesCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        // Si on a atteint la fin, on revient au début
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Sinon on décale d'une carte (environ 33% ou la largeur d'une carte + gap)
          const cardWidth = scrollRef.current.children[0]?.clientWidth || 0;
          const gap = 24; // gap-6 = 24px
          scrollRef.current.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.children[0]?.clientWidth || 0;
      const gap = 24;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -(cardWidth + gap) : (cardWidth + gap), behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full group">
      {/* Boutons de navigation manuelle */}
      <button 
        onClick={() => scroll('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/90 shadow-md rounded-full text-slate-800 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <button 
        onClick={() => scroll('right')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/90 shadow-md rounded-full text-slate-800 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Ombres de floutage sur les bords (fade) */}
      <div className="absolute left-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
      
      {/* Conteneur défilant horizontal */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-6 pb-6 pt-2 snap-x snap-mandatory scrollbar-hide" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Outil 0 : Le Flux (Lien désactivé) */}
        <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col group/card shrink-0 w-[85vw] md:w-[calc(33.333%-1rem)] snap-center relative">
          <div className="relative w-full h-40 bg-muted overflow-hidden">
            <Image src="/b2c/vintage_newsstand_iso.png" alt="Le Flux" fill className="object-cover transition-transform duration-500" />
            <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm z-10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div className="absolute inset-0 bg-orange-600/95 backdrop-blur-sm flex flex-col justify-center p-6 opacity-0 group-hover/card:opacity-100 transition-all duration-500 z-20">
              <p className="text-white text-sm font-medium leading-relaxed">
                Veille stratégique et décryptage thématique propulsés par IA pour repérer les opportunités de marché.
              </p>
            </div>
          </div>
          <div className="p-6 flex flex-col flex-1">
            <h4 className="font-bold text-lg mb-2 text-foreground">Le Flux (Veille IA)</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">Décryptage des enjeux et opportunités de marché. Uniquement disponible depuis l'Espace Personnel.</p>
          </div>
        </div>

        {/* Outil 1 : Économies */}
        <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col group/card shrink-0 w-[85vw] md:w-[calc(33.333%-1rem)] snap-center">
          <div className="relative w-full h-40 bg-muted overflow-hidden">
            <Image src="/b2c/radar_iso.png" alt="Radar Économique" fill className="object-cover group-hover/card:scale-105 transition-transform duration-500" />
            <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm z-10">
              <Fuel className="w-5 h-5 text-orange-600" />
            </div>
            <div className="absolute inset-0 bg-orange-600/95 backdrop-blur-sm flex flex-col justify-center p-6 opacity-0 group-hover/card:opacity-100 transition-all duration-500 z-20">
              <p className="text-white text-sm font-medium leading-relaxed">
                Visualisez en temps réel les prix des carburants et l'état des stations. Idéal pour les conducteurs réguliers et les familles cherchant à optimiser leur budget quotidien.
              </p>
            </div>
          </div>
          <div className="p-6 flex flex-col flex-1">
            <h4 className="font-bold text-lg mb-2 text-foreground">Radar Économique</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">Cartographie temps réel des prix des carburants et points de recharge électrique autour de vous.</p>
          </div>
        </div>
        
        {/* Outil 2 : Territoire */}
        <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col group/card shrink-0 w-[85vw] md:w-[calc(33.333%-1rem)] snap-center">
          <div className="relative w-full h-40 bg-muted overflow-hidden">
            <Image src="/b2c/datatourisme_iso.png" alt="Vie Locale" fill className="object-cover group-hover/card:scale-105 transition-transform duration-500" />
            <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm z-10">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <div className="absolute inset-0 bg-orange-600/95 backdrop-blur-sm flex flex-col justify-center p-6 opacity-0 group-hover/card:opacity-100 transition-all duration-500 z-20">
              <p className="text-white text-sm font-medium leading-relaxed">
                Agrégation hyperlocale des événements de votre commune (marchés, brocantes, festivités). Pensé pour les citoyens en quête de dynamisme et de reconnexion territoriale.
              </p>
            </div>
          </div>
          <div className="p-6 flex flex-col flex-1">
            <h4 className="font-bold text-lg mb-2 text-foreground">Vie Locale (DATAtourisme)</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">Agenda des marchés, brocantes et événements synchronisés directement par les mairies.</p>
          </div>
        </div>

        {/* Outil 3 : Multimodale */}
        <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col group/card shrink-0 w-[85vw] md:w-[calc(33.333%-1rem)] snap-center">
          <div className="relative w-full h-40 bg-muted overflow-hidden">
            <Image src="/b2c/multimodal_iso.png" alt="Multimodal" fill className="object-cover group-hover/card:scale-105 transition-transform duration-500" />
            <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm z-10">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="absolute inset-0 bg-orange-600/95 backdrop-blur-sm flex flex-col justify-center p-6 opacity-0 group-hover/card:opacity-100 transition-all duration-500 z-20">
              <p className="text-white text-sm font-medium leading-relaxed">
                Synchronisation instantanée des horaires de bus, trains et vélos. La solution ultime pour les nomades et les adeptes des mobilités douces péri-urbaines.
              </p>
            </div>
          </div>
          <div className="p-6 flex flex-col flex-1">
            <h4 className="font-bold text-lg mb-2 text-foreground">Mobilité Multimodale</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">Horaires de bus, trains et flottes partagées consolidés via le registre national (PAN).</p>
          </div>
        </div>

        {/* Outil 4 : Travel Planner */}
        <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col group/card shrink-0 w-[85vw] md:w-[calc(33.333%-1rem)] snap-center">
          <div className="relative w-full h-40 bg-muted overflow-hidden">
            <Image src="/b2c/travel_planner_iso.png" alt="Travel Planner" fill className="object-cover group-hover/card:scale-105 transition-transform duration-500" />
            <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm z-10">
              <Compass className="w-5 h-5 text-purple-600" />
            </div>
            <div className="absolute inset-0 bg-orange-600/95 backdrop-blur-sm flex flex-col justify-center p-6 opacity-0 group-hover/card:opacity-100 transition-all duration-500 z-20">
              <p className="text-white text-sm font-medium leading-relaxed">
                Planifiez des itinéraires touristiques inoubliables ponctués de points d'intérêts et de moments de joie à travers le territoire.
              </p>
            </div>
          </div>
          <div className="p-6 flex flex-col flex-1">
            <h4 className="font-bold text-lg mb-2 text-foreground">Travel Planner IA</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">Générateur de parcours intelligent reliant points d'intérêts, patrimoine et nature.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
