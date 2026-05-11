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

  // 4. Upsert dans raw_michelin et unified_pois (Par lots pour éviter les timeouts)
  console.log("💾 Insertion dans la couche Bronze (raw_michelin) et Silver (unified_pois)...");
  
  const batchSize = 500;
  let insertedCount = 0;
  
  for (let i = 0; i < frenchRecords.length; i += batchSize) {
    const rawBatch: any[] = [];
    const unifiedBatch: any[] = [];

    frenchRecords.slice(i, i + batchSize).forEach((r: any) => {
        const lat = parseFloat(r.Latitude);
        const lon = parseFloat(r.Longitude);
        
        if (isNaN(lat) || isNaN(lon)) return;

        // Generate a unique source ID from Name + lat + lon
        const sourceId = Buffer.from(`${r.Name}_${lat}_${lon}`).toString('base64');
        
        rawBatch.push({
            source_id: sourceId,
            name: r.Name,
            address: r.Address,
            city: r.Location.split(',')[0].trim(),
            price: r.Price,
            cuisine: r.Cuisine,
            lat: lat,
            lon: lon,
            award: r.Award,
            url: r.Url,
            description: r.Description
        });

        let type = 'restaurant';
        if (/Etoile|Étoile|Star/i.test(r.Award)) type = 'michelin_starred';
        else if (/Bib/i.test(r.Award)) type = 'michelin_bib';

        unifiedBatch.push({
            source_id: `michelin:${sourceId}`,
            source: 'MICHELIN',
            categories: ['Restauration'],
            title: r.Name,
            type: type,
            lat: lat,
            lon: lon,
            address: r.Address,
            city: r.Location.split(',')[0].trim(),
            description: r.Description,
            metadata: {
                award: r.Award,
                cuisine: r.Cuisine,
                price: r.Price,
                url: r.Url
            }
        });
    });

    const { error: rawErr } = await supabase
      .from('raw_michelin')
      .upsert(rawBatch, { onConflict: 'source_id' });

    if (rawErr) {
      console.error(`❌ Erreur raw_michelin (batch ${i}):`, rawErr.message);
    }

    const { error: uniErr } = await supabase
      .from('unified_pois')
      .upsert(unifiedBatch, { onConflict: 'source_id' });

    if (uniErr) {
      console.error(`❌ Erreur unified_pois (batch ${i}):`, uniErr.message);
    }

    insertedCount += rawBatch.length;
    console.log(`   -> ${insertedCount} restaurants insérés (Bronze & Silver)...`);
  }
  
  console.log("✅ Ingestion Bronze & Silver (Unified POI) terminée sans erreur !");
}

run().catch(console.error);
