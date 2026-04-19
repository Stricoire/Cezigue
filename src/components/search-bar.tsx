"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState, FormEvent } from "react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const currentRegion = searchParams.get("region");

  const [query, setQuery] = useState(initialQuery);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (currentRegion && currentRegion !== "Toutes") {
      params.set("region", currentRegion);
    }
    if (query.trim()) {
      params.set("q", query.trim());
    }
    
    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : "?");
  };

  return (
    <form onSubmit={handleSearch} className="w-full relative mb-6">
      <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden p-1 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400">
        <div className="pl-4 text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un sujet ou un mot-clé parmi les analyses..."
          className="w-full h-12 bg-transparent text-sm md:text-base border-none focus:outline-none focus:ring-0 px-4 text-slate-700 placeholder:text-slate-400"
        />
        <button
          type="submit"
          className="h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors whitespace-nowrap"
        >
          Filtrer
        </button>
      </div>
    </form>
  );
}
