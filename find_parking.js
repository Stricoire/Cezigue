require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('unified_pois')
    .select('id, title, type, categories, metadata')
    .ilike('title', '%parking%')
    .limit(10);
    
  if (error) {
    console.error(error);
  } else {
    console.log("Parkings found:");
    console.log(JSON.stringify(data, null, 2));
  }
}
run();
