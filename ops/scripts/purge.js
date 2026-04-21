require('dotenv').config({path: '.env.local'});
const {createClient} = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function purgeJunk() {
  console.log("Purge des piscines et terrains de sport non nommés...");
  const {data, error} = await s.auth.admin.listUsers(); // just dummy to wake up connection
  
  // Exécuter une requete RPC brute ou un delete par petites requetes
  // Supprimer les piscines non nommées
  const { error: e1 } = await s
    .from('unified_pois')
    .delete()
    .eq('title', 'Non nommé');
  
  if (e1) console.error("Erreur suppression:", e1);
  else console.log("Poubelles 'Non nommé' purgées !");
}
purgeJunk();
