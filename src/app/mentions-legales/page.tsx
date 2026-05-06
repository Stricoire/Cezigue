import React from 'react';

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Mentions Légales</h1>
        
        <div className="space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Éditeur du site</h2>
            <p>Le site <strong>Cezigue</strong> est édité par la société <strong>ANTCHOUSKI !</strong>, Société par Actions Simplifiée (SAS).</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Siège social :</strong> 627 ROUTE DE VILLEMUR, 31340 MIREPOIX-SUR-TARN, France</li>
              <li><strong>SIRET :</strong> 904 364 874 00019</li>
              <li><strong>TVA Intracommunautaire :</strong> FR75 904 364 874</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Directeur de la publication</h2>
            <p>Le Directeur de la publication est le représentant légal de la société ANTCHOUSKI !.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Hébergement</h2>
            <p>L'hébergement du site est assuré par <strong>Vercel Inc.</strong></p>
            <p className="mt-1">440 N Barranca Ave #4133<br/>Covina, CA 91731<br/>États-Unis</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Propriété intellectuelle</h2>
            <p>L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.</p>
            <p className="mt-2">Les données cartographiques et algorithmiques générées restent la propriété de la plateforme ou de leurs sources Open Data respectives.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Données personnelles</h2>
            <p>Les informations recueillies font l'objet d'un traitement informatique destiné à la gestion de votre compte et de vos abonnements. Conformément à la loi « informatique et libertés » du 6 janvier 1978 modifiée, vous bénéficiez d'un droit d'accès et de rectification aux informations qui vous concernent.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
