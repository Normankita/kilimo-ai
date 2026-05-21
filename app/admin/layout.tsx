import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminNavbar from '@/components/admin/admin-navbar'
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <AdminNavbar
        role={profile.role as UserRole}
        name={profile.full_name}
        email={profile.email ?? user.email}
      />
      {/* pt-14 = top navbar height */}
      <main className="pt-14 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
