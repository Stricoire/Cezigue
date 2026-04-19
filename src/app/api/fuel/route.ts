import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const radius = searchParams.get('radius') || "15";
  const type = searchParams.get('type') || "fuel"; // "fuel" ou "ev"

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Les coordonnées (lat, lon) sont requises.' },
      { status: 400 }
    );
  }

  try {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (type === "ev") {
      // 1 degré de latitude correspond à environ 111 km.
      // On calcule une bounding box approximative pour le rayon demandé.
      const radiusKm = parseFloat(radius);
      const degreeOffset = radiusKm / 111;
      
      const latMin = latNum - degreeOffset;
      const latMax = latNum + degreeOffset;
      // La longitude dépend de la latitude, on l'approxime par cos(lat)
      const lonOffset = degreeOffset / Math.cos(latNum * Math.PI / 180);
      const lonMin = lonNum - lonOffset;
      const lonMax = lonNum + lonOffset;

      // API ODRE : geo_point_borne est null dans leur dernière mise à jour. On utilise consolidated_latitude / longitude avec une Bounding Box
      const apiUrlEV = `https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/bornes-irve/records?where=consolidated_latitude>${latMin} AND consolidated_latitude<${latMax} AND consolidated_longitude>${lonMin} AND consolidated_longitude<${lonMax}&limit=80`;
      const responseEV = await fetch(apiUrlEV, { cache: 'no-store' });

      if (!responseEV.ok) throw new Error(`ODRE API responded with status: ${responseEV.status}`);
      
      const dataEV = await responseEV.json();

      if (!dataEV.results || dataEV.results.length === 0) {
        return NextResponse.json({
          stations: [],
          message: "Aucune borne électrique trouvée dans ce périmètre."
        });
      }

      const parsedStations = dataEV.results.map((station: any) => {
        // Extraction de la tarification au kWh si possible
        let tarifNum = null;
        if (station.tarification) {
          const match = station.tarification.match(/([0-9.,]+)\s*€?\s*\/\s*kWh/i) || station.tarification.match(/([0-9.,]+)/);
          if (match && match[1]) {
            tarifNum = parseFloat(match[1].replace(',', '.'));
          } else {
             tarifNum = station.tarification; // string fallback
          }
        }

        const carburants = [
          { nom: `${station.puissance_nominale || '?'} kW`, valeur: tarifNum || "Inconnu", isEv: true }
        ];

        return {
          id: station.id_station_itinerance || station.id_pdc_itinerance || Math.random().toString(),
          nom: station.nom_station || station.enseigne || "Borne de Recharge",
          adresse: station.adresse_station || "",
          ville: station.consolidated_commune || station.commune || "",
          lat: station.consolidated_latitude,
          lon: station.consolidated_longitude,
          carburants
        };
      });

      // Dédoublonnage par ID Station et Tri
      const uniqueMap = new Map();
      parsedStations.forEach((s: any) => {
        if (!uniqueMap.has(s.id)) {
          if (s.lat && s.lon) {
            s.distance = calculateHaversineDistance(latNum, lonNum, s.lat, s.lon);
          } else {
            s.distance = 999;
          }
          uniqueMap.set(s.id, s);
        }
      });

      const stations = Array.from(uniqueMap.values());
      stations.sort((a: any, b: any) => a.distance - b.distance);

      return NextResponse.json({ stations });
    }

    // --- MODE FUEL THERMIQUE CLASSIQUE ---
    // API Officielle Instantanée du Gouvernement (Mises à jour temps réel, mais sans les noms)
    const apiUrlPrices = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?where=within_distance(geom, geom'POINT(${lon} ${lat})', ${radius}km)&limit=50`;
    
    // API OpenDataSoft (Mises à jour différées J-1, mais contient les 'Noms' et 'Marques' des stations)
    const apiUrlNames = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/prix-des-carburants-j-1/records?where=within_distance(geo_point, geom'POINT(${lon} ${lat})', ${radius}km)&limit=50`;

    const [responsePrices, responseNames] = await Promise.all([
      fetch(apiUrlPrices, { cache: 'no-store' }),
      fetch(apiUrlNames, { cache: 'no-store' })
    ]);

    if (!responsePrices.ok) {
      throw new Error(`Data Economie API responded with status: ${responsePrices.status}`);
    }

    const [dataPrices, dataNames] = await Promise.all([
      responsePrices.json(),
      responseNames.ok ? responseNames.json() : { results: [] }
    ]);

    if (!dataPrices.results || dataPrices.results.length === 0) {
      return NextResponse.json({
        stations: [],
        message: "Aucune station trouvée dans ce périmètre."
      });
    }

    // Création d'un dictionnaire Nom/Marque depuis ODS
    const namesDict = new Map();
    if (dataNames.results) {
      dataNames.results.forEach((s: any) => {
        namesDict.set(s.id?.toString(), {
          name: s.name,
          brand: s.brand
        });
      });
    }

    // Parsing du schéma temps réel data.economie.gouv.fr enrichi avec les noms ODS
    const parsedStations = dataPrices.results.map((station: any) => {
      const carburants = extractPrices(station.prix);
      const enri = namesDict.get(station.id?.toString());

      return {
        id: station.id,
        nom: enri?.name || station.brand || enri?.brand || "Station Service",
        brand: station.brand || enri?.brand || "",
        adresse: station.adresse || station.address || "Adresse inconnue",
        ville: station.ville || station.com_arm_name || "",
        lat: station.geom?.lat,
        lon: station.geom?.lon,
        carburants
      };
    });

    // Filtre des stations vides de prix au cas où, dédoublonnage et calcul de la distance réelle
    const uniqueMap = new Map();

    parsedStations.forEach((s: any) => {
      if (!uniqueMap.has(s.id) && s.carburants.length > 0) {
        // Calcul Haversine de la distance
        if (s.lat && s.lon) {
          s.distance = calculateHaversineDistance(latNum, lonNum, s.lat, s.lon);
        } else {
          s.distance = 999;
        }
        uniqueMap.set(s.id, s);
      }
    });

    const stations = Array.from(uniqueMap.values());
    
    // Tri par distance croissante (du plus proche au plus lointain)
    stations.sort((a: any, b: any) => a.distance - b.distance);

    return NextResponse.json({
      stations
    });

  } catch (error) {
    console.error('[Fuel API Error]:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'extraction des prix (Radar Carburant).", details: String(error) },
      { status: 500 }
    );
  }
}

// Formule de Haversine pour calculer la distance à vol d'oiseau entre deux coordonnées GPS
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Rayon de la Terre en kilomètres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function extractPrices(pricesData: any) {
  if (!pricesData) return [];
  try {
    const rawData = typeof pricesData === "string" ? JSON.parse(pricesData) : pricesData;
    const elements = Array.isArray(rawData) ? rawData : [rawData];
    return elements
      .map((p: any) => {
        const val = p.price !== undefined ? parseFloat(p.price) : (p['@valeur'] !== undefined ? parseFloat(p['@valeur']) : null);
        return {
          nom: p.name || p.nom || p['@nom'] || "Essence",
          valeur: val
        };
      })
      // On exclut les prix à 0 qui sont des anomalies
      .filter((p: any) => p.valeur !== null && !isNaN(p.valeur) && p.valeur > 0);
  } catch(e) {
    return [];
  }
}
