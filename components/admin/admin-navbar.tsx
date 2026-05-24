'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/profile'
import {
  Sprout, LayoutDashboard, TrendingUp, PlaySquare, Leaf,
  Users, LogOut, Menu, X, ChevronLeft, Shield, Star,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ROLE_META: Record<UserRole, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  farmer:      { label: 'Mkulima',        color: '#4a8a60', bg: 'rgba(74,138,96,0.15)',   icon: Sprout  },
  admin:       { label: 'Admin',          color: '#c4952a', bg: 'rgba(196,149,42,0.15)',   icon: Shield  },
  super_admin: { label: 'Super Admin',    color: '#a855f7', bg: 'rgba(168,85,247,0.15)',   icon: Star    },
}

interface Props {
  role: UserRole
  name?: string | null
  email?: string | null
}

export default function AdminNavbar({ role, name, email }: Props) {
  const pathname   = usePathname()
  const router     = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)

  const roleMeta = ROLE_META[role]
  const RoleIcon = roleMeta.icon

  // Links available to all admins
  const baseLinks: { href: string; label: string; icon: React.ElementType; exact?: boolean }[] = [
    { href: '/admin',         label: 'Dashboard',     icon: LayoutDashboard, exact: true },
    { href: '/admin/market',  label: 'Market Prices', icon: TrendingUp },
    { href: '/admin/content', label: 'Education',     icon: PlaySquare },
    { href: '/admin/crops',   label: 'Crop Info',     icon: Leaf },
  ]

  // Super-admin only
  const superLinks: { href: string; label: string; icon: React.ElementType; exact?: boolean }[] = [
    { href: '/admin/users', label: 'Users', icon: Users },
  ]

  const links = role === 'super_admin' ? [...baseLinks, ...superLinks] : baseLinks

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href) && pathname !== '/admin'
      || (exact && pathname === href)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = (name ?? 'A')[0].toUpperCase()

  return (
    <>
      {/* ── Top navbar ─────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{
          backgroundColor: 'var(--sidebar)',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">

          {/* Logo + panel badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-[var(--primary)] rounded-lg p-1.5">
              <Sprout className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-sm text-white">Kilimo AI</span>
              <p className="text-[9px] leading-none -mt-0.5" style={{ color: roleMeta.color }}>
                {roleMeta.label} Panel
              </p>
            </div>
          </div>

          {/* Role badge pill */}
          <div
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{ backgroundColor: roleMeta.bg, color: roleMeta.color }}
          >
            <RoleIcon className="h-3 w-3" />
            {roleMeta.label}
          </div>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {links.map(({ href, label, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname.startsWith(href) && href !== '/admin'
                  ? true
                  : pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'text-white'
                      : 'text-[var(--sidebar-fg)] hover:text-white hover:bg-white/8'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                  {active && (
                    <motion.span
                      layoutId="admin-indicator"
                      className="absolute inset-0 rounded-lg"
                      style={{ backgroundColor: roleMeta.color, opacity: 0.18, zIndex: -1 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 shrink-0">

            {/* Back to app */}
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[var(--sidebar-fg)] hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/8 transition-all"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {role === 'farmer' ? 'App' : 'Farmer App'}
            </Link>

            {/* Profile pill */}
            <div className="relative">
              <button
                onClick={() => { setDropOpen(o => !o); setMenuOpen(false) }}
                className="flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 transition-all hover:bg-white/8"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
                  style={{ backgroundColor: roleMeta.color }}
                >
                  {initials}
                </div>
                <span className="hidden sm:block text-sm font-semibold text-white max-w-[100px] truncate">
                  {name?.split(' ')[0] ?? '…'}
                </span>
                <motion.div animate={{ rotate: dropOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--sidebar-fg)]" />
                </motion.div>
              </button>

              <AnimatePresence>
                {dropOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0,  scale: 1 }}
                    exit={{    opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-2xl overflow-hidden"
                    style={{
                      backgroundColor: 'var(--sidebar)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    }}
                  >
                    {/* Identity */}
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <p className="text-sm font-semibold text-white truncate">{name ?? 'Admin'}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--sidebar-fg)' }}>{email ?? ''}</p>
                      <div
                        className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: roleMeta.bg, color: roleMeta.color }}
                      >
                        <RoleIcon className="h-2.5 w-2.5" />
                        {roleMeta.label}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2">
                      <Link
                        href="/dashboard"
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[var(--sidebar-fg)] hover:bg-white/8 hover:text-white transition-all"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Go to Farmer App
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[var(--sidebar-fg)] hover:bg-white/8 hover:text-white transition-all"
                      >
                        <Users className="h-3.5 w-3.5" />
                        My Profile
                      </Link>
                      <button
                        onClick={() => { setDropOpen(false); handleLogout() }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => { setMenuOpen(o => !o); setDropOpen(false) }}
              className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-[var(--sidebar-fg)] hover:text-white hover:bg-white/8 transition-all"
            >
              <AnimatePresence mode="wait" initial={false}>
                {menuOpen
                  ? <motion.div key="x"    initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate:  90, opacity: 0 }} transition={{ duration: 0.14 }}><X    className="h-5 w-5" /></motion.div>
                  : <motion.div key="menu" initial={{ rotate:  90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.14 }}><Menu className="h-5 w-5" /></motion.div>
                }
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile slide-down menu ──────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="md:hidden fixed top-14 left-0 right-0 z-40 py-2"
            style={{
              backgroundColor: 'var(--sidebar)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            {links.map(({ href, label, icon: Icon, exact }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  (exact ? pathname === href : pathname.startsWith(href))
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--sidebar-fg)] hover:bg-white/8 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
            <div className="mx-3 mt-1 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--sidebar-fg)] hover:bg-white/8 hover:text-white transition-all"
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                Back to Farmer App
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
