'use client'

import { useCallback } from 'react'
import { HelpCircle } from 'lucide-react'

const STEPS = [
  {
    element: '#assistant-messages',
    popover: {
      title: 'Eneo la Mazungumzo',
      description: 'Majibu ya AI yataonekana hapa. Unaweza kusogea juu kuona mazungumzo ya awali.',
    },
  },
  {
    element: '#assistant-chat-input',
    popover: {
      title: 'Andika Swali Lako',
      description: 'Andika swali lako hapa chini kwa Kiswahili au Kiingereza.',
    },
  },
  {
    element: '#assistant-send-button',
    popover: {
      title: 'Tuma Ujumbe',
      description: 'Bonyeza kitufe hiki kutuma ujumbe wako kwa AI.',
      doneBtnText: 'Nimeelewa! →',
    },
  },
]

export function AssistantTour() {
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
        driverObj.destroy()
      },
      steps: STEPS,
    })

    driverObj.drive()
  }, [])

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
