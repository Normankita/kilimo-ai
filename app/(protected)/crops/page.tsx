'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/language-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Droplets, Calendar, Bug, BarChart3, Thermometer, Lightbulb } from 'lucide-react'

const CROPS = [
  {
    name: 'Mahindi', nameEn: 'Maize', emoji: '🌽',
    season: { sw: 'Masika (Machi–Juni) na Vuli (Okt–Jan)', en: 'Long rains (Mar–Jun) & short rains (Oct–Jan)' },
    water: { sw: 'Wastani, mm 500–800 kwa msimu', en: 'Moderate, 500–800 mm per season' },
    temp: '18–30°C',
    yield: { sw: '2–4 t/ha (kawaida) | 6–8 t/ha (na mbolea)', en: '2–4 t/ha (basic) | 6–8 t/ha (with fertiliser)' },
    diseases: ['Maize streak', 'Rust (Kutu)', 'Smut', 'Fall armyworm'],
    tips: {
      sw: 'Panda mbegu bora. Weka DAP wakati wa kupanda, urea wiki 4–6 baadaye.',
      en: 'Use certified seeds. Apply DAP at planting, urea at 4–6 weeks.',
    },
    accent: '#2a5c3f',
  },
  {
    name: 'Mchele', nameEn: 'Rice', emoji: '🌾',
    season: { sw: 'Masika (Machi–Agosti), unahitaji mvua nyingi', en: 'Rainy season (Mar–Aug), needs heavy rain' },
    water: { sw: 'Nyingi, mm 1000–2000 au umwagiliaji', en: 'Heavy, 1000–2000 mm or irrigation needed' },
    temp: '20–35°C',
    yield: { sw: '2–3 t/ha (mvua) | 4–6 t/ha (umwagiliaji)', en: '2–3 t/ha (rain-fed) | 4–6 t/ha (irrigated)' },
    diseases: ['Rice blast', 'Sheath blight', 'Leaf rust'],
    tips: {
      sw: 'Panda katika safu cm 20×20. Punguza maji wiki 2 kabla ya kuvuna.',
      en: 'Plant in rows 20×20 cm. Reduce water 2 weeks before harvest.',
    },
    accent: '#2a5878',
  },
  {
    name: 'Nyanya', nameEn: 'Tomatoes', emoji: '🍅',
    season: { sw: 'Mwaka mzima (bora hali kavu na umwagiliaji)', en: 'Year-round (best in dry season with irrigation)' },
    water: { sw: 'Wastani–nyingi; umwagiliaji mara kwa mara', en: 'Moderate–heavy; regular irrigation' },
    temp: '18–27°C',
    yield: { sw: '15–25 t/ha', en: '15–25 t/ha' },
    diseases: ['Early blight', 'Late blight', 'Fusarium wilt', 'Leaf miner'],
    tips: {
      sw: 'Tumia mbegu zilizothibitishwa. Funga mimea kwa nguzo. Dawa mapema.',
      en: 'Use certified seeds. Stake plants for support. Start pest control early.',
    },
    accent: '#7c2020',
  },
  {
    name: 'Maharage', nameEn: 'Beans', emoji: '🫘',
    season: { sw: 'Masika na Vuli, fuata mvua', en: 'Both rainy seasons, follow the rains' },
    water: { sw: 'Kidogo–wastani, mm 300–500 kwa msimu', en: 'Low–moderate, 300–500 mm per season' },
    temp: '16–24°C',
    yield: { sw: '0.8–1.5 t/ha', en: '0.8–1.5 t/ha' },
    diseases: ['Angular leaf spot', 'Bean rust', 'Bacterial blight', 'Aphids'],
    tips: {
      sw: 'Zungushia mazao kila msimu. Vuna mapema ili mbegu zisiote.',
      en: 'Rotate crops each season. Harvest early to prevent seed sprouting.',
    },
    accent: '#5a4010',
  },
  {
    name: 'Vitunguu', nameEn: 'Onions', emoji: '🧅',
    season: { sw: 'Hali kavu (Juni–Novemba), ukanda kame bora', en: 'Dry season (Jun–Nov), arid zones best' },
    water: { sw: 'Kidogo, mm 350–500, umwagiliaji kidogo', en: 'Low, 350–500 mm, light irrigation' },
    temp: '13–24°C',
    yield: { sw: '10–20 t/ha', en: '10–20 t/ha' },
    diseases: ['Purple blotch', 'Downy mildew', 'Thrips'],
    tips: {
      sw: 'Usimwagilie kupita kiasi, vitunguu vinaoza. Vuna vikisalia nje.',
      en: "Don't overwater, bulbs rot easily. Harvest when tops fall over.",
    },
    accent: '#4a2a6e',
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.3 },
  }),
}

export default function CropsPage() {
  const { t, lang } = useLanguage()

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{t.crops.title}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t.crops.subtitle}</p>
      </motion.div>

      <div className="space-y-4">
        {CROPS.map((crop, i) => (
          <motion.div
            key={crop.name}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="overflow-hidden">
              {/* Accent stripe */}
              <div className="h-1 w-full" style={{ backgroundColor: crop.accent }} />

              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-base">
                  <span className="text-2xl">{crop.emoji}</span>
                  <div>
                    <span style={{ color: 'var(--text)' }}>{lang === 'sw' ? crop.name : crop.nameEn}</span>
                    <span className="text-xs font-normal ml-2" style={{ color: 'var(--text-muted)' }}>
                      {lang === 'sw' ? crop.nameEn : crop.name}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon={<Calendar className="h-4 w-4 text-emerald-600" />} label={t.crops.season} value={crop.season[lang]} />
                  <InfoRow icon={<Droplets className="h-4 w-4 text-blue-500" />} label={t.crops.water} value={crop.water[lang]} />
                  <InfoRow icon={<Thermometer className="h-4 w-4 text-orange-500" />} label={t.crops.temperature} value={crop.temp} />
                  <InfoRow icon={<BarChart3 className="h-4 w-4 text-violet-500" />} label={t.crops.yield} value={crop.yield[lang]} />
                </div>

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

                <div className="rounded-lg p-3 flex gap-2.5"
                  style={{ backgroundColor: 'var(--accent-bg)', border: '1px solid var(--border)' }}>
                  <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                  <div>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--accent)' }}>{t.crops.tips}</p>
                    <p className="text-sm" style={{ color: 'var(--text)' }}>{crop.tips[lang]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
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
