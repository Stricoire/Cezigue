require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  let { data, error } = await supabase.from('unified_pois')
    .select('id, title, type')
    .ilike('title', '%parking%')
    .limit(1);

  console.log("Parking by title:", data);

  let res = await supabase.from('unified_pois')
    .select('id, title, type')
    .ilike('type', '%parking%')
    .limit(1);

  console.log("Parking by type:", res.data);
  
  let res3 = await supabase.from('unified_pois')
    .select('id, title, type, categories')
    .contains('categories', ['parking'])
    .limit(1);

  console.log("Parking by categories array:", res3.data);
}
run();
