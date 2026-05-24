import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname
  const code = request.nextUrl.searchParams.get('code')

  // Forward OAuth code to the callback handler when Supabase redirects to /login
  // instead of /auth/callback (happens when /auth/callback isn't in the Supabase allowlist)
  if (pathname === '/login' && code) {
    return NextResponse.redirect(new URL(`/auth/callback?code=${code}`, request.url))
  }

  const { data: { user } } = await supabase.auth.getUser()

  // Auth pages: redirect signed-in users to their home
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password']
  const isAuthPage = authPages.some(p => pathname.startsWith(p))

  if (user && isAuthPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    const dest = (role === 'admin' || role === 'super_admin') ? '/admin' : '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
