'use client'

// Run this in Supabase SQL Editor (adds phone_number column):
// alter table profiles add column if not exists phone_number text;

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Camera, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

const TZ_REGIONS = [
  'Dar es Salaam', 'Arusha', 'Dodoma', 'Mbeya', 'Morogoro', 'Mwanza',
  'Kilimanjaro', 'Tanga', 'Iringa', 'Rukwa', 'Kagera', 'Mara', 'Lindi',
  'Ruvuma', 'Shinyanga', 'Singida', 'Tabora', 'Kigoma', 'Pwani', 'Geita',
  'Katavi', 'Njombe', 'Simiyu', 'Songwe', 'Kaskazini Unguja', 'Kusini Unguja',
]

const ROLE_LABEL: Record<string, string> = {
  farmer: 'Mkulima',
  admin: 'Msimamizi',
  super_admin: 'Msimamizi Mkuu',
}

const ROLE_VARIANT: Record<string, 'success' | 'secondary' | 'outline'> = {
  farmer: 'success',
  admin: 'secondary',
  super_admin: 'outline',
}

interface ProfileForm {
  full_name: string
  phone_number: string
  location: string
  farm_location: string
  bio: string
  preferred_language: string
}

const BLANK: ProfileForm = {
  full_name: '', phone_number: '', location: '',
  farm_location: '', bio: '', preferred_language: 'sw',
}

