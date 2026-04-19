"use client";

import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, FeatureGroup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Correction des icônes Leaflet dans Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const trainIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component pour recentrer automatiquement la carte sur les tracés
function ChangeView({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function RouteMap({ routes, selectedRouteId }: { routes: any[], selectedRouteId: string | null }) {
  
  // Calcul dynamique de la vue
  let bounds: L.LatLngBounds | null = null;
  if (routes && routes.length > 0) {
    const allCoords = routes.flatMap(r => r.coordinates);
    if (allCoords.length > 0) {
      bounds = L.latLngBounds(allCoords);
    }
  }

  return (
    <div className="h-64 md:h-80 w-full rounded-2xl overflow-hidden border border-neutral-200 shadow-inner z-0">
      <MapContainer 
        center={[43.6047, 1.4442]} // Toulouse par défaut
        zoom={10} 
        scrollWheelZoom={true} 
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {bounds && <ChangeView bounds={bounds} />}

        {routes.map((route) => {
          const isSelected = selectedRouteId === route.id;
          const isIntermodal = route.id.includes("intermodal");
          
          // Style de la ligne en fonction de la sélection
          const color = isIntermodal ? "#4F46E5" : "#525252"; // Indigo // Neutral
          const weight = isSelected ? 6 : 3;
          const opacity = isSelected ? 1 : 0.4;
          const dashArray = isIntermodal ? "10, 10" : undefined; // Pointillés pour le train

          return (
            <FeatureGroup key={route.id}>
              <Polyline 
                positions={route.coordinates} 
                pathOptions={{ color, weight, opacity, dashArray }} 
              />
              
              {isSelected && (
                <>
                  <Marker position={route.coordinates[0]} icon={customIcon}>
                     <Popup>Départ</Popup>
                  </Marker>
                  <Marker position={route.coordinates[route.coordinates.length - 1]} icon={customIcon}>
                     <Popup>Arrivée</Popup>
                  </Marker>
                  {isIntermodal && route.hubCoordinate && (
                    <Marker position={route.hubCoordinate} icon={trainIcon}>
                       <Popup>Gare Relais (P+R)</Popup>
                    </Marker>
                  )}
                </>
              )}
            </FeatureGroup>
          );
        })}
      </MapContainer>
    </div>
  );
}
