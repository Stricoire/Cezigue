import React from 'react';

export default function CGV() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Conditions Générales de Vente et d'Utilisation (CGV/CGU)</h1>
        
        <div className="space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Objet</h2>
            <p>Les présentes Conditions Générales régissent l'utilisation de la plateforme <strong>Cezigue</strong>, éditée par la SAS <strong>ANTCHOUSKI !</strong> (ci-après "l'Éditeur"). En utilisant nos services, l'utilisateur accepte pleinement et entièrement les présentes conditions.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Description des services</h2>
            <p>Cezigue est une plateforme de veille stratégique et cartographique spécialisée dans les mobilités. Elle propose des tableaux de bord, des analyses géospatiales (Radar, Heatmap) et des flux d'intelligence artificielle.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Accès et Abonnements</h2>
            <p>L'accès à certaines fonctionnalités nécessite la souscription à un abonnement payant via notre partenaire de paiement sécurisé (Stripe). Les tarifs et durées d'engagement sont précisés lors de la commande.</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Les abonnements sont renouvelés tacitement à leur date d'anniversaire.</li>
              <li>L'utilisateur peut annuler son abonnement à tout moment depuis son espace "Mon Compte". L'annulation prendra effet à la fin de la période facturée en cours.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Tarifs et Paiement</h2>
            <p>Les prix de nos services sont indiqués en euros toutes taxes comprises (TTC). L'Éditeur se réserve le droit de modifier ses prix à tout moment, mais le service sera facturé sur la base du tarif en vigueur au moment de la validation de la commande.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Limites de responsabilité</h2>
            <p>Les données cartographiques et analyses fournies proviennent en partie de sources Open Data (ex: OpenStreetMap, DataTourisme). Bien que l'Éditeur s'efforce d'assurer la plus grande exactitude, il ne saurait garantir de manière absolue l'exhaustivité ou l'exactitude des informations fournies.</p>
            <p className="mt-2">La plateforme est fournie "en l'état" et ne saurait engager la responsabilité de la société ANTCHOUSKI ! en cas d'erreurs, d'indisponibilité du service ou d'interprétation erronée des données par l'utilisateur.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Droit applicable et juridiction compétente</h2>
            <p>Les présentes CGV sont soumises à la loi française. En cas de litige, et à défaut de résolution amiable, les tribunaux français seront seuls compétents.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
