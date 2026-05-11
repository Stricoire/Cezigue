import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Layers, Plus, ExternalLink, ArrowRight } from "lucide-react";

export default async function MyServicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: services } = await supabase
    .from("user_microservices")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Mes Micro-services</h1>
          <p className="text-muted-foreground mt-2">Vos vues et API sur-mesure générées par l'IA.</p>
        </div>
        <Link 
          href="/dashboard/studio"
          className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau Service
        </Link>
      </div>

      {!services || services.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-3xl border border-border/50">
          <Layers className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground">Aucun service créé</h2>
          <p className="text-muted-foreground mt-2 mb-6">Utilisez le Studio pour générer votre premier micro-service.</p>
          <Link href="/dashboard/studio" className="font-bold text-primary hover:underline">Aller au Studio &rarr;</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service: any) => (
            <div key={service.id} className="bg-card rounded-2xl p-6 border border-border/40 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-muted-foreground px-3 py-1 bg-muted rounded-full">
                  {service.config_json.type === 'map' ? 'Carte' : 'Liste'}
                </span>
              </div>
              
              <h3 className="text-lg font-black text-foreground mb-2">{service.title}</h3>
              <p className="text-sm text-muted-foreground flex-1">{service.description}</p>
              
              <div className="mt-6 pt-6 border-t border-border/40 flex items-center justify-between">
                <Link 
                  href={`/dashboard/mes-services/${service.id}`}
                  className="text-sm font-bold text-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  Ouvrir <ArrowRight className="w-4 h-4" />
                </Link>
                
                {/* Simulated API Endpoint Link */}
                <button className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1">
                  API <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
