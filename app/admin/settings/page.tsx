'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSiteSettings } from '@/lib/site-settings-context'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImagePlus, ImageIcon, Palette, Clock, ShieldCheck, UserCog } from 'lucide-react'

interface FormState {
  app_name: string
  logo_url: string | null
  accent_color: string
  hero_slideshow_interval_s: number
  google_login_enabled: boolean
  email_login_enabled: boolean
  signups_enabled: boolean
  password_reset_enabled: boolean
  admin_can_edit_users: boolean
  admin_can_change_roles: boolean
  admin_can_toggle_active: boolean
  admin_can_reset_passwords: boolean
  admin_can_delete_users: boolean
  admin_can_view_audit_log: boolean
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200"
        style={{ backgroundColor: checked ? 'var(--primary)' : 'var(--border)' }}
      >
        <span
          className="h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0px)' }}
        />
      </button>
    </div>
  )
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const { refresh } = useSiteSettings()
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: viewer } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (viewer?.role !== 'super_admin') {
        router.replace('/admin')
        return
      }
      setAuthorized(true)
      setChecking(false)

      const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single()
      if (data) {
        setForm({
          app_name: data.app_name,
          logo_url: data.logo_url,
          accent_color: data.accent_color,
          hero_slideshow_interval_s: Math.round(data.hero_slideshow_interval_ms / 1000),
          google_login_enabled: data.google_login_enabled,
          email_login_enabled: data.email_login_enabled,
          signups_enabled: data.signups_enabled,
          password_reset_enabled: data.password_reset_enabled,
          admin_can_edit_users: data.admin_can_edit_users,
          admin_can_change_roles: data.admin_can_change_roles,
          admin_can_toggle_active: data.admin_can_toggle_active,
          admin_can_reset_passwords: data.admin_can_reset_passwords,
          admin_can_delete_users: data.admin_can_delete_users,
          admin_can_view_audit_log: data.admin_can_view_audit_log,
        })
      }
      setLoading(false)
    }
    init()
  }, [])

  async function handleLogoUpload(file: File) {
    if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3MB'); return }
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) { toast.error('Use a JPEG, PNG, or WebP image'); return }

    setUploadingLogo(true)
    const path = `settings/logo-${Date.now()}.jpg`
    const { error } = await supabase.storage.from('site-media')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (error) {
      toast.error('Upload failed: ' + error.message)
      setUploadingLogo(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('site-media').getPublicUrl(path)
    setForm(f => f ? { ...f, logo_url: publicUrl } : f)
    setUploadingLogo(false)
  }

  async function handleSave() {
    if (!form) return
    if (!form.app_name.trim()) { toast.error('App name is required'); return }
    if (!form.google_login_enabled && !form.email_login_enabled) {
      toast.error('At least one login method must stay enabled')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('site_settings').update({
      app_name: form.app_name.trim(),
      logo_url: form.logo_url,
      accent_color: form.accent_color,
      hero_slideshow_interval_ms: Math.max(2, form.hero_slideshow_interval_s) * 1000,
      google_login_enabled: form.google_login_enabled,
      email_login_enabled: form.email_login_enabled,
      signups_enabled: form.signups_enabled,
      password_reset_enabled: form.password_reset_enabled,
      admin_can_edit_users: form.admin_can_edit_users,
      admin_can_change_roles: form.admin_can_change_roles,
      admin_can_toggle_active: form.admin_can_toggle_active,
      admin_can_reset_passwords: form.admin_can_reset_passwords,
      admin_can_delete_users: form.admin_can_delete_users,
      admin_can_view_audit_log: form.admin_can_view_audit_log,
      updated_at: new Date().toISOString(),
    }).eq('id', 1)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Settings saved')
      await refresh()
    }
    setSaving(false)
  }

  if (checking) return null
  if (!authorized) return null

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <ShieldCheck className="h-5 w-5" style={{ color: 'var(--primary)' }} />
          Site Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          App-wide configuration — visible to super_admin only
        </p>
      </div>

      {loading || !form ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3].map(i => <div key={i} className="h-56 rounded-xl shimmer" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {/* Left column */}
            <div className="space-y-5">
              {/* Branding */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                    Branding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>App Name</Label>
                    <Input value={form.app_name} onChange={e => setForm(f => f && { ...f, app_name: e.target.value })} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Logo</Label>
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        {form.logo_url
                          ? <img src={form.logo_url} alt="" className="h-full w-full object-cover" />
                          : <ImageIcon className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                        }
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={e => { const file = e.target.files?.[0]; if (file) handleLogoUpload(file) }}
                      />
                      <Button type="button" variant="outline" size="sm" className="gap-1.5"
                        onClick={() => fileRef.current?.click()} disabled={uploadingLogo}>
                        <ImagePlus className="h-3.5 w-3.5" />
                        {uploadingLogo ? 'Uploading...' : form.logo_url ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                      {form.logo_url && (
                        <button type="button" onClick={() => setForm(f => f && { ...f, logo_url: null })}
                          className="text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" /> Accent Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={form.accent_color}
                        onChange={e => setForm(f => f && { ...f, accent_color: e.target.value })}
                        className="h-10 w-14 rounded-lg border cursor-pointer" style={{ borderColor: 'var(--border)' }} />
                      <Input value={form.accent_color} onChange={e => setForm(f => f && { ...f, accent_color: e.target.value })} placeholder="#2a5c3f" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Landing page */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                    Landing Page
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    <Label>Hero Slideshow Interval (seconds)</Label>
                    <Input type="number" min={2} value={form.hero_slideshow_interval_s}
                      onChange={e => setForm(f => f && { ...f, hero_slideshow_interval_s: Number(e.target.value) })} />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      How long each branding photo shows before crossfading to the next, on the public landing page.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                    Authentication
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  <Toggle
                    checked={form.google_login_enabled}
                    onChange={v => setForm(f => f && { ...f, google_login_enabled: v })}
                    label="Google Login"
                    description="Show the 'Continue with Google' option on login/register"
                  />
                  <Toggle
                    checked={form.email_login_enabled}
                    onChange={v => setForm(f => f && { ...f, email_login_enabled: v })}
                    label="Email/Password Login"
                    description="Show the email and password form on login/register"
                  />
                  <Toggle
                    checked={form.signups_enabled}
                    onChange={v => setForm(f => f && { ...f, signups_enabled: v })}
                    label="Allow New Signups"
                    description="Let new farmers register for an account"
                  />
                  <Toggle
                    checked={form.password_reset_enabled}
                    onChange={v => setForm(f => f && { ...f, password_reset_enabled: v })}
                    label="Allow Password Reset"
                    description="Let users request a password reset link"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserCog className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                    Admin Permissions
                  </CardTitle>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    What a plain admin may do on the Users page. Super admins always have full access, regardless of these switches.
                  </p>
                </CardHeader>
                <CardContent className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  <Toggle
                    checked={form.admin_can_edit_users}
                    onChange={v => setForm(f => f && { ...f, admin_can_edit_users: v })}
                    label="Edit User Details"
                    description="Edit name, location, phone, farm location, bio"
                  />
                  <Toggle
                    checked={form.admin_can_change_roles}
                    onChange={v => setForm(f => f && { ...f, admin_can_change_roles: v })}
                    label="Change Roles"
                    description="Promote a farmer to admin or demote back"
                  />
                  <Toggle
                    checked={form.admin_can_toggle_active}
                    onChange={v => setForm(f => f && { ...f, admin_can_toggle_active: v })}
                    label="Activate/Deactivate Accounts"
                    description="Suspend or restore login access"
                  />
                  <Toggle
                    checked={form.admin_can_reset_passwords}
                    onChange={v => setForm(f => f && { ...f, admin_can_reset_passwords: v })}
                    label="Reset Passwords"
                    description="Send reset links or set a password directly"
                  />
                  <Toggle
                    checked={form.admin_can_delete_users}
                    onChange={v => setForm(f => f && { ...f, admin_can_delete_users: v })}
                    label="Delete Accounts"
                    description="Soft-delete accounts (only a super admin can restore one)"
                  />
                  <Toggle
                    checked={form.admin_can_view_audit_log}
                    onChange={v => setForm(f => f && { ...f, admin_can_view_audit_log: v })}
                    label="View Audit Log"
                    description="Off by default — grants access to the full action history"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
          </div>
        </>
      )}
    </div>
  )
}
