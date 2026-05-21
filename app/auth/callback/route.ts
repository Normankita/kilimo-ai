import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { roleRedirectPath, type UserRole } from '@/lib/profile'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  // Ensure a profile exists for new OAuth users
  const { data: existing } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (!existing) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      role: 'farmer',
      full_name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
      email: data.user.email,
    })
  }

  const role = (existing?.role ?? 'farmer') as UserRole
  return NextResponse.redirect(`${origin}${roleRedirectPath(role)}`)
}
