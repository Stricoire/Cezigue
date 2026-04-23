require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAnalyses() {
  const { data, error } = await supabase
    .from('articles_veille')
    .select('titre, source_nom, tags, marlowe_insight_premium, created_at')
    .not('marlowe_insight_premium', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error(error);
    return;
  }

  // Group by premium insight
  const groups = {};
  data.forEach(a => {
    const p = a.marlowe_insight_premium;
    if (!groups[p]) {
      groups[p] = { count: 0, titles: [] };
    }
    groups[p].count++;
    groups[p].titles.push(a.titre);
  });

  let i = 1;
  for (const [insight, info] of Object.entries(groups)) {
    console.log(`\n======================================================`);
    console.log(`💡 THÈME ${i} (${info.count} articles associés)`);
    console.log(`Titres:`);
    info.titles.slice(0, 3).forEach(t => console.log(`  - ${t}`));
    if (info.titles.length > 3) console.log(`  - ... et ${info.titles.length - 3} autres`);
    console.log(`\n--- NOTE STRATÉGIQUE V8 ---`);
    console.log(insight);
    i++;
  }
}

checkAnalyses();
