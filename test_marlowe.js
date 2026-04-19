require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `Agis comme Marina, une experte pointue en stratégie d'opportunité de marché de logiciels (SaaS) et analyste de startups locales.
Analyse cet article d'actualité locale française :
Titre : Transports publics en crise
Description : Les grèves ralentissent l'économie locale.
Région concernée : Ile-de-France

Mission : En lisant entre les lignes de l'événement relaté dans l'article, trouve une véritable idée de startup informatique, très nichée, pragmatique.
Tu DOIS impérativement répondre DANS CE FORMAT EXACT (avec les '|||' comme séparateurs, rien d'autre) :
[Un Titre résumé de l'enjeu en 1 phrase courte]|||Note Stratégique : [Une analyse de 3-4 lignes max expliquant l'impact business local en se référant au contexte de l'article]|||<strong>Initiative locale ou tendance :</strong> [Décris une dynamique précise issue de l'article ou d'un besoin parallèle dans la région].<br/><br/><strong>Le problème local :</strong> [Explication claire de ce dont manquent les entreprises/mairies à cause de cet événement]<br/><br/><strong>L'idée de Startup (SaaS/App) :</strong> [Une idée d'application ou SaaS ultra concrète, hyper pragmatique pour résoudre spécifiquement ça]`;
  console.log("Calling model...");
  const result = await model.generateContent(prompt);
  let output = result.response.text();
  console.log("RAW OUTPUT:");
  console.log(output);
  console.log("SPLITS:", output.split("|||").length);
}
testGemini();