function pwdStrength(pwd: string) {
  if (!pwd) return null
  const score = [
    pwd.length >= 8, /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^A-Za-z0-9]/.test(pwd),
  ].filter(Boolean).length
  if (score <= 1) return { label: 'Dhaifu', color: '#ef4444', w: '28%' }
  if (score <= 2) return { label: 'Wastani', color: '#f59e0b', w: '60%' }
  return { label: 'Imara', color: '#22c55e', w: '100%' }
}

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

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [uid, setUid] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [role, setRole] = useState('farmer')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [form, setForm] = useState<ProfileForm>(BLANK)
  const [saved, setSaved] = useState<ProfileForm>(BLANK)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)

  const [currPwd, setCurrPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurr, setShowCurr] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)

  const [googleLinked, setGoogleLinked] = useState(false)
  const [linkingGoogle, setLinkingGoogle] = useState(false)

  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  const dirty = (Object.keys(BLANK) as (keyof ProfileForm)[]).some(
    k => form[k] !== saved[k]
  )

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setUid(user.id)
      setEmail(user.email ?? null)
      setGoogleLinked(user.identities?.some(i => i.provider === 'google') ?? false)

      const { data: p } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (p) {
        setRole(p.role ?? 'farmer')
        setAvatarUrl(p.avatar_url ?? '')
        const f: ProfileForm = {
          full_name: p.full_name ?? '',
          phone_number: p.phone_number ?? '',
          location: p.location ?? '',
          farm_location: p.farm_location ?? '',
          bio: p.bio ?? '',
          preferred_language: p.preferred_language ?? 'sw',
        }
        setForm(f)
        setSaved(f)
      }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault()
        e.returnValue = 'Una mabadiliko ambayo hayajahifadhiwa. Endelea?'
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  function f(k: keyof ProfileForm, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function handleSave() {
    if (!form.full_name.trim()) { toast.error('Jina kamili linahitajika'); return }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        phone_number: form.phone_number,
        location: form.location,
        farm_location: form.farm_location,
        bio: form.bio,
        preferred_language: form.preferred_language,
      })
      .eq('id', uid!)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Mabadiliko yamehifadhiwa!')
      setSaved({ ...form })
    }
    setSaving(false)
  }

  async function handleAvatar(file: File) {
    if (file.size > 2 * 1024 * 1024) { toast.error('Picha lazima iwe chini ya 2MB'); return }
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) { toast.error('Tumia JPG au PNG tu'); return }

    setUploading(true)
    setUploadPct(15)
    const tick = setInterval(() => setUploadPct(p => Math.min(p + 15, 85)), 300)

    const path = `${uid}/avatar.jpg`
    const { error } = await supabase.storage.from('avatars')
      .upload(path, file, { upsert: true, contentType: 'image/jpeg' })

    clearInterval(tick)

    if (error) {
      toast.error('Hitilafu ya kupakia picha: ' + error.message)
      setUploading(false)
      setUploadPct(0)
      return
    }

    setUploadPct(100)
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = `${publicUrl}?v=${Date.now()}`
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', uid!)
    setAvatarUrl(url)
    toast.success('Picha ya wasifu imesasishwa!')
    setTimeout(() => { setUploading(false); setUploadPct(0) }, 700)
  }

  async function handlePasswordChange() {
    if (!currPwd) { toast.error('Weka nywila yako ya sasa'); return }
    if (newPwd.length < 6) { toast.error('Nywila mpya lazima iwe na herufi 6 au zaidi'); return }
    if (newPwd !== confirmPwd) { toast.error('Nywila mpya hazilingani'); return }
    setChangingPwd(true)

    if (email) {
      const { error: re } = await supabase.auth.signInWithPassword({ email, password: currPwd })
      if (re) { toast.error('Nywila ya sasa si sahihi'); setChangingPwd(false); return }
    }

    const { error } = await supabase.auth.updateUser({ password: newPwd })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Nywila imebadilishwa kikamilifu!')
      setCurrPwd(''); setNewPwd(''); setConfirmPwd('')
    }
    setChangingPwd(false)
  }

  async function handleLinkGoogle() {
    setLinkingGoogle(true)
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { toast.error(error.message); setLinkingGoogle(false) }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    const res = await fetch('/api/delete-account', { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? 'Hitilafu ya kufuta akaunti')
      setDeleting(false)
      return
    }
    await supabase.auth.signOut()
    router.push('/')
  }

  const strength = pwdStrength(newPwd)

  if (loading) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-xl shimmer" />)}
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-8">
      {/* Unsaved changes banner */}
      {dirty && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{ backgroundColor: 'rgba(42,92,63,0.1)', border: '1px solid rgba(42,92,63,0.3)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
            Kuna mabadiliko ambayo hayajahifadhiwa
          </p>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Inahifadhi...' : 'Hifadhi Sasa'}
          </Button>
        </motion.div>
      )}

      {/* ── Card 1: Profile Info ─────────────────────────────── */}
      <Card>
        <div className="p-5 space-y-6">
          {/* Avatar section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => !uploading && fileRef.current?.click()}>
              <div className="h-28 w-28 rounded-full overflow-hidden"
                style={{ outline: '3px solid var(--border)', outlineOffset: '3px' }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-white"
                    style={{ backgroundColor: 'var(--primary)' }}>
                    {(form.full_name || email || '?')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-full flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
                style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}>
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>

            <input ref={fileRef} type="file" className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleAvatar(file)
                e.target.value = ''
              }} />

            {uploading && (
              <div className="w-40 space-y-1.5">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: 'var(--primary)' }}
                    animate={{ width: `${uploadPct}%` }} transition={{ duration: 0.3 }} />
                </div>
                <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                  {uploadPct < 100 ? `Inapakia... ${uploadPct}%` : '✓ Imekamilika'}
                </p>
              </div>
            )}

            <div className="text-center">
              <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
                {form.full_name || '—'}
              </p>
              <Badge variant={ROLE_VARIANT[role] ?? 'outline'} className="mt-1.5">
                {ROLE_LABEL[role] ?? role}
              </Badge>
              {email && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{email}</p>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Jina Kamili *</Label>
              <Input value={form.full_name} onChange={e => f('full_name', e.target.value)}
                placeholder="Jina na Ukoo" />
            </div>

            <div className="space-y-1.5">
              <Label>Namba ya Simu</Label>
              <Input value={form.phone_number} onChange={e => f('phone_number', e.target.value)}
                placeholder="+255 7XX XXX XXX" type="tel" />
            </div>

            <div className="space-y-1.5">
              <Label>Mkoa</Label>
              <select
                value={form.location}
                onChange={e => f('location', e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-sm"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: form.location ? 'var(--text)' : 'var(--text-muted)',
                }}>
                <option value="">Chagua Mkoa...</option>
                {TZ_REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Mahali pa Shamba</Label>
              <Input value={form.farm_location} onChange={e => f('farm_location', e.target.value)}
                placeholder="Mfano: Kilosa, Morogoro" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Maelezo Mafupi</Label>
                <span className="text-xs" style={{ color: form.bio.length > 180 ? '#ef4444' : 'var(--text-muted)' }}>
                  {form.bio.length}/200
                </span>
              </div>
              <textarea
                value={form.bio}
                onChange={e => f('bio', e.target.value.slice(0, 200))}
                placeholder="Eleza kidogo kuhusu wewe na shamba lako..."
                rows={3}
                maxLength={200}
                className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </div>

            <div className="space-y-1.5">
              <Label>Lugha Inayopendelewa</Label>
              <div className="grid grid-cols-2 rounded-lg overflow-hidden border"
                style={{ borderColor: 'var(--border)' }}>
                {[{ v: 'sw', l: 'Kiswahili' }, { v: 'en', l: 'English' }].map(({ v, l }) => (
                  <button key={v} type="button" onClick={() => f('preferred_language', v)}
                    className="py-2.5 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: form.preferred_language === v ? 'var(--primary)' : 'var(--surface)',
                      color: form.preferred_language === v ? 'white' : 'var(--text-muted)',
                    }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving || !dirty}>
              {saving ? 'Inahifadhi...' : 'Hifadhi Mabadiliko'}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Card 2: Security ─────────────────────────────────── */}
      <Card>
        <div className="p-5 space-y-6">
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Usalama</h2>

          {/* Change password */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Badilisha Nywila
            </p>

            <div className="space-y-1.5">
              <Label>Nywila ya Sasa</Label>
              <div className="relative">
                <Input type={showCurr ? 'text' : 'password'} value={currPwd}
                  onChange={e => setCurrPwd(e.target.value)} placeholder="••••••••" className="pr-10" />
                <button type="button" onClick={() => setShowCurr(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showCurr ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Nywila Mpya</Label>
              <div className="relative">
                <Input type={showNew ? 'text' : 'password'} value={newPwd}
                  onChange={e => setNewPwd(e.target.value)} placeholder="••••••••" className="pr-10" />
                <button type="button" onClick={() => setShowNew(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {strength && (
                <div className="space-y-1 pt-0.5">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: strength.color }}
                      animate={{ width: strength.w }} transition={{ duration: 0.3 }} />
                  </div>
                  <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Thibitisha Nywila Mpya</Label>
              <Input type="password" value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)} placeholder="••••••••" />
              {confirmPwd && newPwd !== confirmPwd && (
                <p className="text-xs text-red-500">Nywila hazilingani</p>
              )}
            </div>

            <Button variant="outline" className="w-full" onClick={handlePasswordChange} disabled={changingPwd}>
              {changingPwd ? 'Inabadilisha...' : 'Badilisha Nywila'}
            </Button>
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* Connected accounts */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Akaunti Zilizounganishwa
            </p>

            <div className="flex items-center justify-between rounded-lg px-3.5 py-3 border"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: 'var(--primary)' }}>
                  @
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Barua Pepe</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{email}</p>
                </div>
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>Imesajiliwa</span>
            </div>

            <div className="flex items-center justify-between rounded-lg px-3.5 py-3 border"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--border)' }}>
                  <GoogleIcon />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Google</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {googleLinked ? 'Imeunganishwa' : 'Haijaungansishwa'}
                  </p>
                </div>
              </div>
              {googleLinked ? (
                <div className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--primary)' }}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Imeunganishwa
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={handleLinkGoogle} disabled={linkingGoogle}>
                  {linkingGoogle ? '...' : 'Unganisha'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Card 3: Danger Zone ──────────────────────────────── */}
      <div className="rounded-xl p-5 space-y-3"
        style={{ border: '2px solid rgba(239,68,68,0.35)', backgroundColor: 'var(--surface)' }}>
        <div>
          <h2 className="font-semibold text-red-500">Eneo la Hatari</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Vitendo hivi haviwezi kubatilishwa. Kuwa makini sana.
          </p>
        </div>
        <Button variant="outline"
          className="border-red-400 text-red-500 hover:bg-red-50"
          onClick={() => { setDeleteModal(true); setDeleteInput('') }}>
          Futa Akaunti
        </Button>
      </div>

      {/* Delete modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Futa Akaunti">
        <div className="space-y-4">
          <div className="rounded-lg p-3"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              <strong>Onyo:</strong> Kufuta akaunti yako kutaondoa data yako yote — mazungumzo, mapendeleo, na taarifa za wasifu. Kitendo hiki hakiwezi kubatilishwa.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Andika <strong>FUTA</strong> kuthibitisha</Label>
            <Input value={deleteInput}
              onChange={e => setDeleteInput(e.target.value.toUpperCase())}
              placeholder="FUTA" className="font-mono tracking-widest text-center" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteModal(false)}>
              Ghairi
            </Button>
            <button
              disabled={deleteInput !== 'FUTA' || deleting}
              onClick={handleDeleteAccount}
              className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
              style={{ backgroundColor: '#dc2626' }}>
              {deleting ? 'Inafuta...' : 'Futa Akaunti'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
