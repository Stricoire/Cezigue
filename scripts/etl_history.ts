import { createClient } from '@supabase/supabase-js';

// Instanciation de Supabase via les variables d'environnement (GitHub Secrets)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

const ODS_THERMAL_URL = "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux/exports/json";

async function runEtl() {
    console.log(`[ETL] Début de l'extraction des données journalières : ${new Date().toISOString()}`);
    const todayDate = new Date().toISOString().split('T')[0];

    try {
        console.log(`[ETL][Thermique] Téléchargement du snapshot journalier...`);
        // Télécharge le snapshot JSON complet des stations d'aujourd'hui
        const response = await fetch(ODS_THERMAL_URL);
        if (!response.ok) throw new Error("Erreur lors du téléchargement de l'API Thermal");
        
        const stations = await response.json();
        console.log(`[ETL][Thermique] ${stations.length} stations récupérées. Sauvegarde en BDD...`);

        // Batch processing pour Supabase
        const BATCH_SIZE = 500;
        let insertedCount = 0;

        for (let i = 0; i < stations.length; i += BATCH_SIZE) {
            const batch = stations.slice(i, i + BATCH_SIZE);
            const factRecords: any[] = [];
            const dimRecords: any[] = [];

            batch.forEach((s: any) => {
                if (!s.id) return;
                
                // Maintien de la Dimension (Au cas où c'est une nouvelle station)
                dimRecords.push({
                    id: String(s.id),
                    type: 'thermique',
                    nom: s.adresse || "Station Thermique", // data.gouv n'a pas tjrs de nom complet
                    adresse: s.adresse,
                    ville: s.ville,
                    lat: s.geom ? s.geom.lat : null,
                    lon: s.geom ? s.geom.lon : null
                });

                // Extraction des différents carburants (Le JSON OpenDataSoft liste SP98, E10 etc. sous format dynamique)
                const fuels = ['gazole', 'sp98', 'sp95', 'e10', 'e85', 'gplc'];
                fuels.forEach(fuel => {
                    const priceKey = `${fuel}_prix`;
                    if (s[priceKey] !== undefined && s[priceKey] !== null) {
                        factRecords.push({
                            station_id: String(s.id),
                            carburant: fuel.toUpperCase(),
                            prix: parseFloat(s[priceKey]),
                            date_releve: todayDate
                        });
                    }
                });
            });

            // 1. Sauvegarde silencieuse des dimensions (ON CONFLICT DO NOTHING)
            if (dimRecords.length > 0) {
                await supabase.from('dim_stations').upsert(dimRecords, { onConflict: 'id', ignoreDuplicates: true });
            }

            // 2. Sauvegarde des Faits tarifaires
            if (factRecords.length > 0) {
                const { error } = await supabase.from('fact_prices').upsert(factRecords, { 
                    onConflict: 'station_id, carburant, date_releve', // Empêche le spam si run 2x le même jour
                    ignoreDuplicates: true 
                });
                
                if (error) console.error("[ETL] Erreur d'insertion batch :", error.message);
                else insertedCount += factRecords.length;
            }
        }

        console.log(`[ETL] Terminé ! ${insertedCount} relevés de prix insérés pour la journée de ${todayDate}.`);

    } catch (error) {
        console.error(`[ETL] Échec critique :`, error);
        process.exit(1);
    }
}

// Exécution
runEtl();
