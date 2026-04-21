import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const radius = parseInt(searchParams.get('radius') || '15', 10);
  const mode = searchParams.get('mode'); // 'vibe' | 'freshness'

  if (!lat || !lon || !mode) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  const radiusMeters = radius * 1000;
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Config Supabase manquante' }, { status: 500 });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // Appel RPC PostGIS de base
    let query = supabase.rpc('get_pois_in_radius', {
        p_lat: parseFloat(lat),
        p_lon: parseFloat(lon),
        p_radius_meters: radiusMeters,
        p_categories: null
    });

    // Filtres complexes "Vibe" ou "Fraîcheur" sur la colonne type
    if (mode === 'vibe') {
        query = query.in('type', ['bar', 'pub', 'nightclub', 'restaurant', 'cafe', 'fast_food']);
    } else if (mode === 'freshness') {
        query = query.in('type', ['park', 'garden', 'fountain', 'drinking_water', 'water', 'swimming_pool', 'wood', 'forest', 'pitch', 'recreation_ground', 'nature_reserve']);
    }

    const { data: heatmapPois, error } = await query;

    if (error) {
        console.error("Erreur RPC Heatmap:", error);
        return NextResponse.json({ error: `Erreur DB: ${error.message}` }, { status: 500 });
    }

    // Le moteur HeatmapLeaflet.heat requiert une array de format : [lat, lon, intensity]
    // L'intensité est souvent 1, ou modifiée selon certaines heuristiques (un bar = 1, une boite de nuit = 2, un parc = 2, etc.)
    const heatmapPoints = (heatmapPois || []).map((poi: any) => {
        let intensity = 1.0;
        
        if (mode === 'vibe') {
             if (poi.type === 'nightclub') intensity = 2.0;
             if (poi.type === 'pub' || poi.type === 'bar') intensity = 1.5;
        } else if (mode === 'freshness') {
             if (poi.type === 'park' || poi.type === 'forest') intensity = 2.0;
        }

        return [parseFloat(poi.lat), parseFloat(poi.lon), intensity];
    });

    return NextResponse.json({ points: heatmapPoints });

  } catch (err) {
      console.error("Critical Heatmap API error:", err);
      return NextResponse.json({ error: "Service indisponible" }, { status: 500 });
  }
}
