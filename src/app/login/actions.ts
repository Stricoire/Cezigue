'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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
  redirect('/admin')
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
  redirect('/admin')
}

export async function signInWithProvider(provider: 'google' | 'apple') {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: 'http://localhost:3001/auth/callback', 
    },
  })

  if (error) {
    redirect('/login?error=true')
  }

  if (data?.url) {
    redirect(data.url)
  }
}
