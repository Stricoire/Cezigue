"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Map, MapPin } from "lucide-react";

const REGIONS = [
  "Toutes",
  "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté",
  "Bretagne",
  "Centre-Val de Loire",
  "Corse",
  "Grand Est",
  "Guadeloupe",
  "Guyane",
  "Hauts-de-France",
  "Île-de-France",
  "La Réunion",
  "Martinique",
  "Mayotte",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Côte d'Azur"
];

export default function RegionSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRegion = searchParams.get("region") || "Toutes";

  const handleRegionClick = (region: string) => {
    if (region === "Toutes") {
      router.push("?"); // reset URL
    } else {
      router.push(`?region=${encodeURIComponent(region)}`);
    }
  };

  return (
    <div className="w-full bg-card border border-muted-foreground/20 rounded-2xl p-6 mb-8 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Map className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-foreground">Sélecteur Géographique (PQR)</h2>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((r) => {
          const isActive = r === currentRegion;
          
          return (
            <button
              key={r}
              onClick={() => handleRegionClick(r)}
              className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-colors flex items-center gap-1.5
                ${isActive 
                  ? "bg-primary text-primary-foreground border-primary shadow-md" 
                  : "bg-background border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }
              `}
            >
              {isActive && r !== "Toutes" && <MapPin className="w-3 h-3" />}
              {r}
            </button>
          );
        })}
      </div>
    </div>
  );
}
