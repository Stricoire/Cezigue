import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const radius = parseInt(searchParams.get('radius') || '15', 10);
  
  const rawCategories = searchParams.get('categories');
  const categories = rawCategories ? rawCategories.split(',') : [];

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Lat/Lon manquants' }, { status: 400 });
  }

  const radiusMeters = radius * 1000;
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // Appel de la Fonction Procédurale Supabase (RPC) PostGIS
    const { data: unifiedPois, error } = await supabase.rpc('get_pois_in_radius', {
        p_lat: parseFloat(lat),
        p_lon: parseFloat(lon),
        p_radius_meters: radiusMeters,
        p_categories: categories.length > 0 ? categories : null
    });

    if (error) {
        console.error("Erreur RPC get_pois_in_radius:", error);
        return NextResponse.json({ error: 'Erreur BDD Unifiée' }, { status: 500 });
    }

    const mappedPois = (unifiedPois || []).map((poi: any) => {
        // Recalcul de la distance précise pour l'affichage JavaScript (car PostGIS filtre mais ne renvoie pas la distance calculée dans select *)
        const pLat = parseFloat(poi.lat);
        const pLon = parseFloat(poi.lon);
        const refLat = parseFloat(lat);
        const refLon = parseFloat(lon);
        
        const dLat = (pLat - refLat) * Math.PI / 180;
        const dLon = (pLon - refLon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(refLat * Math.PI / 180) * Math.cos(pLat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const distInKm = (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 6371).toFixed(1);

        // Determination des Icoônes selon type ou category
        let icon = "📍";
        if (poi.categories?.includes('Commerce')) icon = "🛒";
        if (poi.categories?.includes('Santé')) icon = "🏥";
        if (poi.categories?.includes('Service')) icon = "🏣";
        if (poi.categories?.includes('Activité Touristique')) icon = "🏰";
        if (poi.categories?.includes('Événement Culturel')) icon = "🎭";
        if (poi.categories?.includes('Activité Sportive')) icon = "⛹️";

        // Mappings spécifiques 
        if (poi.type === 'bakery') icon = "🥖";
        if (poi.type === 'supermarket') icon = "🏪";
        if (poi.type === 'pharmacy') icon = "⚕️";
        if (poi.type === 'museum') icon = "🏛️";
        if (poi.type === 'restaurant') icon = "🍽️";

        const typeTranslations: Record<string, string> = {
            'car_repair': 'Garage automobile',
            'car_wash': 'Station de lavage',
            'car_parts': 'Pièces automobiles',
            'bicycle': 'Magasin de vélos',
            'doityourself': 'Bricolage',
            'beverages': 'Boissons',
            'hardware': 'Quincaillerie',
            'beauty': 'Institut de beauté',
            'chemist': 'Droguerie',
            'optician': 'Opticien',
            'jewelry': 'Bijouterie',
            'dry_cleaning': 'Pressing',
            'travel_agency': 'Agence de voyage',
            'estate_agent': 'Agence immobilière',
            'books': 'Librairie',
            'gift': 'Boutique de cadeaux',
            'stationery': 'Papeterie',
            'ticket': 'Billetterie',
            'sports': 'Magasin de sport',
            'toys': 'Magasin de jouets',
            'pet': 'Animalerie',
            'copyshop': 'Reprographie',
            'funeral_directors': 'Pompes funèbres',
            'mobile_phone': 'Téléphonie',
            'electronics': 'Électronique',
            'wine': 'Caviste',
            'cheese': 'Fromagerie',
            'seafood': 'Poissonnerie',
            'deli': 'Épicerie fine',
            'shoe_repair': 'Cordonnier',
            'tailor': 'Tailleur',
            'variety_store': 'Bazar',
            'kiosk': 'Kiosque',
            'massage': 'Massage',
            'tattoo': 'Tatoueur',
            'playground': 'Aire de jeux',
            'pitch': 'Terrain de sport',
            'sports_centre': 'Complexe sportif',
            'swimming_pool': 'Piscine',
            'dojo': 'Dojo',
            'gallery': 'Galerie d\'art',
            'theme_park': 'Parc d\'attractions',
            'vacant': 'Espace libre',
            'dentist': 'Dentiste',
            'public_bookcase': 'Boîte à livres',
            'bakery': 'Boulangerie',
            'doctors': 'Cabinet médical',
            'hairdresser': 'Salon de coiffure',
            'newsagent': 'Presse',
            'restaurant': 'Restaurant',
            'fast_food': 'Restauration rapide',
            'butcher': 'Boucherie',
            'convenience': 'Supérette',
            'tobacco': 'Tabac',
            'laundry': 'Laverie',
            'florist': 'Fleuriste',
            'post_office': 'Bureau de poste',
            'clothes': 'Boutique de vêtements',
            'bar': 'Bar',
            'cafe': 'Café',
            'greengrocer': 'Primeur',
            'supermarket': 'Supermarché',
            'pharmacy': 'Pharmacie',
            'museum': 'Musée',
            'clinic': 'Clinique',
            'hospital': 'Hôpital',
            'school': 'École',
            'parking': 'Parking',
            'bank': 'Banque',
            'garden_centre': 'Jardinerie',
            'gas': 'Station Service',
            'car_repair': 'Garage Auto',
            'bicycle_parking': 'Parking à Vélos',
            'car_wash': 'Station de lavage',
            'water_park': 'Parc Aquatique',
            'theme_park': 'Parc d\'Attractions',
            'department_store': 'Grand Magasin',
            'doityourself': 'Bricolage',
            'sports': 'Magasin de Sport',
            'bookmaker': 'PMU',
            'social_facility': 'Centre Social',
            'waste_basket': 'Poubelle publique',
            'waste_disposal': 'Déchetterie',
            'recycling': 'Point de Recyclage',
            'bench': 'Banc public'
        };

        // Gérer les cas composites (ex: "convenience;gas") en prenant le premier
        const rawType = poi.type ? poi.type.toLowerCase().split(';')[0] : '';
        let translatedType = typeTranslations[rawType];
        
        if (!translatedType && rawType) {
            // Fallback générique: remplacer _ par espace et majuscule
            translatedType = rawType.replace(/_/g, ' ');
            translatedType = translatedType.charAt(0).toUpperCase() + translatedType.slice(1);
        }

        let finalTitle = poi.title;
        
        if (finalTitle === 'Non nommé' || !finalTitle || finalTitle.trim() === '') {
            finalTitle = translatedType || poi.categories?.[0] || 'Lieu d\'intérêt';
        }

        const commentsArray = Array.isArray(poi.user_comments) ? poi.user_comments : [];
        const finalScore = poi.cezigue_score || poi.google_rating || poi.yelp_rating || null;

        return {
            id: poi.id,
            title: finalTitle,
            type: translatedType || poi.categories?.[0] || 'Activité',
            categories: poi.categories || [],
            description: poi.description || null,
            address: poi.address || poi.city || null,
            city: poi.city,
            phone: poi.phone,
            distance: `${distInKm} km`,
            rawDist: parseFloat(distInKm),
            icon: icon,
            source: poi.source,
            lat: pLat,
            lon: pLon,
            openingHours: poi.opening_hours,
            date: poi.start_date ? new Date(poi.start_date).toLocaleDateString('fr-FR') : null,
            website: poi.metadata?.website || poi.metadata?.['contact:website'] || poi.metadata?.url || null,
            isDutyPharmacy: poi.metadata?.isDutyPharmacy || false,
            score: finalScore,
            commentsCount: commentsArray.length
        };
    });

    // Tri par distance croissante
    mappedPois.sort((a: any, b: any) => a.rawDist - b.rawDist);

    return NextResponse.json({ lat, lon, radius, events: mappedPois.slice(0, 400) });

  } catch (err) {
      console.error("Critical POI fetch error:", err);
      return NextResponse.json({ error: "Service indisponible" }, { status: 500 });
  }
}
