require('dotenv').config({ path: '.env.local' });

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
// Marlowe Scout V6 - Couverture Intégrale (Vision Marina)

const TOPIC_QUERY = "(mobilité OR transport OR ZFE OR ruraux OR rural OR vélo OR électrique OR utilitaire OR logistique)";

// Sources nationales et Presse Spécialisée (Acteurs Mobilité)
const NATIONAL_SOURCES = [
  { nom: "Média Spécialisés", q: "(source:mobilicites.com OR source:ville-rail-transports.com OR source:flottesautomobiles.com OR source:journalauto.com OR source:largus.fr)", tag: "National" },
  { nom: "Gouvernement & Institutions", q: "(source:ademe.fr OR %22Minist%C3%A8re+des+transports%22)", tag: "National" },
  { nom: "Syndicats Mobilité", q: "(site:mobilians.fr OR site:fntv.fr OR site:fntr.fr)", tag: "National" },
  { nom: "Incubateurs & Tech", q: "(%22Moove Lab%22 OR %22EIT Urban Mobility%22 OR %22X-Mobility%22 OR %22incubateur mobilité%22 OR %22accélérateur mobilité%22)", tag: "National" }
];

// PQR Ultra-ciblée (Requêtes géolocalisées pour garantir > 20 articles récents)
const REGIONAL_SOURCES = [
  { nom: "Auvergne-Rhône-Alpes", q: 'Auvergne Rhône Alpes', tag: "Auvergne-Rhône-Alpes" },
  { nom: "Bourgogne-Franche-Comté", q: 'Bourgogne Franche Comté', tag: "Bourgogne-Franche-Comté" },
  { nom: "Bretagne", q: 'Bretagne', tag: "Bretagne" },
  { nom: "Centre-Val de Loire", q: 'Centre Val Loire', tag: "Centre-Val de Loire" },
  { nom: "Corse", q: 'Corse', tag: "Corse" },
  { nom: "Grand Est", q: 'Grand Est Strasbourg', tag: "Grand Est" },
  { nom: "Hauts-de-France", q: 'Hauts de France Lille', tag: "Hauts-de-France" },
  { nom: "Île-de-France", q: 'Ile de France Paris', tag: "Île-de-France" },
  { nom: "Normandie", q: 'Normandie Rouen', tag: "Normandie" },
  { nom: "Nouvelle-Aquitaine", q: 'Nouvelle Aquitaine Bordeaux', tag: "Nouvelle-Aquitaine" },
  { nom: "Occitanie", q: 'Occitanie Toulouse', tag: "Occitanie" },
  { nom: "Pays de la Loire", q: 'Pays de la Loire Nantes', tag: "Pays de la Loire" },
  { nom: "Provence-Alpes-Côte d'Azur", q: 'PACA Marseille', tag: "Provence-Alpes-Côte d'Azur" },
  
  // DOM-TOM
  { nom: "Guadeloupe", q: 'Guadeloupe', tag: "Guadeloupe" },
  { nom: "Martinique", q: 'Martinique', tag: "Martinique" },
  { nom: "Guyane", q: 'Guyane', tag: "Guyane" },
  { nom: "La Réunion", q: 'Reunion', tag: "La Réunion" },
  { nom: "Mayotte", q: 'Mayotte', tag: "Mayotte" }
];

const ALL_TARGETS = [...NATIONAL_SOURCES, ...REGIONAL_SOURCES];
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
); 

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

// === EPIC 7 : LE BOUCLIER DE MODÉRATION POLITIQUE & ANTI-BIAIS ===
function isArticleValid(titre, desc, sourceNom) {
  const text = (titre + " " + desc).toLowerCase();
  
  // 1. Filtre Hors-Sujet & Faits Divers (Narcotrafic, meurtre, drogue...)
  const blacklistFaitDivers = ["narcotrafic", "meurtre", "drogue", "agression", "tribunal", "condamné", "prison", "couteau", "fusillade", "homicide", "police"];
  if (blacklistFaitDivers.some(w => text.includes(w))) return false;

  // 2. Filtre Politique (Assemblée, Macron, LFI, RN...)
  const blacklistPolitique = ["macroniste", "député", "mélenchon", "le pen", "assemblée nationale", "lfi", "rn", "gouvernement", "ministre", "remaniement", "scandale", "polémique", "parti"];
  if (blacklistPolitique.some(w => text.includes(w))) return false;

  // 3. Bouclier Anti-Biais (Groupe Bolloré)
  const isBollore = sourceNom === "Presse Éco & Générale" || titre.includes("CNews") || titre.includes("Europe 1") || titre.includes("Le JDD") || titre.includes("Paris Match") || titre.includes("Figaro");
  if (isBollore) {
    // Mots connotés "Édito à charge" / Panique morale
    const biasWords = ["honte", "scandale", "wokisme", "ruine", "insécurité", "échec", "mensonge", "catastrophe", "gauchiste", "islamo", "décadence", "ensauvagement"];
    if (biasWords.some(w => text.includes(w))) return false; // Rejet immédiat
  }

  // 4. Filtre Anti-Paywall (Abonnés)
  const blacklistPaywall = ["abonné", "payant", "réservé", "abonnez-vous", "premium"];
  if (blacklistPaywall.some(w => text.includes(w))) return false;

  return true; // L'article est factuel, libre et lié à la mobilité
}

