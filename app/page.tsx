'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/language-context'
import { useTheme } from 'next-themes'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  Sprout, MessageSquare, Cloud, TrendingUp, GraduationCap,
  ArrowRight, ChevronRight, Users, Zap, Shield,
} from 'lucide-react'

const FEATURES = [
  { icon: MessageSquare, color: '#2a5c3f', bgLight: '#edf4ef', bgDark: '#1a2d20',
    sw: { title: 'Msaidizi wa AI', desc: 'Uliza maswali ya kilimo na kupata majibu ya haraka kwa Kiswahili.' },
    en: { title: 'AI Assistant',   desc: 'Ask farming questions and get instant answers in Swahili.' },
  },
  { icon: Cloud, color: '#1c6a9e', bgLight: '#e8f3fb', bgDark: '#0f2030',
    sw: { title: 'Hali ya Hewa',   desc: 'Angalia hali ya hewa ya eneo lako na mipango ya kilimo.' },
    en: { title: 'Live Weather',   desc: 'Check your local weather and plan your farm activities.' },
  },
  { icon: TrendingUp, color: '#7c5c14', bgLight: '#fdf6e3', bgDark: '#1e1804',
    sw: { title: 'Bei za Soko',    desc: 'Jua bei za mazao katika masoko makuu ya Tanzania.' },
    en: { title: 'Market Prices',  desc: 'Know crop prices across major Tanzanian markets.' },
  },
  { icon: GraduationCap, color: '#5a3a6e', bgLight: '#f3eef8', bgDark: '#1e1028',
    sw: { title: 'Elimu ya Kilimo', desc: 'Tazama video na makala ya kilimo bora kwa Kiswahili.' },
    en: { title: 'Education',       desc: 'Watch farming videos and guides in Swahili.' },
  },
]

const STEPS = [
  {
    num: '01', icon: Users,
    sw: { title: 'Jisajili', desc: 'Fungua akaunti yako ya bure kwa dakika chache tu.' },
    en: { title: 'Register', desc: 'Create your free account in just a few minutes.' },
  },
  {
    num: '02', icon: Sprout,
    sw: { title: 'Weka Shamba Lako', desc: 'Ongeza mazao yako, eneo lako, na maelezo ya shamba.' },
    en: { title: 'Set Up Your Farm', desc: 'Add your crops, location, and farm details.' },
  },
  {
    num: '03', icon: Zap,
    sw: { title: 'Pata Ushauri', desc: 'AI itakupa ushauri wa kilimo ulioboreshwa kwa eneo lako.' },
    en: { title: 'Get Smart Advice', desc: 'AI gives you personalised farming advice for your area.' },
  },
]

const STATS = [
  { sw: 'Wakulima Wanaotumia', en: 'Farmers Using', value: '5,000+' },
  { sw: 'Masoko Yanayofuatiliwa', en: 'Markets Tracked', value: '4' },
  { sw: 'Mazao Yanayosaidia', en: 'Crops Supported', value: '5+' },
]

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
})

