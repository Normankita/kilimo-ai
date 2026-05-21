'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Users, TrendingUp, PlaySquare, Leaf, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Stats {
  farmers: number
  admins: number
  marketEntries: number
  videos: number
  cropInfo: number
}

interface RecentPrice {
  crop_name: string
  price_per_kg: number
  market_location: string
  recorded_date: string
}

const statCards = (s: Stats) => [
  { label: 'Total Farmers', value: s.farmers, icon: Users,       color: 'var(--primary)' },
  { label: 'Admins',        value: s.admins,  icon: Users,       color: '#7c3aed' },
  { label: 'Market Entries',value: s.marketEntries, icon: TrendingUp, color: '#1c6a9e' },
  { label: 'Videos',        value: s.videos,  icon: PlaySquare,  color: '#5a3a6e' },
  { label: 'Crop Info',     value: s.cropInfo, icon: Leaf,        color: '#5a6e3a' },
]

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ farmers: 0, admins: 0, marketEntries: 0, videos: 0, cropInfo: 0 })
  const [recent, setRecent] = useState<RecentPrice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const [profiles, market, videos, crops] = await Promise.all([
        supabase.from('profiles').select('role'),
        supabase.from('market_prices').select('id', { count: 'exact', head: true }),
        supabase.from('educational_content').select('id', { count: 'exact', head: true }),
        supabase.from('crop_info').select('id', { count: 'exact', head: true }),
      ])

      const farmers = profiles.data?.filter(p => p.role === 'farmer').length ?? 0
      const admins  = profiles.data?.filter(p => p.role !== 'farmer').length ?? 0

      setStats({
        farmers,
        admins,
        marketEntries: market.count ?? 0,
        videos: videos.count ?? 0,
        cropInfo: crops.count ?? 0,
      })

      const { data: prices } = await supabase
        .from('market_prices')
        .select('crop_name, price_per_kg, market_location, recorded_date')
        .order('recorded_date', { ascending: false })
        .limit(6)

      setRecent(prices ?? [])
      setLoading(false)
    }

    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Admin Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Overview of all platform data</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards(stats).map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                  <s.icon className="h-4 w-4" style={{ color: s.color }} />
                </div>
                {loading
                  ? <div className="h-7 w-12 rounded shimmer" />
                  : <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{s.value}</p>
                }
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent prices */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            Recent Market Price Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-5 pb-5 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-8 rounded shimmer" />)}
            </div>
          ) : recent.length === 0 ? (
            <p className="px-5 pb-5 text-sm" style={{ color: 'var(--text-muted)' }}>No prices yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Crop', 'Price (TZS/kg)', 'Location', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                    className="transition-colors hover:bg-[var(--surface-2)]">
                    <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text)' }}>{r.crop_name}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--primary)' }}>{r.price_per_kg.toLocaleString()}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--text-muted)' }}>{r.market_location}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>{r.recorded_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
