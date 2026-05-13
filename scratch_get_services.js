require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('user_microservices').select('*');
  if (error) console.error(error);
  else {
    data.forEach(s => {
      console.log(`Service: ${s.name}`);
      console.log(`Config:`, JSON.stringify(s.config_json, null, 2));
    });
  }
}
run();
