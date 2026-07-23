'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { TrendingUp, MapPin, Info, Lightbulb, Search } from 'lucide-react'

const EMOJIS: Record<string, string> = { Mahindi: '🌽', Mchele: '🌾', Nyanya: '🍅', Maharage: '🫘', Vitunguu: '🧅' }
const LOCATIONS = ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mbeya']

type PriceRow = { crop_name: string; price_per_kg: number; market_location: string; recorded_date: string }
type SortOption = 'name_asc' | 'name_desc' | 'price_desc' | 'price_asc'

export default function MarketPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<PriceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('name_asc')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('market_prices')
      .select('*')
      .order('recorded_date', { ascending: false })
      .then(({ data }) => { setData(data ?? []); setLoading(false) })
  }, [])

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q ? data.filter(d => d.crop_name.toLowerCase().includes(q)) : data
    const groups = filtered.reduce((acc: Record<string, PriceRow[]>, item) => {
      if (!acc[item.crop_name]) acc[item.crop_name] = []
      acc[item.crop_name].push(item)
      return acc
    }, {})
    const entries = Object.entries(groups)
    entries.sort(([cropA, itemsA], [cropB, itemsB]) => {
      if (sort === 'name_asc') return cropA.localeCompare(cropB)
      if (sort === 'name_desc') return cropB.localeCompare(cropA)
      const maxA = Math.max(...itemsA.map(i => i.price_per_kg))
      const maxB = Math.max(...itemsB.map(i => i.price_per_kg))
      return sort === 'price_desc' ? maxB - maxA : maxA - maxB
    })
    return entries
  }, [data, search, sort])

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

      {!loading && data.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <Input
              placeholder="Search crop..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            className="h-10 rounded-lg border px-3 text-sm shrink-0"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
            <option value="price_desc">Highest price</option>
            <option value="price_asc">Lowest price</option>
          </select>
        </div>
      )}

      {/* Crop cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl shimmer" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center gap-2">
            <TrendingUp className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No market prices recorded yet.</p>
          </CardContent>
        </Card>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center gap-2">
            <Search className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No crops match your search.</p>
          </CardContent>
        </Card>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {grouped.map(([crop, items], ci) => {
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
      )}

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
