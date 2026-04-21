import AdmZip from 'adm-zip';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import 'dotenv/config';

// Fichier de destination pour le flux national massif
const TEMP_FILE_PATH = './temp_datatourisme_national.zip';

const DT_API_KEY = process.env.DATATOURISME_API_KEY;
const DT_URL = process.env.DATATOURISME_FLUX_URL || `https://diffuseur.datatourisme.fr/webservice/bb96b7a3df0ed93dd8e821e0a9a34aa1/${DT_API_KEY}`;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ OUPS ! Veuillez définir NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function downloadZipStream(url, destPath) {
    console.log(`==> Début du téléchargement streamé depuis ${url}...`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - Le flux n'est peut-être pas prêt côté Extranet Datatourisme.`);
    }
    if (!response.body) throw new Error("Réponse vide.");

    const fileStream = fs.createWriteStream(destPath);
    
    // Convert Web ReadableStream to Node Readable using pipeline (supporté dans les NodeJS récents)
    // Pour simplifier et supporter tous les OS, on utilise un custom reader
    const reader = response.body.getReader();
    
    while(true) {
        const {done, value} = await reader.read();
        if (done) break;
        fileStream.write(Buffer.from(value));
    }
    fileStream.end();
    
    console.log(`==> Téléchargement sécurisé terminé sur le disque interne (${destPath}). RAM protégée.`);
}

async function run() {
    console.log("🚀 Lancement du Crawler NATIONAL Datatourisme...");
    
    if (!DT_API_KEY) {
        console.warn("⚠️ Attention : DATATOURISME_API_KEY manquante. S'assurer que le flux est public ou la clé configurée.");
    }

    try {
        await downloadZipStream(DT_URL, TEMP_FILE_PATH);

        console.log("==> Extraction du massif ZIP depuis le disque local...");
        const zip = new AdmZip(TEMP_FILE_PATH);
        const zipEntries = zip.getEntries();
        
        let indexEntry = zipEntries.find(entry => entry.entryName === "index.json");
        if (!indexEntry) throw new Error("index.json introuvable dans l'archive.");

        console.log("==> Lecture de l'Index...");
        const indexData = JSON.parse(zip.readAsText(indexEntry));
        const filesToParse = indexData.map(d => d.file || d.filename).filter(Boolean);
        
        console.log(`==> ${filesToParse.length} objets territoriaux à parser.`);
        
        let parsedEvents = [];
        let totalInserted = 0;

        // Boucle d'extraction V2
        for (let idx = 0; idx < filesToParse.length; idx++) {
            const filePath = filesToParse[idx];
            const fileEntry = zipEntries.find(e => e.entryName.endsWith(filePath));
            if (!fileEntry) continue;

            try {
                const rawJson = zip.readAsText(fileEntry);
                const poi = JSON.parse(rawJson);
                
                const title = poi["rdfs:label"]?.["fr"]?.[0] || poi["dc:identifier"];
                const dt_id = poi["@id"];
                
                const locationNode = poi["isLocatedAt"]?.[0];
                const latStr = locationNode?.["schema:geo"]?.["schema:latitude"];
                const lonStr = locationNode?.["schema:geo"]?.["schema:longitude"];
                const city = locationNode?.["schema:address"]?.[0]?.["schema:addressLocality"] || null;
                
                const description = poi["rdfs:comment"]?.["fr"]?.[0] || poi["hasDescription"]?.[0]?.["shortDescription"]?.["fr"]?.[0] || null;

                const typesArray = poi["@type"] || [];
                let typeLabel = "Événement Culturel";
                if (typesArray.includes("CulturalSite")) typeLabel = "Lieu Culturel";
                if (typesArray.includes("schema:Park")) typeLabel = "Parc & Nature";
                if (typesArray.includes("schema:Museum")) typeLabel = "Musée";

                let startDate = null;
                let endDate = null;
                const takesPlaceAt = poi["takesPlaceAt"]?.[0];
                if (takesPlaceAt) {
                    startDate = takesPlaceAt["startDate"];
                    endDate = takesPlaceAt["endDate"];
                }

                if (latStr && lonStr) {
                   const Categories = ["Activité Touristique"];
                   if (typeLabel.includes("Événement")) Categories.push("Événement Culturel");

                   parsedEvents.push({
                       source_id: `datatourisme:${dt_id}`,
                       source: 'DATATOURISME',
                       categories: Categories,
                       title: title,
                       type: typeLabel,
                       lat: parseFloat(latStr),
                       lon: parseFloat(lonStr),
                       description: description,
                       city: city,
                       start_date: startDate ? new Date(startDate).toISOString() : null,
                       end_date: endDate ? new Date(endDate).toISOString() : null
                   });
                }
            } catch (subErr) {
                // Silencie les erreurs spécifiques de sous-fichiers corrompus
            }

            // On envoie à Supabase par micro-batchs pour éviter les OOM de mémoire vive JavaScript (Garbage Collector friendly)
            if (parsedEvents.length >= 500 || idx === filesToParse.length - 1) {
                if (parsedEvents.length > 0) {
                    const { error } = await supabase
                        .from('unified_pois')
                        .upsert(parsedEvents, { onConflict: 'source_id', ignoreDuplicates: false });
                        
                    if (error) {
                        console.error(`❌ Erreur d'insertion lot:`, error.message);
                    } else {
                        totalInserted += parsedEvents.length;
                        console.log(`[+] Upsert réussi. Sécurisés : ${totalInserted} / ${filesToParse.length}`);
                    }
                    parsedEvents = []; // Libération mémoire
                }
            }
        }

        console.log(`\n🎉 Ingestion Nationale Datatourisme Terminée : ${totalInserted} POIs importés de toute la France.`);
        
        // Nettoyage disque
        if (fs.existsSync(TEMP_FILE_PATH)) {
            fs.unlinkSync(TEMP_FILE_PATH);
            console.log("🧹 Fichier temporaire nettoyé.");
        }

    } catch (globalErr) {
        console.error("💥 Erreur fatale (Flux peut-être trop grand ou corrompu):", globalErr);
    }
}

run();
