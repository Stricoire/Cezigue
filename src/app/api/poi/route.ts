import { NextResponse } from 'next/server';
import { getTaxonomyInfo } from '@/config/poi_taxonomy';

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
    if (categories.length > 0 && !categories.includes('none')) {
        categories.forEach((cat: string) => {
            if (metaToDbMap[cat]) {
                dbCategoriesFilter.push(...metaToDbMap[cat]);
            }
        });
        dbCategoriesFilter = Array.from(new Set(dbCategoriesFilter)); // Dédoublonnage
    }

    // Appel de la Fonction Procédurale Supabase (RPC) PostGIS avec les catégories BDD
    const { data: unifiedPois, error } = await supabase.rpc('get_pois_in_radius', {
        p_lat: parseFloat(lat),
        p_lon: parseFloat(lon),
        p_radius_meters: radiusMeters,
        p_categories: dbCategoriesFilter.length > 0 ? dbCategoriesFilter : null
    });

    if (error) {
        console.error("Erreur RPC get_pois_in_radius:", error);
        return NextResponse.json({ error: 'Erreur BDD Unifiée' }, { status: 500 });
    }

    let mappedPois = (unifiedPois || []).map((poi: any) => {
        // Recalcul de la distance précise pour l'affichage JavaScript
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

        // Détermination des labels et icônes via la taxonomie
        const rawType = poi.type ? poi.type.toLowerCase().split(';')[0] : '';
        const { metaKey, metaData, subData } = getTaxonomyInfo(rawType, poi.categories || []);
        
        let translatedType = subData.label;
        let icon = subData.icon;

        let finalTitle = poi.title;
        
        if (finalTitle === 'Non nommé' || !finalTitle || finalTitle.trim() === '') {
            finalTitle = translatedType || poi.categories?.[0] || 'Lieu d\'intérêt';
        }

        const commentsArray = Array.isArray(poi.user_comments) ? poi.user_comments : [];
        const finalScore = poi.cezigue_score || poi.metadata?.rating || poi.google_rating || poi.yelp_rating || null;
        
        // Extraction Google Data depuis metadata JSONB
        const phone = poi.metadata?.phone || poi.metadata?.formatted_phone_number || poi.phone || null;
        const website = poi.metadata?.website || poi.metadata?.url || poi.metadata?.['contact:website'] || null;

        // Choix de la description (privilégier description:fr si existante)
        const desc = poi.metadata?.['description:fr'] || poi.description || poi.metadata?.description || null;

        return {
            id: poi.id,
            title: finalTitle,
            type: translatedType,
            metaCategory: metaKey, // Pour l'UI Front
            categories: poi.categories || [],
            description: desc,
            address: poi.address || poi.city || null,
            city: poi.city,
            phone: phone,
            distance: `${distInKm} km`,
            rawDist: parseFloat(distInKm),
            icon: icon,
            source: poi.source,
            lat: pLat,
            lon: pLon,
            openingHours: poi.opening_hours || poi.metadata?.opening_hours || null,
            date: poi.start_date ? new Date(poi.start_date).toLocaleDateString('fr-FR') : null,
            website: website,
            isDutyPharmacy: poi.metadata?.isDutyPharmacy || false,
            score: finalScore,
            commentsCount: commentsArray.length
        };
    });

    // Filtrage local par méta-catégories (taxonomie)
    if (categories.length > 0 && !categories.includes('none')) {
        mappedPois = mappedPois.filter((poi: any) => categories.includes(poi.metaCategory));
    }

    // Tri par distance croissante
    mappedPois.sort((a: any, b: any) => a.rawDist - b.rawDist);

    // Limitation globale et par catégorie pour assurer la diversité (éviter que les restaurants écrasent tout)
    const MAX_PER_CATEGORY = categories.length <= 2 ? 400 : 60; 
    const categoryCounts: Record<string, number> = {};
    const diversePois = [];
    const overflowPois = []; // Ceux qui dépassent le quota, au cas où on n'a pas atteint les 400 au total

    for (const poi of mappedPois) {
        if (!categoryCounts[poi.metaCategory]) categoryCounts[poi.metaCategory] = 0;
        
        if (categoryCounts[poi.metaCategory] < MAX_PER_CATEGORY) {
            diversePois.push(poi);
            categoryCounts[poi.metaCategory]++;
        } else {
            overflowPois.push(poi);
        }
    }

    // Compléter avec les overflow si on n'a pas atteint 400
    if (diversePois.length < 400) {
        diversePois.push(...overflowPois.slice(0, 400 - diversePois.length));
    }

    // Re-trier le résultat final par distance (car les overflow ont été ajoutés à la fin)
    diversePois.sort((a: any, b: any) => a.rawDist - b.rawDist);

    return NextResponse.json({ lat, lon, radius, events: diversePois.slice(0, 400) });

  } catch (err) {
      console.error("Critical POI fetch error:", err);
      return NextResponse.json({ error: "Service indisponible" }, { status: 500 });
  }
}
