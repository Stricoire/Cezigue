import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialisation du client admin (Service Role) pour contourner les règles RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // Mesure de sécurité simple : Clé secrète dans le Header
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.MARLOWE_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Accès non autorisé. Identité refusée.' }, { status: 401 });
    }

    // Extraction du contenu envoyé par l'IA
    const body = await request.json();
    const { titre, contenu, source_nom, source_url, tags, marlowe_insight, marlowe_insight_premium, created_at } = body;

    if (!titre || !contenu) {
      return NextResponse.json({ error: 'Champs obligatoires manquants (titre, contenu)' }, { status: 400 });
    }

    // Insertion brutale dans Supabase
    const { data, error } = await supabaseAdmin
      .from('articles_veille')
      .insert([
        { 
          titre, 
          contenu, 
          source_nom, 
          source_url, 
          tags: tags || [],
          marlowe_insight,
          marlowe_insight_premium,
          created_at: created_at ? new Date(created_at).toISOString() : new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Article assimilé par le Hub.', data }, { status: 201 });

  } catch (error: any) {
    console.error("Erreur API Veille:", error);
    return NextResponse.json({ error: error.message || 'Erreur interne du serveur' }, { status: 500 });
  }
}
