'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { useTheme } from 'next-themes'
import {
  Sprout, LayoutDashboard, MessageSquare, TrendingUp,
  GraduationCap, LogOut, Menu, X, Languages, Sun, Moon,
  Monitor, User, QrCode, ChevronDown, ShieldCheck, Wheat,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface NavProfile {
  full_name?: string | null
  avatar_url?: string | null
  role?: string | null
}

const ROLE_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  farmer: { label: 'Mkulima', color: '#4a8a60', icon: Wheat },
  admin: { label: 'Admin', color: '#c4952a', icon: ShieldCheck },
  super_admin: { label: 'Super Admin', color: '#a855f7', icon: ShieldCheck },
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, lang, setLang } = useLanguage()
  const { theme, setTheme } = useTheme()

  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [navProfile, setNavProfile] = useState<NavProfile | null>(null)
  const [mounted, setMounted] = useState(false)

  const dropRef = useRef<HTMLDivElement>(null)

  const navLinks = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/assistant', label: t.nav.assistant, icon: MessageSquare },
    { href: '/crops', label: t.nav.crops, icon: Sprout },
    { href: '/market', label: t.nav.market, icon: TrendingUp },
    { href: '/learn', label: t.nav.learn, icon: GraduationCap },
  ]

  const themeOptions = [
    { value: 'light', icon: <Sun className="h-3.5 w-3.5" />, label: 'Light' },
    { value: 'dark', icon: <Moon className="h-3.5 w-3.5" />, label: 'Dark' },
    { value: 'system', icon: <Monitor className="h-3.5 w-3.5" />, label: 'Auto' },
  ]

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('id', user.id)
        .single()
      setNavProfile(data)
    }
    fetchProfile()
  }, [pathname])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close everything on route change
  useEffect(() => {
    setMenuOpen(false)
    setDropOpen(false)
  }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const roleMeta = ROLE_META[navProfile?.role ?? 'farmer'] ?? ROLE_META.farmer
  const RoleIcon = roleMeta.icon

  // ── Avatar ─────────────────────────────────────────────────────
  function Avatar({ size = 28 }: { size?: number }) {
    const dim = `${size}px`
    if (navProfile?.avatar_url) {
      return (
        <img
          src={navProfile.avatar_url}
          alt="avatar"
          style={{ width: dim, height: dim }}
          className="rounded-full object-cover shrink-0"
        />
      )
    }
    const initials = (navProfile?.full_name ?? '?')[0].toUpperCase()
    return (
      <div
        style={{ width: dim, height: dim, backgroundColor: 'var(--primary)', fontSize: size * 0.4 }}
        className="rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none"
      >
        {initials}
      </div>
    )
  }

  // ── Profile dropdown card ──────────────────────────────────────
  function DropdownPanel() {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.97 }}
        transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--sidebar)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Identity header */}
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar size={44} />
              <span
                className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 bg-emerald-400"
                style={{ borderColor: 'var(--sidebar)' }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{navProfile?.full_name ?? '—'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <RoleIcon className="h-3 w-3 shrink-0" style={{ color: roleMeta.color }} />
                <span className="text-[10px] font-semibold" style={{ color: roleMeta.color }}>
                  {roleMeta.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="py-1.5 px-2">
          <Link
            href="/profile"
            onClick={() => setDropOpen(false)}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--sidebar-fg)] hover:bg-white/8 hover:text-white transition-all"
          >
            <span className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <User className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1 font-medium">{lang === 'sw' ? 'Wasifu Wangu' : 'My Profile'}</span>
          </Link>

          {/* Admin Panel — only for admin / super_admin */}
          {(navProfile?.role === 'admin' || navProfile?.role === 'super_admin') && (
            <Link
              href="/admin"
              onClick={() => setDropOpen(false)}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{ color: roleMeta.color }}
            >
              <span className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${roleMeta.color}18` }}>
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1 font-semibold">
                {navProfile.role === 'super_admin' ? 'Super Admin Panel' : 'Admin Panel'}
              </span>
            </Link>
          )}

          <Link
            href="/qr"
            onClick={() => setDropOpen(false)}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--sidebar-fg)] hover:bg-white/8 hover:text-white transition-all"
          >
            <span className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <QrCode className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1 font-medium">{lang === 'sw' ? 'Nambari ya QR' : 'QR Code'}</span>
          </Link>
        </div>

        {/* Settings */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Language */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs text-[var(--sidebar-fg)]">
              <Languages className="h-3.5 w-3.5" />
              <span>{lang === 'sw' ? 'Lugha' : 'Language'}</span>
            </div>
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
              {(['sw', 'en'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="px-2.5 py-1 text-[11px] font-semibold transition-all"
                  style={{
                    backgroundColor: lang === l ? 'var(--primary)' : 'transparent',
                    color: lang === l ? '#fff' : 'var(--sidebar-fg)',
                  }}
                >
                  {l === 'sw' ? 'SW' : 'EN'}
                </button>
              ))}
            </div>
          </div>
          {/* Theme */}
          {mounted && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[var(--sidebar-fg)]">
                <Sun className="h-3.5 w-3.5" />
                <span>{lang === 'sw' ? 'Mandhari' : 'Theme'}</span>
              </div>
              <div className="flex gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                {themeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    title={opt.label}
                    className="h-7 w-7 flex items-center justify-center rounded-md transition-all"
                    style={{
                      backgroundColor: theme === opt.value ? 'var(--primary)' : 'transparent',
                      color: theme === opt.value ? '#fff' : 'var(--sidebar-fg)',
                    }}
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sign out */}
        <div className="p-2">
        <button
          onClick={() => { setDropOpen(false); handleLogout() }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
        >
          <span className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
            <LogOut className="h-3.5 w-3.5" />
          </span>
          {t.nav.logout}
        </button>
      </div>,
      </motion.div >
    )
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      {/* ════════════════════════════════════════════════════════════
          TOP NAVBAR — fixed, full width, both desktop + mobile
          ════════════════════════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{
          backgroundColor: 'var(--sidebar)',
          borderColor: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Inner wrapper — same max-width as page content so logo/links/avatar line up */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center gap-4">

          {/* ── Logo ─────────────────────────────────────────────── */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0 group">
            <div className="bg-[var(--primary)] rounded-lg p-1.5 transition-transform group-hover:scale-105">
              <Sprout className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-sm text-white">{t.nav.appName}</span>
              <p className="text-[9px] text-[var(--sidebar-fg)] leading-none -mt-0.5">{t.nav.appTagline}</p>
            </div>
          </Link>

          {/* ── Desktop nav links (center) ────────────────────────── */}
          <nav id="main-navigation" className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${active
                      ? 'text-white'
                      : 'text-[var(--sidebar-fg)] hover:text-white hover:bg-white/8'
                    }`}
                >,
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{label}</span>
                  {active && (
                    <motion.span
                      layoutId="topnav-indicator"
                      className="absolute inset-0 rounded-lg"
                      style={{ backgroundColor: 'var(--primary)', zIndex: -1 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>
          ,
          {/* ── Right side: profile pill + mobile hamburger ───────── */}
          <div className="ml-auto flex items-center gap-2 shrink-0">

            {/* Profile avatar + name pill — the dropdown trigger */}
            <div className="relative" ref={dropRef}>
              <button
                id="profile-avatar"
                onClick={() => { setDropOpen(o => !o); setMenuOpen(false) }}
                className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition-all hover:bg-white/8 group"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="relative shrink-0">
                  <Avatar size={30} />
                  <span
                    className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 bg-emerald-400"
                    style={{ borderColor: 'var(--sidebar)' }}
                  />
                </div>
                {/* Name — hidden on very small screens */}
                <span className="hidden sm:block text-sm font-semibold text-white max-w-[120px] truncate">
                  {navProfile?.full_name?.split(' ')[0] ?? '…'}
                </span>
                <motion.div
                  animate={{ rotate: dropOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--sidebar-fg)] group-hover:text-white/70 transition-colors" />
                </motion.div>
              </button>

              <AnimatePresence>
                {dropOpen && <DropdownPanel />}
              </AnimatePresence>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => { setMenuOpen(o => !o); setDropOpen(false) }}
              className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-[var(--sidebar-fg)] hover:text-white hover:bg-white/8 transition-all"
            >
              <AnimatePresence mode="wait" initial={false}>
                {menuOpen
                  ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.14 }}><X className="h-5 w-5" /></motion.div>
                  : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.14 }}><Menu className="h-5 w-5" /></motion.div>
                }
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile slide-down nav menu ───────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="md:hidden fixed top-14 left-0 right-0 z-40 py-2"
            style={{
              backgroundColor: 'var(--sidebar)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${pathname.startsWith(href)
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--sidebar-fg)] hover:bg-white/8 hover:text-white'
                  }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom tab bar ────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around py-1.5"
        style={{
          backgroundColor: 'var(--surface)',
          borderTop: '1px solid var(--border)',
        }}
      >
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors ${active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
                }`}
            >
              <Icon className={`h-5 w-5 transition-transform duration-150 ${active ? 'scale-110' : ''}`} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
