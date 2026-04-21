"use client";

import { useState, useEffect } from "react";
import AddressInput from "@/components/AddressInput";
import FuelRadar from "@/components/FuelRadar";
import RoutePlanner from "@/components/RoutePlanner";
import WidgetWrapper from "@/components/WidgetWrapper";
import LocalActivityRadar from "@/components/LocalActivityRadar";
import { ArrowLeft, Droplet, TrainTrack, HeartHandshake, BoxSelect, CalendarDays, UserCheck, Store } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function ServicesPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [locationData, setLocationData] = useState<any>(null);
  
  // Dashboard Widget State
  const [activeWidgets, setActiveWidgets] = useState<string[]>(['fuel']);
  const [maximizedWidget, setMaximizedWidget] = useState<string | null>(null);
  const [defaultRadius, setDefaultRadius] = useState<number>(15);

  const [routeDestination, setRouteDestination] = useState<string>("");

  const handleLaunchItinerary = (dest: string) => {
    setRouteDestination(dest);
    if (!activeWidgets.includes('multimodal')) {
      toggleWidget('multimodal');
    }
    setMaximizedWidget('multimodal');
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // Auto-Hydratation depuis la BDD (Espace Personnel) ou page d'accueil
  useEffect(() => {
    const initSpace = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUser(user);

      if (user) {
        const { data: prefs } = await supabase.from('user_preferences').select('*').eq('id', user.id).single();
        if (prefs) {
          if (prefs.active_widgets) setActiveWidgets(prefs.active_widgets);
          if (prefs.default_radius) setDefaultRadius(prefs.default_radius);
          
          const urlParams = new URLSearchParams(window.location.search);
          if (!urlParams.get('lat') && prefs.default_lat && prefs.default_lon) {
            setLocationData({
              lat: prefs.default_lat,
              lon: prefs.default_lon,
              address: prefs.default_address,
              insee: prefs.default_insee
            });
            return;
          }
        }
      }

      // Par défaut (Visiteur)
      const urlParams = new URLSearchParams(window.location.search);
      const lat = urlParams.get('lat');
      const lon = urlParams.get('lon');
      const address = urlParams.get('address');
      
      if (lat && lon) {
        setLocationData({ lat, lon, address: address || "Position Actuelle" });
      }
    };
    initSpace();
  }, []);

  const toggleWidget = async (id: string) => {
    let newWidgets;
    if (activeWidgets.includes(id)) {
      newWidgets = activeWidgets.filter(w => w !== id);
      if (maximizedWidget === id) setMaximizedWidget(null);
    } else {
      newWidgets = [...activeWidgets, id];
    }
    setActiveWidgets(newWidgets);

    if (user) {
      await supabase.from('user_preferences').upsert({ id: user.id, active_widgets: newWidgets });
    }
  };

  const handleLocationFound = async (data: any) => {
    setLocationData(data);
    if (user) {
      await supabase.from('user_preferences').upsert({
        id: user.id,
        default_lat: data.lat,
        default_lon: data.lon,
        default_address: data.address,
        default_insee: data.insee
      });
    }
  };

  const toggleMaximize = (id: string) => {
    setMaximizedWidget(prev => prev === id ? null : id);
  };

  const handleRadiusChange = async (r: number) => {
    setDefaultRadius(r);
    if (user) {
      await supabase.from('user_preferences').update({ default_radius: r }).eq('id', user.id);
    }
  };

  const widgetsList = [
    { id: 'fuel', title: 'Radar Carburant', icon: <Droplet className="w-5 h-5 text-orange-500" /> },
    { id: 'multimodal', title: 'Offre Multimodale', icon: <TrainTrack className="w-5 h-5 text-blue-500" /> },
    { id: 'events', title: 'Vie Locale & Commerces', icon: <Store className="w-5 h-5 text-orange-600" /> },
    { id: 'aids', title: 'Aides Locales', icon: <HeartHandshake className="w-5 h-5 text-green-500" /> }
  ];

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-neutral-50 dark:bg-background">
      <div className="w-full max-w-7xl mb-8 flex items-center justify-between">
         <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
           <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l&apos;accueil
         </Link>
         <h1 className="text-2xl font-bold tracking-tight">Mobilité Péri-rurale</h1>
      </div>

      <div className="w-full max-w-7xl flex flex-col items-center text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4 select-none">
          {user ? (
             <span className="flex items-center justify-center gap-3">
               <UserCheck className="w-8 h-8 text-primary" />
               Espace Personnel
             </span>
          ) : (
             "Le Point Zéro"
          )}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {user ? "Votre configuration est automatiquement sauvegardée. Saisissez une nouvelle commune pour recentrer votre dashboard." : "Saisissez votre commune ou adresse exacte. Le système identifiera automatiquement les outils autour de vous."}
        </p>
      </div>

      <div className="w-full max-w-5xl z-50 mb-12">
        <AddressInput onLocationFound={handleLocationFound} />
      </div>
      
      {/* Dashboard Area */}
      {locationData?.lat && locationData?.lon && (
        <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 items-start relative">
          
          {/* Main Area: Render Active Widgets */}
          <div className="flex-1 w-full flex flex-col gap-6">
            
            {activeWidgets.length === 0 && (
              <div className="h-64 border-2 border-dashed border-neutral-300 rounded-3xl flex flex-col items-center justify-center bg-white/50 text-neutral-400">
                 <BoxSelect className="w-12 h-12 mb-4 opacity-50" />
                 <p className="font-medium">Aucun outil actif. Sélectionnez-en un dans le menu.</p>
              </div>
            )}

            <WidgetWrapper 
              id="fuel" 
              title="Radar Carburant" 
              icon={<Droplet className="w-5 h-5 text-orange-500 fill-orange-50" />} 
              isActive={activeWidgets.includes('fuel')} 
              isMaximized={maximizedWidget === 'fuel'} 
              onToggleMaximize={toggleMaximize} 
              onClose={toggleWidget}
            >
               <FuelRadar lat={locationData.lat} lon={locationData.lon} maximized={maximizedWidget === 'fuel'} />
            </WidgetWrapper>

            <WidgetWrapper 
              id="multimodal" 
              title="Planificateur MaaS (TCO)" 
              icon={<TrainTrack className="w-5 h-5 text-blue-500" />} 
              isActive={activeWidgets.includes('multimodal')} 
              isMaximized={maximizedWidget === 'multimodal'} 
              onToggleMaximize={toggleMaximize} 
              onClose={toggleWidget}
            >
               <RoutePlanner initialOrigin={locationData.address} externalDestination={routeDestination} />
            </WidgetWrapper>

            <WidgetWrapper 
              id="events" 
              title="Vie Locale & Commerces" 
              icon={<Store className="w-5 h-5 text-orange-600" />} 
              isActive={activeWidgets.includes('events')} 
              isMaximized={maximizedWidget === 'events'} 
              onToggleMaximize={toggleMaximize} 
              onClose={toggleWidget}
            >
               <LocalActivityRadar 
                 insee={locationData.insee?.code || '75056'} 
                 lat={locationData.lat} 
                 lon={locationData.lon}
                 user={user}
                 isMaximized={maximizedWidget === 'events'} 
                 defaultRadius={defaultRadius}
                 onRadiusChange={handleRadiusChange}
                 onLaunchItinerary={handleLaunchItinerary}
               />
            </WidgetWrapper>

            <WidgetWrapper 
              id="aids" 
              title="Aides Locales (Bientôt)" 
              icon={<HeartHandshake className="w-5 h-5 text-green-500" />} 
              isActive={activeWidgets.includes('aids')} 
              isMaximized={maximizedWidget === 'aids'} 
              onToggleMaximize={toggleMaximize} 
              onClose={toggleWidget}
            >
               <div className="h-64 flex items-center justify-center text-neutral-400">
                 <p>Analyse des aides au transport à venir...</p>
               </div>
            </WidgetWrapper>

          </div>

          {/* Right Sidebar: Widget Menu */}
          <div className="w-full lg:w-72 shrink-0 bg-white shadow-sm border border-neutral-200 rounded-3xl p-5 sticky top-8 z-40">
            <h3 className="font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <BoxSelect className="w-5 h-5 text-neutral-400" />
              Vos Outils
            </h3>
            <ul className="space-y-3">
              {widgetsList.map(widget => {
                 const isActive = activeWidgets.includes(widget.id);
                 return (
                   <li key={widget.id}>
                     <button
                       onClick={() => toggleWidget(widget.id)}
                       className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isActive 
                            ? 'border-neutral-900 bg-neutral-900 text-white shadow-md' 
                            : 'border-neutral-200 bg-transparent text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                       }`}
                     >
                       <div className="flex items-center gap-3">
                         <div className={`p-1.5 rounded-md ${isActive ? 'bg-white/10' : 'bg-neutral-100'}`}>
                           {widget.icon}
                         </div>
                         <span className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-neutral-700'}`}>
                           {widget.title}
                         </span>
                       </div>
                       
                       {/* Toggle Checkbox visuel */}
                       <div className={`w-10 h-5 rounded-full flex items-center p-0.5 transition-colors ${isActive ? 'bg-white' : 'bg-neutral-300'}`}>
                         <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isActive ? 'translate-x-5 bg-neutral-900' : 'translate-x-0'}`}></div>
                       </div>
                     </button>
                   </li>
                 )
              })}
            </ul>
            <div className="mt-8 pt-6 border-t border-neutral-100 text-xs text-neutral-400 text-center">
               Espace Personnel (Hub B2C) • Sprint 6
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
