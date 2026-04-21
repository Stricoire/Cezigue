import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// On s'assure de n'importer le module que côté client (sécurité Next.js)
if (typeof window !== 'undefined') {
  require('leaflet.heat');
}

interface HeatmapLayerProps {
  points: Array<[number, number, number]>;
  mode: 'vibe' | 'freshness';
}

export default function HeatmapLayer({ points, mode }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    // Configuration des couleurs selon le mode
    const options = mode === 'vibe' 
      ? {
          radius: 30, // Zone d'influence large pour le vibe
          blur: 20,
          maxZoom: 15,
          max: 1.5,   // Les boites de nuits montent à 2.0 pour faire le pic
          gradient: { 0.2: 'blue', 0.4: 'cyan', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' }
        }
      : {
          radius: 40, // Fraîcheur : influence très diffuse (parcs)
          blur: 25,
          maxZoom: 14,
          max: 2.0,
          gradient: { 0.2: 'teal', 0.4: 'cyan', 0.6: 'lightgreen', 0.8: 'green', 1.0: 'darkgreen' }
        };

    let heatLayer: any = null;
    try {
        // @ts-ignore : leaflet.heat ajoute heatLayer dynamiquement à L
        heatLayer = L.heatLayer(points, options).addTo(map);
    } catch(e) {
        console.warn('Heatmap layer init error:', e);
    }

    return () => {
      // Nettoyage sécurisé
      if (map && heatLayer && map.removeLayer) {
          try { map.removeLayer(heatLayer); } catch(ex) {}
      }
    };
  }, [map, points, mode]);

  return null;
}
