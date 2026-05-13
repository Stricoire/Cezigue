require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_pois_in_radius', {
    p_lat: 43.6044,
    p_lon: 1.4439,
    p_radius_meters: 500,
    p_categories: ['parking'],
    p_search_query: null
  });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Found ${data.length} total parkings around Place du Capitole.`);
    if (data.length > 0) {
       console.log("Samples:", data.slice(0, 3).map(p => p.title + " - " + p.type + " - " + p.categories.join(',')));
    }
  }
}
run();
