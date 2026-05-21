'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  Sprout, LayoutDashboard, MessageSquare, TrendingUp,
  GraduationCap, LogOut, Menu, X, Languages,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface NavProfile {
  full_name?: string | null
  avatar_url?: string | null
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, lang, setLang } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const [navProfile, setNavProfile] = useState<NavProfile | null>(null)

  const navLinks = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/assistant',  label: t.nav.assistant,  icon: MessageSquare  },
    { href: '/crops',      label: t.nav.crops,      icon: Sprout         },
    { href: '/market',     label: t.nav.market,     icon: TrendingUp     },
    { href: '/learn',      label: t.nav.learn,      icon: GraduationCap  },
  ]

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()
      setNavProfile(data)
    }
    fetchProfile()
  }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function Avatar({ size = 28 }: { size?: number }) {
    const dim = `${size}px`
    if (navProfile?.avatar_url) {
      return (
        <img
          src={navProfile.avatar_url}
          alt="avatar"
          style={{ width: dim, height: dim }}
          className="rounded-full object-cover ring-1 ring-white/20 shrink-0"
        />
      )
    }
    const initials = (navProfile?.full_name ?? '?')[0].toUpperCase()
    return (
      <div
        style={{ width: dim, height: dim, backgroundColor: 'var(--primary)', fontSize: size * 0.38 }}
        className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      >
        {initials}
      </div>
    )
  }

  function LangSwitch({ compact = false }: { compact?: boolean }) {
    return (
      <button
        onClick={() => setLang(lang === 'sw' ? 'en' : 'sw')}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
          compact
            ? 'text-[var(--sidebar-fg)] hover:bg-white/10'
            : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
        }`}
        title={t.common.language}
      >
        <Languages className="h-4 w-4" />
        <span>{lang === 'sw' ? 'EN' : 'SW'}</span>
      </button>
    )
  }

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-56 min-h-screen fixed left-0 top-0 z-40 border-r border-[var(--border)]"
        style={{ backgroundColor: 'var(--sidebar)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/10">
          <div className="bg-[var(--primary)] rounded-lg p-1.5">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base text-white">{t.nav.appName}</span>
            <p className="text-[10px] text-[var(--sidebar-fg)] leading-none mt-0.5">{t.nav.appTagline}</p>
          </div>
        </div>

        {/* User profile card — top of sidebar, always visible */}
        <Link
          id="profile-avatar"
          href="/profile"
          className="flex items-center gap-3 px-4 py-3 border-b border-white/10 hover:bg-white/5 transition-colors group"
        >
          <Avatar size={36} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {navProfile?.full_name ?? '—'}
            </p>
            <p className="text-[10px] text-[var(--sidebar-fg)] mt-0.5 group-hover:text-white/60 transition-colors">
              {lang === 'sw' ? 'Angalia wasifu →' : 'View profile →'}
            </p>
          </div>
        </Link>

        {/* Nav links */}
        <nav id="main-navigation" className="flex-1 py-4 px-3 space-y-0.5">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--sidebar-fg)] hover:bg-white/8 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-transform duration-150 ${active ? '' : 'group-hover:scale-110'}`} />
                {label}
                {active && (
                  <motion.div layoutId="nav-indicator" className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom bar: lang + theme + sign out */}
        <div className="p-3 border-t border-white/10 flex items-center gap-1">
          <LangSwitch compact />
          <div className="flex-1" />
          <ThemeToggle />
          <button
            onClick={handleLogout}
            title={t.nav.logout}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">{t.nav.logout}</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b border-white/10"
        style={{ backgroundColor: 'var(--sidebar)' }}
      >
        <div className="flex items-center gap-2">
          <div className="bg-[var(--primary)] rounded-md p-1">
            <Sprout className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white">{t.nav.appName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <LangSwitch compact />
          <ThemeToggle />
          <Link href="/profile" className="p-0.5 rounded-full">
            <Avatar size={28} />
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-[var(--sidebar-fg)] hover:text-white transition-colors"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile slide-down menu ───────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="md:hidden fixed top-14 left-0 right-0 z-40 border-b border-white/10 py-2"
            style={{ backgroundColor: 'var(--sidebar)' }}
          >
            {/* Profile row */}
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 mx-3 mb-2 px-3 py-2.5 rounded-lg hover:bg-white/8 transition-colors"
            >
              <Avatar size={32} />
              <div>
                <p className="text-sm font-semibold text-white">{navProfile?.full_name ?? '—'}</p>
                <p className="text-[10px] text-[var(--sidebar-fg)]">
                  {lang === 'sw' ? 'Angalia wasifu' : 'View profile'}
                </p>
              </div>
            </Link>

            <div className="mx-3 mb-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />

            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  pathname.startsWith(href)
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--sidebar-fg)] hover:bg-white/8 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}

            <div className="mx-3 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => { setMenuOpen(false); handleLogout() }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="h-4 w-4" />
                {t.nav.logout}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom tab bar ────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] flex justify-around py-1.5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors ${
                active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
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
