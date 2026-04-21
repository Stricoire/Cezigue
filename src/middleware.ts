import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Fetch session
  const { data: { user } } = await supabase.auth.getUser()

  // Protected route logic : Admin
  const isAuthRoute = request.nextUrl.pathname.startsWith('/admin')
  
  if (isAuthRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Freemium Logic : Metered Access for micro-services
  const isServiceRoute = request.nextUrl.pathname.startsWith('/services')

  if (isServiceRoute && !user) {
    const quotaCookie = request.cookies.get('czg_quota')
    const currentQuota = quotaCookie ? parseInt(quotaCookie.value, 10) : 3

    if (currentQuota <= 0) {
      // Quota exhausted -> Paywall
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('reason', 'freemium_limit')
      return NextResponse.redirect(url)
    } else {
      // Decrement the local quota for this visit
      // MaxAge = 24h ensures it resets daily
      supabaseResponse.cookies.set('czg_quota', (currentQuota - 1).toString(), {
        path: '/',
        maxAge: 60 * 60 * 24 // 1 day
      })
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
