import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { roleRedirectPath, type UserRole } from '@/lib/profile'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Optional: honour a `next` redirect hint (e.g. from linkIdentity)
  const next = searchParams.get('next') ?? null

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  // Check if profile already exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  let role: UserRole = 'farmer'

  if (!existing) {
    // First-time Google sign-up, create a farmer profile
    const { data: created } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        role: 'farmer',
        full_name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
        email: data.user.email,
      })
      .select('role')
      .single()

    role = (created?.role ?? 'farmer') as UserRole
  } else {
    role = existing.role as UserRole
  }

  // If a specific `next` param was provided (e.g. account-linking flow), honour it.
  // Otherwise route by role: farmers → /dashboard, admins → /admin
  const destination = next ?? roleRedirectPath(role)
  return NextResponse.redirect(`${origin}${destination}`)
}
