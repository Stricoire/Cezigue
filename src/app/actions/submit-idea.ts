"use server";

import { createClient } from "@supabase/supabase-js";

export async function submitStartupIdea(formData: FormData) {
  // Extraction des données
  const phone = formData.get("phone") as string;
  const notes = formData.get("notes") as string;
  const insight = formData.get("insight") as string;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Sauvegarde dans le CRM (Supabase)
  const { error } = await supabase
    .from("startup_pitches")
    .insert([{ phone, notes, insight }]);

  if (error) {
    console.error("Erreur insertion Pitch:", error);
    return { success: false, message: "Erreur lors de la sauvegarde." };
  }

  return { success: true, message: "Proposition envoyée et sauvegardée avec succès." };
}
