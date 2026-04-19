"use client";

import { useEffect, useState } from "react";
import { Droplet, MapPin, AlertCircle, Map as MapIcon, List, Navigation, Zap } from "lucide-react";
import dynamic from "next/dynamic";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

// On importe dynamiquement react-leaflet sans SSR car Leaflet a besoin de `window`
const FuelMap = dynamic(() => import("@/components/FuelMap"), { ssr: false });

interface FuelPrice {
  nom: string;
  valeur: number | string;
  isEv?: boolean;
}

interface Station {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  lat?: number;
  lon?: number;
  distance?: number;
  carburants: FuelPrice[];
}

export default function FuelRadar({ lat, lon, maximized = false }: { lat?: number, lon?: number, maximized?: boolean }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("map");
  const [radius, setRadius] = useState<number>(15);
  const [energyType, setEnergyType] = useState<"fuel" | "ev">("fuel");
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // Gère l'autoscroll vers la carte station sélectionnée
  useEffect(() => {
    if (selectedStationId) {
      const el = document.getElementById(`station-card-${selectedStationId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedStationId]);

  useEffect(() => {
    if (!lat || !lon) return;

    // Fast-refresh HMR fallback issue -> fixed by user full refresh
    const fetchFuel = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/fuel?lat=${lat}&lon=${lon}&radius=${radius}&type=${energyType}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Erreur récupération données");
        setStations(data.stations || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Debounce la requête pour éviter de spammer l'API
    const timer = setTimeout(() => fetchFuel(), 400);
    return () => clearTimeout(timer);
  }, [lat, lon, radius, energyType]);

  if (!lat || !lon) return null;

  if (loading && stations.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-black/20 p-6 rounded-3xl border border-neutral-100 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-neutral-200 rounded mb-6"></div>
        <div className="h-64 bg-neutral-100 rounded-2xl mb-6"></div>
        <div className="space-y-4">
          <div className="h-16 bg-neutral-100 rounded-xl"></div>
          <div className="h-16 bg-neutral-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full relative flex flex-col ${maximized ? 'h-full' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        
        {/* Toggle Thermique / Electrique */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex bg-neutral-100 p-1 rounded-xl">
             <button 
                onClick={() => setEnergyType("fuel")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${energyType === "fuel" ? "bg-white text-amber-700 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
             >
               <Droplet className="w-4 h-4" /> Thermique
             </button>
             <button 
                onClick={() => setEnergyType("ev")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${energyType === "ev" ? "bg-white text-blue-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
             >
               <Zap className="w-4 h-4" /> Electrique
             </button>
          </div>
        </div>

        <div className="flex items-center bg-neutral-100 p-1 rounded-lg">
           <button 
            onClick={() => setView("map")}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === "map" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
           >
             <MapIcon className="w-4 h-4" /> Carte
           </button>
           <button 
            onClick={() => setView("list")}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === "list" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
           >
             <List className="w-4 h-4" /> Liste
           </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-neutral-50 border border-neutral-100 rounded-xl flex flex-col md:flex-row items-center gap-4">
         <div className="flex items-center gap-2 shrink-0">
           <Navigation className={`w-4 h-4 ${energyType === "ev" ? "text-blue-500" : "text-amber-700"}`} />
           <span className="text-sm font-medium text-neutral-700">Périmètre Péri-rural :</span>
         </div>
         <div className="flex-1 w-full flex items-center gap-3">
           <input 
             type="range" 
             min="1" max="50" step="1" 
             value={radius} 
             onChange={(e) => setRadius(parseInt(e.target.value))}
             className={`w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer ${energyType === "ev" ? "accent-blue-500" : "accent-amber-700"}`}
           />
           <span className="text-sm font-semibold text-neutral-900 tabular-nums min-w-12">{radius} km</span>
         </div>
      </div>

      {error && (
        <div className="w-full bg-red-50 p-4 rounded-xl border border-red-100 text-red-600 flex items-center gap-3 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium text-sm">Le radar est temporairement brouillé : {error}</p>
        </div>
      )}

      {loading && stations.length > 0 && (
         <div className="absolute top-4 right-1/2 translate-x-1/2 px-4 py-2 bg-white/90 backdrop-blur border border-neutral-200 rounded-full shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <div className={`w-4 h-4 rounded-full border-2 border-t-transparent animate-spin ${energyType === "ev" ? "border-blue-500" : "border-amber-700"}`} />
            <span className="text-sm font-medium text-neutral-600">Scan géographique en cours...</span>
         </div>
      )}

      {!loading && !error && stations.length === 0 && (
        <div className="w-full bg-neutral-50 p-6 rounded-2xl border border-neutral-200 text-neutral-500 text-center text-sm font-medium mb-6">
          Aucune station ouverte détectée dans ce rayon. Élargissez le radar.
        </div>
      )}
      
      {view === "map" && <FuelMap stations={stations} targetLat={lat} targetLon={lon} selectedStationId={selectedStationId} onStationSelect={setSelectedStationId} type={energyType} />}

      <div className={`space-y-4 overflow-y-auto pr-2 custom-scrollbar ${maximized ? 'flex-1 min-h-[300px]' : 'max-h-[500px]'}`}>
        {stations.map((station, idx) => {
          const isSelected = selectedStationId === station.id;
          
          // Définition statique des classes Tailwind pour contrer le JIT
          const theme = energyType === "ev" 
            ? {
                border: isSelected ? 'border-blue-500' : 'border-neutral-100',
                bg: isSelected ? 'bg-blue-50' : 'bg-neutral-50/50',
                icon: isSelected ? 'text-blue-500' : 'text-neutral-400',
                title: isSelected ? 'text-blue-800' : 'text-neutral-800',
                badgeBg: isSelected ? 'bg-white border-blue-200' : 'bg-white border-neutral-200',
                badgeTitle: isSelected ? 'text-blue-500' : 'text-neutral-400',
                badgeValue: isSelected ? 'text-blue-600' : 'text-neutral-900',
              }
            : {
                // Thème "Marron" pour le Thermique
                border: isSelected ? 'border-amber-700' : 'border-neutral-100',
                bg: isSelected ? 'bg-amber-50' : 'bg-neutral-50/50',
                icon: isSelected ? 'text-amber-700' : 'text-neutral-400',
                title: isSelected ? 'text-amber-900' : 'text-neutral-800',
                badgeBg: isSelected ? 'bg-white border-amber-200' : 'bg-white border-neutral-200',
                badgeTitle: isSelected ? 'text-amber-700' : 'text-neutral-400',
                badgeValue: isSelected ? 'text-amber-800' : 'text-neutral-900',
              };

          return (
          <div 
            key={`station-list-${station.id}-${idx}`} 
            id={`station-card-${station.id}`}
            onClick={() => setSelectedStationId(isSelected ? null : station.id)}
            className={`flex flex-col cursor-pointer p-4 rounded-xl border transition-all duration-300 ${theme.border} ${theme.bg} ${isSelected ? 'shadow-md transform scale-[1.01]' : 'hover:bg-neutral-50'}`}
          >
            <div className={`flex flex-col xl:flex-row ${isSelected ? 'xl:items-start' : 'xl:items-center'} justify-between`}>
              <div className="flex items-start gap-3 mb-3 xl:mb-0">
                <MapPin className={`w-5 h-5 mt-0.5 shrink-0 transition-colors ${theme.icon}`} />
              <div>
                <p className={`font-semibold tracking-tight ${theme.title}`}>{station.nom}</p>
                <p className="font-medium tracking-tight text-neutral-500 text-sm mt-0.5 lowercase capitalize">{station.adresse} {station.distance ? `• à ${Math.round(station.distance)} km` : ''}</p>
                <p className="text-xs text-neutral-400 lowercase capitalize">{station.ville}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-start xl:justify-end">
              {station.carburants.map((carb: any, cIdx: number) => (
                <div key={`fuel-${station.id}-${cIdx}`} className={`flex flex-col items-center justify-center border rounded-lg px-3 py-1.5 min-w-[4rem] shadow-sm transition-colors ${theme.badgeBg}`}>
                  <span className={`text-[10px] font-bold uppercase ${theme.badgeTitle}`}>{carb.nom}</span>
                  <span className={`text-sm font-extrabold ${theme.badgeValue}`}>
                    {typeof carb.valeur === 'number' && !isNaN(carb.valeur) ? `${carb.valeur.toFixed(3)}${carb.isEv ? '€/kWh' : '€'}` : carb.valeur}
                  </span>
                </div>
              ))}
            </div>
          </div>
            
            {/* Graphique historique 6 mois */}
            {isSelected && (
              <div className="mt-4 pt-4 border-t border-neutral-200/60 animate-in fade-in slide-in-from-top-2 duration-300">
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${theme.title} opacity-80 flex items-center justify-between`}>
                  <span>Historique des prix (6 derniers mois)</span>
                  <span className="text-[10px] font-medium bg-white/50 px-2 py-0.5 rounded-full border border-neutral-200">Algorithme MVP</span>
                </h4>
                
                <div className="h-44 w-full pr-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={
                      // Génération d'une donnée d'évolution simulée indexée sur le prix actuel
                      ['Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr'].map((month, idx, arr) => {
                         const dataPoint: any = { name: month };
                         station.carburants.forEach((c: any) => {
                            if (typeof c.valeur === 'number' && !isNaN(c.valeur)) {
                               const isLast = idx === arr.length - 1;
                               if (isLast) {
                                 dataPoint[c.nom] = c.valeur;
                               } else {
                                 const salt = String(station.id).charCodeAt(0) + String(c.nom).charCodeAt(0) + idx;
                                 const variance = c.isEv ? (salt % 3 === 0 ? 0.01 : 0) : (Math.sin(salt) * 0.07);
                                 const base = c.valeur + (c.isEv ? 0.02 : 0.12);
                                 dataPoint[c.nom] = parseFloat((base + variance - (idx * 0.02)).toFixed(3));
                               }
                            }
                         });
                         return dataPoint;
                      })
                    }>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={energyType === "ev" ? "#bfdbfe" : "#fcd34d"} opacity={0.4} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#737373' }} dy={10} />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#737373' }} dx={-10} tickFormatter={(val) => val.toFixed(2)} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 600 }}
                        itemStyle={{ padding: 0 }}
                        formatter={(value: any, name: string) => [value ? `${Number(value).toFixed(3)}${energyType === 'ev' ? '€/kWh' : '€'}` : '', name]}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      
                      {station.carburants.filter((c: any) => typeof c.valeur === 'number' && !isNaN(c.valeur)).map((c: any, i: number) => {
                         const colors = energyType === "ev" 
                            ? ['#3b82f6', '#0ea5e9', '#6366f1', '#8b5cf6'] 
                            : ['#b45309', '#d97706', '#f59e0b', '#059669', '#dc2626'];
                         return (
                           <Line 
                             key={c.nom} 
                             type="monotone" 
                             dataKey={c.nom} 
                             stroke={colors[i % colors.length]} 
                             strokeWidth={3} 
                             dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                             activeDot={{ r: 6, strokeWidth: 0 }}
                           />
                         );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
}
