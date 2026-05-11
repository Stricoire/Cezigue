import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Instanciation de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `
Tu es l'Agent d'Architecture Logicielle de Cezigue.io. 
Ton rôle est de traduire les besoins des utilisateurs Premium en "Micro-services" exécutables.
L'utilisateur te décrira ce qu'il veut afficher sur sa carte de mobilité.

Tu dois impérativement répondre avec un objet JSON strict correspondant à cette interface TypeScript :
{
  "title": string, // Un titre court (ex: "Gares et Aéroports")
  "description": string, // Une brève explication du service
  "config_json": {
    "type": "map" | "list", // Le type d'affichage souhaité
    "categories": string[], // La liste des tags de lieux (ex: ["gare", "aeroport", "pharmacy"]) EN ANGLAIS ou FRANCAIS normalisé
    "radius": number // Le rayon de recherche en mètres (par défaut 10000)
  }
}

Exemple d'input : "Je voudrais une carte avec toutes les pharmacies à 5km."
Exemple d'output :
{
  "title": "Pharmacies de proximité",
  "description": "Affiche les pharmacies dans un rayon de 5km.",
  "config_json": {
    "type": "map",
    "categories": ["pharmacy"],
    "radius": 5000
  }
}

NE RENVOIE QUE LE JSON, sans aucun markdown (\`\`\`json) autour.
`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt manquant" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "GEMINI_API_KEY manquante" }, { status: 500 });
    }

    // Appel à Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: SYSTEM_PROMPT });
    const result = await model.generateContent(prompt);
    let textResponse = result.response.text().trim();
    
    // Nettoyage au cas où Gemini ajoute des backticks markdown malgré la consigne
    if (textResponse.startsWith('```json')) textResponse = textResponse.replace('```json', '');
    if (textResponse.startsWith('```')) textResponse = textResponse.replace('```', '');
    if (textResponse.endsWith('```')) textResponse = textResponse.slice(0, -3);

    let parsedConfig;
    try {
        parsedConfig = JSON.parse(textResponse.trim());
    } catch (parseError) {
        console.error("Gemini a renvoyé un JSON invalide :", textResponse);
        return NextResponse.json({ error: "L'IA n'a pas pu générer une configuration valide." }, { status: 500 });
    }

    // Pour l'insertion, on utilise le client admin (service_role) pour éviter les soucis RLS
    // tout en assignant le user_id manuellement
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: insertedService, error: dbError } = await supabaseAdmin
        .from('user_microservices')
        .insert({
            user_id: user.id,
            title: parsedConfig.title,
            description: parsedConfig.description,
            config_json: parsedConfig.config_json
        })
        .select()
        .single();

    if (dbError) {
        console.error("Erreur d'insertion BDD :", dbError);
        return NextResponse.json({ error: "Erreur lors de la sauvegarde du service." }, { status: 500 });
    }

    return NextResponse.json({ success: true, service: insertedService });

  } catch (error) {
    console.error("Chat-to-build API Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
