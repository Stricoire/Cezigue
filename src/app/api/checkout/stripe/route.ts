import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-04-22.dahlia', // Utilise la dernière version d'API disponible
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { priceId, userId, mode = 'subscription' } = body;

    if (!priceId || !userId) {
      return NextResponse.json({ error: 'Missing priceId or userId' }, { status: 400 });
    }

    // 1. Récupérer l'email de l'utilisateur Supabase (Optionnel mais recommandé pour pré-remplir Stripe)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    const customerEmail = userData?.user?.email;

    // 2. Vérifier si l'utilisateur a déjà un stripe_customer_id dans user_preferences
    const { data: prefs } = await supabaseAdmin
      .from('user_preferences')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = prefs?.stripe_customer_id;

    // 3. Créer la session de checkout Stripe
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode as Stripe.Checkout.SessionCreateParams.Mode,
      automatic_tax: { enabled: true }, // Active le calcul automatique de la TVA
      billing_address_collection: 'required', // Obligatoire pour calculer la TVA selon le pays
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      client_reference_id: userId, // CRUCIAL: Permet au webhook de savoir qui a payé !
    };

    if (customerId) {
      sessionConfig.customer = customerId;
    } else if (customerEmail) {
      sessionConfig.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Erreur Stripe Checkout:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
