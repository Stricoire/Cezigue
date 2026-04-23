import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Utilitaires géographiques
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Rayon de la terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const decodePolyline = (t: string, e = 5) => {
  let index = 0, lat = 0, lng = 0;
  const coordinates: [number, number][] = [];
  while (index < t.length) {
      let b, shift = 0, result = 0;
      do {
          b = t.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0;
      result = 0;
      do {
          b = t.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      coordinates.push([lat / Math.pow(10, e), lng / Math.pow(10, e)]);
  }
  return coordinates;
};

import { POI_TAXONOMY, getTaxonomyInfo } from '@/config/poi_taxonomy';

// Map Tastes UI -> Meta-Catégories de la taxonomie
const TASTE_MAPPING: Record<string, string[]> = {
  "gastronomy": ["Restauration", "Commerce de Bouche"],
  "nature": ["Nature & Activités Sportives"],
  "history": ["Tourisme & Culture", "Services Publics & Pratiques"],
  "events": ["Tourisme & Culture", "Boutiques & Services"]
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startLocation, destination, viaWaypoint, vehicleType, fuelType, tankCapacity, initialFuelLevel, tastes, tripType } = body;

    if (!startLocation || !destination) {
      return NextResponse.json({ error: "Départ et destination requis." }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Clé API Google Maps manquante.");
    }

    // 1. Calcul de l'itinéraire principal via Google Maps
    const originStr = `${startLocation.lat},${startLocation.lon}`;
    const destStr = `${destination.lat},${destination.lon}`;
    let waypointsParam = "";
    if (viaWaypoint) {
       waypointsParam = `&waypoints=${viaWaypoint.lat},${viaWaypoint.lon}`;
    }
    const gmUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}${waypointsParam}&mode=driving&language=fr&key=${apiKey}`;
    
    const gmRes = await fetch(gmUrl);
    const gmData = await gmRes.json();

    if (!gmData.routes || gmData.routes.length === 0) {
      return NextResponse.json({ error: "Impossible de calculer l'itinéraire routier." }, { status: 404 });
    }

    const route = gmData.routes[0];
    const polyline = route.overview_polyline.points;
    const distanceKm = route.legs[0].distance.value / 1000;
    const durationMins = route.legs[0].duration.value / 60;
    
    const coordinates = decodePolyline(polyline);

    // 1.5. Simulation de carburant et détermination des arrêts (Hubs)
    let capacity = tankCapacity ? parseFloat(tankCapacity) : (vehicleType === "electrique" ? 60 : 50);
    let consoPer100 = 6.5;
    let isElectric = vehicleType === "electrique";
    if (fuelType === "Gazole") consoPer100 = 5.2;
    if (fuelType === "SP98") consoPer100 = 6.7;
    if (fuelType === "E85") consoPer100 = 8.0;
    if (isElectric) consoPer100 = 15.0;
    
    // Si chill, on consomme un peu moins
    if (tripType === 'chill') consoPer100 *= 0.9;

    let currentFuelPercent = initialFuelLevel ? parseFloat(initialFuelLevel) : 100;
    let fuelAmount = (currentFuelPercent / 100) * capacity;
    
    const refuelStops: any[] = [];
    let distSinceLastPoint = 0;
    let accumulatedDist = 0;
    
    // Parcourir les coordonnées pour simuler la consommation
    for (let i = 1; i < coordinates.length; i++) {
        const pt = coordinates[i];
        const prevPt = coordinates[i-1];
        const d = getDistance(prevPt[0], prevPt[1], pt[0], pt[1]);
        distSinceLastPoint += d;
        accumulatedDist += d;
        
        // Tous les 5km on recalcule le fuel
        if (distSinceLastPoint >= 5) {
            const consumed = (distSinceLastPoint * consoPer100) / 100;
            fuelAmount -= consumed;
            distSinceLastPoint = 0;
            
            const currentPercent = (fuelAmount / capacity) * 100;
            
            // Si on tombe sous 20% (pour protéger la réserve des 12.5%)
            if (currentPercent <= 20) {
                // On enregistre un arrêt technique
                refuelStops.push({
                   lat: pt[0],
                   lon: pt[1],
                   km: Math.round(accumulatedDist),
                   station: null // Sera rempli par l'API
                });
                // Le plein est fait
                fuelAmount = capacity;
            }
        }
    }

    // Récupérer les stations réelles pour chaque arrêt
    for (const stop of refuelStops) {
        if (!isElectric) {
            const fuelApiUrl = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?where=within_distance(geom, geom'POINT(${stop.lon} ${stop.lat})', 15km)&limit=3`;
            try {
                const fres = await fetch(fuelApiUrl, { cache: 'no-store' });
                if (fres.ok) {
                    const fdata = await fres.json();
                    if (fdata.results && fdata.results.length > 0) {
                        const stationInfo = fdata.results[0];
                        
                        let priceStr = "";
                        if (stationInfo.prix) {
                           let arr;
                           try {
                              arr = typeof stationInfo.prix === 'string' ? JSON.parse(stationInfo.prix) : stationInfo.prix;
                           } catch (e) { arr = []; }
                           const fuels = Array.isArray(arr) ? arr : [arr];
                           const fuelMatch = fuels.find((p:any) => p['@nom']?.includes(fuelType) || (fuelType === 'SP95' && p['@nom']?.includes('E10')));
                           if (fuelMatch && fuelMatch['@valeur']) {
                              priceStr = fuelMatch['@valeur'];
                           }
                        }

                        stop.station = {
                            name: stationInfo.adresse || "Station Service",
                            city: stationInfo.ville,
                            prices: priceStr || null,
                            lat: stationInfo.geom?.lat || stop.lat,
                            lon: stationInfo.geom?.lon || stop.lon
                        };
                    }
                }
            } catch (e) { console.error("Erreur API Carburant"); }
        } else {
             // Mock basique pour l'électrique en attendant l'API IRVE
             stop.station = {
                name: "Borne de recharge Rapide",
                city: "Sur itinéraire",
                lat: stop.lat,
                lon: stop.lon
             };
        }
    }

    // 2. Échantillonnage de la trajectoire pour les POIs
    // On veut un point tous les X kilomètres selon le mode (Express: 50km, Chill: 30km)
    const intervalKm = tripType === 'express' ? 60 : 30;
    
    const waypoints: {lat: number, lon: number}[] = [];
    let currentDistance = 0;
    let lastPoint = coordinates[0];

    // On ajoute toujours le point de départ
    waypoints.push({ lat: lastPoint[0], lon: lastPoint[1] });

    for (let i = 1; i < coordinates.length; i++) {
      const pt = coordinates[i];
      const dist = getDistance(lastPoint[0], lastPoint[1], pt[0], pt[1]);
      currentDistance += dist;

      if (currentDistance >= intervalKm) {
        waypoints.push({ lat: pt[0], lon: pt[1] });
        currentDistance = 0; // Reset
      }
      lastPoint = pt;
    }
    
    // On ajoute l'étape ciblée (viaWaypoint) comme un point de recherche majeur
    if (viaWaypoint) {
       waypoints.push({ lat: viaWaypoint.lat, lon: viaWaypoint.lon });
    }
    
    // Et les stations essence pour s'assurer d'avoir des POIs autour
    refuelStops.forEach(rs => {
       if (rs.station) {
          waypoints.push({ lat: rs.station.lat, lon: rs.station.lon });
       }
    });

    // On ajoute toujours le point d'arrivée si pas déjà trop proche
    const finalPoint = coordinates[coordinates.length - 1];
    if (waypoints.length > 0 && getDistance(waypoints[waypoints.length-1].lat, waypoints[waypoints.length-1].lon, finalPoint[0], finalPoint[1]) > 10) {
       waypoints.push({ lat: finalPoint[0], lon: finalPoint[1] });
    }

    // 3. Scan des POIs sur le corridor
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // Traduction des tastes en Meta-Catégories
    let selectedMetaCategories: string[] = [];
    
    if (tastes && Array.isArray(tastes) && tastes.length > 0) {
       tastes.forEach((t: string) => {
          if (TASTE_MAPPING[t]) {
             selectedMetaCategories.push(...TASTE_MAPPING[t]);
          }
       });
    } else {
       selectedMetaCategories = Object.keys(POI_TAXONOMY);
    }
    
    // Remove duplicates
    selectedMetaCategories = Array.from(new Set(selectedMetaCategories));

    // Mapping des Méta-catégories UI vers les catégories brutes de la base de données (OSM/Michelin)
    const metaToDbMap: Record<string, string[]> = {
        "Restauration": ["Restauration"],
        "Commerce de Bouche": ["Commerce"],
        "Tourisme & Culture": ["Activité Touristique"],
        "Santé & Soins": ["Santé"],
        "Services Publics & Pratiques": ["Service"],
        "Boutiques & Services": ["Commerce", "Service"],
        "Nature & Activités Sportives": ["Activité Sportive"],
        "Autres Services": ["Service", "Autre"]
    };

    let dbCategoriesFilter: string[] = [];
    if (selectedMetaCategories.length > 0) {
        selectedMetaCategories.forEach((cat: string) => {
            if (metaToDbMap[cat]) {
                dbCategoriesFilter.push(...metaToDbMap[cat]);
            }
        });
        dbCategoriesFilter = Array.from(new Set(dbCategoriesFilter)); // Dédoublonnage
    }

    const allPois = new Map<string, any>(); // Utilisation d'une Map pour dédupliquer par ID

    // On effectue les requêtes Supabase en parallèle pour chaque waypoint
    const radiusMeters = 5000; // 5km autour du point pour éviter le bruit énorme
    
    const poiPromises = waypoints.map(async (wp) => {
      const { data: unifiedPois, error } = await supabase.rpc('get_pois_in_radius', {
          p_lat: wp.lat,
          p_lon: wp.lon,
          p_radius_meters: radiusMeters,
          p_categories: dbCategoriesFilter.length > 0 ? dbCategoriesFilter : null // Filtrage en amont dans la BDD
      });

      if (!error && unifiedPois) {
         unifiedPois.forEach((poi: any) => {
            if (!allPois.has(poi.id)) {
               const rawType = poi.type ? poi.type.toLowerCase().split(';')[0] : '';
               const taxonomyInfo = getTaxonomyInfo(rawType, poi.categories || []);
               
               // On ne garde que les POIs qui matchent les meta-categories demandées
               if (selectedMetaCategories.includes(taxonomyInfo.metaKey)) {
                   // On injecte les infos traduites
                   poi.translatedType = taxonomyInfo.subData.label;
                   poi.metaCategory = taxonomyInfo.metaKey;
                   poi.icon = taxonomyInfo.subData.icon;
                   // Override internal category so UI filter sees exact MetaCategory
                   poi.categories = [taxonomyInfo.metaKey];
                   allPois.set(poi.id, poi);
               }
            }
         });
      }
    });

    await Promise.all(poiPromises);

    const rawPoisArray = Array.from(allPois.values());

    // Limitation par catégorie pour assurer la diversité sur les longs trajets
    const MAX_PER_CATEGORY = selectedMetaCategories.length <= 2 ? 1000 : 150; 
    const categoryCounts: Record<string, number> = {};
    const diversePoisArray = [];

    for (const poi of rawPoisArray) {
        if (!categoryCounts[poi.metaCategory]) categoryCounts[poi.metaCategory] = 0;
        
        if (categoryCounts[poi.metaCategory] < MAX_PER_CATEGORY) {
            diversePoisArray.push(poi);
            categoryCounts[poi.metaCategory]++;
        }
    }

    const poisArray = diversePoisArray.map(poi => {
       const finalScore = poi.cezigue_score || poi.metadata?.rating || poi.google_rating || poi.yelp_rating || null;
       const phone = poi.metadata?.phone || poi.metadata?.formatted_phone_number || poi.phone || null;
       const website = poi.metadata?.website || poi.metadata?.url || poi.metadata?.['contact:website'] || null;

       return {
          id: poi.id,
          title: poi.title || poi.translatedType || 'Lieu d\'intérêt',
          type: poi.translatedType,
          metaCategory: poi.metaCategory,
          icon: poi.icon,
          categories: poi.categories,
          description: poi.metadata?.['description:fr'] || poi.description || poi.metadata?.description || null,
          lat: parseFloat(poi.lat),
          lon: parseFloat(poi.lon),
          city: poi.city,
          address: poi.address || poi.city || null,
          phone: phone,
          website: website,
          score: finalScore
       };
    });

    // 4. Retour de l'agrégation
    return NextResponse.json({
      success: true,
      route: {
        distanceKm: Math.round(distanceKm),
        durationMins: Math.round(durationMins),
        polyline: polyline,
        coordinates: coordinates // Utile si l'interface veut l'utiliser
      },
      corridor: {
        waypointsCount: waypoints.length,
        poisFound: poisArray.length,
        pois: poisArray,
        refuelStops: refuelStops
      }
    });

  } catch (error: any) {
    console.error("Travel Planner API Error:", error);
    return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
  }
}
