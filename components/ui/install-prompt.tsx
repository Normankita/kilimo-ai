'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sprout, X, Download } from 'lucide-react'

const DISMISSED_KEY = 'kilimo_install_dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(DISMISSED_KEY)) return

    function handler(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    sessionStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-20 md:bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
            style={{ backgroundColor: '#2a5c3f', color: 'white' }}
          >
            <div className="shrink-0 w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Sprout className="h-5 w-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Sakinisha Kilimo AI</p>
              <p className="text-xs text-white/70 mt-0.5 leading-tight">Pakua kwenye simu yako bila malipo</p>
            </div>

            <button
              onClick={handleInstall}
              className="shrink-0 flex items-center gap-1.5 bg-white text-[#2a5c3f] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Sakinisha
            </button>

            <button
              onClick={handleDismiss}
              className="shrink-0 p-1 text-white/60 hover:text-white transition-colors"
              aria-label="Funga"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
