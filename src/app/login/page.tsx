import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, UserPlus } from "lucide-react";
import { login, signup, signInWithProvider } from "./actions";

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      
      {/* Background Lueur Terroir */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="z-10 w-full max-w-sm flex flex-col gap-8">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/logo.png" alt="Cezigue" className="h-12 w-12 drop-shadow-[0_0_8px_var(--color-primary)]" />
          <h1 className="text-3xl font-black tracking-tight text-foreground">Connexion</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Accédez à votre QG de commandement (Bunker).
          </p>
          
          {searchParams?.error && (
            <div className="text-red-500 font-bold border border-red-500/50 bg-red-500/10 p-2 rounded w-full">
              Identifiants invalides ou erreur système.
            </div>
          )}
        </div>

        {/* Social Auth (Google / Apple) */}
        <form className="flex flex-col gap-3">
          <button type="submit" formAction={signInWithProvider.bind(null, 'google')} className="inline-flex items-center justify-center rounded-lg border bg-background hover:bg-muted text-foreground transition-all h-12 font-bold w-full border-muted-foreground/30 hover:border-secondary hover:text-secondary group">
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            Continuer avec Google
          </button>
          <button type="submit" formAction={signInWithProvider.bind(null, 'apple')} className="inline-flex items-center justify-center rounded-lg border bg-background hover:bg-muted text-foreground transition-all h-12 font-bold w-full border-muted-foreground/30 hover:border-primary hover:text-primary group">
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M15.176 10.978c-.015-3.082 2.529-4.568 2.645-4.639-1.442-2.108-3.663-2.39-4.437-2.42-1.892-.191-3.693 1.116-4.654 1.116-.96 0-2.47-1.087-4.04-1.06-2.036.027-3.921 1.183-4.966 3.013-2.115 3.666-.541 9.083 1.517 12.054 1.01 1.457 2.193 3.087 3.774 3.031 1.512-.058 2.083-.974 3.916-.974 1.815 0 2.348.974 3.93.945 1.637-.027 2.668-1.488 3.66-2.946 1.144-1.671 1.614-3.292 1.636-3.376-.035-.015-3.155-1.213-3.149-4.704M14.618 3.82c.83-.996 1.385-2.383 1.233-3.757-1.189.048-2.618.791-3.473 1.8-0.76.892-1.431 2.308-1.258 3.659 1.332.103 2.66-0.697 3.498-1.701"/>
            </svg>
            Continuer avec Apple
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted-foreground/30" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground font-bold">Ou par identification</span>
          </div>
        </div>

        {/* Manual Auth Form */}
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-foreground">Email de commandement</label>
            <Input 
              name="email" 
              type="email" 
              className="bg-card border-muted-foreground/30 focus-visible:ring-primary h-12" 
              required 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-foreground">Code d&apos;accès (Mot de passe)</label>
            <Input 
              name="password" 
              type="password" 
              className="bg-card border-muted-foreground/30 focus-visible:ring-primary h-12" 
              required 
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button type="submit" formAction={login} className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground font-bold h-12 flex-1 shadow-md hover:bg-primary/90 transition-all active:scale-95 group">
              <ShieldCheck className="w-5 h-5 mr-2" />
              Connexion
            </button>
            <button type="submit" formAction={signup} className="inline-flex items-center justify-center rounded-lg border border-primary/40 bg-transparent text-primary font-bold h-12 flex-1 hover:bg-primary/10 transition-all active:scale-95 group">
              <UserPlus className="w-5 h-5 mr-2" />
              Créer compte
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Cezigue Hub. Accès restreint.
        </p>

      </div>
    </main>
  );
}
