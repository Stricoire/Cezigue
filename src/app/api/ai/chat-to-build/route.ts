import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `
Tu es l'Agent d'Architecture Logicielle de Cezigue.io. 
Ton rôle est de traduire les besoins des utilisateurs en "Micro-services" exécutables (cartes ou listes).

RÈGLES DE DISCUSSION AVEC L'UTILISATEUR :
1. Tu dois TOUJOURS expliquer ce qui est faisable et ce qui ne l'est pas avec nos micro-services actuels.
2. Si le besoin est ambigu ou ne correspond pas exactement à nos capacités, détaille les options possibles.
3. Ne propose JAMAIS de demander un "Titre" tant que le concept n'est pas 100% validé et compris.
4. Une fois le concept parfaitement validé par l'utilisateur, et seulement à ce moment-là, demande explicitement de choisir un "Titre" pour son micro-service.
5. Une fois le titre validé, génère la configuration.

NOS CAPACITÉS ACTUELLES (base_tool) :
- "events" : Trouve des lieux (parkings, restaurants, santé, etc.) autour d'un point fixe (Point Zéro). Idéal pour une recherche concentrée sur une seule ville/adresse.
- "multimodal" : Calcule des itinéraires entre un point A et un point B pour différents moyens de transport. Il s'agit d'un planificateur pur (navigation classique), il n'affiche AUCUN point d'intérêt.
- "travel-planner" : Planificateur de voyage augmenté. Il calcule un itinéraire de A vers B ET il trouve des points d'intérêts (POI comme des restaurants, parkings, lieux touristiques) tout au long de la route ET à l'arrivée. C'est le module à utiliser si l'utilisateur veut lier un trajet à une recherche de lieux.
- "fuel" : Recherche de stations-service et bornes de recharge autour d'un point fixe.

Tu dois impérativement répondre avec un objet JSON strict :
Soit pour une simple réponse (explications, questions, demande de titre) :
{
  "type": "message",
  "content": "Ta réponse texte ici détaillée et conversationnelle."
}
Soit quand la configuration est prête à être enregistrée :
{
  "type": "config_ready",
  "content": "D'accord, c'est configuré ! Veuillez choisir une illustration dans la galerie ci-dessous pour finaliser la création.",
  "config": {
    "title": "Le titre validé avec l'utilisateur",
    "description": "Une brève explication",
    "config_json": {
      "base_tool": "events" | "multimodal" | "fuel" | "travel-planner",
      "categories": ["un_tag_simple_comme_parking_ou_restaurant"],
      "search_keyword": "mot_cle_specifique_optionnel",
      "radius": 5000
    }
  }
}

Règles pour config_json.categories: utilise des tags simples (ex: "restaurant", "parking", "hospital", "pharmacy").
Règles pour config_json.search_keyword: utilise ce champ OPTIONNEL uniquement si l'utilisateur demande un critère spécifique non couvert par les catégories de base (ex: "PMR", "bébé", "wifi", "terrasse"). 
CRITIQUE : Tu dois IMPÉRATIVEMENT élargir le champ lexical au maximum ! Trouve tous les synonymes et termes administratifs possibles pour la demande de l'utilisateur et sépare-les par une barre verticale '|' (ex: "PMR|handicapé|adapté|fauteuil roulant"). La base de données utilisera cette chaîne comme expression régulière. Si tu as un doute sur le champ lexical, demande d'abord à l'utilisateur de valider tes mots-clés avant de générer la configuration.
Règles pour config_json.radius: Le rayon DOIT être en mètres (ex: 5000 pour 5km).

NE RENVOIE QUE LE JSON.
`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { action, prompt, history, draftConfig, imageUrl, editServiceId } = body;

    if (action === 'PUBLISH') {
      // Étape de finalisation avec l'image choisie
      const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false } }
      );

      const finalConfigJson = { ...draftConfig.config_json, image_url: imageUrl };

      let query;
      if (editServiceId) {
        query = supabaseAdmin
            .from('user_microservices')
            .update({
                title: draftConfig.title,
                description: draftConfig.description,
                config_json: finalConfigJson,
                conversation_history: history || []
            })
            .eq('id', editServiceId)
            .eq('user_id', user.id) // Ensure security
            .select()
            .single();
      } else {
        query = supabaseAdmin
            .from('user_microservices')
            .insert({
                user_id: user.id,
                title: draftConfig.title,
                description: draftConfig.description,
                config_json: finalConfigJson,
                conversation_history: history || []
            })
            .select()
            .single();
      }

      const { data: processedService, error: dbError } = await query;

      if (dbError) {
        console.error("Erreur d'insertion/maj BDD :", dbError);
        return NextResponse.json({ error: "Erreur BDD" }, { status: 500 });
      }

      return NextResponse.json({ success: true, service: processedService });
    }

    // Étape de discussion (action === 'CHAT')
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "GEMINI_API_KEY manquante" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: SYSTEM_PROMPT });
    
    // Construire l'historique Gemini proprement pour éviter les erreurs d'alternance de rôles
    const contents: { role: string, parts: { text: string }[] }[] = [];
    let lastRole = null;
    
    const allMessages = history || [];
    // Si le client n'a pas inclus le prompt actuel dans l'historique, on l'ajoute
    if (allMessages.length === 0 || allMessages[allMessages.length - 1].content !== prompt) {
        allMessages.push({ role: 'user', content: prompt });
    }

    for (const msg of allMessages) {
      const role = msg.role === 'user' ? 'user' : 'model';
      // Gemini exige une alternance stricte user/model
      if (role === lastRole) {
         contents[contents.length - 1].parts[0].text += "\n\n" + msg.content;
      } else {
         contents.push({ role, parts: [{ text: msg.content }] });
         lastRole = role;
      }
    }
    
    // Le premier message DOIT être 'user'
    if (contents.length > 0 && contents[0].role === 'model') {
       contents.shift();
    }

    const result = await model.generateContent({ contents });
    let textResponse = result.response.text().trim();
    
    if (textResponse.startsWith('```json')) textResponse = textResponse.replace('```json', '');
    if (textResponse.startsWith('```')) textResponse = textResponse.replace('```', '');
    if (textResponse.endsWith('```')) textResponse = textResponse.slice(0, -3);

    let parsedResponse;
    try {
        parsedResponse = JSON.parse(textResponse.trim());
    } catch (err) {
        console.error("JSON invalide:", textResponse);
        // Fallback si Gemini a juste répondu en texte
        parsedResponse = { type: "message", content: textResponse };
    }

    return NextResponse.json({ success: true, response: parsedResponse });

  } catch (error: any) {
    console.error("API Error:", error);
    let errorMessage = "Erreur serveur";
    if (error.status === 429 || (error.message && error.message.includes('429'))) {
      errorMessage = "Quota d'utilisation IA dépassé (limite journalière ou requêtes trop fréquentes). Veuillez patienter quelques minutes ou configurer une clé API payante.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