// L'Esprit Sémantique Freemium - V8 (NLP Vicieux : Découpage ciblé)
async function generateMarinaInsightFree(titre, desc, sourceNom, region, searchQ) {
  const text = (titre + " " + desc).toLowerCase();
  
  // Extraction de mots-clés du titre pour donner l'illusion d'une lecture ciblée
  const words = titre.split(' ').filter(w => w.length > 5 && !['comment', 'pourquoi', 'contre', 'depuis', 'quand'].includes(w.toLowerCase()));
  const sujetPrincipal = words.length > 0 ? words[0] : "cet enjeu d'actualité";
  const localisation = region && region !== "National" ? `en ${region}` : "au niveau national";
  
  let premierePhrase = desc.split('. ')[0] || titre;
  if (premierePhrase.length > 150) premierePhrase = premierePhrase.substring(0, 150) + "...";

  let resume = `Nouveauté marché : L'évolution de la mobilité territoriale.`;
  let detail = `Note Stratégique : L'information locale (Source: ${sourceNom}) indique la tendance suivante : "${premierePhrase}". L'impact direct ${localisation} est une tension sur les process opérationnels. Les dirigeants doivent s'impliquer pour ne pas gaspiller de budget sur des ressources mal allouées.`;
  
  let specificProblemQuery = `"optimisation" véhicules PME OR "rentabilité" flotte automobile`;

  let theProblem = `D'après l'actualité autour de ${sujetPrincipal}, les décideurs de ${region || 'la région'} peinent à coordonner leurs flottes en temps réel. L'absence d'outils numériques légers limite l'agilité face à ces nouvelles réglementations et contraintes économiques.`;
  let theIdea = `Déploiement d'un module "Alerte & Dispatch" simplifié et localisé. Une plateforme très épurée qui identifie directement les véhicules sous-utilisés ou accidentés et propose des ré-allocations pour gagner en rentabilité.`;

  // --- RECHERCHE WEB EN TEMPS RÉEL (Intelligence Concurrentielle Locale) ---
  const insightQuery = `${specificProblemQuery} ${searchQ}`;
  // Retour sur Google News qui fonctionnait parfaitement
  const gNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(insightQuery)}&hl=fr&gl=FR&ceid=FR:fr`;
  
  let localSolutionsText = "";
  try {
    const response = await fetch(gNewsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    if (response.ok) {
      const xml = await response.text();
      const localArticles = parseRSS(xml, 3); // On prend les 3 meilleures news
      
      if (localArticles.length > 0) {
        localSolutionsText = `<strong>Initiatives locales récentes :</strong><ul class="mt-1 space-y-1 mb-2">` + 
          localArticles.map(a => `<li class="opacity-90 leading-tight pr-4">- <a href="${a.link}" target="_blank" class="underline decoration-primary/30 hover:decoration-primary">${a.title}</a></li>`).join("") + 
          `</ul>`;
      } else {
        localSolutionsText = `<strong class="text-green-600">Initiatives locales récentes :</strong> <span class="opacity-90">Aucun projet concurrent ou médiatisé repéré récemment dans la presse locale. Le besoin est grand ouvert.</span><br/><br/>`;
      }
    } else {
      localSolutionsText = `<strong>Initiatives locales récentes :</strong> <span class="opacity-80">Ressources web inaccessibles terminées temporairement.</span><br/><br/>`;
    }
  } catch (e) {
    localSolutionsText = `<strong>Initiatives locales récentes :</strong> <span class="opacity-80">Erreur de veille web.</span><br/><br/>`;
  }

  // Assemblage de la section Marché complète
  let marche = `${localSolutionsText}
<strong>Le problème :</strong> ${theProblem}<br/><br/>
<strong>L'idée de projet :</strong> ${theIdea}`;
  
  return resume + "|||" + detail + "|||" + marche;
}

