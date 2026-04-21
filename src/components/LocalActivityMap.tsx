"use client";
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Store, CalendarDays, Pill } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import dynamic from 'next/dynamic';
import { getPoiTheme } from './LocalActivityRadar';

const HeatmapLayer = dynamic(() => import('./HeatmapLayer'), { ssr: false });

// Fix leaflet missing default icons in Next.js environment
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const getMarkerHtml = (poi: any, isSelected: boolean) => {
  const theme = getPoiTheme(poi);
  const bgColor = theme.bgSolid;
  let iconComponent = <Store className="w-4 h-4 text-white" />;
  
  if (poi.categories?.[0] === "Santé" || poi.type === "Pharmacie") { iconComponent = <Pill className="w-4 h-4 text-white"/>; }
  else if (poi.categories?.[0] === "Événement Culturel" || poi.type === "Activité Touristique" || poi.type === "Parc d'attraction") { iconComponent = <CalendarDays className="w-4 h-4 text-white" />; }
  
  const iconStr = ReactDOMServer.renderToString(iconComponent);
  
  return `<div class="w-12 h-12 flex flex-col items-center justify-center -translate-y-4 transition-transform duration-300 ${isSelected ? 'scale-125 z-[9999]' : 'scale-100 z-10'}">
              <div class="absolute -top-3 whitespace-nowrap bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-neutral-700 shadow-sm border border-neutral-200 max-w-[100px] truncate">
                  ${poi.title}
              </div>
              <div class="w-7 h-7 ${bgColor} rounded-full flex items-center justify-center shadow-lg border-2 border-white mt-1">
                ${iconStr}
              </div>
              <div class="absolute bottom-[0.3rem] w-2 h-2 ${bgColor} rotate-45 -z-10 shadow-sm"></div>
            </div>`;
};

interface LocalActivityMapProps {
  pois: any[];
  targetLat?: string;
  targetLon?: string;
  selectedPoiId?: string | null;
  onPoiSelect?: (id: string) => void;
  mapMode?: 'normal' | 'vibe' | 'freshness';
  heatmapPoints?: Array<[number, number, number]>;
  user?: any;
  onReviewSubmitted?: () => void;
}

export default function LocalActivityMap({ 
  pois, targetLat, targetLon, selectedPoiId, onPoiSelect,
  mapMode = 'normal', heatmapPoints = [], user, onReviewSubmitted
}: LocalActivityMapProps) {
  if (pois.length === 0 && (!targetLat || !targetLon) && heatmapPoints.length === 0) return null;

  const validPois = pois.filter((p) => p.lat && p.lon);
  
  const selectedPoi = validPois.find(p => p.id === selectedPoiId);
  const center: [number, number] = selectedPoi 
    ? [selectedPoi.lat, selectedPoi.lon]
    : targetLat && targetLon 
      ? [parseFloat(targetLat), parseFloat(targetLon)] 
      : (validPois[0] ? [validPois[0].lat, validPois[0].lon] : [43.6, 1.4]); // Toulouse par défaut

  function ChangeView({ center, isSelected }: { center: [number, number], isSelected: boolean }) {
    const map = useMap();
    useEffect(() => {
       if (!map || !map.setView) return;
       
       // Le timeout évite le bug classique Leaflet "_leaflet_pos" en développement lié au React StrictMode React 18
       // qui démonte/remonte les composants trop vite.
       const t = setTimeout(() => {
           try {
               const currentZoom = map.getZoom();
               map.setView(center, isSelected ? 15 : currentZoom, { animate: true });
           } catch(e) {
               console.warn("Leaflet setView error mitigated:", e);
           }
       }, 50);
       
       return () => clearTimeout(t);
    }, [center, map, isSelected]);
    return null;
  }

  const isHeatmapActive = mapMode !== 'normal';
  const tileUrl = mapMode === 'vibe' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark theme for nightlife vibe
    : mapMode === 'freshness' 
      ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Normal/greenish theme for freshness
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden bg-neutral-100 mt-2 lg:mt-0 mb-6 lg:mb-0 relative z-0">
      <MapContainer key="activity-map-zoom-enabled" center={center} zoom={isHeatmapActive ? 14 : 13} scrollWheelZoom={true} className="h-full w-full z-0">
        <ChangeView center={center} isSelected={!!selectedPoi && !isHeatmapActive} />
        <TileLayer
          key={tileUrl}
          attribution='&copy; OpenStreetMap & CartoDB'
          url={tileUrl}
        />

        {isHeatmapActive && heatmapPoints.length > 0 && (
           <HeatmapLayer points={heatmapPoints} mode={mapMode as 'vibe' | 'freshness'} />
        )}
        
        {targetLat && targetLon && (
           <Marker 
             position={[parseFloat(targetLat), parseFloat(targetLon)]}
             icon={L.divIcon({
               className: 'bg-transparent',
               html: `<div class="w-6 h-6 bg-rose-500 border-4 border-white ${isHeatmapActive ? 'border-neutral-900' : ''} rounded-full shadow-md animate-pulse"></div>`,
               iconSize: [24, 24],
               iconAnchor: [12, 12]
             })}
            >
             <Popup>Votre position d&apos;ancrage</Popup>
           </Marker>
        )}

        {/* Affichage des marqueurs POIs classiques EN MÊME TEMPS que la Heatmap, comme demandé */}
        {validPois.map((poi, idx) => {
          const isSelected = selectedPoiId === poi.id;
          
          return (
          <Marker 
            key={`map-key-${poi.id}-${idx}`} 
            position={[poi.lat, poi.lon]}
            icon={L.divIcon({
               className: 'bg-transparent',
               html: getMarkerHtml(poi, isSelected),
               iconSize: [48, 48],
               iconAnchor: [24, 40] 
            })}
            eventHandlers={{
              click: (e) => {
                if (onPoiSelect) onPoiSelect(poi.id);
                const map = e.target._map;
                map.setView([poi.lat, poi.lon], 15, { animate: true });
              }
            }}
          >
            <Popup className="rounded-2xl">
              <div className="text-sm p-1 max-w-[200px]">
                <strong className="text-neutral-900 block mb-1">{poi.title}</strong>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider mb-2 inline-block ${getPoiTheme(poi).bg} ${getPoiTheme(poi).text} border ${getPoiTheme(poi).border}`}>
                    {poi.type}
                </span>
                <p className="text-neutral-500 text-xs block mb-2">{poi.distance ? `À ${poi.distance}` : ''}</p>
                
                {poi.isDutyPharmacy && (
                    <div className="bg-red-50 text-red-600 font-bold text-xs p-1.5 border border-red-200 rounded mb-2">
                      ⚠️ Pharmacie de Garde probable (24/7)
                    </div>
                )}
                
                {poi.openingHours && (
                   <div className="text-xs bg-slate-50 p-2 rounded border border-slate-100 text-slate-700 font-mono mt-1 whitespace-pre-wrap">
                      <span className="font-bold text-slate-500 text-[10px] uppercase block mb-1">Horaires</span>
                      {poi.openingHours.replace(/;/g, '\\n')}
                   </div>
                )}
              </div>
            </Popup>
          </Marker>
        )})}
      </MapContainer>
    </div>
  );
}
