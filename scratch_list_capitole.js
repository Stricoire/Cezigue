require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_pois_in_radius', {
    p_lat: 43.6044,
    p_lon: 1.4439,
    p_radius_meters: 500,
    p_categories: null,
    p_search_query: null
  });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Found ${data.length} total POIs around Place du Capitole.`);
    
    // Group by type
    const types = {};
    data.forEach(p => {
       types[p.type] = (types[p.type] || 0) + 1;
    });
    console.log("Types found:", types);
    
    // Print anything that might be a parking
    const parkings = data.filter(p => 
      (p.type && p.type.toLowerCase().includes('parking')) || 
      (p.type && p.type.toLowerCase().includes('stationnement')) || 
      (p.title && p.title.toLowerCase().includes('parking'))
    );
    console.log(`Potential parkings: ${parkings.length}`);
    if (parkings.length > 0) {
      console.log(parkings.map(p => ({ title: p.title, type: p.type, categories: p.categories })));
    }
  }
}
run();
