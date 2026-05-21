'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sprout, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, lang, setLang } = useLanguage()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [exchanging, setExchanging] = useState(true)
  const [exchangeError, setExchangeError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setExchangeError('Kiungo hiki si sahihi. Omba kiungo kipya.')
      setExchanging(false)
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) setExchangeError('Kiungo kimeisha muda wake. Omba kiungo kipya.')
        setExchanging(false)
      })
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) { setError(t.auth.passwordTooShort); return }
    if (password !== confirm) { setError(t.auth.passwordMismatch); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    }
  }

  return (
    <motion.div
      className="w-full max-w-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex flex-col items-center mb-8">
        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: 'var(--primary)' }}>
          <Sprout className="h-9 w-9 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t.nav.appName}</h1>
      </div>

      <div className="rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: 'var(--surface)' }}>
        {exchanging ? (
          <div className="text-center py-6">
            <div className="w-8 h-8 border-2 rounded-full border-t-transparent mx-auto animate-spin"
              style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
            <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>{t.common.loading}</p>
          </div>
        ) : exchangeError ? (
          <div className="text-center py-4">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{exchangeError}</p>
            <Link href="/forgot-password">
              <Button className="w-full">{t.auth.sendResetLink}</Button>
            </Link>
          </div>
        ) : done ? (
          <motion.div
            className="text-center py-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(42,92,63,0.1)' }}>
              <CheckCircle2 className="h-7 w-7" style={{ color: 'var(--primary)' }} />
            </div>
            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text)' }}>{t.auth.passwordUpdated}</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.auth.passwordUpdatedDesc}</p>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{t.auth.resetTitle}</h2>
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{t.auth.resetSubtitle}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">{t.auth.newPassword}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t.auth.passwordPlaceholder}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">{t.auth.confirmPassword}</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder={t.auth.passwordPlaceholder}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
                  style={{ backgroundColor: 'rgba(185,28,28,0.08)', color: 'var(--danger)', border: '1px solid rgba(185,28,28,0.2)' }}>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.auth.resetting : t.auth.resetPassword}
              </Button>
            </form>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default function ResetPasswordPage() {
  const { lang, setLang } = useLanguage()

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
      <Suspense fallback={<div className="text-white">{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
