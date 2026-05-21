'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { fetchOrCreateProfile, roleRedirectPath } from '@/lib/profile'
import { useLanguage } from '@/lib/language-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sprout, AlertCircle, Mail } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

type ErrorType = 'credentials' | 'unconfirmed' | 'generic' | null

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { t, lang, setLang } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorType, setErrorType] = useState<ErrorType>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorType(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('not confirmed') || msg.includes('email_not_confirmed')) setErrorType('unconfirmed')
      else if (msg.includes('invalid') || msg.includes('credentials')) setErrorType('credentials')
      else setErrorType('generic')
      setLoading(false)
      return
    }

    if (data.user) {
      const profile = await fetchOrCreateProfile(data.user.id, {
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name,
        location: data.user.user_metadata?.location,
      })
      router.push(profile ? roleRedirectPath(profile.role) : '/dashboard')
      router.refresh()
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleResend() {
    setResending(true)
    const supabase = createClient()
    await supabase.auth.resend({ type: 'signup', email })
    setResent(true)
    setResending(false)
  }

  const errorMsg =
    errorType === 'credentials' ? t.auth.wrongCredentials :
    errorType === 'unconfirmed' ? t.auth.emailNotConfirmed :
    errorType === 'generic'     ? t.auth.wrongCredentials : null

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
            <motion.div className="rounded-2xl p-4 mb-4 cursor-pointer"
              style={{ backgroundColor: 'var(--primary)' }} whileHover={{ scale: 1.05 }}>
              <Sprout className="h-9 w-9 text-white" />
            </motion.div>
          </Link>
          <h1 className="text-2xl font-bold text-white">{t.nav.appName}</h1>
          <p className="text-white/50 mt-1 text-sm">{t.nav.appTagline}</p>
        </div>

        <div className="rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: 'var(--surface)' }}>
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>{t.auth.formTitle}</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{t.auth.formSubtitle}</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input id="email" type="email" placeholder={t.auth.emailPlaceholder}
                value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t.auth.password}</Label>
                <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: 'var(--primary)' }}>
                  {t.auth.forgotPassword}
                </Link>
              </div>
              <Input id="password" type="password" placeholder={t.auth.passwordPlaceholder}
                value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>

            {errorMsg && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-lg px-3 py-2.5 text-sm"
                style={{ backgroundColor: 'rgba(185,28,28,0.08)', color: 'var(--danger)', border: '1px solid rgba(185,28,28,0.2)' }}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
                {errorType === 'unconfirmed' && !resent && (
                  <button type="button" onClick={handleResend} disabled={resending || !email}
                    className="mt-2 flex items-center gap-1.5 text-xs font-medium underline"
                    style={{ color: 'var(--primary)' }}>
                    <Mail className="h-3 w-3" />
                    {resending ? t.auth.sending : t.auth.resendConfirmation}
                  </button>
                )}
                {resent && <p className="mt-1.5 text-xs" style={{ color: 'var(--primary)' }}>✓ {t.auth.resetSent}</p>}
              </motion.div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.auth.loggingIn : t.auth.login}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>au</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 h-10 rounded-lg border text-sm font-medium transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60"
            style={{ borderColor: 'var(--border)', color: 'var(--text)', backgroundColor: 'var(--surface)' }}>
            <GoogleIcon />
            {googleLoading
              ? (lang === 'sw' ? 'Inaelekeza...' : 'Redirecting...')
              : (lang === 'sw' ? 'Ingia na Google' : 'Continue with Google')}
          </button>

          <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
            {t.auth.noAccount}{' '}
            <Link href="/register" className="font-medium hover:underline" style={{ color: 'var(--primary)' }}>
              {t.auth.registerHere}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
