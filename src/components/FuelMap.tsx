"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix leaflet missing default icons in Next.js environment
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

export default function FuelMap({ stations, targetLat, targetLon, selectedStationId, onStationSelect, type = "fuel" }: { stations: any[], targetLat?: number, targetLon?: number, selectedStationId?: string | null, onStationSelect?: (id: string) => void, type?: "fuel" | "ev" }) {
  if (stations.length === 0) return null;

  // Calcul du centre sur le Point Zéro cible, sinon sur la première station valide
  const validStations = stations.filter((s) => s.lat && s.lon);
  if (validStations.length === 0 && (!targetLat || !targetLon)) return null;

  const center: [number, number] = targetLat && targetLon 
    ? [targetLat, targetLon] 
    : [validStations[0].lat, validStations[0].lon];

  // MapContainer de React-Leaflet ne met pas à jour son centre automatiquement
  function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
       map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
  }

  const themeColor600 = type === "ev" ? "bg-blue-600" : "bg-amber-700";

  return (
    <div className="h-64 md:h-80 w-full rounded-2xl overflow-hidden shadow-sm border border-neutral-200 mt-2 mb-6 relative z-0">
      <MapContainer key="fuel-map-zoom-enabled" center={center} zoom={12} scrollWheelZoom={true} className="h-full w-full z-0">
        <ChangeView center={center} />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {/* Marqueur du point zéro (adresse tapée) */}
        {targetLat && targetLon && (
           <Marker 
             position={[targetLat, targetLon]}
             icon={L.divIcon({
               className: 'bg-transparent',
               html: `<div class="w-6 h-6 bg-orange-500 border-4 border-white rounded-full shadow-md animate-pulse"></div>`,
               iconSize: [24, 24],
               iconAnchor: [12, 12]
             })}
            >
             <Popup>Votre point d&apos;ancrage Péri-rural</Popup>
           </Marker>
        )}

        {/* Marqueurs des stations carburants/EV */}
        {validStations.map((station, idx) => {
          const isSelected = selectedStationId === station.id;
          
          return (
          <Marker 
            key={`map-key-${station.id}-${idx}`} 
            position={[station.lat, station.lon]}
            icon={L.divIcon({
               className: 'bg-transparent',
               html: `<div class="w-12 h-12 flex flex-col items-center justify-center -translate-y-4 transition-transform duration-300 ${isSelected ? 'scale-125 z-50' : 'scale-100 z-10'}">
                        <div class="absolute -top-3 whitespace-nowrap bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-neutral-700 shadow-sm border border-neutral-200 max-w-[100px] truncate">
                           ${station.nom}
                        </div>
                        <div class="w-5 h-5 ${themeColor600} rounded-full flex items-center justify-center shadow-md border-2 border-white mt-1">
                          <div class="w-1.5 h-1.5 ${isSelected ? 'bg-white' : 'bg-transparent'} rounded-full"></div>
                        </div>
                        <div class="absolute bottom-[0.3rem] w-1.5 h-1.5 ${themeColor600} rotate-45 -z-10"></div>
                      </div>`,
               iconSize: [48, 48],
               iconAnchor: [24, 40] // Center base of the pin
            })}
            eventHandlers={{
              click: (e) => {
                if (onStationSelect) onStationSelect(station.id);
                const map = e.target._map;
                map.setView([station.lat, station.lon], 14, { animate: true });
              }
            }}
          >
            <Popup className="rounded-2xl">
              <div className="text-sm p-1">
                <strong className="text-neutral-900 block mb-1">{station.nom}</strong>
                <span className="text-neutral-500 text-xs block mb-3 lowercase capitalize">{station.adresse} {station.distance ? `(à ${Math.round(station.distance)}km)` : ''}</span>
                <div className="flex flex-col gap-1.5">
                  {station.carburants.map((c: any, i: number) => (
                     <div key={i} className="flex justify-between items-center text-xs bg-neutral-100 rounded px-2 py-1">
                      <span className="font-bold text-neutral-500 tracking-tight">{c.nom}</span>
                      <span className="font-extrabold text-neutral-900 ml-3">
                        {typeof c.valeur === 'number' && !isNaN(c.valeur) ? `${c.valeur.toFixed(3)}${c.isEv ? '€/kWh' : '€'}` : c.valeur}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        )})}
      </MapContainer>
    </div>
  );
}
