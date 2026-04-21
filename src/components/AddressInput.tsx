"use client";

import { useState, useEffect } from "react";
import { Search, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  properties: {
    id: string;
    label: string;
    score: number;
    city: string;
    context: string;
  };
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
}

export default function AddressInput({ onLocationFound }: { onLocationFound?: (data: any) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        if (data.features) {
          setResults(data.features);
          setIsOpen(true);
        }
      } catch (e) {
        console.error("Erreur géocodage:", e);
      } finally {
        setIsLoading(false);
      }
    }, 500); // debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = async (feature: Feature) => {
    setQuery(feature.properties.label);
    setIsOpen(false);
    
    // On extrait lat/lon
    const [lon, lat] = feature.geometry.coordinates;

    try {
      // Échographie Administrative (Tech 4.2)
      const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
      const echographieData = await res.json();
      
      if (onLocationFound) {
         // On remonte les données au Dashboard (Hub)
         onLocationFound({
           lat, 
           lon, 
           address: feature.properties.label,
           insee: echographieData
         });
      } else {
         // Comportement par défaut (Page d'accueil) : on redirige vers le Hub
         window.location.href = `/services?lat=${lat}&lon=${lon}&address=${encodeURIComponent(feature.properties.label)}`;
      }
    } catch (e) {
      console.error("Erreur serveur geocode:", e);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className={cn(
        "relative flex items-center w-full rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-neutral-100 transition-all duration-300",
        isOpen && results.length > 0 ? "rounded-b-none shadow-none" : ""
      )}>
        <Search className="absolute left-6 text-neutral-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Renseignez votre commune ou rue (Point Zéro)..."
          className="w-full py-5 pl-14 pr-6 bg-transparent outline-none text-neutral-700 text-lg placeholder:text-neutral-400"
        />
        {isLoading && (
          <div className="absolute right-6 w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-neutral-100 shadow-[0_12px_40px_rgba(0,0,0,0.1)] rounded-b-2xl overflow-hidden z-50">
          <ul className="flex flex-col">
            {results.map((feature) => (
              <li 
                key={feature.properties.id}
                onClick={() => handleSelect(feature)}
                className="flex items-center px-6 py-4 hover:bg-neutral-50 cursor-pointer transition-colors border-b border-neutral-50 last:border-0"
              >
                <div className="bg-primary/10 p-2 rounded-full mr-4 text-primary shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-neutral-800">{feature.properties.label}</p>
                  <p className="text-sm text-neutral-500">{feature.properties.context}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
