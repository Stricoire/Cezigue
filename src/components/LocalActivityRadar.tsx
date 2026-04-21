"use client";

import { useEffect, useState } from "react";
import { Store, MapPin, Loader2, CalendarDays, Filter, Map as MapIcon, List, Clock, AlertTriangle, Pill, Phone, Flame, TreePine, Navigation, Globe } from "lucide-react";
import dynamic from "next/dynamic";

const LocalActivityMap = dynamic(() => import("@/components/LocalActivityMap"), { ssr: false });

interface POI {
  id: string;
  title: string;
  type: string;
  distance: string;
  rawDist: number;
  icon: string;
  source: string;
  lat?: string;
  date?: string;
  description?: string;
  openingHours?: string;
  isDutyPharmacy?: boolean;
  address?: string;
  phone?: string;
  website?: string;
  city?: string;
  postcode?: string;
  score?: number;
  commentsCount?: number;
}

const CATEGORIES_DISPONIBLES = ['Commerce', 'Santé', 'Service', 'Événement Culturel', 'Activité Touristique', 'Activité Sportive', 'Randonnée & Vélo'];

export const CATEGORY_THEMES: Record<string, { color: string, bg: string, text: string, border: string, bgSolid: string, ring: string }> = {
    'Commerce':           { color: 'amber', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', bgSolid: 'bg-amber-500', ring: 'ring-amber-200' },
    'Santé':              { color: 'red', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', bgSolid: 'bg-red-500', ring: 'ring-red-200' },
    'Service':            { color: 'slate', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', bgSolid: 'bg-slate-500', ring: 'ring-slate-200' },
    'Événement Culturel': { color: 'fuchsia', bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-300', bgSolid: 'bg-fuchsia-500', ring: 'ring-fuchsia-200' },
    'Activité Touristique': { color: 'cyan', bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300', bgSolid: 'bg-cyan-500', ring: 'ring-cyan-200' },
    'Activité Sportive':  { color: 'lime', bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-300', bgSolid: 'bg-lime-500', ring: 'ring-lime-200' },
    'Randonnée & Vélo':   { color: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', bgSolid: 'bg-emerald-500', ring: 'ring-emerald-200' },
    'Par défaut':         { color: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', bgSolid: 'bg-orange-500', ring: 'ring-orange-200' }
};

export function getPoiTheme(catOrPoi: any) {
    const typeOrCat = typeof catOrPoi === 'string' ? catOrPoi : (catOrPoi?.categories?.[0] || catOrPoi?.type || 'Par défaut');
    if (typeOrCat === 'Pharmacie') return CATEGORY_THEMES['Santé'];
    if (typeOrCat === "Parc d'attraction") return CATEGORY_THEMES['Activité Touristique'];
    return CATEGORY_THEMES[typeOrCat] || CATEGORY_THEMES['Par défaut'];
}

export default function LocalActivityRadar({ 
  insee, lat, lon, isMaximized = false, 
  defaultRadius = 15, onRadiusChange, onLaunchItinerary, user
}: { 
  insee: string, lat: string, lon: string, isMaximized?: boolean, 
  defaultRadius?: number, onRadiusChange?: (r: number) => void,
  onLaunchItinerary?: (destination: string) => void,
  user?: any
}) {
  const [pois, setPois] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [radius, setRadius] = useState<number>(defaultRadius);
  const [debouncedRadius, setDebouncedRadius] = useState<number>(defaultRadius);
  const [uncheckedTypes, setUncheckedTypes] = useState<string[]>([]);
  
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  
  // UGC (Review) State
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  const resetReviewState = () => {
    setIsReviewing(false);
    setReviewRating(0);
    setReviewComment('');
  };

  const handleSubmitReview = async (poiId: string) => {
    if (reviewRating === 0 || !user) return;
    setIsSubmittingReview(true);
    try {
        const res = await fetch('/api/poi/rate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ poi_id: poiId, rating: reviewRating, comment: reviewComment })
        });
        if (res.ok) {
            // Recharger silencieusement les POIs pour afficher la nouvelle note (Set radius pour trigger effect)
            setDebouncedRadius(prev => prev + 0.0001);
            resetReviewState();
        } else {
            const data = await res.json();
            alert(data.error || "Erreur lors de l'envoi de l'avis");
        }
    } catch (e) {
        alert("Erreur réseau");
    } finally {
        setIsSubmittingReview(false);
    }
  };

  // Filtres
  const [categories, setCategories] = useState<string[]>(CATEGORIES_DISPONIBLES);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [debouncedFilters, setDebouncedFilters] = useState({ categories: CATEGORIES_DISPONIBLES, startDate: "", endDate: "" });

  // Heatmap State
  const [mapMode, setMapMode] = useState<'normal' | 'vibe' | 'freshness'>('normal');
  const [heatmapPoints, setHeatmapPoints] = useState<Array<[number, number, number]>>([]);
  const [isHeatmapLoading, setIsHeatmapLoading] = useState(false);

  const toggleCategory = (cat: string) => {
      setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  useEffect(() => {
    setRadius(defaultRadius);
    setDebouncedRadius(defaultRadius);
  }, [defaultRadius]);

  // Debouncer pour éviter de spammer les APIs
  useEffect(() => {
    const handler = setTimeout(() => {
      if (radius !== debouncedRadius || categories !== debouncedFilters.categories || startDate !== debouncedFilters.startDate || endDate !== debouncedFilters.endDate) {
         setDebouncedRadius(radius);
         setDebouncedFilters({ categories, startDate, endDate });
         if (onRadiusChange && radius !== debouncedRadius) onRadiusChange(radius);
      }
    }, 800);
    return () => clearTimeout(handler);
  }, [radius, categories, startDate, endDate, debouncedRadius, debouncedFilters, onRadiusChange]);

  useEffect(() => {
    if (!lat || !lon) return;

    const fetchPOIs = async () => {
      setIsLoading(true);
      try {
        const catQuery = debouncedFilters.categories.length > 0 ? debouncedFilters.categories.join(',') : 'none';
        let url = `/api/poi?lat=${lat}&lon=${lon}&insee=${insee}&radius=${debouncedRadius}&categories=${catQuery}`;
        if (debouncedFilters.startDate) url += `&start=${debouncedFilters.startDate}`;
        if (debouncedFilters.endDate) url += `&end=${debouncedFilters.endDate}`;

        const res = await fetch(url);
        const data = await res.json();
        setPois(data.events || []);
      } catch (e) {
        console.error("Erreur Backend Unificateur:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPOIs();
  }, [debouncedRadius, debouncedFilters, lat, lon, insee]);

  // Fetch Heatmap Data quand le mode change
  useEffect(() => {
    if (mapMode === 'normal' || !lat || !lon) {
      setHeatmapPoints([]);
      return;
    }

    const fetchHeatmap = async () => {
      setIsHeatmapLoading(true);
      try {
        const res = await fetch(`/api/heatmap?lat=${lat}&lon=${lon}&radius=${debouncedRadius}&mode=${mapMode}`);
        const data = await res.json();
        setHeatmapPoints(data.points || []);
      } catch (e) {
        console.error("Erreur Heatmap:", e);
      } finally {
        setIsHeatmapLoading(false);
      }
    };
    fetchHeatmap();
  }, [mapMode, debouncedRadius, lat, lon]);

  // Gère l'autoscroll vers la carte sélectionnée dans la liste
  useEffect(() => {
    if (selectedPoiId) {
      const el = document.getElementById(`poi-card-${selectedPoiId}`);
      const container = document.getElementById('poi-list-container');
      
      if (el && container) {
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top;
        
        container.scrollBy({
          top: relativeTop - container.clientHeight / 2 + rect.height / 2,
          behavior: 'smooth'
        });
      } else if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedPoiId]);

  const showEventsFilter = categories.includes('Événement Culturel');

  return (
    <div className={`w-full flex-1 flex flex-col overflow-hidden ${isMaximized ? 'h-full' : ''}`}>
      
      <div className="flex flex-col gap-4 p-5 bg-neutral-50/80 border-b border-orange-100/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="flex-1 w-full flex items-center gap-3 bg-white p-2 border border-neutral-200 rounded-lg shadow-sm">
             <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest pl-1">Rayon</span>
             <input 
                type="range" 
                min="1" max="50" step="1" 
                value={radius} 
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <span className="text-xs font-bold text-orange-600 tabular-nums min-w-8">{radius}km</span>
           </div>
        </div>

        <div className="flex bg-neutral-200/50 p-1 rounded-lg gap-1 border border-neutral-200">
           <button 
             onClick={() => setMapMode('normal')}
             title="Affichage normal des points d'intérêts interactifs"
             className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 rounded-md text-sm font-bold transition-all ${mapMode === 'normal' ? 'bg-white text-orange-600 shadow-sm border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-700'}`}
           >
             <MapPin className="w-4 h-4" />
             Normal
           </button>
           <button 
             onClick={() => setMapMode('vibe')}
             title="Vibe Check : Visualisez la densité de la vie nocturne (bars, pubs, restaurants, clubs)."
             className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 rounded-md text-sm font-bold transition-all ${mapMode === 'vibe' ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md border-transparent' : 'text-neutral-500 hover:text-neutral-700'}`}
           >
             <Flame className="w-4 h-4" />
             Vibe Check
           </button>
           <button 
             onClick={() => setMapMode('freshness')}
             title="Îlots de Fraîcheur : Trouvez les zones ombragées et les oasis urbains (parcs, forêts, points d'eau)."
             className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 rounded-md text-sm font-bold transition-all ${mapMode === 'freshness' ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white shadow-md border-transparent' : 'text-neutral-500 hover:text-neutral-700'}`}
           >
             <TreePine className="w-4 h-4" />
             Fraîcheur
           </button>
        </div>
        {/* Descriptions des modes de carte */}
        {mapMode === 'vibe' && (
            <p className="text-[11px] text-orange-700 bg-orange-50 p-2 rounded-md border border-orange-100/60 leading-relaxed font-medium animate-in fade-in slide-in-from-top-1">
              <span className="flex items-center gap-1.5 mb-0.5 font-bold"><Flame className="w-3.5 h-3.5" /> Vibe Check (Heatmap)</span>
              Affiche les "Hot spots" de la vie urbaine étudiante et nocturne. Cette vue identifie par une carte de chaleur les zones à forte concentration de bars, restaurants, pubs et lieux de sociabilité animés.
            </p>
        )}
        {mapMode === 'freshness' && (
            <p className="text-[11px] text-teal-700 bg-teal-50 p-2 rounded-md border border-teal-100/60 leading-relaxed font-medium animate-in fade-in slide-in-from-top-1">
              <span className="flex items-center gap-1.5 mb-0.5 font-bold"><TreePine className="w-3.5 h-3.5" /> Îlots de Fraîcheur</span>
              Idéal en cas de canicule. Met en valeur les refuges climatiques en calculant la densité des parcs, forêts, plans d'eau, piscines et espaces verts environnants.
            </p>
        )}

        <div className="flex flex-col gap-3 pt-3 border-t border-neutral-200/60">
            <div className="flex items-center gap-2 mb-1">
                <Filter className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">Filtrer par Catégorie</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {CATEGORIES_DISPONIBLES.map(cat => {
                    const isActive = categories.includes(cat);
                    const theme = getPoiTheme(cat);
                    return (
                        <button 
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-all ${isActive ? `${theme.bg} ${theme.border} ${theme.text} shadow-sm` : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300'}`}
                        >
                            {isActive ? '✓ ' : ''}{cat}
                        </button>
                    )
                })}
            </div>

            {CATEGORIES_DISPONIBLES.filter(cat => categories.includes(cat)).length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2">
                    {CATEGORIES_DISPONIBLES.filter(c => categories.includes(c)).map(cat => {
                        const typesForCat = Array.from(new Set(pois.filter(p => p.categories?.[0] === cat && p.type).map(p => p.type))).sort();
                        if (typesForCat.length === 0) return null;
                        
                        const theme = getPoiTheme(cat);
                        
                        return (
                            <div key={`sub-${cat}`} className={`flex flex-wrap items-center gap-2 p-2 rounded-lg border bg-white border-neutral-100 shadow-sm animate-in fade-in slide-in-from-top-1`}>
                                <div className="flex items-center gap-2 mr-1">
                                    <span className={`text-[10px] uppercase font-bold ${theme.text} border-b border-transparent`}>{cat} :</span>
                                    <button 
                                        onClick={() => {
                                            const allChecked = typesForCat.every(t => !uncheckedTypes.includes(t));
                                            if (allChecked) {
                                                setUncheckedTypes(prev => Array.from(new Set([...prev, ...typesForCat])));
                                            } else {
                                                setUncheckedTypes(prev => prev.filter(t => !typesForCat.includes(t)));
                                            }
                                        }}
                                        className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border transition-colors ${typesForCat.every(t => !uncheckedTypes.includes(t)) ? 'bg-neutral-100 border-neutral-200 text-neutral-500 hover:bg-neutral-200' : `bg-${theme.color}-50 border-${theme.color}-200 ${theme.text} hover:bg-${theme.color}-100`}`}
                                    >
                                        {typesForCat.every(t => !uncheckedTypes.includes(t)) ? 'Aucun' : 'Tous'}
                                    </button>
                                </div>
                                {typesForCat.map(t => {
                                    const isChecked = !uncheckedTypes.includes(t);
                                    return (
                                        <label key={t} className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer select-none ${isChecked ? `bg-${theme.color}-50 ${theme.text} ring-1 ring-${theme.color}-200` : 'bg-neutral-50 text-neutral-400 border border-neutral-200 hover:bg-neutral-100'}`}>
                                            <input 
                                                type="checkbox" 
                                                className="sr-only" 
                                                checked={isChecked} 
                                                onChange={() => setUncheckedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} 
                                            />
                                            <div className={`w-2.5 h-2.5 rounded-sm flex items-center justify-center transition-colors ${isChecked ? theme.bgSolid : 'border border-neutral-300 bg-white'}`}>
                                                {isChecked && <svg className="w-1.5 h-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            {t}
                                        </label>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
            )}

            {showEventsFilter && (
                <div className="flex items-center gap-2 mt-2 animate-in fade-in slide-in-from-top-2">
                   <div className="flex flex-col">
                       <label className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Date de début (Events)</label>
                       <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs p-1.5 rounded border border-neutral-200 bg-white text-neutral-700" />
                   </div>
                   <div className="flex flex-col">
                       <label className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Date de fin</label>
                       <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs p-1.5 rounded border border-neutral-200 bg-white text-neutral-700" />
                   </div>
                </div>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4 relative bg-card flex flex-col">
        {isLoading && (
          <div className="absolute top-4 right-1/2 translate-x-1/2 px-4 py-2 bg-white/90 backdrop-blur border border-neutral-200 rounded-full shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
             <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
             <span className="text-sm font-medium text-neutral-600">Scan géographique...</span>
          </div>
        )}

        {pois.length === 0 && !isLoading ? (
          <div className="w-full h-48 flex flex-col items-center justify-center p-8 bg-muted/50 rounded-2xl border border-dashed border-border mt-4">
             <Store className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
             <p className="text-muted-foreground font-medium text-center">Aucun résultat trouvé pour ces filtres.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full gap-4">
             <div className="h-[40vh] lg:h-[45vh] shrink-0 rounded-xl overflow-hidden border border-neutral-200 shadow-sm relative z-0">
                 {isHeatmapLoading && (
                   <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-50 flex items-center justify-center">
                     <Loader2 className="w-8 h-8 text-orange-500 animate-spin drop-shadow-md" />
                   </div>
                 )}
                 <LocalActivityMap 
                   pois={pois.filter(p => !uncheckedTypes.includes(p.type))} 
                   targetLat={lat} 
                   targetLon={lon} 
                   selectedPoiId={selectedPoiId} 
                   onPoiSelect={setSelectedPoiId}
                   mapMode={mapMode}
                   heatmapPoints={heatmapPoints}
                   user={user}
                   onReviewSubmitted={() => {
                        // Force refresh of points softly by unsetting then resetting debouncedRadius
                        setDebouncedRadius(prev => prev + 0.0001); 
                   }}
                 />
             </div>
             
             {/* LISTE SCROLLABLE EN DESSOUS EN PLEINE LARGEUR */}
             <div id="poi-list-container" className={`w-full flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar pb-20 ${isMaximized ? 'flex-1 min-h-[300px]' : 'max-h-[500px] min-h-[400px]'}`}>
                {pois.filter(p => !uncheckedTypes.includes(p.type)).map((poi, idx) => {
                    const isSelected = selectedPoiId === poi.id;
                    const theme = getPoiTheme(poi);
                    
                    const themeClasses = {
                        border: isSelected ? `${theme.border} ring-2 ${theme.ring}` : `border-neutral-100/50`,
                        bg: isSelected ? `${theme.bg} bg-opacity-50` : `bg-white`,
                        iconBg: theme.bg,
                        iconText: theme.text,
                        iconBorder: theme.border,
                        textType: theme.text,
                    };

                    return (
                        <div 
                          key={poi.id} 
                          id={`poi-card-${poi.id}`}
                          onClick={() => {
                              setSelectedPoiId(isSelected ? null : poi.id);
                              if (!isSelected) resetReviewState();
                          }}
                          className={`${themeClasses.bg} border ${themeClasses.border} p-4 rounded-xl flex items-start gap-4 transition-all ${isSelected ? 'shadow-md transform scale-[1.01]' : 'shadow-sm hover:-translate-y-0.5 hover:shadow-md'} cursor-pointer`}
                        >
                        <div className={`w-12 h-12 ${themeClasses.iconBg} ${themeClasses.iconText} border ${themeClasses.iconBorder} rounded-full flex items-center justify-center text-2xl shrink-0 shadow-inner`}>
                            {poi.icon}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="font-bold text-foreground truncate flex items-center gap-2">
                                {poi.title}
                                {poi.score ? (
                                    <span className="flex items-center text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                                        ★ {poi.score} <span className="text-[10px] text-amber-600 ml-1">({poi.commentsCount})</span>
                                    </span>
                                ) : null}
                            </h4>
                            <p className={`text-xs font-semibold ${themeClasses.textType} mb-1.5 uppercase tracking-wider`}>{poi.type}</p>
                            
                            {poi.description && (
                                <p className="text-[11px] text-neutral-500 line-clamp-2 leading-tight mb-2 pr-2">{poi.description}</p>
                            )}

                            <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-x-4 gap-y-2">
                                <span className="flex items-center gap-1.5 font-bold">
                                    <MapPin className={`w-3.5 h-3.5 ${themeClasses.textType}`}/> {poi.distance}
                                </span>
                                {poi.date && (
                                    <span className="flex items-center gap-1.5 font-medium bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                                        <CalendarDays className="w-3.5 h-3.5"/> {poi.date}
                                    </span>
                                )}
                            </div>

                            {/* Details enriched */}
                            {(isSelected || poi.isDutyPharmacy || poi.openingHours || poi.address || poi.phone || poi.website) && (
                                <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1">
                                    {poi.isDutyPharmacy && (
                                        <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase bg-red-100 text-red-700 px-2 py-1 rounded w-fit border border-red-200 shadow-sm">
                                            <AlertTriangle className="w-3.5 h-3.5" /> Pharmacie de Garde Potentielle (24/7)
                                        </span>
                                    )}
                                    {poi.address && (
                                        <div className="flex items-start gap-1.5 text-[11px] text-neutral-600 bg-neutral-50 p-2 rounded border border-neutral-100">
                                            <MapPin className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                                            <span className="font-medium max-w-[250px] truncate">{poi.address}</span>
                                        </div>
                                    )}
                                    {poi.phone && (
                                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 bg-neutral-50 p-2 rounded border border-neutral-100">
                                            <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                            <a href={`tel:${poi.phone!.replace(/\s+/g, '')}`} className="font-medium hover:text-blue-600 hover:underline">{poi.phone}</a>
                                        </div>
                                    )}
                                    {poi.website && (
                                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 bg-neutral-50 p-2 rounded border border-neutral-100">
                                            <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                            <a href={poi.website.startsWith('http') ? poi.website : `https://${poi.website}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-blue-600 hover:underline truncate" title={poi.website}>{poi.website.replace(/^https?:\/\//, '')}</a>
                                        </div>
                                    )}
                                    {poi.openingHours && (
                                        <div className="flex items-start gap-1.5 text-[11px] text-neutral-600 bg-neutral-50 p-2 rounded border border-neutral-100">
                                            <Clock className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                                            <span className="whitespace-pre-wrap font-mono uppercase tracking-tight font-medium text-[10px]">{poi.openingHours.replace(/;/g, '\n')}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isSelected && (
                                <div className="mt-3">
                                    {/* Bouton Multimodal / Itinéraire */}
                                    <button 
                                      onClick={(e) => {
                                         e.stopPropagation();
                                         if (onLaunchItinerary) {
                                            const destStr = poi.address ? `${poi.title}, ${poi.address}` : `${poi.title}, ${poi.city || ''}`;
                                            onLaunchItinerary(destStr.trim().replace(/,\s*$/, ''));
                                         }
                                      }}
                                      className={`w-full py-2.5 flex justify-center items-center gap-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 ${theme.bgSolid}`}
                                    >
                                       <Navigation className="w-4 h-4" /> Y aller (Itinéraire)
                                    </button>

                                    {/* Section Noter (UGC) */}
                                    {user ? (
                                        <div onClick={(e) => e.stopPropagation()} className="w-full bg-white border border-neutral-200 rounded-xl p-3 flex flex-col gap-2 mt-2 animate-in fade-in">
                                            {!isReviewing ? (
                                                <button 
                                                    onClick={() => setIsReviewing(true)}
                                                    className="w-full py-2 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                                                >
                                                    ✨ Donner mon avis sur ce lieu
                                                </button>
                                            ) : (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-bold text-neutral-700">Votre note :</span>
                                                        <div className="flex gap-1">
                                                            {[1,2,3,4,5].map(star => (
                                                                <button key={star} onClick={() => setReviewRating(star)} className={`text-lg transition-colors ${reviewRating >= star ? 'text-amber-500' : 'text-neutral-200 hover:text-amber-300'}`}>
                                                                    ★
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <textarea 
                                                        value={reviewComment}
                                                        onChange={e => setReviewComment(e.target.value)}
                                                        placeholder="Un commentaire ? (Optionnel)"
                                                        className="w-full text-xs p-2 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[60px]"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button 
                                                            disabled={isSubmittingReview || reviewRating === 0}
                                                            onClick={() => handleSubmitReview(poi.id)}
                                                            className="flex-1 py-1.5 text-xs font-bold text-white bg-amber-500 rounded-md hover:bg-amber-600 disabled:opacity-50 transition-colors flex justify-center items-center"
                                                        >
                                                            {isSubmittingReview ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Soumettre'}
                                                        </button>
                                                        <button onClick={resetReviewState} className="px-3 py-1.5 text-xs font-bold text-neutral-500 bg-neutral-100 rounded-md hover:bg-neutral-200 transition-colors">
                                                            Annuler
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full mt-2 text-center text-[10px] text-neutral-400 font-medium p-2 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                                            Connectez-vous pour donner un avis sur ce lieu.
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                        </div>
                    )
                })}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
