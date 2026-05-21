'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sprout, AlertCircle, Mail, ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function ForgotPasswordPage() {
  const { t, lang, setLang } = useLanguage()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
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
          {sent ? (
            <motion.div
              className="text-center py-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'rgba(42,92,63,0.1)' }}>
                <Mail className="h-7 w-7" style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text)' }}>{t.auth.resetSent}</h3>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{t.auth.resetSentDesc}</p>
              <Link href="/login">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {t.auth.backToLogin}
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>{t.auth.forgotTitle}</h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{t.auth.forgotSubtitle}</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t.auth.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t.auth.emailPlaceholder}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
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
                  {loading ? t.auth.sending : t.auth.sendResetLink}
                </Button>
              </form>

              <Link href="/login" className="mt-4 flex items-center justify-center gap-1.5 text-sm hover:underline"
                style={{ color: 'var(--text-muted)' }}>
                <ArrowLeft className="h-3.5 w-3.5" />
                {t.auth.backToLogin}
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
