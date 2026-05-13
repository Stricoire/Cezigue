require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
     query: "SELECT 'TOILETTES_PUBLIQUES' ~* ANY(ARRAY['toilette', 'famille']) as result"
  });
  console.log(error ? error : data);
}
run();
