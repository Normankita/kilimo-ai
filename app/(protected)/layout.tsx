import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/navbar'
import PageWrapper from '@/components/motion/page-wrapper'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Note: admins & super_admins can access the farmer app freely.
  // The /admin route group has its own access gate in app/admin/layout.tsx.

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <Navbar />
      {/* pt-14 = navbar height (h-14). pb-20 = mobile bottom tab bar. */}
      <main className="pt-14 pb-20 md:pb-6 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
          <PageWrapper>{children}</PageWrapper>
        </div>
      </main>
    </div>
  )
}
