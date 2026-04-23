import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Fonction utilitaire pour temporiser les appels (politesse)
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function run() {
  console.log("🚀 Lancement de l'ingestion Relais Routiers (Bronze Layer)...");
  
  // 1. Récupérer le sitemap
  console.log("🌐 Téléchargement du sitemap de relais-routiers.com...");
  const sitemapRes = await fetch('https://www.relais-routiers.com/sitemap.xml', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const sitemapText = await sitemapRes.text();
  
  const matches = [...sitemapText.matchAll(/ficherelais\.asp\?nrelais=([A-Z0-9]+)/g)];
  const ids = Array.from(new Set(matches.map(m => m[1])));
  
  console.log(`📡 Trouvé ${ids.length} relais routiers dans le sitemap.`);

  const batch = [];
  
  // 2. Scraping séquentiel
  console.log("🔍 Extraction des données (JSON-LD) de chaque fiche...");
  for (let i = 0; i < ids.length; i++) {
     const id = ids[i];
     try {
         const res = await fetch(`https://www.relais-routiers.com/ficherelais.asp?nrelais=${id}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
         const html = await res.text();
         
         // Extraction du JSON-LD
         const matchLd = html.match(/<script type="application\/ld\+json">\s*({[\s\S]*?})\s*<\/script>/);
         if (!matchLd) continue;
         
         const jsonLd = JSON.parse(matchLd[1]);
         
         // Extraction coordonnées depuis l'URL maps
         let lat = null, lon = null;
         if (jsonLd.hasMap) {
             const coordMatch = jsonLd.hasMap.match(/@([\d\.\-]+),([\d\.\-]+)/);
             if (coordMatch) {
                 lat = parseFloat(coordMatch[1]);
                 lon = parseFloat(coordMatch[2]);
             }
         }
         
         // Facilities
         const facilities: any = {};
         if (jsonLd.amenityFeature) {
             jsonLd.amenityFeature.forEach((f: any) => {
                 if (f.name) facilities[f.name.toLowerCase().replace(/ /g, '_')] = f.value;
             });
         }
         
         if (lat && lon) {
             batch.push({
                 source_id: id,
                 name: jsonLd.name || "Relais Routier Inconnu",
                 address: jsonLd.address?.streetAddress || "",
                 city: jsonLd.address?.addressLocality || "",
                 lat,
                 lon,
                 facilities
             });
         }
         
         // Logging progression
         if ((i + 1) % 50 === 0) console.log(`   ⏳ Progression : ${i+1}/${ids.length}`);
         
     } catch(e) {
         console.error(`⚠️ Erreur sur ${id}:`, e);
     }
     
     // Politesse
     await delay(100);
  }

  console.log(`🇫🇷 ${batch.length} relais routiers valides extraits.`);

  if (batch.length === 0) {
      console.warn("⚠️ Aucun relais extrait. Arrêt.");
      return;
  }

  // 3. Upsert dans raw_relais_routiers
  console.log("💾 Insertion dans la couche Bronze (raw_relais_routiers)...");
  
  // Par batch de 500
  const batchSize = 500;
  let insertedCount = 0;
  
  for (let i = 0; i < batch.length; i += batchSize) {
     const subBatch = batch.slice(i, i + batchSize);
     const { error } = await supabase
        .from('raw_relais_routiers')
        .upsert(subBatch, { onConflict: 'source_id' });

     if (error) {
        console.error(`❌ Erreur lors de l'insertion (batch ${i}):`, error.message);
     } else {
        insertedCount += subBatch.length;
        console.log(`   -> ${insertedCount} relais routiers insérés...`);
     }
  }
  
  // 4. Sync to Gold
  console.log("🔄 Synchronisation vers la couche Gold (unified_pois)...");
  const { error: syncError } = await supabase.rpc('sync_expert_pois_to_unified');
  if (syncError) {
      console.error("❌ Erreur lors de la synchronisation vers unified_pois:", syncError.message);
  } else {
      console.log("✅ Synchronisation réussie. Les Relais Routiers sont désormais disponibles au global pour l'Agent !");
  }
}

run().catch(console.error);
