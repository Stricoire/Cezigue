require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// ==========================================
// CONFIGURATION DES SOURCES (NIVEAU BRONZE)
// ==========================================
// Mix de Google News + Flux RSS directs PQR (Presse Quotidienne Régionale)
const REGIONAL_SOURCES = [
  { nom: "Auvergne-Rhône-Alpes", q: 'Auvergne Rhône Alpes', tag: "Auvergne-Rhône-Alpes" },
  { nom: "Bretagne", q: 'Bretagne', tag: "Bretagne" },
  { nom: "Occitanie", q: 'Occitanie Toulouse', tag: "Occitanie" },
  { nom: "Ile-de-France", q: 'Ile de France Paris', tag: "Île-de-France" },
  { nom: "Nouvelle-Aquitaine", q: 'Nouvelle Aquitaine Bordeaux', tag: "Nouvelle-Aquitaine" }
];

const PQR_DIRECT_RSS = [
  { nom: "Ouest-France (Bretagne/Pays de Loire)", url: "https://www.ouest-france.fr/rss/une", tag: "Bretagne" },
  { nom: "La Dépêche (Occitanie)", url: "https://www.ladepeche.fr/rss.xml", tag: "Occitanie" },
  { nom: "Le Parisien (IDF)", url: "https://www.leparisien.fr/arc/outboundfeeds/rss/ile-de-france.xml", tag: "Île-de-France" }
];

// Outils de nettoyage HTML
function decodeAndCleanHTML(str) {
  if (!str) return "Sans description";
  let cleaned = str.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  const uselessWords = ["Read more", "En savoir plus", "Continuer la lecture"];
  uselessWords.forEach(w => cleaned = cleaned.replace(w, ''));
  return cleaned;
}

// Filtres
function isArticleValid(titre, desc, sourceNom) {
  const text = (titre + " " + desc).toLowerCase();
  const blacklistFaitDivers = ["narcotrafic", "meurtre", "drogue", "agression", "tribunal", "condamné", "prison", "couteau", "fusillade", "homicide", "police"];
  if (blacklistFaitDivers.some(w => text.includes(w))) return false;
  const blacklistPolitique = ["macroniste", "député", "mélenchon", "le pen", "assemblée nationale", "lfi", "rn", "gouvernement", "ministre", "remaniement", "scandale", "polémique", "parti"];
  if (blacklistPolitique.some(w => text.includes(w))) return false;
  const blacklistPaywall = ["abonné", "payant", "réservé", "abonnez-vous", "premium"];
  if (blacklistPaywall.some(w => text.includes(w))) return false;
  return true;
}

// Extracteur RSS générique
function parseRSS(xmlStr, limit = 5) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  let count = 0;
  
  while ((match = itemRegex.exec(xmlStr)) !== null && count < limit) {
    const itemStr = match[1];
    
    const titleMatch = itemStr.match(/<title>([\s\S]*?)<\/title>/i) || [];
    let title = titleMatch[1] ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : "Sans titre";
    title = title.replace(/<[^>]+>/g, '').trim();
    
    const descMatch = itemStr.match(/<description>([\s\S]*?)<\/description>/i) || [];
    let desc = decodeAndCleanHTML(descMatch[1]);
    if (desc.length > 250) desc = desc.substring(0, 250) + "...";

    const linkMatch = itemStr.match(/<link>([\s\S]*?)<\/link>/i) || [];
    let rawLink = linkMatch[1] || "";
    const urlExtract = rawLink.match(/(https?:\/\/[^\s<\]]+)/);
    let link = urlExtract ? urlExtract[1] : `https://google.com/search?q=${encodeURIComponent(title)}`;

    const pubDateMatch = itemStr.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [];
    let pubDate = pubDateMatch[1] ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();

    items.push({ title, description: desc, link, pubDate });
    count++;
  }
  return items;
}

