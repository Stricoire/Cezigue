import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Recherche autour de la Place du Capitole (Toulouse)...");
    const lat = 43.604462;
    const lon = 1.444246;
    const radius = 2000; // 2km
    
    const queries = ["PMR", "adapté", "handicap", "parking"];

    for (const q of queries) {
        const { data, error } = await supabase.rpc('get_pois_in_radius', {
            p_lat: lat,
            p_lon: lon,
            p_radius_meters: radius,
            p_categories: null,
            p_search_query: q
        });

        if (error) {
            console.error(`Erreur pour '${q}':`, error.message);
        } else {
            console.log(`- '${q}': ${data.length} résultats trouvés.`);
            if (data.length > 0) {
               data.forEach(p => console.log(`  [${q}] ${p.title} - ${p.description ? p.description.substring(0, 50) + '...' : 'Pas de description'}`));
            }
        }
    }
    
    // Check if we have *any* POI around Capitole
    const { data: allData, error: allError } = await supabase.rpc('get_pois_in_radius', {
        p_lat: lat,
        p_lon: lon,
        p_radius_meters: radius,
        p_categories: null,
        p_search_query: null
    });
    
    if (allError) {
        console.error("Erreur générale:", allError.message);
    } else {
        console.log(`- SANS FILTRE: ${allData.length} résultats trouvés dans un rayon de 2km.`);
    }
}

check();
