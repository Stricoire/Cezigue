"use client";

import { useState, useEffect } from "react";
import AddressInput from "@/components/AddressInput";
import FuelRadar from "@/components/FuelRadar";
import RoutePlanner from "@/components/RoutePlanner";
import WidgetWrapper from "@/components/WidgetWrapper";
import LocalActivityRadar from "@/components/LocalActivityRadar";
import TravelPlanner from "@/components/TravelPlanner";
import NewsWidget from "@/components/NewsWidget";
import { ArrowLeft, Droplet, TrainTrack, HeartHandshake, BoxSelect, CalendarDays, UserCheck, Store, Compass, Activity } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function ServicesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [locationData, setLocationData] = useState<any>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  
  // Dashboard Widget State
  const [activeWidgets, setActiveWidgets] = useState<string[]>(['fuel']);
  const [maximizedWidget, setMaximizedWidget] = useState<string | null>(null);
  const [defaultRadius, setDefaultRadius] = useState<number>(15);
  
  const [viewMode, setViewMode] = useState<'native' | 'custom'>('native');
  const [customServices, setCustomServices] = useState<any[]>([]);

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
      if (user) {
        setUser(user);
        const { data: mServices } = await supabase.from('user_microservices').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (mServices) setCustomServices(mServices);
      }

      if (user) {
        const { data: prefs } = await supabase.from('user_preferences').select('*').eq('id', user.id).single();
        if (prefs) {
          setIsPremium(prefs.subscription_status === 'ACTIVE');
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

  const handleDeleteService = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce micro-service ?")) return;
    
    try {
      const res = await fetch(`/api/microservices/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Erreur serveur");
      setCustomServices(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert("Impossible de supprimer le service.");
    }
  };

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const widgetsList = [
    { id: 'fuel', title: 'Radar Carburant', image: '/b2c/radar_iso.png', icon: <Droplet className="w-5 h-5 text-orange-600" /> },
    { id: 'multimodal', title: 'Planificateur', image: '/b2c/multimodal_iso.png', icon: <TrainTrack className="w-5 h-5 text-blue-600" /> },
    { id: 'events', title: 'Vie Locale', image: '/b2c/datatourisme_iso.png', icon: <Store className="w-5 h-5 text-orange-600" /> },
    { id: 'travel-planner', title: 'Travel Planner', image: '/b2c/travel_planner_iso.png', icon: <Compass className="w-5 h-5 text-emerald-600" /> },
    { id: 'news', title: 'Le Flux', image: '/b2c/vintage_newsstand_iso.png', icon: <Activity className="w-5 h-5 text-primary" /> },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-[#fff5eb]">
      <div className="w-full max-w-7xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
         <Link href="/" className="flex items-center text-sm font-medium text-zinc-600 hover:text-primary transition-colors">
           <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l&apos;accueil
         </Link>
         <h1 className="text-2xl font-black tracking-tight text-zinc-900 hidden md:block">Mobilité Péri-rurale</h1>
         {user && (
           <div className="flex items-center gap-3">
             <button onClick={() => isPremium ? router.push('/dashboard/studio') : setShowPremiumModal(true)} className="text-sm font-bold text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-full transition-colors flex items-center gap-2 shadow-sm">
               ✨ Studio IA
             </button>
             <Link href="/dashboard/mes-services" className="text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-full transition-colors flex items-center gap-2">
               Mes Services
             </Link>
             <Link href="/dashboard/billing" className="text-sm font-bold text-neutral-600 hover:text-primary bg-white border border-neutral-200 hover:border-primary/50 px-4 py-2 rounded-full transition-colors flex items-center gap-2">
               Abonnement
             </Link>
             <button onClick={handleLogout} className="text-sm font-bold text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-full transition-colors">
               Se déconnecter
             </button>
           </div>
         )}
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

      <div className="w-full max-w-5xl z-50 mb-8">
        <AddressInput onLocationFound={handleLocationFound} />
      </div>

      {/* View Toggle */}
      {locationData?.lat && locationData?.lon && user && (
        <div className="w-full max-w-7xl mb-6 flex justify-center">
          <div className="bg-white p-1 rounded-full shadow-sm border border-border/50 inline-flex">
            <button 
              onClick={() => setViewMode('native')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${viewMode === 'native' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Les services Cézigue
            </button>
            <button 
              onClick={() => setViewMode('custom')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${viewMode === 'custom' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Mes micro-services
            </button>
          </div>
        </div>
      )}
      
      {/* Tool Selection */}
      {locationData?.lat && locationData?.lon && (
        <div className="w-full max-w-7xl mb-12">
          {viewMode === 'native' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {widgetsList.map(widget => {
                const isActive = activeWidgets.includes(widget.id);
                return (
                  <button
                    key={widget.id}
                    onClick={() => toggleWidget(widget.id)}
                    className={`relative overflow-hidden rounded-2xl shadow-sm border-2 transition-all duration-300 text-left group ${isActive ? 'border-primary shadow-md' : 'border-transparent border-zinc-200/60 hover:border-zinc-300'}`}
                  >
                    <div className="relative w-full h-24 md:h-32 bg-white/50">
                      <Image src={widget.image} alt={widget.title} fill className={`object-cover transition-transform duration-500 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <div className="bg-white p-1.5 rounded-full shadow-sm">
                          {widget.icon}
                        </div>
                        <span className="text-white font-bold text-sm drop-shadow-md leading-tight">{widget.title}</span>
                      </div>
                      {/* Checkbox Icon */}
                      <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isActive ? 'bg-primary border-primary' : 'bg-black/20 border-white/80'}`}>
                        {isActive && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {customServices.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  Vous n'avez pas encore créé de micro-services.
                  <br/>
                  <button onClick={() => isPremium ? router.push('/dashboard/studio') : setShowPremiumModal(true)} className="text-primary hover:underline font-bold mt-2 inline-block">Créer mon premier service</button>
                </div>
              )}
              {customServices.map(service => (
                <div key={service.id} className="relative overflow-hidden rounded-2xl shadow-sm border-2 border-transparent border-zinc-200/60 hover:border-zinc-300 transition-all duration-300 group flex flex-col bg-white">
                  <div className="relative w-full h-32 bg-white/50">
                    {service.config_json?.image_url && (
                      <Image src={service.config_json.image_url} alt={service.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-white font-black text-sm drop-shadow-md leading-tight line-clamp-2">{service.title}</span>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between bg-white border-t border-border/40">
                    <Link href={`/dashboard/mes-services/${service.id}`} className="text-xs font-bold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-lg">Ouvrir</Link>
                    <div className="flex items-center gap-3">
                      <button onClick={() => isPremium ? router.push(`/dashboard/studio?edit=${service.id}`) : setShowPremiumModal(true)} className="text-xs font-bold text-muted-foreground hover:text-foreground">Éditer</button>
                      <button 
                        onClick={() => handleDeleteService(service.id)} 
                        className="text-xs font-bold text-red-500 hover:text-red-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dashboard Area */}
      {locationData?.lat && locationData?.lon && (
        <div className="w-full max-w-7xl flex flex-col gap-8 items-start relative">
          
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
              id="news" 
              title="Le Flux d'Intelligence" 
              icon={<Activity className="w-5 h-5 text-indigo-500" />} 
              isActive={activeWidgets.includes('news')} 
              isMaximized={maximizedWidget === 'news'} 
              onToggleMaximize={toggleMaximize} 
              onClose={toggleWidget}
            >
               <NewsWidget region={locationData.address?.state || locationData.address?.region || "Toutes"} user={user} />
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
              id="travel-planner" 
              title="Travel Planner" 
              icon={<Compass className="w-5 h-5 text-emerald-500" />} 
              isActive={activeWidgets.includes('travel-planner')} 
              isMaximized={maximizedWidget === 'travel-planner'} 
              onToggleMaximize={toggleMaximize} 
              onClose={toggleWidget}
            >
               <TravelPlanner 
                 user={user} 
                 locationData={locationData} 
                 maximized={maximizedWidget === 'travel-planner'} 
               />
            </WidgetWrapper>

          </div>
        </div>
      )}

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ✨
            </div>
            <h3 className="text-xl font-black text-zinc-900 mb-2">Passez au niveau supérieur</h3>
            <p className="text-muted-foreground mb-6">
              Pour pouvoir créer vous-même vos propres micro-services et avoir accès à notre capacité d'IA, vous devez prendre un compte premium. Ces capacités requièrent de la puissance de calcul et induisent des coûts de token, c'est pour cela que ce service est payant.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard/billing" className="w-full font-bold text-white bg-primary hover:bg-primary/90 px-4 py-3 rounded-xl transition-colors">
                Voir les possibilités d'abonnement
              </Link>
              <button onClick={() => setShowPremiumModal(false)} className="w-full font-bold text-zinc-500 hover:bg-zinc-100 px-4 py-3 rounded-xl transition-colors">
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
