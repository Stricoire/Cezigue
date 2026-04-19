"use client";

import { useState } from "react";
import AddressInput from "@/components/AddressInput";
import FuelRadar from "@/components/FuelRadar";
import RoutePlanner from "@/components/RoutePlanner";
import WidgetWrapper from "@/components/WidgetWrapper";
import { ArrowLeft, Droplet, TrainTrack, HeartHandshake, BoxSelect } from "lucide-react";
import Link from "next/link";

export default function ServicesPage() {
  const [locationData, setLocationData] = useState<any>(null);
  
  // Dashboard Widget State
  const [activeWidgets, setActiveWidgets] = useState<string[]>(['fuel']);
  const [maximizedWidget, setMaximizedWidget] = useState<string | null>(null);

  const toggleWidget = (id: string) => {
    if (activeWidgets.includes(id)) {
      setActiveWidgets(activeWidgets.filter(w => w !== id));
      if (maximizedWidget === id) setMaximizedWidget(null);
    } else {
      setActiveWidgets([...activeWidgets, id]);
    }
  };

  const toggleMaximize = (id: string) => {
    setMaximizedWidget(prev => prev === id ? null : id);
  };

  const widgetsList = [
    { id: 'fuel', title: 'Radar Carburant', icon: <Droplet className="w-5 h-5 text-orange-500" /> },
    { id: 'multimodal', title: 'Offre Multimodale', icon: <TrainTrack className="w-5 h-5 text-blue-500" /> },
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
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
          Le Point Zéro
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Saisissez votre commune ou adresse exacte. Le système identifiera automatiquement les outils autour de vous.
        </p>
      </div>

      <div className="w-full max-w-5xl z-50 mb-12">
        <AddressInput onLocationFound={setLocationData} />
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
               <RoutePlanner initialOrigin={locationData.address} />
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
               Dashboard Péri-rural • Sprint 3
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
