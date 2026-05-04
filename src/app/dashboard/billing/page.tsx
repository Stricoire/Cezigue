"use client";

import { CheckCircle2, AlertCircle, Settings, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function BillingDashboard() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<"ACTIVE" | "CANCELLED" | "EXPIRED" | "LIFETIME" | "NONE">("NONE");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('subscription_status')
          .eq('id', user.id)
          .single();
          
        if (prefs?.subscription_status) {
          setSubscriptionStatus(prefs.subscription_status);
        }
      }
      setLoading(false);
    };
    fetchStatus();
  }, []);

  const handleManageBilling = async () => {
    if (!userId) return;
    setIsPortalLoading(true);
    try {
      const response = await fetch("/api/billing/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erreur lors de l'accès au portail de facturation.");
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue.");
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'Espace Personnel
          </Link>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center">
            <Settings className="w-8 h-8 mr-3 text-secondary" />
            Gestion de l'abonnement
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos informations de facturation, modifiez votre offre ou téléchargez vos factures via notre portail sécurisé.
          </p>
        </div>

        <div className="space-y-6">
          {/* Current Plan Card */}
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Cezigue Premium</h2>
                  {subscriptionStatus === "ACTIVE" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Actif
                    </span>
                  ) : subscriptionStatus === "LIFETIME" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Accès À Vie
                    </span>
                  ) : subscriptionStatus === "CANCELLED" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      En cours de résiliation (Actif jusqu'à la fin de la période)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                      Aucun abonnement actif
                    </span>
                  )}
                </div>
              </div>

              <p className="text-muted-foreground text-sm mb-8">
                Vous avez accès à l'intégralité du Hub Cezigue (Radar carburant illimité, alertes PWA en temps réel, kiosque complet).
              </p>

              <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div className="text-sm text-muted-foreground">
                  Géré en toute sécurité par Stripe.
                </div>
                
                {subscriptionStatus !== "NONE" ? (
                  <button 
                    onClick={handleManageBilling}
                    disabled={isPortalLoading}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPortalLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    {subscriptionStatus === "LIFETIME" ? "Accéder à mes factures" : "Gérer mon abonnement (Portail)"}
                  </button>
                ) : (
                  <Link 
                    href="/pricing"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90 transition-colors shadow-sm text-center"
                  >
                    Voir les offres
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
