'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const HEARTBEAT_INTERVAL_MS = 60 * 1000

export function PresenceHeartbeat() {
  useEffect(() => {
    const supabase = createClient()

    async function beat() {
      if (document.visibilityState !== 'visible') return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', user.id)
    }

    beat()
    const interval = setInterval(beat, HEARTBEAT_INTERVAL_MS)
    document.addEventListener('visibilitychange', beat)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', beat)
    }
  }, [])

  return null
}
