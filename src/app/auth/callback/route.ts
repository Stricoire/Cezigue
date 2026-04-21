import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  // S'il y a un paramètre 'next' personnalisé, on le récupère, sinon par défaut on va au Hub B2C
  const next = requestUrl.searchParams.get('next') ?? '/services'

  if (code) {
    // Échange du code de sécurité temporaire contre un Token de Session persistant (Cookie SSR)
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }
  }

  // En cas d'erreur de token ou de code expiré, on redirige vers le login avec le drapeau d'erreur
  return NextResponse.redirect(`${requestUrl.origin}/login?error=true`)
}
