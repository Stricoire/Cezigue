"use client";

import { useState } from "react";
import { ArrowRight, Fuel, ChevronDown } from "lucide-react";
import Link from "next/link";
import AddressInput from "@/components/AddressInput";
import FuelRadar from "@/components/FuelRadar";

export default function InteractiveHubStore() {
    const [locationData, setLocationData] = useState<{lat: number, lon: number, address: string} | null>(null);

    return (
        <div className="w-full flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 mt-4">
            
            {/* HEROS SECTION: Centered, Minimalist, Airy */}
            <div className={`w-full max-w-3xl mx-auto flex flex-col items-center text-center transition-all duration-700 ${locationData ? 'mb-4' : 'mb-6'}`}>
                
                {/* Micro-badge dynamique */}
                {!locationData && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider mb-4 border border-primary/20 shadow-sm animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Hub de Mobilité Territoriale
                    </div>
                )}

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-4 leading-[1.1] tracking-tight">
                    L'Essentiel de votre <span className="text-primary">Territoire</span>.
                </h1>
                
                <p className="text-muted-foreground text-sm md:text-base max-w-2xl font-medium mb-6 leading-relaxed">
                    Et si on reprenait le contrôle de nos mobilités ? Entrez votre commune pour déverrouiller votre tableau de bord.
                </p>

                {/* Barre de recherche Google-style */}
                <div className="w-full relative z-50">
                    <AddressInput onLocationFound={setLocationData} />
                </div>
            </div>

            {/* LE DEVOILEMENT (Progressive Disclosure) */}
            {locationData && (
                <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="flex items-center justify-between pb-4 border-b border-border/40">
                        <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
                            <Fuel className="w-6 h-6 text-primary" /> Radar Carburant : {locationData.address}
                        </h2>
                        <Link href={`/services?lat=${locationData.lat}&lon=${locationData.lon}&address=${encodeURIComponent(locationData.address)}`} className="text-sm font-bold bg-foreground text-background px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-primary transition-all shadow-md group">
                            Ouvrir le Hub Complet
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="w-full bg-card shadow-2xl shadow-primary/5 border border-border/80 rounded-[2rem] p-6 relative overflow-hidden">
                        <FuelRadar lat={locationData.lat} lon={locationData.lon} maximized={false} />
                    </div>
                    
                    {/* Liens secondaires très épurés vers les autres services */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <Link href={`/services?lat=${locationData.lat}&lon=${locationData.lon}&address=${encodeURIComponent(locationData.address)}`} className="bg-muted/50 border border-border/50 p-4 rounded-xl flex items-center justify-between hover:bg-muted transition-colors group">
                            <span className="font-semibold text-sm">Voir les Événements Locaux</span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </Link>
                        <Link href="/incubator/pitch" className="bg-muted/50 border border-border/50 p-4 rounded-xl flex items-center justify-between hover:bg-muted transition-colors group">
                            <span className="font-semibold text-sm">Découvrir le Startup Studio B2B</span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </Link>
                    </div>
                </div>
            )}

            {/* L'Indicateur de Scroll a été supprimé pour éviter la surcharge visuelle */}
        </div>
    );
}
