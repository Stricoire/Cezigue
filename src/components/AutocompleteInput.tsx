"use client";

import { useState, useEffect, useRef } from "react";
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

interface AutocompleteInputProps {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onSelect?: (coordinates: [number, number], label: string) => void;
  icon?: React.ReactNode;
  className?: string;
}

export default function AutocompleteInput({ placeholder, value, onChange, onSelect, icon, className }: AutocompleteInputProps) {
  const [results, setResults] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Ferme le menu si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Recherche BAN (Base Adresse Nationale)
  useEffect(() => {
    // Si la recherche est trop courte, on vide
    if (value.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&limit=5`);
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
    }, 400); // debounce

    return () => clearTimeout(timer);
  }, [value]);

  const handleSelect = (feature: Feature) => {
    onChange(feature.properties.label);
    setIsOpen(false);
    if (onSelect) {
      onSelect(feature.geometry.coordinates, feature.properties.label);
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={wrapperRef}>
      <div className="flex items-center gap-4 relative">
        <div className="w-12 h-12 bg-white border-2 border-neutral-200 rounded-full flex items-center justify-center z-10 shadow-sm shrink-0">
          {icon || <Search className="w-5 h-5 text-neutral-400" />}
        </div>
        <div className="flex-1 relative">
           <input
             type="text"
             value={value}
             onChange={(e) => {
               onChange(e.target.value);
               setIsOpen(true); // rouvre quand on tape
             }}
             placeholder={placeholder}
             className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
           />
           {isLoading && (
             <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
           )}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-[calc(100%+8px)] left-[64px] right-0 bg-white border border-neutral-200 shadow-xl rounded-xl overflow-hidden z-50">
          <ul className="flex flex-col max-h-60 overflow-y-auto">
            {results.map((feature) => (
              <li 
                key={feature.properties.id}
                onClick={() => handleSelect(feature)}
                className="flex items-start px-4 py-3 hover:bg-neutral-50 cursor-pointer transition-colors border-b border-neutral-100 last:border-0"
              >
                <MapPin className="w-4 h-4 text-indigo-500 mt-1 shrink-0 mr-3" />
                <div className="text-left">
                  <p className="font-semibold text-neutral-800 text-sm leading-tight">{feature.properties.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{feature.properties.context}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
