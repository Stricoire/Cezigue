"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { submitStartupIdea } from "@/app/actions/submit-idea";

export default function PitchForm({ insight }: { insight: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (isSuccess) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center text-green-600 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h4 className="font-black text-xl">Dossier transmis !</h4>
        <p className="text-sm opacity-80 max-w-sm">
          L&apos;équipe Cezigue Incubator étudie actuellement votre demande. Nous vous recontacterons très vite pour en discuter de vive voix.
        </p>
      </div>
    );
  }

  return (
    <form 
      action={async (formData) => {
        setIsSubmitting(true);
        formData.append("insight", insight);
        await submitStartupIdea(formData);
        setIsSubmitting(false);
        setIsSuccess(true);
      }} 
      className="flex flex-col gap-5 relative z-10"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-foreground uppercase tracking-widest mb-1.5 opacity-80">
            Votre Téléphone
          </label>
          <input 
            type="tel" 
            name="phone" 
            required 
            placeholder="06 XX XX XX XX" 
            className="w-full bg-background border border-muted-foreground/20 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-foreground uppercase tracking-widest mb-1.5 opacity-80">
            Notes / Intentions
          </label>
          <textarea 
            name="notes" 
            required 
            placeholder="Expliquez-nous brièvement pourquoi ce projet résonne pour vous, et quelles synergies vous voyez avec l'écosystème Cezigue (ex: NouNou, Dispatch...)" 
            rows={5} 
            className="w-full bg-background border border-muted-foreground/20 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-all" 
          />
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting} 
        className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
      >
        {isSubmitting ? "Envoi du dossier..." : <><Send className="w-4 h-4" /> Envoyer à l&apos;incubateur</>}
      </button>
    </form>
  );
}
