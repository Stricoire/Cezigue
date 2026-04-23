"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Car, Fuel, Calendar, MapPin, Search, Compass, CheckCircle2, Utensils, TreePine, Castle, PartyPopper, Filter, Droplet } from "lucide-react";
import AddressInput from "@/components/AddressInput";
import { createClient } from "@/utils/supabase/client";
import dynamic from 'next/dynamic';
import { POI_TAXONOMY } from "@/config/poi_taxonomy";

const TravelMap = dynamic(() => import('@/components/TravelMap'), { ssr: false });

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

export default function TravelPlanner({ user, locationData, maximized }: { user: any, locationData: any, maximized?: boolean }) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  // Results
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [startLocation, setStartLocation] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [vehicleType, setVehicleType] = useState<string>("");
  const [fuelType, setFuelType] = useState<string>("");
  const [tankCapacity, setTankCapacity] = useState<number | "">("");
  const [initialFuelLevel, setInitialFuelLevel] = useState<number>(100);
  const [viaWaypoint, setViaWaypoint] = useState<any>(null);
  const [tripType, setTripType] = useState<string>("express"); // express, chill
  const [dates, setDates] = useState({ start: "", end: "" });
  
  // Tastes & Filters
  const [tastes, setTastes] = useState<string[]>([]);
  const [aiFilters, setAiFilters] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'trajet' | 'surplace'>('trajet');

  const tasteOptions = [
    { id: "gastronomy", label: "Gastronomie", icon: <Utensils className="w-6 h-6 mb-2" />, color: "bg-orange-100 text-orange-700 border-orange-200" },
    { id: "nature", label: "Nature & Randos", icon: <TreePine className="w-6 h-6 mb-2" />, color: "bg-green-100 text-green-700 border-green-200" },
    { id: "history", label: "Historique", icon: <Castle className="w-6 h-6 mb-2" />, color: "bg-stone-100 text-stone-700 border-stone-200" },
    { id: "events", label: "Événements", icon: <PartyPopper className="w-6 h-6 mb-2" />, color: "bg-purple-100 text-purple-700 border-purple-200" }
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      if (user) {
        const { data: prefs } = await supabase.from('user_preferences').select('*').eq('id', user.id).single();
        if (prefs) {
          if (prefs.default_lat && prefs.default_lon) {
            setStartLocation({
              lat: prefs.default_lat,
              lon: prefs.default_lon,
              address: prefs.default_address || "Position par défaut"
            });
          } else if (locationData) {
             setStartLocation(locationData);
          }
          if (prefs.vehicle_type) setVehicleType(prefs.vehicle_type);
          if (prefs.fuel_type) setFuelType(prefs.fuel_type);
          if (prefs.tank_capacity) setTankCapacity(prefs.tank_capacity);
        }
      } else if (locationData) {
          setStartLocation(locationData);
      }
      setIsLoading(false);
    };
    fetchUserData();
  }, [user, supabase, locationData]);

  const toggleTaste = (tasteId: string) => {
    setTastes(prev => prev.includes(tasteId) ? prev.filter(t => t !== tasteId) : [...prev, tasteId]);
  };

  const handleGenerate = async () => {
    // Validation
    if (!startLocation || !destination) {
      alert("Veuillez sélectionner un point de départ et une destination.");
      return;
    }

    // Sauvegarde en BDD des préférences si l'utilisateur est connecté
    if (user) {
       await supabase.from('user_preferences').upsert({
          id: user.id,
          default_lat: startLocation.lat,
          default_lon: startLocation.lon,
          default_address: startLocation.address,
          vehicle_type: vehicleType,
          fuel_type: fuelType,
          tank_capacity: tankCapacity === "" ? null : tankCapacity
       });
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/travel-planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startLocation,
          destination,
          viaWaypoint,
          vehicleType,
          fuelType,
          tankCapacity,
          initialFuelLevel,
          dates,
          tripType,
          tastes
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erreur de génération");
      }
      
      console.log("Résultat API:", data);
      setGenerationResult(data);
      
      // On initialise les filtres avec tous les types trouvés pour que les checkboxes puissent être décochées
      if (data?.corridor?.pois) {
          const uniqueCats = Array.from(new Set(data.corridor.pois.map((p: any) => p.type).filter(Boolean)));
          setAiFilters({ categories: uniqueCats });
      }

    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
     setGenerationResult(null);
     setAiFilters({});
  };

  const filteredPois = generationResult?.corridor?.pois?.filter((poi: any) => {
    if (aiFilters.searchQuery) {
      const q = aiFilters.searchQuery.toLowerCase();
      if (!poi.title?.toLowerCase().includes(q) && !poi.description?.toLowerCase().includes(q) && !poi.type?.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (aiFilters.categories !== undefined) {
      if (aiFilters.categories.length === 0) return false;
      if (!poi.type || !aiFilters.categories.includes(poi.type)) {
         return false;
      }
    }
    return true;
  }) || [];

  const poisTrajet = filteredPois.filter((p: any) => getDistance(p.lat, p.lon, destination?.lat, destination?.lon) >= 20);
  const poisSurPlace = filteredPois.filter((p: any) => getDistance(p.lat, p.lon, destination?.lat, destination?.lon) < 20);

  const displayedPois = activeTab === 'trajet' ? poisTrajet : poisSurPlace;

  // Calcul des catégories uniques disponibles dans les résultats
  const uniqueCategories = generationResult ? Array.from(new Set(generationResult.corridor.pois.map((p: any) => p.categories?.[0]).filter(Boolean))) as string[] : [];

  const toggleManualCategory = (cat: string) => {
     setAiFilters((prev: any) => {
        const cats = prev.categories || [];
        if (cats.includes(cat)) {
           return { ...prev, categories: cats.filter((c: string) => c !== cat) };
        } else {
           return { ...prev, categories: [...cats, cat] };
        }
     });
  };

  const getCategoryTheme = (metaCategory: string) => {
    if (POI_TAXONOMY[metaCategory]) return POI_TAXONOMY[metaCategory].theme;
    return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', bgSolid: 'bg-slate-500', ring: 'ring-slate-200' };
  };

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="py-20 flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Chargement de votre profil...</p>
        </div>
      ) : (
        <div className="w-full space-y-10">
          
          {/* Results View */}
          {generationResult ? (
            <div className="w-full flex flex-col xl:flex-row gap-6 animate-in fade-in slide-in-from-bottom-10 duration-500">
               
               {/* Colonne de gauche (Carte + Liste) */}
               <div className="flex-1 flex flex-col gap-6">
                  {/* Header Result */}
                  <div className="flex flex-col gap-4 bg-white p-4 rounded-3xl border border-neutral-100 shadow-sm">
                     <div className="flex items-center justify-between">
                        <div>
                           <h3 className="font-bold text-neutral-900">{startLocation.address} <span className="text-neutral-400 mx-2">→</span> {destination.address}</h3>
                           <p className="text-xs text-neutral-500">{generationResult.route.distanceKm} km • {Math.round(generationResult.route.durationMins / 60)}h{generationResult.route.durationMins % 60} • {generationResult.corridor.poisFound} POIs totaux</p>
                        </div>
                        <button onClick={handleReset} className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full hover:bg-emerald-100">
                           Modifier le trajet
                        </button>
                     </div>
                     
                     {/* Barre de Filtres Manuels Façon Local Radar */}
                     {generationResult?.corridor?.pois?.length > 0 && (
                        <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2">
                           <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                 <Filter className="w-4 h-4 text-emerald-500" />
                                 <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Affiner par sous-catégories</span>
                              </div>
                              <button onClick={() => {
                                 if (aiFilters.categories?.length === 0) {
                                     const allCats = Array.from(new Set(generationResult.corridor.pois.map((p: any) => p.type).filter(Boolean))) as string[];
                                     setAiFilters((prev: any) => ({...prev, categories: allCats}));
                                 } else {
                                     setAiFilters((prev: any) => ({...prev, categories: []}));
                                 }
                              }} className="text-[10px] font-bold text-neutral-400 hover:text-neutral-600 underline">
                                 {aiFilters.categories?.length === 0 ? "Tout cocher" : "Tout décocher"}
                              </button>
                           </div>
                           
                           <div className="flex flex-col gap-2">
                              {Object.keys(POI_TAXONOMY).map(metaCat => {
                                 // Extraire les types de cette meta-catégorie présents dans les résultats
                                 const typesInPois = Array.from(new Set(generationResult.corridor.pois.filter((p: any) => p.metaCategory === metaCat).map((p: any) => p.type).filter(Boolean))) as string[];
                                 
                                 if (typesInPois.length === 0) return null;
                                 
                                 const theme = getCategoryTheme(metaCat);

                                 return (
                                    <div key={metaCat} className="flex flex-wrap items-center gap-2 p-2 rounded-lg border bg-white border-neutral-100 shadow-sm">
                                        <div className="flex items-center gap-2 mr-1">
                                            <span className={`text-[10px] uppercase font-bold ${theme.text} border-b border-transparent`}>{POI_TAXONOMY[metaCat].icon} {metaCat} :</span>
                                        </div>
                                        {typesInPois.sort().map(cat => {
                                           const isSelected = aiFilters.categories?.includes(cat);
                                           return (
                                              <label key={cat} className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer select-none ${isSelected ? `${theme.bg} ${theme.text} ring-1 ring-inset ${theme.ring}` : 'bg-neutral-50 text-neutral-400 border border-neutral-200 hover:bg-neutral-100'}`}>
                                                  <input type="checkbox" className="sr-only" checked={isSelected} onChange={() => toggleManualCategory(cat)} />
                                                  <div className={`w-2.5 h-2.5 rounded-sm flex items-center justify-center transition-colors ${isSelected ? theme.bgSolid : 'border border-neutral-300 bg-white'}`}>
                                                      {isSelected && <svg className="w-1.5 h-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                  </div>
                                                  {cat}
                                              </label>
                                           );
                                        })}
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     )}
                  </div>

                  {/* La Carte */}
                  <div className="h-[400px] w-full rounded-3xl overflow-hidden shadow-sm border border-neutral-200">
                     <TravelMap 
                       coordinates={generationResult.route.coordinates} 
                       pois={filteredPois} 
                       refuelStops={generationResult.corridor?.refuelStops} 
                     />
                  </div>

                  {/* Tabs & List */}
                  <div className="bg-white rounded-3xl border border-neutral-100 p-6 shadow-sm flex-1">
                     <div className="flex gap-4 border-b border-neutral-100 pb-4 mb-6">
                        <button 
                          onClick={() => setActiveTab('trajet')}
                          className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'trajet' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
                        >
                           Sur le trajet ({poisTrajet.length})
                        </button>
                        <button 
                          onClick={() => setActiveTab('surplace')}
                          className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'surplace' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
                        >
                           À l'arrivée ({poisSurPlace.length})
                        </button>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                        {activeTab === 'trajet' && generationResult.corridor?.refuelStops?.length > 0 && (
                           <div className="col-span-full mb-4">
                              <h4 className="font-black text-neutral-800 text-sm mb-3 flex items-center">
                                 <Droplet className="w-4 h-4 text-emerald-500 mr-1.5" /> 
                                 Vos arrêts techniques optimisés
                              </h4>
                              <div className="space-y-3">
                                 {generationResult.corridor.refuelStops.map((stop: any, idx: number) => (
                                    <div key={`hub-${idx}`} className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                       <div>
                                          <div className="font-bold text-sm text-emerald-900">
                                             Arrêt Km {stop.km}
                                          </div>
                                          {stop.station && (
                                             <div className="text-xs text-neutral-600 mt-1">
                                                <span className="font-semibold">{stop.station.name}</span> à {stop.station.city}
                                                {stop.station.prices && <span className="ml-2 font-bold text-emerald-600 px-1.5 py-0.5 bg-white rounded-md border border-emerald-200">{stop.station.prices}€</span>}
                                             </div>
                                          )}
                                       </div>
                                       <div className="text-[10px] font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md self-start sm:self-auto">
                                          Plein recommandé
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}

                        {activeTab === 'trajet' && generationResult.corridor?.refuelStops?.length > 0 && displayedPois.length > 0 && (
                           <div className="col-span-full border-t border-neutral-100 my-2"></div>
                        )}

                        {displayedPois.map((poi: any) => {
                           const theme = getCategoryTheme(poi.metaCategory || 'Autres Services');
                           return (
                              <div key={poi.id} id={`poi-card-${poi.id}`} className="p-4 rounded-2xl border border-neutral-100 bg-neutral-50 hover:bg-emerald-50/50 transition-colors group cursor-pointer">
                                 <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-bold text-neutral-900 text-sm group-hover:text-emerald-700 line-clamp-2">
                                        {poi.title}
                                        {poi.score ? (
                                            <span className="ml-2 inline-flex items-center text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                                                ★ {poi.score}
                                            </span>
                                        ) : null}
                                    </h4>
                                    <span className="text-xl leading-none">{poi.icon}</span>
                                 </div>
                                 <span className={`inline-block px-2 py-1 ${theme.bg} ${theme.text} text-[10px] font-bold rounded-md border ${theme.border} mb-2 uppercase`}>
                                    {poi.type || 'Lieu d\'intérêt'}
                                 </span>
                              <p className="text-xs text-neutral-500 line-clamp-3 mb-3">{poi.description || 'Aucune description disponible.'}</p>
                              
                              <div className="flex items-center text-[10px] text-neutral-400 font-medium mb-3">
                                 <MapPin className="w-3 h-3 mr-1" />
                                 {poi.city}
                              </div>

                              {/* Action Buttons PWA-Ready */}
                              <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-neutral-100">
                                 <a 
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lon}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 text-[10px] font-bold text-white bg-emerald-600 px-3 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
                                 >
                                    <MapPin className="w-3 h-3" /> Navigation
                                 </a>
                                 
                                 {poi.metadata?.phone && (
                                    <a 
                                       href={`tel:${poi.metadata.phone}`}
                                       onClick={(e) => e.stopPropagation()}
                                       className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-neutral-700 bg-white border border-neutral-200 px-3 py-2 rounded-xl hover:bg-neutral-50 transition-colors shadow-sm"
                                    >
                                       Appeler
                                    </a>
                                 )}
                                 
                                 {poi.metadata?.website && (
                                    <a 
                                       href={poi.metadata.website}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       onClick={(e) => e.stopPropagation()}
                                       className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-neutral-700 bg-white border border-neutral-200 px-3 py-2 rounded-xl hover:bg-neutral-50 transition-colors shadow-sm"
                                    >
                                       Site Web
                                    </a>
                                 )}
                              </div>
                           </div>
                           );
                        })}
                        {displayedPois.length === 0 && (
                           <div className="col-span-full py-10 text-center text-neutral-400">
                              <Compass className="w-8 h-8 mx-auto mb-3 opacity-20" />
                              <p className="text-sm">Aucun résultat ne correspond à vos filtres.</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* Agent IA supprimé à la demande de l'utilisateur, filtrage manuel en direct préservé. */}
            </div>
          ) : (
            <>
               <div className="text-center space-y-2">
                 <h2 className="text-3xl font-black tracking-tight text-neutral-900">
                   Planifiez le trajet <span className="text-emerald-500">parfait</span>.
                 </h2>
                 <p className="text-neutral-500 max-w-xl mx-auto">
                   Notre intelligence artificielle calcule la meilleure route et vous suggère des arrêts passionnants selon vos goûts.
                 </p>
               </div>
     
               {/* Section 1: Itinéraire */}
               <section className="bg-neutral-50/50 rounded-3xl p-6 border border-neutral-100">
                 <h3 className="text-lg font-bold flex items-center mb-4">
                   <MapPin className="w-5 h-5 text-blue-500 mr-2" /> 1. Votre itinéraire
                 </h3>
                 
                 <div className="space-y-6 relative">
                   <div className="absolute left-[24px] top-12 bottom-12 w-0.5 bg-neutral-200 z-0"></div>
     
                   {/* Point de départ */}
                   <div className="relative z-20 pl-14">
                     <div className="absolute left-[-2px] top-3 w-4 h-4 rounded-full border-4 border-blue-500 bg-white"></div>
                     <label className="block text-sm font-semibold text-neutral-700 mb-2">Point de départ</label>
                     {startLocation ? (
                       <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-200 shadow-sm">
                         <span className="font-medium text-neutral-800">{startLocation.address}</span>
                         <button onClick={() => setStartLocation(null)} className="text-xs text-blue-600 font-semibold hover:underline">Modifier</button>
                       </div>
                     ) : (
                       <div className="relative z-50">
                          <AddressInput 
                             placeholder="Renseignez l'adresse de départ..." 
                             onLocationFound={(data) => setStartLocation(data)} 
                          />
                       </div>
                     )}
                   </div>
     
                   {/* Étape (Optionnelle) */}
                   <div className="relative z-20 pl-14 pb-2">
                     <div className="absolute left-[-2px] top-3 w-4 h-4 rounded-full border-4 border-fuchsia-500 bg-white"></div>
                     <label className="block text-sm font-semibold text-neutral-700 mb-2">Étape souhaitée (Optionnelle)</label>
                     {viaWaypoint ? (
                       <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-200 shadow-sm">
                         <span className="font-medium text-neutral-800">{viaWaypoint.address}</span>
                         <button onClick={() => setViaWaypoint(null)} className="text-xs text-fuchsia-600 font-semibold hover:underline">Supprimer</button>
                       </div>
                     ) : (
                       <div className="relative z-40">
                          <AddressInput 
                             placeholder="Ajouter une étape précise..." 
                             onLocationFound={(data) => setViaWaypoint(data)} 
                          />
                       </div>
                     )}
                   </div>

                   {/* Destination */}
                   <div className="relative z-10 pl-14">
                     <div className="absolute left-[-2px] top-3 w-4 h-4 rounded-full border-4 border-emerald-500 bg-white"></div>
                     <label className="block text-sm font-semibold text-neutral-700 mb-2">Destination finale</label>
                     {destination ? (
                       <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-200 shadow-sm">
                         <span className="font-medium text-neutral-800">{destination.address}</span>
                         <button onClick={() => setDestination(null)} className="text-xs text-emerald-600 font-semibold hover:underline">Modifier</button>
                       </div>
                     ) : (
                       <div className="relative z-40">
                          <AddressInput 
                             placeholder="Rechercher une destination..." 
                             onLocationFound={(data) => setDestination(data)} 
                          />
                       </div>
                     )}
                   </div>
                 </div>
               </section>
     
               {/* Section 2: Véhicule */}
               <section className="bg-neutral-50/50 rounded-3xl p-6 border border-neutral-100">
                 <h3 className="text-lg font-bold flex items-center mb-4">
                   <Car className="w-5 h-5 text-orange-500 mr-2" /> 2. Votre véhicule
                 </h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-semibold text-neutral-700 mb-2">Type de motorisation</label>
                     <select 
                       className="w-full p-3 rounded-xl border border-neutral-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                       value={vehicleType}
                       onChange={(e) => setVehicleType(e.target.value)}
                     >
                       <option value="">Sélectionner...</option>
                       <option value="thermique">Thermique (Essence/Diesel)</option>
                       <option value="electrique">100% Électrique</option>
                       <option value="hybride">Hybride Rechargeable</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-semibold text-neutral-700 mb-2">Carburant privilégié</label>
                     <select 
                       className="w-full p-3 rounded-xl border border-neutral-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                       value={fuelType}
                       onChange={(e) => setFuelType(e.target.value)}
                       disabled={vehicleType === 'electrique'}
                     >
                       <option value="">Sélectionner...</option>
                       <option value="SP95">Sans Plomb 95 (E10)</option>
                       <option value="SP98">Sans Plomb 98</option>
                       <option value="Gazole">Gazole</option>
                       <option value="E85">Superéthanol E85</option>
                       <option value="GPLc">GPLc</option>
                     </select>
                   </div>
                   
                   {/* Capacité et Niveau */}
                   <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                           Capacité du réservoir / batterie
                        </label>
                        <div className="relative">
                           <input 
                             type="number" 
                             min="10" 
                             step="1"
                             placeholder={vehicleType === 'electrique' ? "Ex: 60" : "Ex: 50"}
                             className="w-full p-3 pr-12 rounded-xl border border-neutral-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                             value={tankCapacity}
                             onChange={(e) => setTankCapacity(e.target.value === "" ? "" : Number(e.target.value))}
                           />
                           <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-medium">
                              {vehicleType === 'electrique' ? 'kWh' : 'L'}
                           </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2 flex justify-between">
                           <span>Niveau au départ</span>
                           <span className="text-emerald-600">{initialFuelLevel}%</span>
                        </label>
                        <input 
                          type="range" 
                          min="5" 
                          max="100" 
                          step="5"
                          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer mt-3 accent-emerald-500"
                          value={initialFuelLevel}
                          onChange={(e) => setInitialFuelLevel(Number(e.target.value))}
                        />
                      </div>
                   </div>
                 </div>
               </section>
     
               {/* Section 3: Profilage IA */}
               <section className="bg-neutral-50/50 rounded-3xl p-6 border border-neutral-100">
                 <h3 className="text-lg font-bold flex items-center mb-4">
                   <Compass className="w-5 h-5 text-emerald-500 mr-2" /> 3. Vos centres d'intérêt
                 </h3>
                 
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-start">
                   {tasteOptions.map(taste => {
                     const isSelected = tastes.includes(taste.id);

                     return (
                       <div key={taste.id} className="flex flex-col gap-2">
                          <button
                            onClick={() => toggleTaste(taste.id)}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 relative overflow-hidden h-full min-h-[90px] ${
                              isSelected ? taste.color + ' border-current shadow-sm' : 'bg-white border-neutral-100 text-neutral-400 hover:border-neutral-200 hover:bg-neutral-50'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-4 h-4 absolute top-2 right-2 opacity-80" />}
                            {taste.icon}
                            <span className={`text-xs font-bold text-center ${isSelected ? '' : 'text-neutral-600'}`}>
                              {taste.label}
                            </span>
                          </button>
                       </div>
                     )
                   })}
                 </div>
               </section>
     
               {/* Section 4: Contraintes */}
               <section className="bg-neutral-50/50 rounded-3xl p-6 border border-neutral-100">
                 <h3 className="text-lg font-bold flex items-center mb-4">
                   <Calendar className="w-5 h-5 text-purple-500 mr-2" /> 4. Rythme du voyage
                 </h3>
                 
                 <div className="flex bg-neutral-200/50 p-1 rounded-2xl mb-2">
                   <button 
                     onClick={() => setTripType('express')}
                     className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${tripType === 'express' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                   >
                     Express (Rapide)
                   </button>
                   <button 
                     onClick={() => setTripType('chill')}
                     className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${tripType === 'chill' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                   >
                     Chill (Arrêts fréquents)
                   </button>
                 </div>
               </section>
     
               {/* Validation */}
               <div className="pt-2 flex justify-center">
                 <button 
                   onClick={handleGenerate}
                   disabled={isGenerating}
                   className={`bg-emerald-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all flex items-center gap-3 ${isGenerating ? 'opacity-70 cursor-not-allowed' : 'hover:bg-emerald-700 hover:scale-105'}`}
                 >
                   {isGenerating ? (
                     <>
                       <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                       Calcul de la route...
                     </>
                   ) : (
                     <>
                       Créer mon itinéraire IA
                       <Compass className="w-5 h-5" />
                     </>
                   )}
                 </button>
               </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}
