"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, FileText, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SessionData {
  status: string;
  amountTotal: number;
  amountSubtotal: number;
  taxAmount: number;
  customerEmail: string;
  invoiceUrl: string | null;
  lineItems: { description: string; amount: number }[];
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("ID de session manquant.");
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/checkout/session?session_id=${sessionId}`);
        if (!response.ok) {
          throw new Error("Impossible de récupérer les détails de la commande.");
        }
        const sessionData = await response.json();
        setData(sessionData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-secondary mb-4" />
        <p className="text-neutral-500">Récupération de votre reçu...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 max-w-md w-full">
          <p className="text-red-500 font-medium mb-4">{error || "Erreur inconnue."}</p>
          <Link href="/dashboard/billing" className="text-secondary hover:underline">
            Retour à l'espace facturation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-neutral-200">
          
          {/* Header */}
          <div className="bg-emerald-50 p-8 text-center border-b border-emerald-100">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Paiement validé !</h1>
            <p className="text-emerald-700">
              Merci pour votre confiance. Votre abonnement / accès a été activé avec succès.
            </p>
          </div>

          {/* Recapitulation */}
          <div className="p-8">
            <h2 className="text-lg font-semibold text-neutral-900 mb-6 border-b pb-2">Récapitulatif de la commande</h2>
            
            <div className="space-y-4 mb-8">
              {data.lineItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <span className="text-neutral-600 font-medium">{item.description}</span>
                  <span className="text-neutral-900 font-semibold">{item.amount.toFixed(2)} €</span>
                </div>
              ))}
            </div>

            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 space-y-3">
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Sous-total (HT)</span>
                <span>{data.amountSubtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-500">
                <span>TVA</span>
                <span>{data.taxAmount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-base font-bold text-neutral-900 pt-3 border-t border-neutral-200">
                <span>Total (TTC)</span>
                <span>{data.amountTotal.toFixed(2)} €</span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {data.invoiceUrl ? (
                <a 
                  href={data.invoiceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  Télécharger la facture officielle (PDF)
                </a>
              ) : (
                <p className="text-sm text-center text-neutral-500 italic">
                  Facture PDF en cours de génération (disponible d'ici quelques minutes sur votre portail).
                </p>
              )}
              
              <Link 
                href="/dashboard/billing"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-100 text-neutral-700 font-medium hover:bg-neutral-200 transition-colors"
              >
                Aller sur mon espace
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
