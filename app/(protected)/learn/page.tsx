'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { Badge } from '@/components/ui/badge'
import { PlayCircle, ExternalLink, BookOpen } from 'lucide-react'

const SEED = [
  { id: 1, title: 'Jinsi ya Kupanda Mahindi Tanzania', description: 'Mwongozo kamili wa kupanda mahindi kwa wakulima wadogo, kuandaa shamba, kupanda, na kutunza.', video_url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', category: 'kupanda', crop_name: 'Mahindi', language: 'Kiswahili' },
  { id: 2, title: 'Umwagiliaji Bora kwa Mboga', description: 'Njia rahisi za kumwagilia mboga kwa matumizi ya maji kidogo lakini mavuno makubwa.', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', category: 'umwagiliaji', crop_name: 'Mboga', language: 'Kiswahili' },
  { id: 3, title: 'Magonjwa ya Nyanya na Jinsi ya Kuyatibu', description: 'Tambua magonjwa ya nyanya mapema na uchague dawa sahihi za asili na za duka.', video_url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', category: 'magonjwa', crop_name: 'Nyanya', language: 'Kiswahili' },
  { id: 4, title: 'Kulinda Mazao dhidi ya Wadudu', description: 'Mbinu za asili na za kisayansi za kupigana na viwavi, nzi, na wadudu wengine.', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', category: 'magonjwa', crop_name: 'Mazao Mengi', language: 'Kiswahili' },
  { id: 5, title: 'Mbolea Bora kwa Udongo wa Tanzania', description: 'Aina za mbolea, wakati wa kutumia, na kiasi kinachofaa kwa udongo wa Tanzania.', video_url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', category: 'kupanda', crop_name: 'Mazao Mengi', language: 'Kiswahili' },
]

const CATEGORY_META: Record<string, { label: string; labelEn: string; color: string }> = {
  all: { label: 'Zote', labelEn: 'All', color: 'var(--primary)' },
  kupanda: { label: 'Kupanda', labelEn: 'Planting', color: '#5a6e3a' },
  umwagiliaji: { label: 'Umwagiliaji', labelEn: 'Irrigation', color: '#2a5878' },
  magonjwa: { label: 'Magonjwa', labelEn: 'Diseases', color: '#7c2020' },
}

function getYouTubeId(url: string) {
  return url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? null
}

type VideoItem = typeof SEED[number]

export default function LearnPage() {
  const { t, lang } = useLanguage()
  const [content, setContent] = useState<VideoItem[]>(SEED)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('educational_content')
      .select('*')
      .order('id', { ascending: true })
      .then(({ data }) => { if (data?.length) setContent(data) })
  }, [])

  const filtered = activeCategory === 'all'
    ? content
    : content.filter(v => v.category === activeCategory)

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{t.learn.title}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t.learn.subtitle}</p>
      </motion.div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.entries(CATEGORY_META).map(([cat, meta]) => {
          const active = activeCategory === cat
          return (
            <motion.button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="shrink-0 text-sm font-medium px-4 py-1.5 rounded-full border transition-all"
              style={{
                backgroundColor: active ? meta.color : 'var(--surface)',
                color: active ? '#fff' : 'var(--text-muted)',
                borderColor: active ? meta.color : 'var(--border)',
              }}
              whileTap={{ scale: 0.95 }}
            >
              {lang === 'sw' ? meta.label : meta.labelEn}
            </motion.button>
          )
        })}
      </div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        layout
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((item) => {
            const ytId = getYouTubeId(item.video_url)
            const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null
            const catMeta = CATEGORY_META[item.category]

            return (
              <motion.a
                key={item.id}
                href={item.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl overflow-hidden border"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.22 }}
                whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <PlayCircle className="h-12 w-12" style={{ color: 'var(--border)' }} />
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-white/90 rounded-full p-3">
                      <PlayCircle className="h-8 w-8" style={{ color: catMeta?.color ?? 'var(--primary)' }} />
                    </div>
                  </div>
                  {/* Category chip */}
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: catMeta?.color ?? 'var(--primary)' }}>
                      {lang === 'sw' ? catMeta?.label : catMeta?.labelEn}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-semibold text-sm leading-snug group-hover:underline"
                      style={{ color: 'var(--text)' }}>
                      {item.title}
                    </h3>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
                  <p className="text-[10px] mt-2 font-medium" style={{ color: catMeta?.color ?? 'var(--primary)' }}>
                    {item.crop_name}
                  </p>
                </div>
              </motion.a>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p style={{ color: 'var(--text-muted)' }}>{t.learn.noContent}</p>
        </div>
      )}
    </div>
  )
}
