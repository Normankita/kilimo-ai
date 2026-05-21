'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import WeatherWidget from '@/components/weather-widget'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, Sprout, TrendingUp, GraduationCap, ArrowRight } from 'lucide-react'
import { DashboardTour } from '@/components/tutorial/dashboard-tour'

const FALLBACK_PRICES = [
  { crop_name: 'Mahindi', price_per_kg: 650, market_location: 'Dar es Salaam' },
  { crop_name: 'Mchele', price_per_kg: 1800, market_location: 'Dar es Salaam' },
  { crop_name: 'Nyanya', price_per_kg: 800, market_location: 'Dar es Salaam' },
  { crop_name: 'Maharage', price_per_kg: 1400, market_location: 'Dar es Salaam' },
  { crop_name: 'Vitunguu', price_per_kg: 500, market_location: 'Dar es Salaam' },
]

const CARD_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

export default function DashboardPage() {
  const { t } = useLanguage()
  const reduced = useReducedMotion()
  const [user, setUser] = useState<{ name: string; location: string } | null>(null)
  const [prices, setPrices] = useState<typeof FALLBACK_PRICES>(FALLBACK_PRICES)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          name: user.user_metadata?.full_name || 'Mkulima',
          location: user.user_metadata?.location || 'Dodoma',
        })
      }
    })

    supabase
      .from('market_prices')
      .select('crop_name, price_per_kg, market_location')
      .order('recorded_date', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data?.length) setPrices(data)
      })
  }, [])

  const firstName = user?.name?.split(' ')[0] ?? '...'
  const location = user?.location ?? 'Dodoma'

  const shortcuts = [
    { href: '/assistant', label: t.dashboard.shortcutAI, desc: t.dashboard.shortcutAIDesc, icon: MessageSquare, color: 'var(--primary)' },
    { href: '/crops', label: t.dashboard.shortcutCrops, desc: t.dashboard.shortcutCropsDesc, icon: Sprout, color: '#5a6e3a' },
    { href: '/market', label: t.dashboard.shortcutMarket, desc: t.dashboard.shortcutMarketDesc, icon: TrendingUp, color: '#2a5878' },
    { href: '/learn', label: t.dashboard.shortcutLearn, desc: t.dashboard.shortcutLearnDesc, icon: GraduationCap, color: '#5a3a6e' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          {t.dashboard.greeting}, {firstName}! 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t.dashboard.subtitle}</p>
      </motion.div>

      {/* Weather, slides in from the left */}
      <motion.div
        id="weather-widget"
        initial={reduced ? {} : { opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          {t.dashboard.weather}, {location}
        </p>
        <WeatherWidget location={`${location},TZ`} />
      </motion.div>

      {/* Shortcuts */}
      <motion.div custom={1} variants={CARD_VARIANTS} initial="hidden" animate="visible">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
          {t.dashboard.shortcuts}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {shortcuts.map(({ href, label, desc, icon: Icon, color }) => (
            <Link key={href} href={href}>
              <motion.div
                className="rounded-xl p-4 text-white cursor-pointer"
                style={{ backgroundColor: color }}
                whileHover={{ y: -2, filter: 'brightness(1.08)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Icon className="h-5 w-5 mb-2 opacity-90" />
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs opacity-75 mt-0.5">{desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Market prices, slides in from the right */}
      <motion.div
        id="market-prices-widget"
        initial={reduced ? {} : { opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.14, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {t.dashboard.marketPrices}
          </p>
          <Link href="/market" className="flex items-center gap-1 text-sm hover:underline transition-colors"
            style={{ color: 'var(--primary)' }}>
            {t.dashboard.viewMore} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {prices.map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center justify-between px-4 py-3"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                >
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{item.crop_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.market_location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>
                      TZS {item.price_per_kg.toLocaleString()}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.dashboard.perKg}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI CTA */}
      <motion.div id="ai-assistant-link" custom={3} variants={CARD_VARIANTS} initial="hidden" animate="visible">
        <div className="rounded-xl p-5 flex items-center gap-4" style={{ backgroundColor: 'var(--primary)' }}>
          <div className="rounded-lg p-2.5 bg-white/10">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">{t.dashboard.aiTitle}</p>
            <p className="text-sm text-white/70">{t.dashboard.aiDesc}</p>
          </div>
          <Link href="/assistant">
            <Button variant="secondary" size="sm">{t.dashboard.ask}</Button>
          </Link>
        </div>
      </motion.div>

      <DashboardTour />
    </div>
  )
}
