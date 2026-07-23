'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Droplets, Calendar, Bug, BarChart3, Thermometer, Lightbulb, Leaf, Search } from 'lucide-react'

interface CropInfo {
  id: number
  name: string
  name_en: string | null
  emoji: string | null
  season_sw: string | null
  season_en: string | null
  water_sw: string | null
  water_en: string | null
  temperature: string | null
  yield_sw: string | null
  yield_en: string | null
  diseases: string[] | null
  tips_sw: string | null
  tips_en: string | null
  accent_color: string | null
  image_url: string | null
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.3 },
  }),
}

type SortOption = 'name_asc' | 'name_desc'

export default function CropsPage() {
  const { t, lang } = useLanguage()
  const [crops, setCrops] = useState<CropInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('name_asc')

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data } = await supabase.from('crop_info').select('*').order('id')
      setCrops(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? crops.filter(c => c.name.toLowerCase().includes(q) || (c.name_en ?? '').toLowerCase().includes(q))
      : crops
    const displayName = (c: CropInfo) => (lang === 'sw' ? c.name : (c.name_en ?? c.name))
    return [...filtered].sort((a, b) => {
      const cmp = displayName(a).localeCompare(displayName(b))
      return sort === 'name_asc' ? cmp : -cmp
    })
  }, [crops, search, sort, lang])

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{t.crops.title}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t.crops.subtitle}</p>
      </motion.div>

      {crops.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <Input
              placeholder={lang === 'sw' ? 'Tafuta zao...' : 'Search crops...'}
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
            <option value="name_asc">{lang === 'sw' ? 'Jina A–Z' : 'Name A–Z'}</option>
            <option value="name_desc">{lang === 'sw' ? 'Jina Z–A' : 'Name Z–A'}</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl shimmer" />
          ))}
        </div>
      ) : crops.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center gap-2">
            <Leaf className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {lang === 'sw' ? 'Hakuna taarifa za mazao bado.' : 'No crop information yet.'}
            </p>
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center gap-2">
            <Search className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {lang === 'sw' ? 'Hakuna zao linalolingana na utafutaji.' : 'No crops match your search.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {visible.map((crop, i) => (
            <motion.div
              key={crop.id}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="overflow-hidden">
                {crop.image_url ? (
                  <img src={crop.image_url} alt={crop.name} className="h-36 w-full object-cover" />
                ) : (
                  /* Accent stripe — shown when no photo has been uploaded yet */
                  <div className="h-1 w-full" style={{ backgroundColor: crop.accent_color ?? '#2a5c3f' }} />
                )}

                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2.5 text-base">
                    <span className="text-2xl">{crop.emoji ?? '🌿'}</span>
                    <div>
                      <span style={{ color: 'var(--text)' }}>{lang === 'sw' ? crop.name : (crop.name_en ?? crop.name)}</span>
                      <span className="text-xs font-normal ml-2" style={{ color: 'var(--text-muted)' }}>
                        {lang === 'sw' ? crop.name_en : crop.name}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow icon={<Calendar className="h-4 w-4 text-emerald-600" />} label={t.crops.season} value={(lang === 'sw' ? crop.season_sw : crop.season_en) ?? '—'} />
                    <InfoRow icon={<Droplets className="h-4 w-4 text-blue-500" />} label={t.crops.water} value={(lang === 'sw' ? crop.water_sw : crop.water_en) ?? '—'} />
                    <InfoRow icon={<Thermometer className="h-4 w-4 text-orange-500" />} label={t.crops.temperature} value={crop.temperature ?? '—'} />
                    <InfoRow icon={<BarChart3 className="h-4 w-4 text-violet-500" />} label={t.crops.yield} value={(lang === 'sw' ? crop.yield_sw : crop.yield_en) ?? '—'} />
                  </div>

                  {crop.diseases && crop.diseases.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Bug className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{t.crops.diseases}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {crop.diseases.map(d => (
                          <Badge key={d} variant="destructive">{d}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(lang === 'sw' ? crop.tips_sw : crop.tips_en) && (
                    <div className="rounded-lg p-3 flex gap-2.5"
                      style={{ backgroundColor: 'var(--accent-bg)', border: '1px solid var(--border)' }}>
                      <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                      <div>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--accent)' }}>{t.crops.tips}</p>
                        <p className="text-sm" style={{ color: 'var(--text)' }}>{lang === 'sw' ? crop.tips_sw : crop.tips_en}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-sm" style={{ color: 'var(--text)' }}>{value}</p>
      </div>
    </div>
  )
}
