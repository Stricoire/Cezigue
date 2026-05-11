import fetch from 'node-fetch';

const CKAN_API_URL = 'https://opendata.government.bg/api/3/action/package_search';

const KEYWORDS = [
  'транспорт', // transport
  'автобус',   // bus
  'мобилност', // mobility
  'транзит',   // transit
  'туризъм',   // tourism
  'места'      // places
];

async function auditCKAN() {
  console.log("🔍 Démarrage de l'audit Open Data Bulgarie (CKAN)");
  let totalDatasetsFound = 0;
  const datasets = [];

  for (const keyword of KEYWORDS) {
    try {
      const url = `${CKAN_API_URL}?q=${encodeURIComponent(keyword)}&rows=10`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Erreur HTTP ${res.status} pour le mot clé ${keyword}`);
        continue;
      }
      
      const data = await res.json();
      if (data.success && data.result) {
        console.log(`\nMot-clé: "${keyword}" -> ${data.result.count} jeux de données trouvés.`);
        
        // Stocker les 3 premiers résultats pour le rapport
        data.result.results.slice(0, 3).forEach(dataset => {
            if (!datasets.find(d => d.id === dataset.id)) {
                datasets.push({
                    id: dataset.id,
                    title: dataset.title,
                    organization: dataset.organization?.title || 'N/A',
                    formats: dataset.resources.map(r => r.format).join(', '),
                    notes: dataset.notes ? dataset.notes.substring(0, 100) + '...' : 'Pas de description'
                });
                totalDatasetsFound++;
            }
        });
      }
    } catch (e) {
      console.error(`Erreur d'exécution pour ${keyword} :`, e.message);
    }
  }

  console.log("\n=== ÉCHANTILLON DE DATASETS INTÉRESSANTS ===");
  datasets.forEach((d, i) => {
      console.log(`\n[${i+1}] ${d.title}`);
      console.log(`    Organisation : ${d.organization}`);
      console.log(`    Formats : ${d.formats}`);
      console.log(`    Description : ${d.notes}`);
  });
  
  console.log(`\n✅ Audit terminé. Echantillon de ${totalDatasetsFound} datasets collecté.`);
}

auditCKAN();
