import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/navbar'
import AdminSidebar from '@/components/admin/admin-sidebar'
import PageWrapper from '@/components/motion/page-wrapper'
import type { UserRole } from '@/lib/profile'

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {isAdmin ? (
        <AdminSidebar
          role={profile!.role as UserRole}
          name={profile!.full_name}
          email={profile!.email ?? user.email}
        />
      ) : (
        <Navbar />
      )}
      <main className="md:ml-56 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-3xl mx-auto p-4 md:p-6">
          <PageWrapper>{children}</PageWrapper>
        </div>
      </main>
    </div>
  )
}
