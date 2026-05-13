require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error, count } = await supabase.from('unified_pois')
    .select('*', { count: 'exact', head: true })
    .ilike('type', '%parking%');

  if (error) {
    console.error("Error TYPE:", error);
  } else {
    console.log(`Total parkings (ilike type) in DB: ${count}`);
  }

  const res2 = await supabase.from('unified_pois')
    .select('*', { count: 'exact', head: true })
    .ilike('title', '%parking%');
    
  console.log(`Total parkings (ilike title) in DB: ${res2.count}`);
}
run();
