import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import fetch from 'node-fetch';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("🚀 Lancement de l'ingestion Michelin (Bronze Layer)...");
  
  // 1. Download CSV
  const csvUrl = 'https://raw.githubusercontent.com/ngshiheng/michelin-my-maps/main/data/michelin_my_maps.csv';
  console.log(`Téléchargement des données depuis ${csvUrl}...`);
  
  const response = await fetch(csvUrl);
  const csvText = await response.text();
  
  // 2. Parse CSV
  console.log("Parsing du CSV...");
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true
  });

  console.log(`✅ ${records.length} restaurants trouvés au niveau mondial.`);
  
  // 3. Filtrer pour la France (ou proche)
  // On peut filtrer sur "France" dans l'adresse ou la localisation
  const frenchRecords = records.filter((r: any) => 
     r.Location.includes('France') || r.Address.includes('France')
  );
  
  console.log(`🇫🇷 ${frenchRecords.length} restaurants étoilés trouvés en France.`);

  if (frenchRecords.length === 0) {
      console.warn("⚠️ Aucun restaurant trouvé pour la France. On garde tout pour le test si nécessaire ? Non, on s'arrête.");
      return;
  }

  // 4. Upsert dans raw_michelin
  console.log("💾 Insertion dans la couche Bronze (raw_michelin)...");
  
  const batchSize = 500;
  let insertedCount = 0;
  
  for (let i = 0; i < frenchRecords.length; i += batchSize) {
    const batch = frenchRecords.slice(i, i + batchSize).map((r: any) => {
        // Generate a unique source ID from Name + lat + lon
        const sourceId = Buffer.from(`${r.Name}_${r.Latitude}_${r.Longitude}`).toString('base64');
        return {
            source_id: sourceId,
            name: r.Name,
            address: r.Address,
            city: r.Location.split(',')[0].trim(),
            price: r.Price,
            cuisine: r.Cuisine,
            lat: parseFloat(r.Latitude),
            lon: parseFloat(r.Longitude),
            award: r.Award,
            url: r.Url,
            description: r.Description
        };
    });

    const { error } = await supabase
      .from('raw_michelin')
      .upsert(batch, { onConflict: 'source_id' });

    if (error) {
      console.error(`❌ Erreur lors de l'insertion (batch ${i}):`, error.message);
    } else {
      insertedCount += batch.length;
      console.log(`   -> ${insertedCount} restaurants insérés...`);
    }
  }
  
  console.log("✅ Ingestion Bronze terminée.");
  
  // 5. Sync to Gold
  console.log("🔄 Synchronisation vers la couche Gold (unified_pois)...");
  const { error: syncError } = await supabase.rpc('sync_expert_pois_to_unified');
  if (syncError) {
      console.error("❌ Erreur lors de la synchronisation vers unified_pois:", syncError.message);
  } else {
      console.log("✅ Synchronisation réussie. Les restaurants étoilés sont désormais disponibles pour l'Agent !");
  }
}

run().catch(console.error);
