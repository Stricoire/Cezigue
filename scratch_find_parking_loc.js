require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  let { data, error } = await supabase.from('unified_pois')
    .select('id, title, city, type, lat, lon')
    .eq('type', 'parking')
    .ilike('title', '%capitole%')
    .limit(5);

  console.log("Parkings near Capitole (by title):", data);
  
  let res2 = await supabase.from('unified_pois')
    .select('id, title, city, type, lat, lon')
    .eq('type', 'parking')
    .limit(5);

  console.log("Some parkings anywhere:", res2.data);
}
run();
