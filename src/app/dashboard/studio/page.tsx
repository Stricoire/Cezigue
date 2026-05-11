import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ChatClient } from "./chat-client";

export default async function DashboardStudioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // TODO: Vérifier si l'utilisateur est Premium
  // Pour l'instant on laisse l'accès à tous les connectés pour le test

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground">Générateur de Micro-services</h1>
        <p className="text-muted-foreground mt-2">
          Discutez avec notre IA pour créer vos propres vues métiers (Cartes, Listes) sur-mesure. 
          Aucun code n'est requis.
        </p>
      </div>

      <ChatClient />
    </div>
  );
}
