'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Users, Sprout, Zap, Play } from 'lucide-react'

const STEPS = [
  {
    icon: Users,
    color: '#2d5a27',
    bg: '#edf4ef',
    num: '01',
    title: 'Jiandikishe',
    emoji: '👤',
    description:
      'Fungua akaunti yako ya bure kwa dakika chache. Jaza jina lako, eneo lako la Tanzania, na mazao unayolima.',
  },
  {
    icon: Sprout,
    color: '#1c6a9e',
    bg: '#e8f3fb',
    num: '02',
    title: 'Weka Shamba Lako',
    emoji: '🌱',
    description:
      'Ongeza taarifa za shamba lako, eneo, mazao, na hali ya udongo. Hii itasaidia AI kukupa ushauri unaofaa.',
  },
  {
    icon: Zap,
    color: '#7c5c14',
    bg: '#fdf6e3',
    num: '03',
    title: 'Pata Msaada',
    emoji: '🤖',
    description:
      'Uliza maswali yoyote kuhusu kilimo kwa Kiswahili. AI itakupa jibu la haraka kulingana na eneo na mazao yako.',
  },
]

export function LandingWalkthroughModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  function close() {
    setOpen(false)
    setTimeout(() => setStep(0), 300)
  }

  const current = STEPS[step]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--surface-2)',
        }}
      >
        <Play className="h-3 w-3 shrink-0" style={{ color: 'var(--primary)' }} />
        Jinsi Inavyofanya Kazi
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                className="relative w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl pointer-events-auto"
                style={{ backgroundColor: 'var(--surface)' }}
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              >
                {/* Close */}
                <button
                  onClick={close}
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-2)' }}
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Illustration area */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div
                      className="flex flex-col items-center justify-center py-10 px-6"
                      style={{ backgroundColor: current.bg }}
                    >
                      <div className="text-6xl mb-4 select-none">{current.emoji}</div>
                      <span
                        className="text-xs font-bold px-3 py-1 rounded-full text-white"
                        style={{ backgroundColor: current.color }}
                      >
                        Hatua {current.num}
                      </span>
                    </div>

                    <div className="px-6 pt-5 pb-2">
                      <h3
                        className="text-lg font-bold mb-2"
                        style={{ color: 'var(--text)' }}
                      >
                        {current.title}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {current.description}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Dot indicators */}
                <div className="flex justify-center gap-1.5 py-3">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      className="rounded-full transition-all duration-200"
                      style={{
                        width: i === step ? '20px' : '8px',
                        height: '8px',
                        backgroundColor:
                          i === step ? 'var(--primary)' : 'var(--border)',
                      }}
                    />
                  ))}
                </div>

                {/* Footer nav */}
                <div
                  className="flex items-center justify-between px-6 py-4 border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <button
                    onClick={close}
                    className="text-xs transition-colors hover:underline"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Ruka
                  </button>

                  <div className="flex items-center gap-2">
                    {step > 0 && (
                      <button
                        onClick={() => setStep(s => s - 1)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors"
                        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Rudi
                      </button>
                    )}
                    {step < STEPS.length - 1 ? (
                      <button
                        onClick={() => setStep(s => s + 1)}
                        className="flex items-center gap-1 text-xs px-4 py-1.5 rounded-lg font-semibold text-white transition-all active:scale-[0.97]"
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        Endelea
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={close}
                        className="text-xs px-4 py-1.5 rounded-lg font-semibold text-white transition-all active:scale-[0.97]"
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        Anza Sasa →
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
