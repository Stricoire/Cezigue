import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ChatClient } from "./chat-client";

export default async function DashboardStudioPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's existing microservices
  const { data: services } = await supabase
    .from('user_microservices')
    .select('*')
    .order('created_at', { ascending: false });

  let initialEditService = null;
  const resolvedSearchParams = await searchParams;
  if (resolvedSearchParams.edit) {
    initialEditService = services?.find(s => s.id === resolvedSearchParams.edit) || null;
  }

  return (
    <div className="flex flex-col md:flex-row w-full max-w-7xl mx-auto py-8 px-4 gap-8">
      {/* Sidebar Historique */}
      <div className="w-80 border border-border/40 bg-muted/20 p-4 rounded-2xl overflow-y-auto hidden md:block max-h-[80vh]">
        <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4">Mes Micro-Services</h2>
        <div className="space-y-3">
          {services?.map(service => (
            <div key={service.id} className="p-3 rounded-xl bg-card border border-border/40 hover:border-primary/40 transition-colors group cursor-pointer">
              {service.config_json?.image_url && (
                <div className="w-full h-24 mb-2 rounded-lg overflow-hidden bg-muted">
                  <img src={service.config_json.image_url} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              )}
              <h3 className="font-bold text-sm text-foreground truncate">{service.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{service.description}</p>
            </div>
          ))}
          {!services?.length && (
            <p className="text-xs text-muted-foreground italic">Aucun service créé pour l'instant.</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-foreground">Générateur de Micro-services</h1>
          <p className="text-muted-foreground mt-2">
            Discutez avec notre IA pour créer vos propres vues métiers (Cartes, Listes) sur-mesure. 
            Aucun code n'est requis.
          </p>
        </div>

        <ChatClient initialEditService={initialEditService} />
      </div>
    </div>
  );
}
