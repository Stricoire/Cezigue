'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=true')
  }

  revalidatePath('/', 'layout')
  redirect('/services')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/login?error=true')
  }

  revalidatePath('/', 'layout')
  redirect('/services')
}

export async function signInWithProvider(provider: 'google' | 'apple') {
  const supabase = await createClient()
  
  // Dynamic Origin detection for Vercel vs Localhost
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: `${origin}/auth/callback`, 
    },
  })

  if (error) {
    redirect('/login?error=true')
  }

  if (data?.url) {
    redirect(data.url)
  }
}
