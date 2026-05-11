const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('../.github.env'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIngestion() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isoYesterday = yesterday.toISOString();

  // Check articles
  const { data: articles, error: errArt } = await supabase
    .from('articles_veille')
    .select('id, tags, created_at')
    .gte('created_at', isoYesterday);

  // Check POI unified
  const { data: pois, error: errPoi } = await supabase
    .from('unified_pois')
    .select('id, categories, source, updated_at')
    .gte('updated_at', isoYesterday);

  console.log("=== INGESTION REPORT ===");
  if (errArt) console.error("Error fetching articles:", errArt);
  else console.log(`New articles from Marlowe: ${articles.length}`);

  if (errPoi) console.error("Error fetching POIs:", errPoi);
  else {
    console.log(`Updated/Inserted POIs: ${pois.length}`);
    const bySource = pois.reduce((acc, p) => {
      acc[p.source] = (acc[p.source] || 0) + 1;
      return acc;
    }, {});
    console.log("By source:", bySource);
  }
}

checkIngestion();