// Vraie IA Premium - Gemini 2.5 Flash
// Vraie IA Premium - Gemini 2.5 Flash
async function generateMarinaInsightPremium(titre, desc, sourceNom, region) {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Agis comme Marina, une experte pointue en stratégie d'opportunité de marché de logiciels (SaaS) et analyste de startups locales.
Analyse cet article d'actualité locale française :
Titre : ${titre}
Description : ${desc}
Région concernée : ${region || "National"}

Mission : En lisant entre les lignes de l'événement relaté dans l'article, trouve une véritable idée de startup informatique, très nichée, pragmatique.
Tu DOIS impérativement répondre DANS CE FORMAT EXACT (avec les '|||' comme séparateurs, rien d'autre) :
[Un Titre résumé de l'enjeu en 1 phrase courte]|||Note Stratégique : [Une analyse de 3-4 lignes max expliquant l'impact business local en se référant au contexte de l'article]|||<strong>Initiative locale ou tendance :</strong> [Décris une dynamique précise issue de l'article ou d'un besoin parallèle dans la région].<br/><br/><strong>Le problème local :</strong> [Explication claire de ce dont manquent les entreprises/mairies à cause de cet événement]<br/><br/><strong>L'idée de Startup (SaaS/App) :</strong> [Une idée d'application ou SaaS ultra concrète, hyper pragmatique pour résoudre spécifiquement ça]`;
    const result = await model.generateContent(prompt);
    let output = result.response.text();
    // Nettoyage Markdown potentiel imposé par le modèle LLM
    output = output.replace(/```html/g, '').replace(/```/g, '').trim();
    
    // Fallback si Gemini a mal formaté
    if (output.split("|||").length < 3) return null;
    return output;
  } catch(e) {
    console.error("      ⚠️ Erreur Gemini:", e.message);
    return null;
  }
}

function parseRSS(xmlStr, limit = 4) {
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

    items.push({ title: title, description: desc, link: link, pubDate: pubDate });
    count++;
  }
  return items;
}

async function runScout() {
  console.log("🕵️‍♂️  Marlowe Scout V6 - Scan Super-Massif (Vision Marina)...");
  let totalInjected = 0;

  for (const source of ALL_TARGETS) {
    console.log(`\n📡 Scan de : ${source.tag} (${source.nom})`);
    try {
      // Pour éviter le blocage IP (503) de Google, on ajoute un petit délai entre chaque région
      await new Promise(r => setTimeout(r, 2000));
      
      // On combine les mots clés mobilités aux noms de territoires.
      const searchQuery = `mobilité OR transport OR ZFE ${source.q}`;
      const gNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=fr&gl=FR&ceid=FR:fr`;
      const response = await fetch(gNewsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9'
        }
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const xml = await response.text();
      const articles = parseRSS(xml, 20); // Extraction de 20 articles par source géographique !
      
      console.log(`   => ${articles.length} articles trouvés.`);
      
      for (const article of articles) {
        // Validation Epic 7
        if (!isArticleValid(article.title, article.description, source.nom)) {
           console.log(`      ⛔ [REJETÉ - Hors-sujet/Politique] ${article.title.substring(0, 30)}...`);
           continue;
        }

        const insight_free = await generateMarinaInsightFree(article.title, article.description, source.nom, source.tag, source.q);
        
        // Anti-Rate-Limit (Quota Gemini Gratuit : 15 RPM max)
        // -> Attente stricte de 4500ms entre chaque article
        if (process.env.GEMINI_API_KEY) {
          await new Promise(r => setTimeout(r, 4500));
        }

        // Si genAI est dispo, on lance en parallèle l'analyse Premium
        const insight_premium = process.env.GEMINI_API_KEY ? await generateMarinaInsightPremium(article.title, article.description, source.nom, source.tag) : null;

        const payload = {
          titre: article.title,
          contenu: article.description,
          source_nom: source.nom,
          source_url: article.link,
          tags: [source.tag],
          marlowe_insight: insight_free,
          marlowe_insight_premium: insight_premium,
          created_at: article.pubDate
        };

        const { error } = await supabaseAdmin.from('articles_veille').insert([payload]);

        if (!error) {
          totalInjected++;
          console.log(`      ✅ [OK] ${article.title.substring(0, 30)}...`);
        } else {
          console.error(`      ❌ Erreur insertion DB: ${error.message}`);
        }
        
        // Rate Limit plus sévère pour éviter de surcharger Google News ET Gemini (15 RPM en free tier limit = 4s d'attente mini)
        await new Promise(r => setTimeout(r, 4500));
        
      }
    } catch (error) {
      console.error(`      ❌ Erreur sur la source: ${error.message}`);
    }
  }

  console.log(`\n🎉 Scan Terminé ! ${totalInjected} articles géolocalisés et ultra-ciblés.`);
}

runScout();
