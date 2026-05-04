"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

const STRIPE_PRICE_MONTHLY_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_ID || "";
const STRIPE_PRICE_ANNUAL_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL_ID || "";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  const features = [
    "Accès illimité aux microservices",
    "Alertes personnalisées temps réel (Push PWA)",
    "Consultation illimitée du Kiosque (Articles Veille)",
    "Création de portefeuilles de favoris",
    "30% de réduction sur le développement de vos applications à la demande",
    "Accès anticipé aux fonctionnalités IA",
    "Support prioritaire"
  ];

  const handleSubscribe = async () => {
    if (!userId) {
      alert("Veuillez vous connecter pour vous abonner.");
      window.location.href = "/login?redirect=/pricing";
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: isAnnual ? STRIPE_PRICE_ANNUAL_ID : STRIPE_PRICE_MONTHLY_ID,
          userId: userId,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Erreur lors de l'initialisation du paiement.");
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-4">
            Prenez le contrôle de votre <span className="text-secondary">mobilité</span>.
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Débloquez la puissance complète du Hub Cezigue. Des données en temps réel, des alertes intelligentes et une veille illimitée pour faire les meilleurs choix au quotidien.
          </p>
        </div>

        {/* Toggle Billing */}
        <div className="flex justify-center mb-12">
          <div className="bg-white p-1 rounded-full shadow-sm border border-neutral-200 inline-flex">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                !isAnnual
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                isAnnual
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
              }`}
            >
              Annuel
              <span className="bg-secondary text-secondary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
                -40%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-neutral-100">
          <div className="p-8 sm:p-10">
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">Premium</h3>
            <p className="text-neutral-500 mb-6">Tout ce qu'il vous faut pour une mobilité optimale.</p>
            
            <div className="mb-8 flex items-baseline text-neutral-900">
              <span className="text-5xl font-extrabold tracking-tight">
                {isAnnual ? "36" : "5"}€
              </span>
              <span className="text-xl font-medium text-neutral-500 ml-1">
                HT / {isAnnual ? "an" : "mois"}
              </span>
            </div>

            <ul className="space-y-4 mb-10">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0 mr-3" />
                  <span className="text-neutral-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={isLoading || !STRIPE_PRICE_MONTHLY_ID}
              className="w-full py-4 px-6 rounded-xl bg-foreground text-background font-bold text-lg hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                "S'abonner"
              )}
            </button>

            <div className="mt-6 text-center text-sm text-neutral-500">
              Paiement 100% sécurisé via Stripe. Sans engagement.
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
           <Link href="/services" className="text-neutral-500 hover:text-neutral-900 flex items-center justify-center gap-2 transition-colors">
              <ArrowRight className="h-4 w-4 rotate-180" />
              Retourner aux services gratuits
           </Link>
        </div>
      </div>
    </div>
  );
}
