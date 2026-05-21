'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sprout, AlertCircle, Mail } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function RegisterPage() {
  const router = useRouter()
  const { t, lang, setLang } = useLanguage()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) { setError(t.auth.passwordTooShort); setLoading(false); return }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName, location },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) { setError(error.message); setLoading(false); return }

    if (data.session && data.user) {
      // Email confirmation disabled — create profile immediately
      await supabase.from('profiles').upsert({
        id: data.user.id,
        role: 'farmer',
        full_name: fullName,
        location,
        email,
      })
      router.push('/dashboard')
      router.refresh()
      return
    }

    // Email confirmation required — store metadata for when they confirm
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        role: 'farmer',
        full_name: fullName,
        location,
        email,
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, var(--sidebar) 0%, #0a1a0f 100%)' }}>
        <motion.div className="w-full max-w-sm rounded-2xl p-8 shadow-2xl text-center"
          style={{ backgroundColor: 'var(--surface)' }}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <motion.div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(42,92,63,0.12)' }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}>
            <Mail className="h-8 w-8" style={{ color: 'var(--primary)' }} />
          </motion.div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>{t.auth.successTitle}</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{t.auth.successDesc}</p>
          <Link href="/login"><Button className="w-full">{t.auth.continueToLogin}</Button></Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, var(--sidebar) 0%, #0a1a0f 100%)' }}>

      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button onClick={() => setLang(lang === 'sw' ? 'en' : 'sw')}
          className="text-xs font-medium text-white/60 hover:text-white px-2 py-1 rounded transition-colors">
          {lang === 'sw' ? 'EN' : 'SW'}
        </button>
        <ThemeToggle />
      </div>

      <motion.div className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <div className="rounded-2xl p-4 mb-4 cursor-pointer" style={{ backgroundColor: 'var(--primary)' }}>
              <Sprout className="h-9 w-9 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">{t.nav.appName}</h1>
          <p className="text-white/50 mt-1 text-sm">{t.nav.appTagline}</p>
        </div>

        <div className="rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: 'var(--surface)' }}>
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>{t.auth.registerTitle}</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{t.auth.registerSubtitle}</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t.auth.fullName}</Label>
              <Input id="name" placeholder={t.auth.namePlaceholder}
                value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">{t.auth.location}</Label>
              <Input id="location" placeholder={t.auth.locationPlaceholder}
                value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input id="email" type="email" placeholder={t.auth.emailPlaceholder}
                value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t.auth.passwordHint}</Label>
              <Input id="password" type="password" placeholder={t.auth.passwordPlaceholder}
                value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm"
                style={{ backgroundColor: 'rgba(185,28,28,0.08)', color: 'var(--danger)', border: '1px solid rgba(185,28,28,0.2)' }}>
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.auth.registering : t.auth.register}
            </Button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
            {t.auth.haveAccount}{' '}
            <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--primary)' }}>
              {t.auth.loginHere}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
