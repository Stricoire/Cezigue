'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight, Settings2, MapPin } from 'lucide-react';

const AddressInput = dynamic(() => import("@/components/AddressInput"), { ssr: false });
const AutocompleteInput = dynamic(() => import("@/components/AutocompleteInput"), { ssr: false });
const LocalActivityRadar = dynamic(() => import("@/components/LocalActivityRadar"), { ssr: false });
const RoutePlanner = dynamic(() => import("@/components/RoutePlanner"), { ssr: false });
const TravelPlanner = dynamic(() => import("@/components/TravelPlanner"), { ssr: false });

export function ServiceRenderer({ service }: { service: any }) {
  const [hasContext, setHasContext] = useState(false);
  
  // Context State
  const [contextLat, setContextLat] = useState<string>("");
  const [contextLon, setContextLon] = useState<string>("");
  const [contextRadius, setContextRadius] = useState<number>(service.config_json.radius || 5000);
  const [contextOrigin, setContextOrigin] = useState<string>("");
  const [contextDest, setContextDest] = useState<string>("");

  const baseTool = service.config_json.base_tool || 'events';

  if (baseTool === 'travel-planner') {
    return (
      <div className="w-full h-full bg-card rounded-3xl border border-border shadow-sm p-4 md:p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-foreground">{service.title}</h2>
          <p className="text-muted-foreground mt-2">{service.description}</p>
          {service.config_json.search_keyword && (
             <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
               Filtre IA Actif : "{service.config_json.search_keyword}"
             </div>
          )}
        </div>
        <TravelPlanner defaultSearchKeyword={service.config_json.search_keyword} lockedCategories={service.config_json.categories} />
      </div>
    );
  }


  const handleLocationFound = (data: any) => {
    setContextLat(data.lat);
    setContextLon(data.lon);
  };

  const executeService = () => {
     setHasContext(true);
  };

  // 1ère étape : Mise en Contexte
  if (!hasContext) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto mt-10 w-full px-4">
         <div className="text-center space-y-4 mb-8">
            {service.config_json?.image_url && (
               <div className="w-full max-w-lg mx-auto h-48 md:h-64 rounded-3xl overflow-hidden shadow-sm relative mb-6 border border-border">
                  <img src={service.config_json.image_url} alt={service.title} className="w-full h-full object-cover" />
               </div>
            )}
            <h1 className="text-3xl md:text-4xl font-black text-foreground">{service.title}</h1>
            <p className="text-muted-foreground text-lg">{service.description}</p>
         </div>

         <div className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-xl relative overflow-hidden">
            {/* Decors */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

            { (baseTool === 'events' || baseTool === 'fuel') && (
               <div className="space-y-6 relative z-10">
                 <div className="flex items-center gap-2 mb-2 text-primary">
                    <MapPin className="w-5 h-5" />
                    <h3 className="font-bold text-lg">Zone d'analyse</h3>
                 </div>
                 
                 <AddressInput onLocationFound={handleLocationFound} placeholder="Où souhaitez-vous chercher ?" />
                 
                 <div className="flex flex-col gap-2 pt-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                   <div className="flex justify-between items-center text-sm font-bold text-muted-foreground">
                     <span className="flex items-center gap-2"><Settings2 className="w-4 h-4" /> Rayon de recherche</span>
                     <span className="text-foreground">{contextRadius / 1000} km</span>
                   </div>
                   <input type="range" min="1000" max="50000" step="1000" value={contextRadius} onChange={e => setContextRadius(parseInt(e.target.value))} className="w-full accent-primary mt-2" />
                 </div>

                 <button 
                   onClick={executeService} 
                   disabled={!contextLat}
                   className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-md hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                 >
                   Démarrer le service <ArrowRight className="w-5 h-5" />
                 </button>
               </div>
            )}

            { baseTool === 'multimodal' && (
               <div className="space-y-6 relative z-10">
                 <div className="flex items-center gap-2 mb-2 text-primary">
                    <MapPin className="w-5 h-5" />
                    <h3 className="font-bold text-lg">Votre Trajet</h3>
                 </div>

                 <div className="space-y-4 relative bg-muted/30 p-4 rounded-xl border border-border/50">
                   <div className="absolute left-10 top-10 bottom-10 w-0.5 bg-border z-0" />
                   <AutocompleteInput value={contextOrigin} onChange={setContextOrigin} placeholder="Point de départ" className="z-10 relative" />
                   <AutocompleteInput value={contextDest} onChange={setContextDest} placeholder="Point d'arrivée" icon={<MapPin className="w-5 h-5 text-primary" />} className="z-10 relative" />
                 </div>
                 
                 <button 
                   onClick={executeService} 
                   disabled={!contextOrigin || !contextDest}
                   className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-md hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                 >
                   Planifier <ArrowRight className="w-5 h-5" />
                 </button>
               </div>
            )}
         </div>
      </div>
    );
  }

  // 2ème étape : Rendu du Service (Moteur natif instancié avec les params de l'IA)
  return (
    <div className="flex flex-col gap-4 h-full w-full">
       <div className="flex items-center justify-between bg-card p-4 md:p-6 rounded-2xl border border-border shadow-sm">
         <div>
           <h2 className="text-xl font-black text-foreground">{service.title}</h2>
           <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
         </div>
         <button onClick={() => setHasContext(false)} className="text-xs font-bold px-4 py-2 bg-muted text-muted-foreground hover:bg-neutral-200 rounded-lg transition-colors">
            Modifier la recherche
         </button>
       </div>

       <div className="flex-1 bg-card rounded-2xl border border-border overflow-hidden">
         { baseTool === 'multimodal' ? (
            <RoutePlanner initialOrigin={contextOrigin} externalDestination={contextDest} />
         ) : (
            <LocalActivityRadar 
               insee={"75056"} // FIXME: We might need real insee, but for generic POI radar, it's bypassed if lat/lon is ok
               lat={contextLat} 
               lon={contextLon} 
               defaultRadius={contextRadius / 1000} 
               lockedCategories={service.config_json.categories}
               hideFilters={true}
               isMaximized={true}
            />
         )}
       </div>
    </div>
  );
}
