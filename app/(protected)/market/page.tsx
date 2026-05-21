'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, MapPin, Info, Lightbulb } from 'lucide-react'

const SEED = [
  { crop_name: 'Mahindi',   price_per_kg: 650,  market_location: 'Dar es Salaam', recorded_date: '2026-05-20' },
  { crop_name: 'Mahindi',   price_per_kg: 600,  market_location: 'Dodoma',         recorded_date: '2026-05-20' },
  { crop_name: 'Mahindi',   price_per_kg: 580,  market_location: 'Mbeya',          recorded_date: '2026-05-20' },
  { crop_name: 'Mahindi',   price_per_kg: 620,  market_location: 'Arusha',         recorded_date: '2026-05-20' },
  { crop_name: 'Mchele',    price_per_kg: 1800, market_location: 'Dar es Salaam', recorded_date: '2026-05-20' },
  { crop_name: 'Mchele',    price_per_kg: 1650, market_location: 'Dodoma',         recorded_date: '2026-05-20' },
  { crop_name: 'Mchele',    price_per_kg: 1700, market_location: 'Arusha',         recorded_date: '2026-05-20' },
  { crop_name: 'Mchele',    price_per_kg: 1600, market_location: 'Mbeya',          recorded_date: '2026-05-20' },
  { crop_name: 'Nyanya',    price_per_kg: 800,  market_location: 'Dar es Salaam', recorded_date: '2026-05-20' },
  { crop_name: 'Nyanya',    price_per_kg: 650,  market_location: 'Dodoma',         recorded_date: '2026-05-20' },
  { crop_name: 'Nyanya',    price_per_kg: 750,  market_location: 'Arusha',         recorded_date: '2026-05-20' },
  { crop_name: 'Nyanya',    price_per_kg: 600,  market_location: 'Mbeya',          recorded_date: '2026-05-20' },
  { crop_name: 'Maharage',  price_per_kg: 1400, market_location: 'Dar es Salaam', recorded_date: '2026-05-20' },
  { crop_name: 'Maharage',  price_per_kg: 1300, market_location: 'Dodoma',         recorded_date: '2026-05-20' },
  { crop_name: 'Maharage',  price_per_kg: 1350, market_location: 'Arusha',         recorded_date: '2026-05-20' },
  { crop_name: 'Maharage',  price_per_kg: 1250, market_location: 'Mbeya',          recorded_date: '2026-05-20' },
  { crop_name: 'Vitunguu',  price_per_kg: 500,  market_location: 'Dar es Salaam', recorded_date: '2026-05-20' },
  { crop_name: 'Vitunguu',  price_per_kg: 450,  market_location: 'Dodoma',         recorded_date: '2026-05-20' },
  { crop_name: 'Vitunguu',  price_per_kg: 480,  market_location: 'Arusha',         recorded_date: '2026-05-20' },
  { crop_name: 'Vitunguu',  price_per_kg: 420,  market_location: 'Mbeya',          recorded_date: '2026-05-20' },
]

const EMOJIS: Record<string, string> = { Mahindi: '🌽', Mchele: '🌾', Nyanya: '🍅', Maharage: '🫘', Vitunguu: '🧅' }
const LOCATIONS = ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mbeya']

type PriceRow = { crop_name: string; price_per_kg: number; market_location: string; recorded_date: string }

export default function MarketPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<PriceRow[]>(SEED)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('market_prices')
      .select('*')
      .order('recorded_date', { ascending: false })
      .then(({ data }) => { if (data?.length) setData(data) })
  }, [])

  const grouped = data.reduce((acc: Record<string, PriceRow[]>, item) => {
    if (!acc[item.crop_name]) acc[item.crop_name] = []
    acc[item.crop_name].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{t.market.title}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t.market.subtitle}</p>
      </motion.div>

      {/* Warning */}
      <motion.div
        className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
        style={{ backgroundColor: 'var(--accent-bg)', border: '1px solid var(--border)', color: 'var(--accent)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        {t.market.warning}
      </motion.div>

      {/* Location pills */}
      <div className="flex gap-2 flex-wrap">
        {LOCATIONS.map(loc => (
          <div key={loc} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', backgroundColor: 'var(--surface)' }}>
            <MapPin className="h-3 w-3" style={{ color: 'var(--primary)' }} />
            {loc}
          </div>
        ))}
      </div>

      {/* Crop cards */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([crop, items], ci) => {
          const prices = items.map(i => i.price_per_kg)
          const maxP = Math.max(...prices)
          const minP = Math.min(...prices)

          return (
            <motion.div
              key={crop}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.08 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl">{EMOJIS[crop] ?? '🌿'}</span>
                    <span style={{ color: 'var(--text)' }}>{crop}</span>
                    <div className="ml-auto flex gap-2">
                      <Badge variant="outline">{t.market.min}: {minP.toLocaleString()}</Badge>
                      <Badge>{t.market.max}: {maxP.toLocaleString()}</Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {LOCATIONS.map(loc => {
                      const item = items.find(i => i.market_location === loc)
                      if (!item) return null
                      const pct = ((item.price_per_kg - minP) / (maxP - minP || 1)) * 100
                      const isTop = item.price_per_kg === maxP

                      return (
                        <motion.div
                          key={loc}
                          className="rounded-lg p-3 border"
                          style={{
                            backgroundColor: isTop ? 'rgba(42,92,63,0.06)' : 'var(--surface-2)',
                            borderColor: isTop ? 'var(--primary)' : 'var(--border)',
                          }}
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: 'spring', stiffness: 400 }}
                        >
                          <div className="flex items-center gap-1 mb-1.5">
                            <MapPin className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{loc}</span>
                            {isTop && <TrendingUp className="h-3 w-3 ml-auto" style={{ color: 'var(--primary)' }} />}
                          </div>
                          <p className="text-base font-bold" style={{ color: isTop ? 'var(--primary)' : 'var(--text)' }}>
                            {item.price_per_kg.toLocaleString()}
                            <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>TZS/kg</span>
                          </p>
                          {/* mini price bar */}
                          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: 'var(--primary)' }} />
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Tip */}
      <motion.div
        className="rounded-xl p-4 flex gap-3"
        style={{ backgroundColor: 'var(--accent-bg)', border: '1px solid var(--border)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Lightbulb className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
        <div>
          <p className="font-semibold text-sm mb-1" style={{ color: 'var(--accent)' }}>{t.market.tip}</p>
          <p className="text-sm" style={{ color: 'var(--text)' }}>{t.market.tipText}</p>
        </div>
      </motion.div>
    </div>
  )
}
