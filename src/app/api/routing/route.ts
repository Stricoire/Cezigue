import { NextResponse } from "next/server";
import { decode as flexDecode } from '@here/flexpolyline';

// Fonction d'aide pour calculer la distance à vol d'oiseau
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const time = searchParams.get('time') || "08:00";
  const dateStr = searchParams.get('date'); // YYYY-MM-DD
  const timeType = searchParams.get('timeType') || "departure";
  const fuelType = searchParams.get('fuelType') || "SP95";
  const avoidTolls = searchParams.get('avoidTolls') === "true";
  const includeParking = searchParams.get('includeParking') === "true";

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!origin || !destination) {
    return NextResponse.json({ error: "Missing origin or destination" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API Key is missing. Please enable it in your environment variables." }, { status: 500 });
  }

  try {
    // Construire le timestamp pour departure_time / arrival_time
    const [hours, minutes] = time.split(':').map(Number);
    let targetDate: Date;

    if (dateStr) {
       const [year, month, day] = dateStr.split('-').map(Number);
       targetDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    } else {
       const now = new Date();
       targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
       // Si l'heure demandée est déjà passée aujourd'hui, on passe à demain (comportement legacy)
       if (targetDate.getTime() < now.getTime()) {
         targetDate.setDate(targetDate.getDate() + 1);
       }
    }
    const targetTimestamp = Math.floor(targetDate.getTime() / 1000);
    const nowTimestamp = Math.floor(Date.now() / 1000);
    
    // Transit accepte 'arrival_time' ou 'departure_time' dans le passé ou futur
    const transitTimeParam = timeType === 'arrival' ? `&arrival_time=${targetTimestamp}` : `&departure_time=${targetTimestamp}`;
    
    // Driving & Bicycling n'acceptent PAS 'arrival_time', et 'departure_time' DOIT être dans le futur ou 'now'.
    let drivingTimeParam = "&departure_time=now";
    if (timeType === "departure" && targetTimestamp > nowTimestamp) {
       drivingTimeParam = `&departure_time=${targetTimestamp}`;
    }

    // Polylines Google Maps (décodage pour le Transit)
    const decodePolyline = (t: string, e = 5) => {
        let index = 0, lat = 0, lng = 0, coordinates = [];
        while (index < t.length) {
            let b, shift = 0, result = 0;
            do {
                b = t.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;
            shift = 0;
            result = 0;
            do {
                b = t.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;
            coordinates.push([lat / Math.pow(10, e), lng / Math.pow(10, e)]);
        }
        return coordinates;
    };

    // RECUPERATION DES COORDONNEES & REQUETES PARALLELES
    const hereKey = process.env.HERE_API_KEY;
    if (!hereKey) throw new Error("HERE_API_KEY is missing. Required for Car routing.");

    const [geoOriginRes, geoDestRes, transitRes, walkingRes] = await Promise.all([
      fetch(`https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(origin)}&apiKey=${hereKey}`, { cache: 'no-store' }),
      fetch(`https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(destination)}&apiKey=${hereKey}`, { cache: 'no-store' }),
      fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=transit${transitTimeParam}&language=fr&key=${apiKey}`),
      fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=bicycling${drivingTimeParam}&language=fr&key=${apiKey}`)
    ]);

    const geoOriginData = await geoOriginRes.json();
    const geoDestData = await geoDestRes.json();
    const transitData = await transitRes.json();
    const walkingData = await walkingRes.json();

    if (!geoOriginData.items?.length || !geoDestData.items?.length) throw new Error("Failsafe HERE: Impossible de géocoder les adresses.");

    const originLat = geoOriginData.items[0].position.lat;
    const originLng = geoOriginData.items[0].position.lng;
    const destLat = geoDestData.items[0].position.lat;
    const destLng = geoDestData.items[0].position.lng;

    // FETCH HERE ROUTING (Fast/Alt & Short)
    const hereUrlFast = `https://router.hereapi.com/v8/routes?transportMode=car&routingMode=fast&alternatives=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&return=summary,polyline,tolls,actions,instructions&apiKey=${hereKey}`;
    const hereUrlShort = `https://router.hereapi.com/v8/routes?transportMode=car&routingMode=short&origin=${originLat},${originLng}&destination=${destLat},${destLng}&return=summary,polyline,tolls,actions,instructions&apiKey=${hereKey}`;

    const [hereResFast, hereResShort] = await Promise.all([
        fetch(hereUrlFast, { cache: 'no-store' }),
        fetch(hereUrlShort, { cache: 'no-store' })
    ]);

    if (!hereResFast.ok) throw new Error("Erreur API HERE Routing Fast");
    const hereDataFast = await hereResFast.json();
    const hereDataShort = hereResShort.ok ? await hereResShort.json() : null;

    if (!hereDataFast.routes?.length) throw new Error("Aucun itinéraire voiture trouvé via HERE.");

    const getTollSum = (section: any) => {
        let sum = 0;
        if (section.tolls) {
           for (const t of section.tolls) {
              if (t.fares) {
                 for (const f of t.fares) {
                    if (f.price?.value) sum += f.price.value;
                 }
              }
           }
        }
        return sum;
    };

    const getSmartSteps = (actions: any[]) => {
        const rawSteps = actions ? actions.map((act: any) => ({ iconId: "car", text: (act.instruction || act.action || "").replace(/<[^>]*>?/gm, '') })) : [];
        if (rawSteps.length <= 5) return rawSteps;
        const middle = rawSteps.slice(1, rawSteps.length - 1);
        return [rawSteps[0], middle[Math.floor(middle.length / 3)], middle[Math.floor(middle.length * 2 / 3)], rawSteps[rawSteps.length - 1]];
    };

    // ROUTE 0: FASTEST
    const sectFast = hereDataFast.routes[0].sections[0];
    const distanceKmD = sectFast.summary.length / 1000;
    const durationMinD = Math.round(sectFast.summary.duration / 60);
    const timeStrD = durationMinD > 60 ? `${Math.floor(durationMinD / 60)}h ${durationMinD % 60}min` : `${durationMinD}min`;
    const distStrD = `${distanceKmD.toFixed(1)} km`;
    
    const decodedFast = flexDecode(sectFast.polyline);
    const coordinatesD = decodedFast.polyline as [number, number][];
    
    const tollCost = getTollSum(sectFast);
    const baseStepsD = getSmartSteps(sectFast.actions);

    // FUEL PRICING (Estimate & Realgouv)
    let consoPer100 = 6.0; let pricePerUnit = 1.80; let unit = "L";
    if (fuelType === "Gazole") { consoPer100 = 5.2; pricePerUnit = 1.68; }
    else if (fuelType === "SP95") { consoPer100 = 6.5; pricePerUnit = 1.83; }
    else if (fuelType === "SP98") { consoPer100 = 6.7; pricePerUnit = 1.95; }
    else if (fuelType === "E85") { consoPer100 = 8.0; pricePerUnit = 0.89; }
    else if (fuelType === "Electrique") { consoPer100 = 15.0; pricePerUnit = 0.25; unit = "kWh"; }

    if (fuelType !== "Electrique") {
      try {
        const fuelApiUrl = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?where=within_distance(geom, geom'POINT(${originLng} ${originLat})', 15km)&limit=5`;
        const fuelRes = await fetch(fuelApiUrl, { cache: 'no-store' });
        if (fuelRes.ok) {
          const fData = await fuelRes.json();
          if (fData?.results?.length > 0) {
            for (const st of fData.results) {
               if (st.prix) {
                  const arr = typeof st.prix === 'string' ? JSON.parse(st.prix) : st.prix;
                  const fuels = Array.isArray(arr) ? arr : [arr];
                  const fuelMatch = fuels.find((p:any) => p['@nom']?.includes(fuelType) || (fuelType === 'SP95' && p['@nom']?.includes('E10')));
                  if (fuelMatch && fuelMatch['@valeur']) {
                     pricePerUnit = parseFloat(fuelMatch['@valeur']);
                     break;
                  }
               }
            }
          }
        }
      } catch (e) {
        console.warn("Erreur Fuel Gouv:", e);
      }
    }

    const fuelNeededD = (distanceKmD * consoPer100) / 100;
    const fuelCostD = fuelNeededD * pricePerUnit;
    const parkingCost = includeParking ? 15.00 : 0.00;

    const result = [];

    // OPTION 0: FAST
    result.push({
      id: "voiture",
      title: "Voiture (Le plus Rapide)",
      iconId: "car",
      colorTheme: "neutral",
      time: timeStrD,
      distance: distStrD,
      costs: { fuel: parseFloat(fuelCostD.toFixed(2)), fuelStr: `${fuelNeededD.toFixed(1)} ${unit} x ${pricePerUnit.toFixed(3)}€ — ${fuelCostD.toFixed(2)}€`, tolls: parseFloat(tollCost.toFixed(2)), parking: parkingCost },
      totalCost: parseFloat((fuelCostD + tollCost + parkingCost).toFixed(2)),
      tollsEstimated: false,
      co2: fuelType === "Electrique" ? "0.0 kg" : (fuelNeededD * 2.3).toFixed(1) + " kg",
      steps: baseStepsD,
      coordinates: coordinatesD
    });

    // OPTION 1: ALTERNATIVE (Si disponible dans routes[1] de HERE Fast)
    let altMerged = false;
    if (hereDataFast.routes.length > 1) {
       const sectAlt = hereDataFast.routes[1].sections[0];
       const distanceKmAlt = sectAlt.summary.length / 1000;
       const durationMinAlt = Math.round(sectAlt.summary.duration / 60);
       const tollCostAlt = getTollSum(sectAlt);
       
       let ecoFactor = 1.0;
       const speedOrig = distanceKmD / (durationMinD / 60);
       const speedAlt = distanceKmAlt / (durationMinAlt / 60);
       if (speedAlt < speedOrig - 15 && speedAlt < 95) {
           ecoFactor = 0.85; 
       }
       
       const fuelNeededAlt = (distanceKmAlt * (consoPer100 * ecoFactor)) / 100;
       const fuelCostAlt = fuelNeededAlt * pricePerUnit;
       const totalCostAlt = fuelCostAlt + tollCostAlt + parkingCost;
       const totalCostRef = fuelCostD + tollCost + parkingCost;

       let isEcoAlternative = false;
       if (totalCostAlt < totalCostRef - 0.50) {
           isEcoAlternative = true; // C'est une vraie et nette alternative economique
       }

       // Est-ce identique à la route HERE Short ?
       let sectShort = hereDataShort?.routes?.[0]?.sections?.[0];
       let distShort = sectShort ? sectShort.summary.length / 1000 : 0;
       if (sectShort && distShort >= distanceKmAlt * 0.95 && distShort <= distanceKmAlt * 1.05) {
           altMerged = true;
       }

       let title = isEcoAlternative ? "Voiture (Alternative Économique)" : "Voiture (Alternative)";
       if (isEcoAlternative && altMerged) title = "Voiture (Alternative Économique & Écologique)";

       const decodedAlt = flexDecode(sectAlt.polyline);
       
       result.push({
         id: "voiture_alternative",
         title: title,
         iconId: "car",
         colorTheme: altMerged ? "teal" : "neutral",
         time: durationMinAlt > 60 ? `${Math.floor(durationMinAlt / 60)}h ${durationMinAlt % 60}min` : `${durationMinAlt}min`,
         distance: `${distanceKmAlt.toFixed(1)} km`,
         costs: { fuel: parseFloat(fuelCostAlt.toFixed(2)), fuelStr: `${fuelNeededAlt.toFixed(1)} ${unit} x ${pricePerUnit.toFixed(3)}€ — ${fuelCostAlt.toFixed(2)}€`, tolls: parseFloat(tollCostAlt.toFixed(2)), parking: parkingCost },
         totalCost: parseFloat(totalCostAlt.toFixed(2)),
         tollsEstimated: false,
         co2: fuelType === "Electrique" ? "0.0 kg" : (fuelNeededAlt * 2.3).toFixed(1) + " kg",
         steps: getSmartSteps(sectAlt.actions),
         coordinates: decodedAlt.polyline as [number, number][]
       });
    }

    // OPTION 2: ECOLOGICAL (HERE Short, si pas fusionnée)
    if (!altMerged && hereDataShort?.routes?.length > 0) {
        const sectShort = hereDataShort.routes[0].sections[0];
        const distanceKmShort = sectShort.summary.length / 1000;
        
        // Uniquement si plus courte que la Fast (sinon incohérent)
        if (distanceKmShort < distanceKmD * 0.95) {
            const durationMinShort = Math.round(sectShort.summary.duration / 60);
            const tollCostShort = getTollSum(sectShort);
            
            let ecoFactor = 0.85; 
            const fuelNeededShort = (distanceKmShort * (consoPer100 * ecoFactor)) / 100;
            const fuelCostShort = fuelNeededShort * pricePerUnit;
            
            const decodedShort = flexDecode(sectShort.polyline);

            result.push({
               id: "voiture_ecologique",
               title: "Voiture (Alternative Écologique)",
               iconId: "leaf",
               colorTheme: "teal",
               time: durationMinShort > 60 ? `${Math.floor(durationMinShort / 60)}h ${durationMinShort % 60}min` : `${durationMinShort}min`,
               distance: `${distanceKmShort.toFixed(1)} km`,
               costs: { fuel: parseFloat(fuelCostShort.toFixed(2)), fuelStr: `${fuelNeededShort.toFixed(1)} ${unit} x ${pricePerUnit.toFixed(3)}€ — ${fuelCostShort.toFixed(2)}€`, tolls: parseFloat(tollCostShort.toFixed(2)), parking: parkingCost },
               totalCost: parseFloat((fuelCostShort + tollCostShort + parkingCost).toFixed(2)),
               tollsEstimated: false,
               co2: fuelType === "Electrique" ? "0.0 kg" : (fuelNeededShort * 2.3).toFixed(1) + " kg",
               steps: getSmartSteps(sectShort.actions),
               coordinates: decodedShort.polyline as [number, number][]
            });
        }
    }

    // On mock la structure origin/dest object de routeD pour la suite (Covoit, Transit)
    // IMPORTANT: the code below expects routeD.legs[0].start_location.lat etc
    const routeD = {
       legs: [{
          start_location: { lat: originLat, lng: originLng },
          end_location: { lat: destLat, lng: destLng }
       }],
       overview_polyline: { points: "" }
    };

    // OPTION 2A : COVOITURAGE (CONDUCTEUR)
    const fuelCostCov = fuelCostD/3;
    const tollCostCov = tollCost/3;
    const fuelCovStr = `${(fuelNeededD/3).toFixed(1)} ${unit} / pers — ${fuelCostCov.toFixed(2)}€`;
    result.push({
      id: "covoiturage_driver",
      title: "Proposer un Trajet (Conducteur)",
      iconId: "users",
      colorTheme: "green",
      time: `${durationMinD + 15}min`,
      distance: distStrD,
      costs: { fuel: parseFloat(fuelCostCov.toFixed(2)), fuelStr: fuelCovStr, tolls: parseFloat(tollCostCov.toFixed(2)), parking: includeParking ? 5.00 : 0.00 },
      totalCost: parseFloat((fuelCostCov + tollCostCov + (includeParking ? 5 : 0)).toFixed(2)),
      co2: fuelType === "Electrique" ? "0.0 kg" : ((fuelNeededD/3) * 2.3).toFixed(1) + " kg",
      steps: [{ iconId: "clock", text: "Détour et attente passagère estimée : 15 min" }, ...baseStepsD.slice(0,3)],
      coordinates: coordinatesD
    });

    // OPTION 2B : COVOITURAGE PASSAGER (DEEP LINKS)
    const urlBlablacar = `https://www.blablacar.fr/search?fn=${encodeURIComponent(origin)}&tn=${encodeURIComponent(destination)}`;
    const urlMobicoop = `https://www.mobicoop.fr/covoiturages-reguliers?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}`;
    
    result.push({
      id: "covoiturage_passenger",
      title: "Chercher un Trajet (Passager)",
      iconId: "users",
      colorTheme: "green",
      time: timeStrD,
      distance: distStrD,
      costs: { fuel: 0, fuelStr: "0 L", tolls: 0, parking: 0 },
      totalCost: parseFloat((distanceKmD * 0.08).toFixed(2)), // Moyenne nationale ~8cts/km pour un passager
      totalCostEstimated: true,
      co2: "0.0 kg",
      urls: [
        { name: "BlaBlaCar", url: urlBlablacar, color: "blue" },
        { name: "Mobicoop (Coopératif)", url: urlMobicoop, color: "teal" }
      ],
      steps: [
        { iconId: "users", text: "Ce trajet est soumis à l'offre en temps réel des conducteurs." },
        { iconId: "clock", text: "Cliquez sur les liens ci-dessous pour ouvrir les plateformes avec vos adresses pré-remplies." }
      ],
      coordinates: coordinatesD
    });

    // OPTION 3 & 4: TRANSIT PUR & INTERMODAL MATH (SI DIRECT DISPONIBLE)
    if (transitData.status === 'OK' && transitData.routes.length > 0) {
      const routeT = transitData.routes[0];
      const durationMinT = Math.round(routeT.legs[0].duration.value / 60);
      const timeStrT = durationMinT > 60 ? `${Math.floor(durationMinT / 60)}h ${durationMinT % 60}min` : `${durationMinT}min`;
      const distStrT = `${(routeT.legs[0].distance.value / 1000).toFixed(1)} km`;
      const coordinatesT = decodePolyline(routeT.overview_polyline.points);

      const transitSteps = routeT.legs[0].steps.map((step: any) => {
        if (step.travel_mode === "TRANSIT") {
          const l = step.transit_details.line;
          const agency = l.agencies ? l.agencies[0].name : "Transport Public";
          return {
            iconId: l.vehicle.type === "SUBWAY" ? "subway" : l.vehicle.type === "BUS" ? "bus" : "train",
            text: `${l.vehicle.name} Ligne ${l.short_name || l.name} - ${agency}`,
            subtext: `Départ de ${step.transit_details.departure_stop.name} à ${step.transit_details.departure_time.text} vers ${step.transit_details.arrival_stop.name}`
          };
        } else {
          return {
            iconId: "walk",
            text: step.html_instructions.replace(/<[^>]*>?/gm, '')
          };
        }
      });
      
      const isTicketEstimated = !routeT.fare || routeT.fare.value === 0;
      const ticketCost = isTicketEstimated ? Math.max(1.80, Math.round(distanceKmD * 0.12)) : routeT.fare.value; // Estimate 12cts/km for intercity, or 1.80 min
      const containsTrain = transitSteps.some((s:any) => s.iconId === "train" || s.text.includes("TER") || s.text.includes("TGV"));
      const containsSubway = transitSteps.some((s:any) => s.iconId === "subway");
      
      const priceSubtext = (containsTrain && isTicketEstimated && distanceKmD > 50) ? `Tarif estimatif: De ${(distanceKmD * 0.08).toFixed(0)}€ à ${(distanceKmD * 0.18).toFixed(0)}€ SNCF` : "Coût Complet estimé";
      const sncfUrl = `https://www.sncf-connect.com/app/home/search/od/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`;
      
      result.push({
        id: "intermodal_train", // Pour matcher le filtre UI
        title: containsTrain ? "SNCF / Intercités" : containsSubway ? "Métro" : "Transport Public",
        iconId: containsTrain ? "train" : containsSubway ? "subway" : "bus",
        colorTheme: containsTrain ? "indigo" : "blue",
        time: timeStrT,
        distance: distStrT,
        costs: { fuel: 0, fuelStr: "0 L — 0€", tolls: 0, train: ticketCost, trainEstimated: isTicketEstimated, parking: 0 },
        totalCost: ticketCost,
        priceSubtext: priceSubtext,
        co2: "0.8 kg",
        urls: containsTrain ? [{ name: "SNCF Connect", url: sncfUrl, color: "blue" }] : undefined,
        steps: transitSteps.slice(0, 5),
        coordinates: coordinatesT
      });
      
      // On ne propose l'intermodal classique Que sur les trajets moyens (pas pour traverser la France)
      if (durationMinD > 20 && distanceKmD < 80) {
          const mixRideMins = Math.round(durationMinT * 0.8);
          const fuelM = (fuelNeededD * 0.4);
          result.push({
            id: "intermodal",
            title: "Park & Ride Opti",
            iconId: "train",
            colorTheme: "purple",
            time: `${mixRideMins}min`,
            distance: `${(distanceKmD * 0.8).toFixed(1)} km`,
            costs: { fuel: parseFloat((fuelM*pricePerUnit).toFixed(2)), fuelStr: `${fuelM.toFixed(1)} ${unit} — ${(fuelM*pricePerUnit).toFixed(2)}€`, tolls: 0, train: ticketCost, trainEstimated: isTicketEstimated, parking: 0 },
            totalCost: parseFloat((fuelM*pricePerUnit + ticketCost).toFixed(2)),
            co2: fuelType === "Electrique" ? "0.1 kg" : (fuelM * 2.3).toFixed(1) + " kg",
            steps: [
              { iconId: "car", text: "Conduite vers le parc relais périphérique" },
              { iconId: "parking", text: "Stationnement au parc relais (P+R) Gratuit" },
              transitSteps.find((s:any) => s.iconId !== 'walk') || { iconId: "bus", text: "Connexion transport public" }
            ],
            coordinates: [ ...coordinatesD.slice(0, Math.floor(coordinatesD.length * 0.4)), ...coordinatesT.slice(0, Math.floor(coordinatesT.length * 0.6)) ]
          });
      }
    } else if (distanceKmD < 100) {
      // THE MAAS HUB FINDER: AUTOMATIC PARK & RIDE FALLBACK (Uniquement trajets < 100km !)
      // L'utilisateur est en zone urbaine/périurbaine, on cherche le relais public le plus proche
      let fallbackSuccess = false;
      
      try {
        const originLat = routeD.legs[0].start_location.lat;
        const originLng = routeD.legs[0].start_location.lng;
        
        // FIABILISATION OVERPASS API : Double Radar pour capter les Gares SNCF ET les stations de Métro P+R
        const overpassQuery = `[out:json];(node(around:25000, ${originLat}, ${originLng})["railway"="station"];node(around:25000, ${originLat}, ${originLng})["station"="subway"];);out 15;`;
        
        const overpassRes = await fetch('https://overpass.openstreetmap.fr/api/interpreter?data=' + encodeURIComponent(overpassQuery), {
           headers: { 'User-Agent': 'CezigueMobilityHub/1.0 (contact@cezigue.com)' }
        });
        
        if (overpassRes.ok) {
           const hubsData = await overpassRes.json();
           
           if (hubsData && hubsData.elements && hubsData.elements.length > 0) {
             // Séparation des deux "ligues" : Train vs Métro
             const trainHubs = hubsData.elements
                 .filter((h:any) => h.tags.railway === "station")
                 .map((h:any) => ({ name: h.tags.name || "Gare SNCF", lat: h.lat, lon: h.lon, dist: getDistance(originLat, originLng, h.lat, h.lon), type: "train" }))
                 .sort((a:any, b:any) => a.dist - b.dist).slice(0, 3);
                 
             const subwayHubs = hubsData.elements
                 .filter((h:any) => h.tags.station === "subway")
                 .map((h:any) => ({ name: h.tags.name || "Station de Métro", lat: h.lat, lon: h.lon, dist: getDistance(originLat, originLng, h.lat, h.lon), type: "subway" }))
                 .sort((a:any, b:any) => a.dist - b.dist).slice(0, 3);

             const candidates = [...trainHubs, ...subwayHubs];

             let bestTrainOption: any = null;
             let bestTrainTotalTime = Infinity;

             let bestSubwayOption: any = null;
             let bestSubwayTotalTime = Infinity;

             for (const hub of candidates) {
                try {
                  const hubDrivingRes = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${hub.lat},${hub.lon}&mode=driving&language=fr&key=${apiKey}`);
                  const hubDrivingData = await hubDrivingRes.json();
                  
                  if (hubDrivingData.status === 'OK' && hubDrivingData.routes.length > 0) {
                     const dRoute = hubDrivingData.routes[0];
                     const durD = Math.round(dRoute.legs[0].duration.value / 60);

                     // L'utilisateur arrive à la gare à `targetTimestamp + durD` + 5 mins de parking
                     const transitDepartureTimestamp = targetTimestamp + (durD * 60) + (5 * 60);
                     const adjustedTimeParam = timeType === 'arrival' ? `&arrival_time=${targetTimestamp}` : `&departure_time=${transitDepartureTimestamp}`;

                     const hubTransitRes = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${hub.lat},${hub.lon}&destination=${encodeURIComponent(destination)}&mode=transit${adjustedTimeParam}&language=fr&key=${apiKey}`);
                     const hubTransitData = await hubTransitRes.json();
                     
                     if (hubTransitData.status === 'OK' && hubTransitData.routes.length > 0) {
                       const tRoute = hubTransitData.routes[0];
                       const durT = Math.round(tRoute.legs[0].duration.value / 60);
                       const totalTime = durD + durT + 5; 
                       
                       if (hub.type === "train" && totalTime < bestTrainTotalTime) {
                          bestTrainTotalTime = totalTime;
                          bestTrainOption = { hub, dRoute, tRoute, durD, durT, totalTime, distDKm: dRoute.legs[0].distance.value / 1000 };
                       } else if (hub.type === "subway" && totalTime < bestSubwayTotalTime) {
                          bestSubwayTotalTime = totalTime;
                          bestSubwayOption = { hub, dRoute, tRoute, durD, durT, totalTime, distDKm: dRoute.legs[0].distance.value / 1000 };
                       }
                     }
                  }
                } catch(e) {
                   // Continue
                }
             }

             const pushHubOption = (opt: any, label: string, colorTheme: string, iconId: string) => {
                 if (opt) {
                     fallbackSuccess = true;
                     const { hub, dRoute, tRoute, durD, durT, totalTime, distDKm } = opt;
                     
                     const fuelMix = (distDKm * consoPer100) / 100;
                     const fuelMixStr = `${fuelMix.toFixed(1)} ${unit} — ${(fuelMix * pricePerUnit).toFixed(2)}€`;
                     // Forcer the price ticket estimation if missing
                     const isTicketEst = !tRoute.fare;
                     const ticket = isTicketEst ? (iconId === 'subway' ? 1.80 : 4.50) : tRoute.fare.value;

                     const targetDateObj = new Date(targetTimestamp * 1000);
                     targetDateObj.setMinutes(targetDateObj.getMinutes() + totalTime);
                     const fallbackArrivalStr = targetDateObj.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
                     const arrivalTimeStr = tRoute.legs[0].arrival_time?.text || fallbackArrivalStr;

                     result.push({
                        id: `intermodal_${hub.type}`,
                        title: `Hub Relay: ${hub.name}`,
                        iconId: iconId,
                        colorTheme: colorTheme,
                        time: `${totalTime}min`,
                        arrivalTime: arrivalTimeStr,
                        distance: `${distDKm.toFixed(1)} km (Route) + TR`,
                        costs: {
                           fuel: parseFloat((fuelMix * pricePerUnit).toFixed(2)),
                           fuelStr: fuelMixStr,
                           tolls: 0,
                           train: ticket,
                           trainEstimated: isTicketEst,
                           parking: 0
                        },
                        totalCost: parseFloat((fuelMix * pricePerUnit + ticket).toFixed(2)),
                        co2: fuelType === "Electrique" ? "0.1 kg" : (fuelMix * 2.3).toFixed(1) + " kg",
                        steps: [
                          { iconId: "car", text: `Rabattement en voiture vers : ${hub.name} (${distDKm.toFixed(1)}km, ~${durD}min)` },
                          { iconId: "parking", text: "Stationnement au P+R", subtext: "Gratuit estimé (Correspondance 5 min)" },
                          ...tRoute.legs[0].steps
                             .filter((s:any) => s.travel_mode === "TRANSIT" || (s.travel_mode === "WALKING" && s.duration.value > 60))
                             .map((s:any) => {
                                let rawText = s.html_instructions ? s.html_instructions.replace(/<[^>]*>?/gm, '') : "Connexion";
                                let icon = "clock";
                                let subtext = "";

                                if (s.travel_mode === "WALKING") {
                                   icon = "walk";
                                   subtext = `${s.duration?.text || ""} de marche`;
                                } else if (s.travel_mode === "TRANSIT") {
                                   const details = s.transit_details;
                                   if (details) {
                                      const vType = details.line?.vehicle?.type;
                                      icon = vType === "SUBWAY" ? "subway" : (vType === "BUS" ? "bus" : "train");
                                      const lineName = details.line?.short_name || details.line?.name;
                                      
                                      const dir = details.headsign ? `(Dir. ${details.headsign})` : "";
                                      const lineStr = lineName ? `[Ligne ${lineName}] ` : "";
                                      
                                      // On override le texte par un truc ultra clair
                                      if (vType === "SUBWAY") rawText = `${lineStr} Métro ${dir}`;
                                      else if (vType === "BUS") rawText = `${lineStr} Bus ${dir}`;
                                      else rawText = `${lineStr} Train ${dir}`;

                                      const arrStop = details.arrival_stop?.name;
                                      const stops = details.num_stops ? `${details.num_stops} arrêt${details.num_stops > 1 ? 's' : ''}` : "";
                                      
                                      subtext = `Départ ${details.departure_time?.text || "--:--"} - Arrivée ${details.arrival_time?.text || "--:--"}`;
                                      if (arrStop) subtext += ` • Sortir à : ${arrStop}`;
                                      if (stops) subtext += ` (${stops})`;
                                   }
                                }
                                return { iconId: icon, text: rawText, subtext };
                             })
                        ],
                        coordinates: [ ...decodePolyline(dRoute.overview_polyline.points), ...decodePolyline(tRoute.overview_polyline.points) ],
                        hubCoordinate: [hub.lat, hub.lon]
                     });
                 }
             };

             // Pousser les deux options ! L'utilisateur aura le choix entre le meilleur train et/ou le meilleur métro
             pushHubOption(bestTrainOption, "SNCF", "indigo", "train");
             pushHubOption(bestSubwayOption, "Métro Urbain", "blue", "subway");
           }
        }
      } catch (err) {
         console.warn("Hub Finder Error:", err);
      }

      if (!fallbackSuccess) {
        // Vraiment aucun transport, on informe l'utilisateur
        result.push({
          id: "transit_pur",
          title: "Zone blanche Transports",
          iconId: "train",
          colorTheme: "neutral",
          time: "N/A",
          distance: "N/A",
          costs: { fuel: 0, fuelStr: "0 L", tolls: 0, parking: 0 },
          totalCost: 0,
          co2: "0.0 kg",
          steps: [{ iconId: "walk", text: "Le radar n'a trouvé aucun relais SNCF ou bus disposant d'un trajet vers votre destination." }],
          coordinates: coordinatesD.slice(0, 5) // Segment décoratif
        });
      }
    }

    // OPTION 4B: AUTOPARTAGE (CITIZ / YEA! / FREE-FLOATING)
    try {
        const originLat = routeD.legs[0].start_location.lat;
        const originLng = routeD.legs[0].start_location.lng;
        
        // FIABILISATION OVERPASS API : .fr
        const overpassQuery = `[out:json];node(around:5000, ${originLat}, ${originLng})["amenity"="car_sharing"];out 3;`;
        const overpassRes = await fetch('https://overpass.openstreetmap.fr/api/interpreter?data=' + encodeURIComponent(overpassQuery), {
           headers: { 'User-Agent': 'CezigueMobilityHub/1.0' }
        });
        
        if (overpassRes.ok) {
           const stationsData = await overpassRes.json();
           
           if (stationsData && stationsData.elements && stationsData.elements.length > 0) {
             // Trier par proximité absolue
             const stations = stationsData.elements.map((s:any) => {
                const distDist = getDistance(originLat, originLng, s.lat, s.lon);
                return { name: s.tags.name || s.tags.operator || "Station Autopartage", lat: s.lat, lon: s.lon, dist: distDist };
             }).sort((a:any, b:any) => a.dist - b.dist);
             
             const bestStation = stations[0];
             
             // Si la station est à moins de 3km (faisable à pied ou vélo rapide)
             if (bestStation.dist < 3.0) {
                 // Cost: approx 2.50€/hr + 0.40€/km
                 const autoHourlyRate = (durationMinD / 60) * 2.50;
                 const autoKmRate = distanceKmD * 0.40;
                 const estimatedAutoPrice = autoHourlyRate + autoKmRate;
                 const walkTimeMins = Math.round((bestStation.dist / 5) * 60); // 5km/h walking speed
                 
                 result.push({
                      id: "autopartage",
                      title: `Autopartage (${bestStation.name})`,
                      iconId: "car",
                      colorTheme: "orange",
                      time: `${durationMinD + walkTimeMins}min`,
                      distance: `${bestStation.dist.toFixed(1)}km à pied + ${distStrD}`,
                      costs: { fuel: 0, fuelStr: "0 L (Carburant Inclus)", tolls: parseFloat(tollCost.toFixed(2)), parking: parkingCost },
                      totalCost: parseFloat((estimatedAutoPrice + tollCost + parkingCost).toFixed(2)),
                      totalCostEstimated: true,
                      co2: fuelType === "Electrique" ? "0.0 kg" : (fuelNeededD * 2.3).toFixed(1) + " kg",
                      steps: [
                        { iconId: "walk", text: `Marche vers le véhicule : ${bestStation.name} (${walkTimeMins} min)` },
                        { iconId: "car", text: "Trajet en véhicule partagé (Carburant & Assurance inclus)" },
                        ...baseStepsD.slice(0,2)
                      ],
                      coordinates: coordinatesD
                   });
             }
           }
        }
    } catch (err) {
         console.warn("Autopartage Scanner Error:", err);
    }

    // OPTION 5 : VÉLO (Pour les trajets courts)
    if (walkingData.status === 'OK' && walkingData.routes.length > 0) {
      const routeW = walkingData.routes[0];
      const durationMinW = Math.round(routeW.legs[0].duration.value / 60);
      if (durationMinW < 90) { // On propose le vélo que si c'est < 1h30 (Trajets urbains)
        result.push({
          id: "bicycling",
          title: "Mobilité Douce (Vélo)",
          iconId: "walk",
          colorTheme: "green",
          time: `${durationMinW}min`,
          distance: `${(routeW.legs[0].distance.value / 1000).toFixed(1)} km`,
          costs: { fuel: 0, fuelStr: "0 L", tolls: 0, parking: 0 },
          totalCost: 0,
          co2: "0.0 kg",
          steps: [{ iconId: "walk", text: "Trajet cyclable via les pistes locales" }],
          coordinates: decodePolyline(routeW.overview_polyline.points)
        });
      }
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Routing Error:", error);
    return NextResponse.json({ error: error.message || "Erreur de calcul d'itinéraire" }, { status: 200 });
  }
}
