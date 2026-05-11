'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, MapPin } from 'lucide-react';

const LocalActivityMap = dynamic(() => import("@/components/LocalActivityMap"), { ssr: false });

export function ServiceRenderer({ service }: { service: any }) {
  const [pois, setPois] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Défaut : Centre de la France
  const [center, setCenter] = useState<[number, number]>([46.2276, 2.2137]);

  useEffect(() => {
    // 1. Essayer de récupérer la position de l'utilisateur
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter([pos.coords.latitude, pos.coords.longitude]);
          fetchData(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Fallback Paris
          const defaultLat = 48.8566;
          const defaultLon = 2.3522;
          setCenter([defaultLat, defaultLon]);
          fetchData(defaultLat, defaultLon);
        }
      );
    } else {
      fetchData(center[0], center[1]);
    }
  }, []);

  const fetchData = async (lat: number, lon: number) => {
    try {
      const { categories, radius } = service.config_json;
      let url = `/api/poi?lat=${lat}&lon=${lon}&radius=${radius || 5000}`;
      
      if (categories && categories.length > 0) {
        url += `&categories=${categories.join(',')}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur de récupération des données");

      setPois(data.pois || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[600px] w-full bg-card rounded-3xl border border-border/40 flex items-center justify-center flex-col gap-4 shadow-sm">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Initialisation du service sur-mesure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-500/10 text-red-500 rounded-xl border border-red-500/30">
        Erreur d'exécution du micro-service : {error}
      </div>
    );
  }

  const isMap = service.config_json.type === 'map';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between bg-card p-6 rounded-2xl border border-border/40 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-foreground">{service.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-wider">
            {pois.length} Résultats
          </span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
            Rayon : {(service.config_json.radius || 5000) / 1000} km
          </span>
        </div>
      </div>

      {isMap ? (
        <div className="h-[600px] w-full rounded-3xl overflow-hidden border-2 border-border shadow-md relative z-0">
           <LocalActivityMap pois={pois} center={center} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pois.map((poi, idx) => (
            <div key={idx} className="bg-card p-4 rounded-xl border border-border/40 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-foreground text-sm line-clamp-1">{poi.name || "Lieu sans nom"}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{(poi.tags && poi.tags.description) || "Aucune description"}</p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {poi.type || "POI"}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                  <MapPin className="w-3 h-3" /> {(poi.distance / 1000).toFixed(1)} km
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
