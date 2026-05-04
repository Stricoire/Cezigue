"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, Loader2, Sparkles, Infinity } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

const STRIPE_PRICE_MONTHLY_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_ID || "";
const STRIPE_PRICE_ANNUAL_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL_ID || "";
const STRIPE_PRICE_LIFETIME_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME_ID || "";

export default function PricingPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

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

  const coreFeatures = [
    "Accès illimité aux microservices",
    "Alertes personnalisées temps réel (Push PWA)",
    "Consultation illimitée du Kiosque (Articles Veille)",
    "Création de portefeuilles de favoris",
    "Accès anticipé aux fonctionnalités IA",
    "Support prioritaire"
  ];

  const handleSubscribe = async (priceId: string, planName: string, mode: 'subscription' | 'payment') => {
    if (!userId) {
      alert("Veuillez vous connecter pour choisir une offre.");
      window.location.href = "/login?redirect=/pricing";
      return;
    }

    if (!priceId) {
      alert("Cette offre n'est pas encore configurée.");
      return;
    }

    setLoadingPlan(planName);
    try {
      const response = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: priceId,
          userId: userId,
          mode: mode
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
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-24 pb-12 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-4">
            Prenez le contrôle de votre <span className="text-secondary">mobilité</span>.
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Débloquez la puissance complète du Hub Cezigue. Des données en temps réel, des alertes intelligentes et une veille illimitée pour faire les meilleurs choix au quotidien.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          
          {/* Mensuel */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-neutral-200 flex flex-col h-full hover:shadow-xl transition-shadow">
            <div className="p-8 flex-grow">
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Mensuel</h3>
              <p className="text-sm text-neutral-500 mb-6 min-h-[40px]">Flexibilité totale, sans engagement à long terme.</p>
              
              <div className="mb-8 flex items-baseline text-neutral-900">
                <span className="text-5xl font-extrabold tracking-tight">5€</span>
                <span className="text-lg font-medium text-neutral-500 ml-1">HT / mois</span>
              </div>

              <ul className="space-y-4 mb-8">
                {coreFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mr-3" />
                    <span className="text-neutral-700">{feature}</span>
                  </li>
                ))}
                <li className="flex items-start text-sm font-semibold bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                  <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mr-3" />
                  <span className="text-neutral-900">5% de réduction sur vos Apps sur-mesure</span>
                </li>
              </ul>
            </div>
            <div className="p-8 pt-0 mt-auto">
              <button
                onClick={() => handleSubscribe(STRIPE_PRICE_MONTHLY_ID, 'mensuel', 'subscription')}
                disabled={loadingPlan !== null || !STRIPE_PRICE_MONTHLY_ID}
                className="w-full py-3 px-6 rounded-xl bg-neutral-100 text-neutral-900 font-bold hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loadingPlan === 'mensuel' ? <Loader2 className="w-5 h-5 animate-spin" /> : "S'abonner"}
              </button>
            </div>
          </div>

          {/* Annuel (Highlighted) */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-secondary relative flex flex-col h-full transform md:-translate-y-4">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
            <div className="absolute top-4 right-4">
              <span className="bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Populaire
              </span>
            </div>
            <div className="p-8 flex-grow">
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">Annuel</h3>
              <p className="text-sm text-neutral-500 mb-6 min-h-[40px]">Le meilleur choix pour s'engager sur la durée avec une belle économie.</p>
              
              <div className="mb-2 flex items-baseline text-neutral-900">
                <span className="text-5xl font-extrabold tracking-tight">36€</span>
                <span className="text-lg font-medium text-neutral-500 ml-1">HT / an</span>
              </div>
              <div className="mb-8 text-sm text-emerald-600 font-semibold bg-emerald-50 inline-block px-3 py-1 rounded-full">
                Soit 3€ / mois (40% d'économie)
              </div>

              <ul className="space-y-4 mb-8">
                {coreFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mr-3" />
                    <span className="text-neutral-700">{feature}</span>
                  </li>
                ))}
                <li className="flex items-start text-sm font-bold bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mr-3" />
                  <span className="text-amber-900">25% de réduction sur vos Apps sur-mesure</span>
                </li>
              </ul>
            </div>
            <div className="p-8 pt-0 mt-auto">
              <button
                onClick={() => handleSubscribe(STRIPE_PRICE_ANNUAL_ID, 'annuel', 'subscription')}
                disabled={loadingPlan !== null || !STRIPE_PRICE_ANNUAL_ID}
                className="w-full py-4 px-6 rounded-xl bg-foreground text-background font-bold text-lg hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loadingPlan === 'annuel' ? <Loader2 className="w-6 h-6 animate-spin" /> : "S'abonner"}
              </button>
            </div>
          </div>

          {/* À Vie */}
          <div className="bg-neutral-900 text-white rounded-3xl shadow-xl overflow-hidden border border-neutral-800 flex flex-col h-full hover:shadow-2xl transition-shadow">
            <div className="p-8 flex-grow">
              <div className="flex items-center gap-2 mb-2">
                <Infinity className="w-6 h-6 text-emerald-400" />
                <h3 className="text-xl font-bold text-white">À Vie</h3>
              </div>
              <p className="text-sm text-neutral-400 mb-6 min-h-[40px]">Un accès illimité, pour toujours. Sans abonnement.</p>
              
              <div className="mb-8 flex items-baseline text-white">
                <span className="text-5xl font-extrabold tracking-tight">100€</span>
                <span className="text-lg font-medium text-neutral-400 ml-1">HT / une fois</span>
              </div>

              <ul className="space-y-4 mb-8">
                {coreFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mr-3" />
                    <span className="text-neutral-300">{feature}</span>
                  </li>
                ))}
                <li className="flex items-start text-sm font-bold bg-neutral-800 p-2.5 rounded-lg border border-neutral-700">
                  <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mr-3" />
                  <span className="text-amber-100">40% de réduction sur vos Apps sur-mesure</span>
                </li>
              </ul>
            </div>
            <div className="p-8 pt-0 mt-auto">
              <button
                onClick={() => handleSubscribe(STRIPE_PRICE_LIFETIME_ID, 'lifetime', 'payment')}
                disabled={loadingPlan !== null || !STRIPE_PRICE_LIFETIME_ID}
                className="w-full py-3 px-6 rounded-xl bg-white text-neutral-900 font-bold hover:bg-neutral-100 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loadingPlan === 'lifetime' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Obtenir l'accès à vie"}
              </button>
            </div>
          </div>

        </div>

        <div className="text-center mt-16">
          <p className="text-sm text-neutral-500 mb-6">Paiement 100% sécurisé via Stripe.</p>
          <Link href="/services" className="text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-2 transition-colors">
            <ArrowRight className="h-4 w-4 rotate-180" />
            Retourner aux services gratuits
          </Link>
        </div>
      </div>
    </div>
  );
}
