import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Activity } from "lucide-react";
import { ServiceRenderer } from "./service-renderer";

export default async function ServiceViewerPage({
  params,
}: {
  params: Promise<{ serviceId: string }>
}) {
  const { serviceId } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Load the specific service
  const { data: service, error } = await supabase
    .from("user_microservices")
    .select("*")
    .eq("id", serviceId)
    .single();

  if (error || !service) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center">
        <h1 className="text-2xl font-black text-foreground mb-4">Service introuvable</h1>
        <p className="text-muted-foreground mb-8">Ce micro-service n'existe pas ou ne vous appartient pas.</p>
        <Link href="/dashboard/mes-services" className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full">
          Retour à mes services
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 border-b border-border/40 pb-8">
        <div className="flex flex-col gap-4">
          <Link href="/services" className="bg-muted hover:bg-border text-foreground px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 w-fit transition-all shadow-sm border border-border/50">
            <ArrowLeft className="w-5 h-5" /> Retour à mon Espace Personnel
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground leading-none">Console Micro-service</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">En ligne</span>
                <span className="text-xs text-muted-foreground ml-2 font-mono bg-muted px-2 py-0.5 rounded border border-border/50">
                  ID: {service.id.split('-')[0]}...
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-3 bg-muted text-foreground font-bold rounded-xl border border-border hover:bg-border/50 transition-colors text-sm shadow-sm">
             <ExternalLink className="w-4 h-4" />
             Endpoint API
          </button>
        </div>
      </div>

      {/* Renderer View */}
      <ServiceRenderer service={service} />
      
    </div>
  );
}
