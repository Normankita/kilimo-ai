'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/profile'
import {
  Sprout, LayoutDashboard, TrendingUp, PlaySquare, Leaf, Users,
  LogOut, ChevronLeft, Menu, X, Shield, UserCircle,
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ROLE_LABEL: Record<UserRole, string> = {
  farmer: 'Farmer',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

interface Props {
  role: UserRole
  name?: string | null
  email?: string | null
}

export default function AdminSidebar({ role, name, email }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = [
    { href: '/admin',         label: 'Dashboard',    icon: LayoutDashboard, exact: true },
    { href: '/admin/market',  label: 'Market Prices', icon: TrendingUp },
    { href: '/admin/content', label: 'Education',     icon: PlaySquare },
    { href: '/admin/crops',   label: 'Crop Info',     icon: Leaf },
    ...(role === 'super_admin'
      ? [{ href: '/admin/users', label: 'Users', icon: Users }]
      : []),
  ]

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <div className="rounded-lg p-1.5" style={{ backgroundColor: 'var(--primary)' }}>
          <Sprout className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm text-white">Kilimo AI</span>
          <p className="text-[10px] text-white/40 leading-none mt-0.5">Admin Panel</p>
        </div>
        <Link href="/dashboard" className="ml-auto text-white/40 hover:text-white/70 transition-colors" title="Back to app">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link key={href} href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active ? 'bg-[var(--primary)] text-white' : 'text-white/60 hover:bg-white/8 hover:text-white'
              }`}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: 'var(--primary)' }}>
              {name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{name ?? 'Admin'}</p>
              <p className="text-[10px] text-white/40 truncate">{email ?? ''}</p>
            </div>
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium text-white/80"
              style={{ backgroundColor: role === 'super_admin' ? '#7c3aed' : '#2a5c3f' }}>
              {ROLE_LABEL[role]}
            </span>
          </div>
        </div>
        <Link href="/profile" onClick={() => setMobileOpen(false)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/8 hover:text-white transition-all duration-150">
          <UserCircle className="h-4 w-4" />
          Wasifu Wangu
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/8 hover:text-white transition-all duration-150">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen fixed left-0 top-0 z-40 border-r border-white/10"
        style={{ backgroundColor: 'var(--sidebar)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b border-white/10"
        style={{ backgroundColor: 'var(--sidebar)' }}>
        <div className="flex items-center gap-2">
          <div className="rounded-md p-1" style={{ backgroundColor: 'var(--primary)' }}>
            <Sprout className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">Admin</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 text-white/60 hover:text-white">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="md:hidden fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)} />
            <motion.div
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-64 flex flex-col border-r border-white/10"
              style={{ backgroundColor: 'var(--sidebar)' }}
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
