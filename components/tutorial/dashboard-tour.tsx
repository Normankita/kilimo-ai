'use client'

import { useEffect, useCallback } from 'react'
import { HelpCircle } from 'lucide-react'

const TOUR_KEY = 'kilimo_tour_completed'

const STEPS = [
  {
    popover: {
      title: 'Karibu Kilimo AI! 🌱',
      description: 'Hebu tukuonyeshe jinsi ya kutumia mfumo huu. Itachukua sekunde 30 tu.',
    },
  },
  {
    element: '#weather-widget',
    popover: {
      title: 'Hali ya Hewa',
      description: 'Hapa utaona hali ya hewa ya eneo lako kila siku.',
    },
  },
  {
    element: '#market-prices-widget',
    popover: {
      title: 'Bei za Masoko',
      description: 'Bei za mazao zilizosasishwa kutoka masoko mbalimbali Tanzania.',
    },
  },
  {
    element: '#ai-assistant-link',
    popover: {
      title: 'Msaidizi wa AI',
      description: 'Uliza maswali yoyote kuhusu kilimo kwa Kiswahili. AI itakusaidia.',
    },
  },
  {
    element: '#main-navigation',
    popover: {
      title: 'Menyu Kuu',
      description: 'Tumia menyu hii kupita kwenye sehemu zote za mfumo.',
      side: 'right' as const,
    },
  },
  {
    element: '#profile-avatar',
    popover: {
      title: 'Wasifu Wako',
      description: 'Bonyeza hapa kuweka picha yako na taarifa za shamba lako.',
      side: 'right' as const,
    },
  },
  {
    popover: {
      title: 'Uko Tayari! 🎉',
      description:
        'Sasa unajua jinsi ya kutumia Kilimo AI. Anza kwa kuuliza AI swali lako la kwanza la kilimo.',
      doneBtnText: 'Anza Sasa →',
    },
  },
]

export function DashboardTour() {
  const startTour = useCallback(async () => {
    const { driver } = await import('driver.js')

    const driverObj = driver({
      animate: true,
      overlayOpacity: 0.75,
      stagePadding: 10,
      allowClose: true,
      doneBtnText: 'Maliza',
      nextBtnText: 'Endelea →',
      prevBtnText: '← Rudi',
      showProgress: true,
      progressText: 'Hatua {{current}} ya {{total}}',
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_KEY, 'true')
        driverObj.destroy()
      },
      steps: STEPS,
    })

    driverObj.drive()
  }, [])

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY)
    if (!completed) {
      const timer = setTimeout(startTour, 1000)
      return () => clearTimeout(timer)
    }
  }, [startTour])

  return (
    <button
      onClick={startTour}
      title="Onyesha Mwongozo"
      className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
      style={{ backgroundColor: 'var(--primary)' }}
    >
      <HelpCircle className="h-5 w-5 text-white" />
    </button>
  )
}
