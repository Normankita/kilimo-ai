import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminNavbar from '@/components/admin/admin-navbar'
import Navbar from '@/components/layout/navbar'
import PageWrapper from '@/components/motion/page-wrapper'
import type { UserRole } from '@/lib/profile'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  // Only admin and super_admin may enter
  if (!profile || profile.role === 'farmer') redirect('/dashboard')

  // super_admin keeps the separate admin shell with an explicit switch back
  // to the farmer app. Plain admins get the same shell the farmer app uses —
  // admin tools are just more links in that one navbar, not a separate mode.
  if (profile.role === 'super_admin') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
        <AdminNavbar
          role={profile.role as UserRole}
          name={profile.full_name}
          email={profile.email ?? user.email}
        />
        {/* pt-14 = top navbar height */}
        <main className="pt-14 min-h-screen">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <Navbar containerClassName="max-w-[1600px]" />
      {/* pt-14 = navbar height (h-14). pb-20 = mobile bottom tab bar. */}
      <main className="pt-14 pb-20 md:pb-6 min-h-screen">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
          <PageWrapper>{children}</PageWrapper>
        </div>
      </main>
    </div>
  )
}
