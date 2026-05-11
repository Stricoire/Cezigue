import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: serviceId } = await params;
    if (!serviceId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    // Use service role to bypass RLS if needed, or normal client if RLS is setup.
    // We explicitly check user_id to ensure security.
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { error } = await supabaseAdmin
      .from('user_microservices')
      .delete()
      .eq('id', serviceId)
      .eq('user_id', user.id); // Security: only delete if owned by the current user

    if (error) {
      console.error("Erreur suppression BDD :", error);
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("API Error DELETE:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
