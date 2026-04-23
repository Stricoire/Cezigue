import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI((process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY)!);

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    message: {
      type: SchemaType.STRING,
      description: "Le message conversationnel chaleureux et concis de l'agent de voyage (format texte simple, pas de markdown).",
    },
    quickReplies: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "2 à 4 suggestions de réponses courtes (ex: 'Un resto routier', 'Un lieu historique', 'Plutôt nature')",
    },
    activeFilters: {
      type: SchemaType.OBJECT,
      description: "Filtres extraits de l'intention de l'utilisateur pour mettre à jour la carte en temps réel.",
      properties: {
        searchQuery: {
          type: SchemaType.STRING,
          description: "Mots clés optionnels pour rechercher dans les titres et descriptions (ex: 'château', 'méditerranéen', 'pizza'). Laisser vide si non pertinent."
        },
        categories: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Sous-catégories spécifiques à filtrer. Exemples: 'Restaurant', 'Site naturel', 'Musée', 'Boutique'. Laisser vide pour ne pas filtrer par catégorie stricte."
        }
      }
    }
  },
  required: ["message", "quickReplies", "activeFilters"],
};

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !context) {
      return NextResponse.json({ error: 'Messages and context are required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `Tu es un guide de voyage expert et bienveillant pour l'application Cezigue.
Le voyageur vient de générer un itinéraire de ${context.routeInfo}.
Le système a trouvé ${context.poisCount} points d'intérêts le long du trajet (Gastronomie, Nature, Histoire, etc.).
Ton but est de l'aider à trouver les meilleurs arrêts.
Pose des questions simples et fermées via les 'quickReplies' ou demande ce qui lui ferait plaisir.
IMPORTANT: Ton rôle est d'être une "Generative UI". En plus de ta réponse texte, tu dois déduire les filtres ('searchQuery' ou 'categories') correspondants à la demande de l'utilisateur pour que la carte se mette à jour instantanément.
Si l'utilisateur dit "Je veux un resto étoilé", tu mets "étoilé" ou "gastronomique" dans searchQuery.
Sois toujours concis (2 phrases max).`,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any,
      }
    });

    let history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    if (history.length > 0 && history[0].role === 'model') {
      history.unshift({ role: 'user', parts: [{ text: "Bonjour, commençons la planification." }] });
    }

    const chat = model.startChat({
      history: history
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const text = response.text();
    
    const jsonResponse = JSON.parse(text);

    return NextResponse.json(jsonResponse);

  } catch (error: any) {
    console.error("Erreur Gemini API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
