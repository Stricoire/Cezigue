const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('../.github.env'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isoYesterday = yesterday.toISOString();

  // Try to query unified_pois
  const { data: unified, error: errUnified } = await supabase
    .from('unified_pois')
    .select('id, category, source', { count: 'exact' })
    .gte('updated_at', isoYesterday);

  if (errUnified) {
    console.error("unified_pois ERROR:", errUnified.message);
  } else {
    console.log(`unified_pois: ${unified.length} records updated since yesterday.`);
    const sources = unified.reduce((acc, p) => { acc[p.source] = (acc[p.source] || 0) + 1; return acc; }, {});
    console.log("Sources:", sources);
  }

  // Try to query raw_michelin
  const { data: michelin, error: errMichelin } = await supabase
    .from('raw_michelin')
    .select('id', { count: 'exact' });

  if (errMichelin) {
    console.error("raw_michelin ERROR:", errMichelin.message);
  } else {
    console.log(`raw_michelin TOTAL records: ${michelin.length}`);
  }

  // Try to query articles_veille
  const { data: articles, error: errArticles } = await supabase
    .from('articles_veille')
    .select('id')
    .gte('created_at', isoYesterday);

  if (errArticles) {
    console.error("articles_veille ERROR:", errArticles.message);
  } else {
    console.log(`articles_veille: ${articles.length} records since yesterday.`);
  }

  // Check what tables do exist by trying to insert a dummy query if we had pgmeta, but let's stick to this.
}

check();
