require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('unified_pois').select('type');
  if (error) console.error(error);
  
  const types = new Set();
  data.forEach(d => {
     if (d.type) types.add(d.type);
  });
  console.log(Array.from(types).slice(0, 50).join(', '));
}
run();