export default function LandingPage() {
  const { lang, setLang, t } = useLanguage()

  const sw = lang === 'sw'

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 85%, transparent)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-1.5" style={{ backgroundColor: 'var(--primary)' }}>
              <Sprout className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-base" style={{ color: 'var(--text)' }}>Kilimo AI</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(sw ? 'en' : 'sw')}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', backgroundColor: 'var(--surface-2)' }}
            >
              {sw ? 'EN' : 'SW'}
            </button>
            <ThemeToggle />
            <Link href="/login"
              className="ml-1 text-sm font-medium px-4 py-1.5 rounded-lg border transition-all"
              style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
              {sw ? 'Ingia' : 'Login'}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(160deg, color-mix(in srgb, var(--primary) 8%, transparent) 0%, transparent 60%)' }} />
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-5 pointer-events-none"
          style={{ backgroundColor: 'var(--primary)' }} />

        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          <motion.div {...fade(0)}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
              style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>
              <Sprout className="h-3.5 w-3.5" />
              {sw ? 'Teknolojia ya Kilimo — Tanzania' : 'Smart Farming Technology — Tanzania'}
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl font-bold leading-tight mb-4"
            style={{ color: 'var(--text)' }}
            {...fade(0.06)}
          >
            {sw ? 'Kilimo Bora,' : 'Better Farming,'}
            <br />
            <span style={{ color: 'var(--primary)' }}>{sw ? 'Maisha Bora' : 'Better Life'}</span>
          </motion.h1>

          <motion.p
            className="text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
            {...fade(0.12)}
          >
            {sw
              ? 'Msaidizi wa kilimo wa kiteknolojia kwa wakulima wadogo Tanzania. Pata ushauri wa AI, bei za soko, na mafunzo — yote bila malipo.'
              : 'A smart agriculture assistant for Tanzanian smallholder farmers. Get AI advice, market prices, and education — all for free.'}
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row gap-3 justify-center" {...fade(0.18)}>
            <Link href="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all active:scale-[0.97]"
              style={{ backgroundColor: 'var(--primary)' }}>
              {sw ? 'Jisajili Bure' : 'Register Free'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold border transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', backgroundColor: 'var(--surface)' }}>
              {sw ? 'Jifunze Zaidi' : 'Learn More'}
            </a>
          </motion.div>

          {/* Stats row */}
          <motion.div className="flex justify-center gap-8 mt-12" {...fade(0.24)}>
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sw ? s.sw : s.en}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section id="features" className="py-16 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <motion.div className="text-center mb-10" {...fade()}>
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text)' }}>
              {sw ? 'Vipengele Vyetu' : 'Our Features'}
            </h2>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {sw ? 'Kila kitu unachohitaji kwa kilimo bora' : 'Everything you need for smarter farming'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => {
              const content = sw ? f.sw : f.en
              return (
                <motion.div
                  key={i}
                  className="rounded-2xl p-5 border"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                  {...fade(i * 0.07)}
                  whileHover={{ y: -3, boxShadow: '0 8px 28px rgba(0,0,0,0.1)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: f.bgLight }}>
                    <f.icon className="h-5 w-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>{content.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{content.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How it Works ───────────────────────────────────────── */}
      <section className="py-16 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <motion.div className="text-center mb-10" {...fade()}>
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text)' }}>
              {sw ? 'Jinsi Inavyofanya Kazi' : 'How It Works'}
            </h2>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {sw ? 'Hatua tatu rahisi za kuanza' : 'Three simple steps to get started'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => {
              const content = sw ? step.sw : step.en
              return (
                <motion.div key={i} className="relative" {...fade(i * 0.1)}>
                  {/* Connector line (desktop only) */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-full h-px border-t border-dashed"
                      style={{ borderColor: 'var(--border)' }} />
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <step.icon className="h-7 w-7" style={{ color: 'var(--primary)' }} />
                      </div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                        style={{ backgroundColor: 'var(--primary)' }}>
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-1.5" style={{ color: 'var(--text)' }}>{content.title}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{content.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA banner ─────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            className="rounded-3xl p-10 text-center relative overflow-hidden"
            style={{ backgroundColor: 'var(--primary)' }}
            {...fade()}
          >
            {/* decorative circles */}
            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-white/5" />

            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {sw ? 'Anza Leo, Bila Malipo!' : 'Start Today, Completely Free!'}
              </h2>
              <p className="text-white/70 text-sm mb-7 max-w-md mx-auto">
                {sw
                  ? 'Jiunge na wakulima wa Tanzania wanaotumia Kilimo AI kuimarisha mashamba yao.'
                  : 'Join Tanzanian farmers using Kilimo AI to improve their farms.'}
              </p>
              <Link href="/register"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-[var(--primary)] bg-white hover:bg-white/90 shadow-lg transition-all active:scale-[0.97]"
              >
                {sw ? 'Jisajili Bure Sasa' : 'Register Free Now'}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t py-8 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <div className="rounded-md p-1" style={{ backgroundColor: 'var(--primary)' }}>
            <Sprout className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold" style={{ color: 'var(--text)' }}>Kilimo AI</span>
        </div>
        <p>{sw ? '© 2026 Kilimo AI. Haki zote zimehifadhiwa.' : '© 2026 Kilimo AI. All rights reserved.'}</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <Link href="/login" className="hover:underline">{sw ? 'Ingia' : 'Login'}</Link>
          <Link href="/register" className="hover:underline">{sw ? 'Jisajili' : 'Register'}</Link>
        </div>
      </footer>
    </div>
  )
}
