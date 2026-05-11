const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const { data, error } = await supabase
    .from('user_feedback')
    .insert([
      { type_retour: 'bug', message: 'test script', user_email: 'test@example.com' }
    ]);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Success:", data);
  }
}

testInsert();
