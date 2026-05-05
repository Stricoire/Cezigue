import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Ce script requiert les clés d'administration pour lire les emails de l'Auth et mettre à jour les préférences.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-04-22.dahlia',
});

// Clé secrète pour s'assurer que n'importe qui ne peut pas appeler cette route
const ADMIN_SECRET = process.env.MARLOWE_SECRET_KEY;

export async function POST(req: Request) {
  try {
    // 1. Vérification de la sécurité (Header Authorization)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      totalStripeSubs: 0,
      syncedUsers: 0,
      errors: [] as string[]
    };

    // 2. Récupération de tous les utilisateurs Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      throw new Error(`Erreur Supabase Auth: ${authError.message}`);
    }
    const users = authData.users;

    // 3. Récupération de tous les abonnements Stripe actifs
    // (Pour une base énorme, il faudrait paginer avec `starting_after`, 
    // mais limit: 100 suffit pour un lancement B2C).
    const subscriptions = await stripe.subscriptions.list({
      status: 'all',
      limit: 100 
    });
    
    results.totalStripeSubs = subscriptions.data.length;

    // 4. Boucle de réconciliation
    for (const sub of subscriptions.data) {
      try {
        // Récupérer l'email du client Stripe
        const customer = await stripe.customers.retrieve(sub.customer as string);
        if (customer.deleted) continue;

        const email = customer.email;
        if (!email) continue;

        // Chercher l'utilisateur Supabase correspondant
        const supabaseUser = users.find(u => u.email === email);
        if (supabaseUser) {
          
          // Déterminer le statut
          let status = 'NONE';
          if (sub.status === 'active' || sub.status === 'trialing') {
            status = 'ACTIVE';
          } else if (sub.status === 'canceled') {
            status = 'CANCELLED';
          } else if (sub.status === 'past_due' || sub.status === 'unpaid') {
            status = 'EXPIRED';
          }

          // Mise à jour de la table user_preferences
          const { error: updateError } = await supabaseAdmin
            .from('user_preferences')
            .update({
              stripe_customer_id: customer.id,
              stripe_subscription_id: sub.id,
              subscription_status: status
            })
            .eq('id', supabaseUser.id);

          if (updateError) {
            results.errors.push(`Erreur Maj pour ${email}: ${updateError.message}`);
          } else {
            results.syncedUsers++;
          }
        }
      } catch (err: any) {
        results.errors.push(`Erreur processing Stripe Sub ${sub.id}: ${err.message}`);
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error(`Admin Sync Error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
