'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { createClient } from './supabase/client'

export interface SiteSettings {
  appName: string
  logoUrl: string | null
  accentColor: string
  heroSlideshowIntervalMs: number
  googleLoginEnabled: boolean
  emailLoginEnabled: boolean
  signupsEnabled: boolean
  passwordResetEnabled: boolean
}

// Mirrors the defaults in supabase/schema.sql's site_settings table, so the
// app looks and behaves the same before that migration has ever run.
const DEFAULT_SETTINGS: SiteSettings = {
  appName: 'Kilimo AI',
  logoUrl: null,
  accentColor: '#2a5c3f',
  heroSlideshowIntervalMs: 5000,
  googleLoginEnabled: true,
  emailLoginEnabled: true,
  signupsEnabled: true,
  passwordResetEnabled: true,
}

interface SiteSettingsContextType {
  settings: SiteSettings
  refresh: () => Promise<void>
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  refresh: async () => {},
})

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single()
    if (!data) return

    const next: SiteSettings = {
      appName: data.app_name ?? DEFAULT_SETTINGS.appName,
      logoUrl: data.logo_url ?? null,
      accentColor: data.accent_color ?? DEFAULT_SETTINGS.accentColor,
      heroSlideshowIntervalMs: data.hero_slideshow_interval_ms ?? DEFAULT_SETTINGS.heroSlideshowIntervalMs,
      googleLoginEnabled: data.google_login_enabled ?? true,
      emailLoginEnabled: data.email_login_enabled ?? true,
      signupsEnabled: data.signups_enabled ?? true,
      passwordResetEnabled: data.password_reset_enabled ?? true,
    }
    setSettings(next)
    document.documentElement.style.setProperty('--primary', next.accentColor)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <SiteSettingsContext.Provider value={{ settings, refresh }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
