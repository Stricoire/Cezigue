import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Vous devez être connecté pour noter un lieu." }, { status: 401 });
    }

    const body = await request.json();
    const { poi_id, rating, comment } = body;

    if (!poi_id || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Données invalides. La note doit être entre 1 et 5." }, { status: 400 });
    }

    // 1. Fetch existing enrichments
    const { data: existing } = await supabase
        .from('cezigue_enrichments')
        .select('*')
        .eq('poi_id', poi_id)
        .single();
        
    const newCommentObj = {
        user_id: user.id,
        rating: rating,
        text: comment || null,
        date: new Date().toISOString()
    };

    let newScore = rating;
    let newComments = [newCommentObj];

    if (existing) {
        // Append comment
        const currentComments = Array.isArray(existing.user_comments) ? existing.user_comments : [];
        // Filter out previous rating from the SAME user if exists
        newComments = currentComments.filter((c: any) => c.user_id !== user.id);
        newComments.push(newCommentObj);

        // Calculate average score
        const totalScore = newComments.reduce((acc: number, c: any) => acc + c.rating, 0);
        newScore = parseFloat((totalScore / newComments.length).toFixed(2));
    }

    // UPSERT
    const { error: upsertError } = await supabase
        .from('cezigue_enrichments')
        .upsert({
            poi_id: poi_id,
            cezigue_score: newScore,
            user_comments: newComments,
            last_enriched_at: new Date().toISOString()
        }, { onConflict: 'poi_id' });

    if (upsertError) {
        console.error("UPSERT Error:", upsertError);
        return NextResponse.json({ error: "Erreur lors de la sauvegarde de l'avis." }, { status: 500 });
    }

    return NextResponse.json({ success: true, newScore, commentsCount: newComments.length });

  } catch (error) {
    console.error("Rate API Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
