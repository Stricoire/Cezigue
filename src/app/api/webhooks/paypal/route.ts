import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialise un client Supabase Admin pour bypasser les RLS (Row Level Security)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const event = JSON.parse(body);

    // TODO (Sécurité) : En production, il est crucial de vérifier la signature du Webhook
    // avec l'API PayPal en utilisant PAYPAL_WEBHOOK_ID pour s'assurer que l'appel
    // provient bien de PayPal et non d'une source malveillante.
    
    // Pour l'instant, on traite l'événement directement
    console.log(`[PayPal Webhook] Événement reçu : ${event.event_type}`);

    const resource = event.resource;
    
    // Le "custom_id" est ce qu'on a passé depuis le frontend, c'est le user.id Supabase
    const userId = resource.custom_id;
    const subscriptionId = resource.id;

    if (!userId) {
      console.warn(`[PayPal Webhook] Aucun custom_id fourni pour l'abonnement ${subscriptionId}.`);
      return NextResponse.json({ received: true });
    }

    let status = 'NONE';
    
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.UPDATED':
        status = 'ACTIVE';
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        // L'utilisateur a annulé, il gardera son accès jusqu'à la fin de la période
        // (Géré par PayPal, mais on le marque comme annulé)
        status = 'CANCELLED';
        break;
      case 'BILLING.SUBSCRIPTION.EXPIRED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        status = 'EXPIRED';
        break;
      default:
        // On ignore les autres événements
        return NextResponse.json({ received: true });
    }

    console.log(`[PayPal Webhook] Mise à jour de l'utilisateur ${userId} -> Statut: ${status}`);

    // Mise à jour de la base de données Supabase
    const { error } = await supabaseAdmin
      .from('user_preferences')
      .update({
        subscription_status: status,
        paypal_subscription_id: subscriptionId,
        // On pourrait ajouter d'autres champs comme la date de fin de période si fournie par l'événement
      })
      .eq('id', userId);

    if (error) {
      console.error(`[PayPal Webhook] Erreur Supabase :`, error.message);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true, status });
  } catch (error: any) {
    console.error(`[PayPal Webhook] Erreur serveur :`, error.message);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
