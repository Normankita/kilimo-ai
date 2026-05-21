import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/admin-sidebar'
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

  if (!profile || profile.role === 'farmer') redirect('/dashboard')

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <AdminSidebar
        role={profile.role as UserRole}
        name={profile.full_name}
        email={profile.email ?? user.email}
      />
      <main className="md:ml-56 pt-14 md:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