// ==========================================
// ETAPE 1 : BRONZE (INGESTION BRUTE MULTI-SOURCES)
// ==========================================
async function runBronzeExtraction() {
  console.log("🟠 [BRONZE] Ingestion des sources (Google News + Flux RSS directs)...");
  let newArticles = [];

  // 1. Google News
  for (const source of REGIONAL_SOURCES) {
    try {
      await new Promise(r => setTimeout(r, 2000));
      const searchQuery = `mobilité OR transport OR ZFE ${source.q}`;
      const gNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=fr&gl=FR&ceid=FR:fr`;
      const response = await fetch(gNewsUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (response.ok) {
        const articles = parseRSS(await response.text(), 3);
        articles.forEach(a => {
          if (isArticleValid(a.title, a.description, source.nom)) {
            newArticles.push({ ...a, source_nom: source.nom, tag: source.tag });
          }
        });
      }
    } catch (e) { console.error(`Erreur Google News pour ${source.tag}`); }
  }

  // 2. Direct PQR RSS
  for (const feed of PQR_DIRECT_RSS) {
    try {
      const response = await fetch(feed.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (response.ok) {
        const articles = parseRSS(await response.text(), 3);
        articles.forEach(a => {
          // On filtre en local pour s'assurer que ça parle de mobilité (les flux globaux parlent de tout)
          const text = (a.title + " " + a.description).toLowerCase();
          const mobilityKeywords = ["mobilité", "transport", "vélo", "zfe", "route", "bus", "train", "véhicule", "logistique"];
          if (mobilityKeywords.some(w => text.includes(w)) && isArticleValid(a.title, a.description, feed.nom)) {
            newArticles.push({ ...a, source_nom: feed.nom, tag: feed.tag });
          }
        });
      }
    } catch (e) { console.error(`Erreur RSS PQR pour ${feed.nom}`); }
  }

  // 3. Insertion en base de données sans appel LLM
  console.log(`Insertion de ${newArticles.length} articles bruts en DB...`);
  for (const article of newArticles) {
    // Vérifier si l'article existe déjà via son URL pour éviter les doublons
    const { data: existing } = await supabaseAdmin.from('articles_veille').select('id').eq('source_url', article.link).single();
    if (!existing) {
      await supabaseAdmin.from('articles_veille').insert([{
        titre: article.title,
        contenu: article.description,
        source_nom: article.source_nom,
        source_url: article.link,
        tags: [article.tag],
        created_at: article.pubDate
        // marlowe_insight et marlowe_insight_premium restent NULL (à analyser)
      }]);
    }
  }
}

// ==========================================
// ETAPE 2 & 3 : SILVER & GOLD (CLUSTERING THEMATIQUE ET ANALYSE)
// ==========================================
async function runSilverAndGoldAnalysis() {
  console.log("⚪ [SILVER/GOLD] Regroupement thématique et génération d'opportunités...");
  
  if (!genAI) {
    console.error("Clé Gemini manquante, impossible de générer les insights.");
    return;
  }

  // Récupérer les articles non analysés (les 50 plus récents)
  const { data: articles } = await supabaseAdmin
    .from('articles_veille')
    .select('id, titre, contenu, tags')
    .is('marlowe_insight_premium', null)
    .order('created_at', { ascending: false })
    .limit(30);

  if (!articles || articles.length === 0) {
    console.log("Aucun nouvel article à analyser.");
    return;
  }

  console.log(`${articles.length} articles à analyser en batch.`);

  const prompt = `Agis comme Marina, une experte pointue en stratégie de marché de startups (SaaS) et analyste des dynamiques territoriales.
Voici une liste d'articles d'actualités récents au format JSON :
${JSON.stringify(articles.map(a => ({ id: a.id, titre: a.titre, resume: a.contenu, region: a.tags[0] })))}

MISSION 1 (SILVER) : Regroupe ces articles par grands "Thèmes" (maximum 4 thèmes différents). Pour chaque thème, rédige une courte "Note de marché" (1-2 phrases résumant la tendance).

MISSION 2 (GOLD) : Pour CHAQUE thème identifié, génère une Note Stratégique avec une idée de Startup SaaS ou d'application ultra pragmatique pour résoudre le problème soulevé par cette tendance.

Tu DOIS IMPÉRATIVEMENT répondre avec un format JSON strict. Échappe correctement tous les guillemets (\\") à l'intérieur de tes textes pour éviter les erreurs de parsing. Le format doit être :
{
  "themes": [
    {
      "nom_theme": "Nom du thème (ex: ZFE et logistique)",
      "ids_articles": ["id1", "id2"],
      "insight_basic": "Note de Marché: [Ton résumé du marché en 1-2 phrases]",
      "insight_premium": "[Titre de l'enjeu]|||Note Stratégique : [Analyse]|||<strong>Initiative locale ou tendance :</strong> [Décris la tendance].<br/><br/><strong>Le problème local :</strong> [Le manque des entreprises/citoyens].<br/><br/><strong>L'idée de Startup (SaaS/App) :</strong> [Idée concrète]"
    }
  ]
}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    let output = result.response.text();
    output = output.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const analysis = JSON.parse(output);

    // Mise à jour de la base de données avec l'analyse Gold pour tous les articles liés
    for (const theme of analysis.themes) {
      if (!theme.ids_articles || theme.ids_articles.length === 0) continue;
      
      console.log(`Thème généré : ${theme.nom_theme} (${theme.ids_articles.length} articles associés)`);
      
      const { error } = await supabaseAdmin
        .from('articles_veille')
        .update({
          marlowe_insight: theme.insight_basic,
          marlowe_insight_premium: theme.insight_premium
        })
        .in('id', theme.ids_articles);
        
      if (error) console.error("Erreur lors de la mise à jour :", error.message);
    }
    
    console.log("Mise à jour des analyses terminée !");
    
  } catch (error) {
    console.error("Erreur critique lors de l'analyse Gemini :", error);
  }
}

// Fonction principale du Daemon
async function startMedallionPipeline() {
  console.log("🚀 Démarrage du Pipeline Medallion V8...");
  await runBronzeExtraction();
  // Pause de 5 secondes pour être sûr
  await new Promise(r => setTimeout(r, 5000));
  await runSilverAndGoldAnalysis();
  console.log("✅ Cycle V8 terminé.");
}

if (require.main === module) {
  startMedallionPipeline();
}
