import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-04-22.dahlia',
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Récupérer la session Stripe avec l'expansion de line_items et la facture
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'invoice', 'subscription.latest_invoice'],
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let invoicePdfUrl = null;
    if (session.invoice) {
        // Paiement unique avec facture
        const invoice = session.invoice as Stripe.Invoice;
        invoicePdfUrl = invoice.hosted_invoice_url || invoice.invoice_pdf;
    } else if (session.subscription) {
        // Abonnement
        const sub = session.subscription as Stripe.Subscription;
        if (sub.latest_invoice) {
            const invoice = sub.latest_invoice as Stripe.Invoice;
            invoicePdfUrl = invoice.hosted_invoice_url || invoice.invoice_pdf;
        }
    }

    const lineItems = session.line_items?.data || [];
    const amountTotal = session.amount_total || 0;
    const amountSubtotal = session.amount_subtotal || 0;
    const taxAmount = amountTotal - amountSubtotal;

    return NextResponse.json({
      status: session.payment_status,
      amountTotal: amountTotal / 100, // Stripe renvoie en centimes
      amountSubtotal: amountSubtotal / 100,
      taxAmount: taxAmount / 100,
      customerEmail: session.customer_details?.email || '',
      lineItems: lineItems.map(item => ({
        description: item.description,
        amount: item.amount_total / 100,
      })),
      invoiceUrl: invoicePdfUrl,
    });
  } catch (error: any) {
    console.error('Erreur Stripe Session Fetch:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
