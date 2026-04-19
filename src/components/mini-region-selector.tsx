"use client";

import { useRouter } from "next/navigation";

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

export default function MiniRegionSelector({ currentRegion }: { currentRegion: string }) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const region = e.target.value;
    if (region === "Toutes") {
      router.push("?");
    } else {
      router.push(`?region=${encodeURIComponent(region)}`);
    }
  };

  return (
    <select 
      value={currentRegion}
      onChange={handleChange}
      className="w-full text-xs font-bold bg-muted/30 border border-muted-foreground/20 text-foreground py-1 px-2 rounded-md outline-none focus:border-primary/50 cursor-pointer appearance-none"
    >
      {REGIONS.map(r => (
        <option key={r} value={r}>{r === "Toutes" ? "🌍 Toutes les régions" : r}</option>
      ))}
    </select>
  );
}
