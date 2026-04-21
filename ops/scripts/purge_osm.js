require('dotenv').config({path: '.env.local'});
const {createClient} = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function purgeJunk() {
  console.log("🧹 Reprise du nettoyage en mode TURBO (avec pauses pour ne pas bloquer l'API)...");
  let keepGoing = true; let deletedCount = 0;
  while(keepGoing) {
    const { data: items } = await s.from('unified_pois').select('id').eq('title', 'Non nommé').limit(500); 
    if (!items || items.length === 0) break;
    const ids = items.map(x => x.id);
    for(let i=0; i<ids.length; i+=100) {
        const chunk = ids.slice(i, i+100);
        await s.from('unified_pois').delete().in('id', chunk);
        deletedCount += chunk.length;
    }
    console.log(`♻️ Purgé ${deletedCount} poubelles...`);
    await sleep(300); // Laisse de l'air à Supabase pour ne pas DDoS l'App !
  }
  console.log("✅ TERMINÉ ! Moins de piscines, plus de pertinence.");
}
purgeJunk();
