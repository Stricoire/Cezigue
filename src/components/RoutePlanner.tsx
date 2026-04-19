"use client";

import { useState } from "react";
import { MapPin, Car, Train, Clock, ArrowRight, Navigation, ChevronDown, Users, Bus, Leaf } from "lucide-react";
import AutocompleteInput from "./AutocompleteInput";
import dynamic from "next/dynamic";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

export default function RoutePlanner({ initialOrigin = "" }: { initialOrigin?: string }) {
  const [origin, setOrigin] = useState<string>(initialOrigin);
  const [destination, setDestination] = useState<string>("");
  const [licensePlate, setLicensePlate] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>("08:00");
  const [timeType, setTimeType] = useState<"departure" | "arrival">("departure");
  const [fuelType, setFuelType] = useState<string>("SP95");
  const [avoidTolls, setAvoidTolls] = useState<boolean>(false);
  const [includeParking, setIncludeParking] = useState<boolean>(false);
  
  const [isConfigExpanded, setIsConfigExpanded] = useState<boolean>(true);
  const [showCar, setShowCar] = useState<boolean>(true);
  const [showCarpoolDriver, setShowCarpoolDriver] = useState<boolean>(true);
  const [showCarpoolPassenger, setShowCarpoolPassenger] = useState<boolean>(true);
  const [showTrain, setShowTrain] = useState<boolean>(true);
  const [showSubway, setShowSubway] = useState<boolean>(true);

  const [calculating, setCalculating] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const calculateRoute = async () => {
    setCalculating(true);
    try {
      const res = await fetch(`/api/routing?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${date}&time=${time}&timeType=${timeType}&fuelType=${fuelType}&avoidTolls=${avoidTolls}&includeParking=${includeParking}`);
      if (!res.ok) throw new Error("Erreur de requête");
      
      const routesData = await res.json();
      
      if (routesData.error || !Array.isArray(routesData)) {
        console.error("L'API n'a pas pu calculer l'itinéraire:", routesData.error);
        alert(routesData.error || "Aucun itinéraire trouvé pour ces adresses.");
        setCalculating(false);
        return;
      }
      
      // On remappe les icons pour React (Le backend renvoie un ID String pour éviter de passer des composants react via JSON)
      const mappedRoutes = routesData.map((route: any) => ({
        ...route,
        icon: route.iconId === 'train' ? <Train className="w-5 h-5"/> : 
              route.iconId === 'bus' ? <Bus className="w-5 h-5"/> :
              route.iconId === 'subway' ? <Train className="w-5 h-5"/> :
              route.iconId === 'users' ? <Users className="w-5 h-5"/> :
              route.iconId === 'leaf' ? <Leaf className="w-5 h-5 text-teal-600"/> :
              <Car className="w-5 h-5"/>,
        steps: route.steps.map((step: any) => ({
          ...step,
          icon: step.iconId === 'train' ? <Train className="w-4 h-4 text-indigo-500"/> : 
                step.iconId === 'subway' ? <Train className="w-4 h-4 text-blue-500"/> :
                step.iconId === 'bus' ? <Bus className="w-4 h-4 text-orange-500"/> :
                step.iconId === 'parking' ? <MapPin className="w-4 h-4 text-red-500"/> : 
                step.iconId === 'clock' ? <Clock className="w-4 h-4 text-amber-600"/> :
                step.iconId === 'walk' ? <MapPin className="w-4 h-4 text-green-500"/> :
                step.iconId === 'leaf' ? <Leaf className="w-4 h-4 text-teal-500"/> :
                <Car className="w-4 h-4 text-neutral-500"/>
        }))
      }));

      setResults(mappedRoutes);
      if (mappedRoutes.length > 2) {
        setSelectedRouteId(mappedRoutes[2].id);
      } else if (mappedRoutes.length > 0) {
        setSelectedRouteId(mappedRoutes[0].id);
      }
      setIsConfigExpanded(false);
    } catch (e) {
      console.error("Erreur appel API Routing", e);
    } finally {
      setCalculating(false);
    }
  };

  const filteredRoutes = results ? results.filter((route: any) => {
    if (route.id.startsWith('voiture') && !showCar) return false;
    if (route.id === 'covoiturage_driver' && !showCarpoolDriver) return false;
    if (route.id === 'covoiturage_passenger' && !showCarpoolPassenger) return false;
    if (route.id === 'intermodal_train' && !showTrain) return false;
    if (route.id === 'intermodal_subway' && !showSubway) return false;
    return true;
  }) : null;



  return (
    <div className="w-full bg-neutral-100 min-h-[100dvh] md:min-h-0 md:bg-white md:rounded-3xl md:border md:border-neutral-200 shadow-sm overflow-hidden flex flex-col">
      
      {/* Panneau Config/Recherche Top */}
      <div className="w-full bg-white border-b border-neutral-200 shadow-sm z-20 relative">
        
        {/* Toggle Bar / Summary if Collapsed */}
        {!isConfigExpanded && (
          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => setIsConfigExpanded(true)}>
             <div className="flex flex-col">
               <span className="text-sm font-bold text-neutral-800">{origin || "Position"} ➡️ {destination || "Destination"}</span>
               <span className="text-xs font-medium text-neutral-500">
                  {new Date(date).toLocaleDateString('fr-FR', {weekday: 'short', day: 'numeric', month: 'short'})} à {time} {timeType === 'arrival' ? '(Arrivée)' : '(Départ)'}
               </span>
             </div>
             <button className="px-3 py-1.5 bg-neutral-100 text-neutral-600 text-xs font-bold uppercase rounded-lg hover:bg-neutral-200">Éditer</button>
          </div>
        )}

        {/* Full Config Form (Collapsible) */}
        {isConfigExpanded && (
          <div className="bg-neutral-50 p-4 md:p-6 space-y-4">
            {/* Header: Date & Time Picker */}
            <div className="flex flex-col md:flex-row gap-2">
               <div className="flex bg-white border border-neutral-200 rounded-xl overflow-hidden focus-within:ring-2 ring-indigo-500 transition-all p-1 flex-1">
                  <select 
                    value={timeType} 
                    onChange={(e) => setTimeType(e.target.value as "departure"|"arrival")}
                    className="bg-transparent text-sm font-medium text-neutral-600 outline-none px-3 border-r border-neutral-200 cursor-pointer"
                  >
                    <option value="departure">Départ à</option>
                    <option value="arrival">Arrivée à</option>
                  </select>
                  <input 
                    type="time" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)}
                    className="flex-1 bg-transparent px-3 text-sm font-bold text-neutral-800 outline-none"
                  />
               </div>
               <div className="flex bg-white border border-neutral-200 rounded-xl overflow-hidden focus-within:ring-2 ring-indigo-500 transition-all p-1 w-full md:w-32">
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent px-3 text-sm font-medium text-neutral-800 outline-none cursor-pointer"
                  />
               </div>
            </div>

            {/* Champs A -> B */}
            <div className="relative">
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-neutral-200" />
              <div className="space-y-4 relative">
                <AutocompleteInput 
                  placeholder="Point de départ (Ex: Rieumes)" 
                  value={origin} 
                  onChange={setOrigin} 
                  icon={<div className="w-3 h-3 bg-neutral-900 rounded-full" />}
                />
                <AutocompleteInput 
                  placeholder="Point d'arrivée (Ex: Toulouse Capitole)" 
                  value={destination} 
                  onChange={setDestination} 
                  icon={<MapPin className="w-5 h-5 text-indigo-600" />}
                />
              </div>
            </div>

            {/* Véhicule & Carburant */}
            <div className="flex gap-2">
              <div className="flex flex-1 bg-white border border-neutral-200 rounded-xl overflow-hidden focus-within:ring-2 ring-indigo-500 transition-all">
                 <div className="w-8 bg-blue-600 flex items-center justify-center text-white font-bold text-[8px]">F</div>
                 <input type="text" placeholder="Plaque" value={licensePlate} onChange={e => setLicensePlate(e.target.value.toUpperCase())} className="flex-1 py-2 px-2 font-mono font-bold text-sm outline-none uppercase placeholder:font-sans placeholder:font-normal placeholder:text-neutral-400 min-w-0" />
              </div>
              <div className="flex bg-white border border-neutral-200 rounded-xl overflow-hidden focus-within:ring-2 ring-indigo-500 transition-all">
                 <select 
                   value={fuelType} 
                   onChange={(e) => setFuelType(e.target.value)}
                   className="bg-transparent text-sm font-medium text-neutral-700 outline-none px-3 cursor-pointer"
                 >
                   <option value="Gazole">Gazole</option>
                   <option value="SP95">SP95/E10</option>
                   <option value="SP98">SP98</option>
                   <option value="E85">Superéthanol</option>
                   <option value="Electrique">Électrique</option>
                 </select>
              </div>
            </div>

            {/* Options de Trajet (Péages & Parking) */}
            <div className="flex flex-col md:flex-row gap-4 pt-2 border-t border-neutral-100">
               <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 cursor-pointer">
                 <input type="checkbox" checked={avoidTolls} onChange={(e) => setAvoidTolls(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                 Éviter les péages
               </label>
               <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 cursor-pointer">
                 <input type="checkbox" checked={includeParking} onChange={(e) => setIncludeParking(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                 Inclure parking payant
               </label>
            </div>

            <button onClick={calculateRoute} disabled={calculating || !origin || !destination} className="w-full bg-neutral-900 hover:bg-black text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-all flex justify-center items-center gap-2 mt-2">
              {calculating ? "Calcul en cours..." : "Trouver un Itinéraire"}
            </button>
          </div>
        )}

        {/* Filtrage horizontal / Scrollable Pills */}
        {results && (
          <div className="bg-white px-2 py-3 border-t border-neutral-100 overflow-x-auto flex flex-nowrap gap-2 no-scrollbar scroll-smooth shadow-sm">
             <button onClick={() => setShowCar(!showCar)} className={"shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all " + (showCar ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200")}>
                <Car className="w-3.5 h-3.5" /> Options Voiture
             </button>
             <button onClick={() => setShowTrain(!showTrain)} className={"shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all " + (showTrain ? "bg-indigo-600 text-white" : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200")}>
                <Train className="w-3.5 h-3.5" /> Rail (Gare P+R)
             </button>
             <button onClick={() => setShowSubway(!showSubway)} className={"shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all " + (showSubway ? "bg-blue-500 text-white" : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200")}>
                <Train className="w-3.5 h-3.5" /> Métro (Station P+R)
             </button>
             <button onClick={() => setShowCarpoolDriver(!showCarpoolDriver)} className={"shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all " + (showCarpoolDriver ? "bg-emerald-600 text-white" : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200")}>
                <Users className="w-3.5 h-3.5" /> Proposer Covoit
             </button>
             <button onClick={() => setShowCarpoolPassenger(!showCarpoolPassenger)} className={"shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all " + (showCarpoolPassenger ? "bg-emerald-500 text-white" : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200")}>
                <Users className="w-3.5 h-3.5" /> Mode Passager
             </button>
          </div>
        )}
      </div>

      {/* Cœur Mobile-First: Carte Dynamique suivie de la liste */}
      <div className="flex-1 flex flex-col relative">
        
        {/* La Carte (Encart haut) */}
        {!isConfigExpanded && results && (
           <div className="w-full h-[35vh] md:h-[45vh] bg-blue-50 relative shrink-0 z-10 border-b border-neutral-200 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.1)]">
              <RouteMap routes={filteredRoutes || []} selectedRouteId={selectedRouteId} />
           </div>
        )}

        {/* Liste des résultats */}
        <div className="flex-1 bg-neutral-100/50 p-4 space-y-4 overflow-y-auto">
           {!results && isConfigExpanded && (
             <div className="h-full min-h-[300px] flex items-center justify-center">
                <div className="text-center text-neutral-400 max-w-xs">
                   <Navigation className="w-12 h-12 mx-auto mb-3 opacity-20" />
                   <p className="text-sm">Renseignez votre point de départ et d&apos;arrivée pour évaluer le meilleur mode de rabattement.</p>
                </div>
             </div>
           )}

           {filteredRoutes && filteredRoutes.length === 0 && (
             <div className="text-center py-10 text-neutral-500 text-sm font-medium">Aucun trajet sélectionné. Activez les filtres ci-dessus.</div>
           )}
           
           {filteredRoutes && filteredRoutes.map((route: any) => {
              const isSelected = selectedRouteId === route.id;
              
              return (
                <div 
                  key={route.id} 
                  onClick={() => {
                     setSelectedRouteId(route.id);
                     if (isConfigExpanded) setIsConfigExpanded(false);
                  }}
                  className={`bg-white rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${isSelected ? (route.colorTheme === 'indigo' ? 'border-indigo-500 shadow-md ring-4 ring-indigo-50 border-t-[6px]' : route.colorTheme === 'blue' ? 'border-blue-500 shadow-md ring-4 ring-blue-50 border-t-[6px]' : route.colorTheme === 'emerald' ? 'border-emerald-500 shadow-md ring-4 ring-emerald-50 border-t-[6px]' : 'border-neutral-900 shadow-md ring-4 ring-neutral-100 border-t-[6px]') : 'border-neutral-200 hover:border-neutral-300'}`}
                >
                  {/* Card Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className={`flex items-center gap-2 font-bold mb-1 ${route.colorTheme === 'indigo' ? 'text-indigo-700' : route.colorTheme === 'blue' ? 'text-blue-600' : route.colorTheme === 'emerald' ? 'text-emerald-600' : 'text-neutral-800'}`}>
                        {route.icon} {route.title}
                      </div>
                      <div className="text-xs text-neutral-500 font-medium pt-1">
                        ⌚ Temps : <span className="text-neutral-800">{route.time}</span>
                        {route.arrivalTime && ` • 🏁 Arrivée : `}
                        {route.arrivalTime && <span className="text-indigo-600 font-bold">{route.arrivalTime}</span>}
                        {` • CO2 : `}
                        <span className="text-green-600 font-bold">{route.co2}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                       <div className={`font-black text-xl md:text-2xl ${route.colorTheme === 'indigo' ? 'text-indigo-700' : route.colorTheme === 'blue' ? 'text-blue-600' : route.colorTheme === 'emerald' ? 'text-emerald-600' : 'text-neutral-900'}`}>
                         {route.totalCost.toFixed(2)}€
                       </div>
                       <div className="text-[10px] text-neutral-400 capitalize">{route.priceSubtext || "Coût Complet estimé"}</div>
                    </div>
                  </div>

                  {/* Détail Expandable */}
                  {isSelected && (
                    <div className="bg-neutral-50 p-4 border-t border-neutral-100 animate-in slide-in-from-top-2 duration-300">
                      
                      <div className="mb-5 bg-white border border-neutral-100 rounded-xl p-3 shadow-sm flex flex-col gap-2 text-xs font-semibold text-neutral-600">
                        <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-between">
                          <div className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-neutral-400"/> Carburant: {route.costs.fuelStr || `${route.costs.fuel.toFixed(2)}€`}</div>
                          {route.costs.train > 0 && <div className="flex items-center gap-1.5"><Train className="w-3.5 h-3.5 text-indigo-500"/> Billet: {route.costs.train.toFixed(2)}€</div>}
                          <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-400"/> Parking: {route.costs.parking.toFixed(2)}€</div>
                          {(route.costs.tolls !== undefined) && (
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className="font-bold text-amber-500">Péage:</span> 
                              {route.costs.tolls === 0 && route.tollsEstimated ? 
                                <span className="text-[8px] sm:text-[10px] text-amber-600/80 italic font-medium bg-amber-50 px-1 rounded truncate max-w-[80px] sm:max-w-none">Non géré par Google</span> 
                                : route.tollsEstimated ? 
                                <span className="text-[10px] text-amber-600/80 italic font-medium bg-amber-50 px-1 rounded">Estimation</span>
                                : `${route.costs.tolls.toFixed(2)}€`
                              }
                            </div>
                          )}
                        </div>
                      </div>

                      <details className="group" open>
                        <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 hover:text-neutral-600 transition-colors">
                          <span>Étapes du trajet</span>
                          <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="space-y-3 relative mt-4">
                          <div className="absolute left-2.5 top-2 bottom-2 w-px bg-neutral-200 z-0" />
                          {route.steps.map((step: any, idx: number) => (
                             <div key={idx} className="flex items-start gap-3 relative z-10">
                                <div className="w-5 h-5 bg-white border border-neutral-200 rounded flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                  {step.icon}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-neutral-800 leading-tight">{step.text}</p>
                                  {step.subtext && <p className="text-xs text-neutral-500 mt-0.5">{step.subtext}</p>}
                                </div>
                             </div>
                          ))}
                        </div>
                      </details>

                      {route.urls && (
                        <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-col gap-2">
                           <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Passer à l&apos;action :</p>
                           {route.urls.map((u: any, idx: number) => (
                              <a key={idx} href={u.url} target="_blank" rel="noreferrer" className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 ${u.color === 'blue' ? 'bg-[#00AFF5]' : 'bg-teal-600'}`}>
                                 Voir sur {u.name} <ArrowRight className="w-4 h-4" />
                              </a>
                           ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
           })}
        </div>
      </div>
    </div>
  );
};
