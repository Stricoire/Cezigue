import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  try {
    const { type, message, email } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials not found, logging feedback instead:");
      console.log(`FEEDBACK [${type}] from ${email}: ${message}`);
      return NextResponse.json({ success: true, fake: true });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('user_feedback')
      .insert([
        { type_retour: type, message, user_email: email }
      ]);

    if (error) {
      console.error('Feedback insertion error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Feedback API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
