import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Building2, Target, ArrowLeft } from "lucide-react";
import Link from "next/link";
import PitchForm from "./pitch-form";

// Initialisation de Supabase (Server-side uniquement)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function PitchPage({ searchParams }: { searchParams: { id?: string } }) {
  const { id } = await searchParams;

  if (!id) {
    return notFound();
  }

  // Fetch l'article depuis Supabase
  const { data: article } = await supabase
    .from("articles_veille")
    .select("*")
    .eq("id", id)
    .single();

  if (!article || !article.marlowe_insight) {
    return notFound();
  }

  // Parser l'insight
  const parts = article.marlowe_insight.split("|||");
  const marche = parts[2] || "";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decor (Cezigue Style) */}
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-5xl px-4 py-12 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>
        
        <div className="mb-12">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm mb-4">
            <Building2 className="w-5 h-5" />
            Cezigue Incubator
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground leading-tight mb-6">
            Proposer une <span className="text-primary italic">Startup</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
             Cezigue accompagne les entrepreneurs et les acteurs territoriaux pour tester, lancer et scaler des projets de mobilité de demain. Prenez rendez-vous avec nous pour étudier la viabilité de votre concept.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Colonne de Gauche : Le Concept (Rappel) */}
          <div className="space-y-8">
            <div className="bg-card border border-muted-foreground/10 rounded-2xl p-8 shadow-xl">
               <h3 className="font-bold text-foreground text-lg mb-2 flex items-center gap-2">
                 <Target className="w-5 h-5 text-secondary" />
                 L&apos;opportunité identifiée
               </h3>
               <p className="text-sm text-muted-foreground mb-6">
                 Basé sur le signal de la veille : <i>{article.titre}</i>
               </p>

               <div 
                  className="text-sm text-foreground/90 font-medium leading-relaxed space-y-4 [&>strong]:text-foreground [&>strong]:font-black [&>strong]:text-base [&>strong]:block [&>strong]:mt-2"
                  dangerouslySetInnerHTML={{ __html: marche.replace(/\n/g, '<br/>') }}
                />
            </div>
          </div>

          {/* Colonne de Droite : Le Formulaire Client */}
          <div className="bg-card border border-primary/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
            
            <h3 className="text-2xl font-black text-foreground mb-2 relative z-10">
              Passer à l&apos;action
            </h3>
            <p className="text-muted-foreground text-sm mb-8 relative z-10">
              Parlons de cette opportunité. Remplissez ce dossier et l&apos;équipe Cezigue vous recontactera rapidement.
            </p>

            <PitchForm insight={marche} />
          </div>
        </div>
      </div>
    </div>
  );
}
