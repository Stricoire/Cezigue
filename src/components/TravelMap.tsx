"use client";

import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

import { POI_TAXONOMY } from "@/config/poi_taxonomy";

const getPoiIcon = (metaCategory?: string) => {
  let leafletColor = "blue";
  
  if (metaCategory && POI_TAXONOMY[metaCategory]) {
     const tailwindColor = POI_TAXONOMY[metaCategory].theme.color;
     
     // Mapping Tailwind colors -> Leaflet Marker colors (blue, gold, red, green, orange, yellow, violet, grey, black)
     const colorMap: Record<string, string> = {
        'amber': 'orange',
        'red': 'red',
        'slate': 'grey',
        'fuchsia': 'violet',
        'cyan': 'blue',
        'lime': 'green',
        'emerald': 'green',
        'orange': 'orange',
        'indigo': 'violet',
        'blue': 'blue'
     };
     leafletColor = colorMap[tailwindColor] || 'blue';
  }
  
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${leafletColor}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const getRefuelIcon = () => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

function ChangeView({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function TravelMap({ coordinates, pois, refuelStops = [] }: { coordinates: number[][], pois: any[], refuelStops?: any[] }) {
  let bounds: L.LatLngBounds | null = null;
  if (coordinates && coordinates.length > 0) {
    bounds = L.latLngBounds(coordinates as any);
  } else if (pois && pois.length > 0) {
    bounds = L.latLngBounds(pois.map(p => [p.lat, p.lon]));
  }

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-neutral-200 shadow-inner z-0 relative">
      <MapContainer 
        center={[46.2276, 2.2137]} // Centre France par défaut
        zoom={6} 
        scrollWheelZoom={true} 
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.fr/">OSM France</a>'
          url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
        />

        {bounds && <ChangeView bounds={bounds} />}

        {coordinates && coordinates.length > 0 && (
          <Polyline 
            positions={coordinates as any} 
            pathOptions={{ color: "#0ea5e9", weight: 5, opacity: 0.8 }} 
          />
        )}
        
        {coordinates && coordinates.length > 0 && (
           <>
              <Marker position={coordinates[0] as any} icon={customIcon}>
                 <Popup>Départ</Popup>
              </Marker>
              <Marker position={coordinates[coordinates.length - 1] as any} icon={customIcon}>
                 <Popup>Arrivée</Popup>
              </Marker>
           </>
        )}

        {pois && pois.map((poi) => (
          <Marker key={poi.id} position={[poi.lat, poi.lon]} icon={getPoiIcon(poi.metaCategory)}>
            <Popup>
              <div className="font-bold">{poi.title}</div>
              <div className="text-xs text-neutral-500 font-bold uppercase">{poi.type}</div>
              <div className="text-xs mt-1 mb-2">{poi.city}</div>
              <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      const card = document.getElementById(`poi-card-${poi.id}`);
                      if (card) {
                          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                  }}
                  className="w-full flex justify-center items-center bg-neutral-100 text-neutral-700 font-bold text-[10px] uppercase py-1.5 rounded-md hover:bg-neutral-200 transition-colors border border-neutral-200"
                >
                  Voir dans la liste
              </button>
            </Popup>
          </Marker>
        ))}

        {refuelStops && refuelStops.map((stop, idx) => (
          <Marker key={`refuel-${idx}`} position={[stop.lat, stop.lon]} icon={getRefuelIcon()}>
            <Popup>
              <div className="font-bold text-neutral-900">Arrêt Technique (Km {stop.km})</div>
              {stop.station && (
                <>
                   <div className="text-xs font-semibold text-neutral-600 mt-1">{stop.station.name}</div>
                   <div className="text-xs text-neutral-500">{stop.station.city}</div>
                   {stop.station.prices && (
                     <div className="text-xs font-bold text-emerald-600 mt-1">{stop.station.prices}€</div>
                   )}
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
