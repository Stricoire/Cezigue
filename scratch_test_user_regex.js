require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const userRegex = "PMR|handicapé|adapté|fauteuil roulant|accessibilité|stationnement réservé|CMI|GIG|GIC|Personne à mobilité réduite|Prioritaire|Stationnement spécifique|Disabled parking";
  const { data, error } = await supabase.rpc('get_pois_in_radius', {
    p_lat: 43.6044,
    p_lon: 1.4439,
    p_radius_meters: 5000,
    p_categories: ['PARKING', 'STATIONNEMENT', 'parking'],
    p_search_query: userRegex
  });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Found ${data.length} matching parkings with user regex.`);
  }
}
run();
