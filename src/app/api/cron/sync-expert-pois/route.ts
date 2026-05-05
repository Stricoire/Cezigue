import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_SECRET = process.env.MARLOWE_SECRET_KEY;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Call the unified procedure
    const { error: syncError } = await supabase.rpc('sync_expert_pois_to_unified');
    
    if (syncError) {
      throw new Error(syncError.message);
    }

    return NextResponse.json({ success: true, message: "POI synchronisés avec succès vers unified_pois" });
  } catch (error: any) {
    console.error(`Sync POI Error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
