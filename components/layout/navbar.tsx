'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  Sprout, LayoutDashboard, MessageSquare, BookOpen, TrendingUp,
  GraduationCap, LogOut, Menu, X, Languages,
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lang } from '@/lib/translations'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, lang, setLang } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/assistant',  label: t.nav.assistant,  icon: MessageSquare  },
    { href: '/crops',      label: t.nav.crops,      icon: Sprout         },
    { href: '/market',     label: t.nav.market,     icon: TrendingUp     },
    { href: '/learn',      label: t.nav.learn,      icon: GraduationCap  },
  ]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
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
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen fixed left-0 top-0 z-40 border-r border-[var(--border)]"
        style={{ backgroundColor: 'var(--sidebar)' }}>
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <div className="bg-[var(--primary)] rounded-lg p-1.5">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base text-white">{t.nav.appName}</span>
            <p className="text-[10px] text-[var(--sidebar-fg)] leading-none mt-0.5">{t.nav.appTagline}</p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5">
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
                  <motion.div
                    layoutId="nav-indicator"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <div className="flex items-center gap-2 px-2 py-1">
            <LangSwitch compact />
            <div className="flex-1" />
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--sidebar-fg)] hover:bg-white/8 hover:text-white transition-all duration-150"
          >
            <LogOut className="h-4 w-4" />
            {t.nav.logout}
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b border-white/10"
        style={{ backgroundColor: 'var(--sidebar)' }}>
        <div className="flex items-center gap-2">
          <div className="bg-[var(--primary)] rounded-md p-1">
            <Sprout className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white">{t.nav.appName}</span>
        </div>
        <div className="flex items-center gap-2">
          <LangSwitch compact />
          <ThemeToggle />
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
            <div className="mx-3 mt-2 pt-2 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-[var(--sidebar-fg)] hover:text-white hover:bg-white/8"
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
