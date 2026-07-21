'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { Users, Search, Pencil, Ban, CheckCircle2, Mail, KeyRound, Circle, WifiOff, TrendingUp, Eye } from 'lucide-react'
import { canManageUser, type UserRole } from '@/lib/profile'
import { isOnline, formatRelativeTime } from '@/lib/utils'
import { UserGrowthChart } from '@/components/admin/user-growth-chart'
import { UserContactHoverCard } from '@/components/admin/user-contact-hover-card'
import { logAuditAction } from '@/lib/audit-log'

interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  email: string | null
  location: string | null
  phone_number: string | null
  farm_location: string | null
  bio: string | null
  avatar_url: string | null
  is_active: boolean
  last_active_at: string | null
  first_active_at: string | null
  created_at: string | null
}

const ROLE_COLORS: Record<string, 'success' | 'secondary' | 'destructive' | 'outline'> = {
  farmer: 'success',
  admin: 'secondary',
  super_admin: 'outline',
}

const BLANK_EDIT = { full_name: '', location: '', phone_number: '', farm_location: '', bio: '' }

export default function AdminUsersPage() {
  const [viewerRole, setViewerRole] = useState<UserRole | null>(null)
  const [viewerName, setViewerName] = useState<string | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [editing, setEditing] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState(BLANK_EDIT)
  const [saving, setSaving] = useState(false)

  const [viewingUser, setViewingUser] = useState<Profile | null>(null)

  const [deactivating, setDeactivating] = useState<Profile | null>(null)

  const [resettingFor, setResettingFor] = useState<Profile | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetSaving, setResetSaving] = useState(false)
  const [sendingLinkFor, setSendingLinkFor] = useState<string | null>(null)

  const supabase = createClient()

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id ?? null)
    if (!user) return

    const { data: viewer } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
    const role = (viewer?.role ?? 'farmer') as UserRole
    setViewerRole(role)
    setViewerName(viewer?.full_name ?? null)

    setLoading(true)
    let query = supabase
      .from('profiles')
      .select('id, role, full_name, email, location, phone_number, farm_location, bio, avatar_url, is_active, last_active_at, first_active_at, created_at')
      .order('created_at', { ascending: false })

    // Admins manage farmers and other admins, but a super_admin row should
    // never even surface in an admin's list — not just be uneditable.
    if (role === 'admin') query = query.neq('role', 'super_admin')

    const { data, error } = await query
    if (error) toast.error(error.message)
    else setUsers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(u =>
      (u.full_name ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.location ?? '').toLowerCase().includes(q)
    )
  }, [users, search])

  const roleCount = (role: string) => users.filter(u => u.role === role).length

  const statusCounts = useMemo(() => {
    const deactivated = users.filter(u => !u.is_active).length
    const activeNow = users.filter(u => u.is_active && isOnline(u.last_active_at)).length
    const offline = users.length - deactivated - activeNow
    return { activeNow, offline, deactivated }
  }, [users])

  function canManage(target: Profile) {
    if (!viewerRole || !currentUserId) return false
    return canManageUser(viewerRole, currentUserId, target)
  }

  function logUserAction(action: Parameters<typeof logAuditAction>[0]['action'], target: Profile, details?: Record<string, unknown>) {
    if (!currentUserId || !viewerRole) return
    logAuditAction({
      actorId: currentUserId,
      actorName: viewerName,
      actorRole: viewerRole,
      action,
      targetId: target.id,
      targetName: target.full_name ?? target.email,
      details,
    })
  }

  async function handleRoleChange(userId: string, newRole: string) {
    const target = users.find(u => u.id === userId)
    setUpdatingId(userId)
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Role updated')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as UserRole } : u))
      if (target) logUserAction('role_change', target, { from: target.role, to: newRole })
    }
    setUpdatingId(null)
  }

  function openEdit(u: Profile) {
    setEditing(u)
    setEditForm({
      full_name: u.full_name ?? '',
      location: u.location ?? '',
      phone_number: u.phone_number ?? '',
      farm_location: u.farm_location ?? '',
      bio: u.bio ?? '',
    })
  }

  async function handleSaveEdit() {
    if (!editing) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update(editForm).eq('id', editing.id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Details updated')
      const changed = (Object.keys(editForm) as (keyof typeof editForm)[])
        .filter(key => (editing[key] ?? '') !== editForm[key])
      setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...editForm } : u))
      if (changed.length) logUserAction('profile_edit', editing, { changed })
      setEditing(null)
    }
    setSaving(false)
  }

  async function handleToggleActive() {
    if (!deactivating) return
    const nextActive = !deactivating.is_active
    setUpdatingId(deactivating.id)
    const { error } = await supabase.from('profiles').update({ is_active: nextActive }).eq('id', deactivating.id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(nextActive ? 'Account activated' : 'Account deactivated')
      setUsers(prev => prev.map(u => u.id === deactivating.id ? { ...u, is_active: nextActive } : u))
      logUserAction(nextActive ? 'activate' : 'deactivate', deactivating)
    }
    setUpdatingId(null)
    setDeactivating(null)
  }

  async function handleSendResetLink(u: Profile) {
    if (!u.email) {
      toast.error('This user has no email on file')
      return
    }
    setSendingLinkFor(u.id)
    const { error } = await supabase.auth.resetPasswordForEmail(u.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Reset link sent to ${u.email}`)
      logUserAction('password_reset_link', u)
    }
    setSendingLinkFor(null)
  }

  function openResetPassword(u: Profile) {
    setResettingFor(u)
    setNewPassword(generateDefaultPassword())
  }

  function generateDefaultPassword() {
    const random = Math.random().toString(36).slice(-6)
    return `Kilimo-${random}`
  }

  async function handleSetPassword() {
    if (!resettingFor) return
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setResetSaving(true)
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resettingFor.id, password: newPassword }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.error ?? 'Failed to set password')
      } else {
        toast.success(`Password set for ${resettingFor.full_name ?? resettingFor.email ?? 'user'}`)
        logUserAction('password_reset_direct', resettingFor)
        setResettingFor(null)
      }
    } finally {
      setResetSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Users</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {users.length} total · {roleCount('farmer')} farmers · {roleCount('admin')} admins
            {viewerRole === 'super_admin' && ` · ${roleCount('super_admin')} super admins`}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <Input
            placeholder="Search by name, email, location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
        {/* Analytics sidebar — stat tiles + growth chart, stays visible while the table scrolls */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-20 flex flex-col gap-3">
          {[
            { label: 'Active now', value: statusCounts.activeNow, icon: Circle, color: '#10b981' },
            { label: 'Offline', value: statusCounts.offline, icon: WifiOff, color: 'var(--text-muted)' },
            { label: 'Deactivated', value: statusCounts.deactivated, icon: Ban, color: '#ef4444' },
          ].map(kpi => (
            <Card key={kpi.label}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <kpi.icon className="h-4 w-4 shrink-0" style={{ color: kpi.color }} />
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{kpi.label}</p>
                </div>
                {loading
                  ? <div className="h-5 w-8 rounded shimmer" />
                  : <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>{kpi.value}</p>
                }
              </CardContent>
            </Card>
          ))}

          {/* Signups vs. users who have actually logged in, last 30 days */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                User Growth (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[200px] rounded shimmer" />
              ) : (
                <UserGrowthChart
                  series={[
                    { key: 'signups', label: 'Signed up', color: 'var(--primary)', dates: users.map(u => u.created_at) },
                    { key: 'active', label: 'Logged in', color: 'var(--accent)', dates: users.map(u => u.first_active_at) },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* User table */}
        <div className="order-2 lg:order-1 min-w-0">
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Email', 'Phone', 'Location', 'Role', 'Status', 'Joined', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-2.5"><div className="h-6 rounded shimmer" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No users found.
                  </td>
                </tr>
              ) : filtered.map(user => {
                const isSelf = user.id === currentUserId
                const manageable = canManage(user)
                const online = isOnline(user.last_active_at)

                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}
                    className="transition-colors hover:bg-[var(--surface-2)]">
                    <td className="px-4 py-3">
                      <UserContactHoverCard user={user}>
                        <div className="flex items-center gap-2">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-fg)' }}>
                              {(user.full_name ?? user.email ?? '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium" style={{ color: 'var(--text)' }}>
                              {user.full_name ?? '—'}
                              {isSelf && <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>(you)</span>}
                            </p>
                          </div>
                        </div>
                      </UserContactHoverCard>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{user.email ?? '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{user.phone_number ?? '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{user.location ?? '—'}</td>
                    <td className="px-4 py-3">
                      {manageable ? (
                        <select
                          value={user.role}
                          disabled={updatingId === user.id}
                          onChange={e => handleRoleChange(user.id, e.target.value)}
                          className="h-7 rounded-md border px-2 text-xs"
                          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                          <option value="farmer">farmer</option>
                          <option value="admin">admin</option>
                          {/* Only super_admin can grant/hold super_admin — admin can never manage or set this role */}
                          {viewerRole === 'super_admin' && <option value="super_admin">super_admin</option>}
                        </select>
                      ) : (
                        <Badge variant={ROLE_COLORS[user.role] ?? 'outline'}>{user.role}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!user.is_active ? (
                        <Badge variant="destructive">Deactivated</Badge>
                      ) : online ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--primary)' }}>
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          Active now
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Last seen {formatRelativeTime(user.last_active_at)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => setViewingUser(user)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)]" title="View details" style={{ color: 'var(--text-muted)' }}>
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {manageable && (
                        <>
                          <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)]" title="Edit details" style={{ color: 'var(--text-muted)' }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleSendResetLink(user)}
                            disabled={sendingLinkFor === user.id || !user.email}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)] disabled:opacity-40"
                            title={user.email ? 'Send password reset link' : 'No email on file'}
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openResetPassword(user)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)]"
                            title="Set a new password directly"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeactivating(user)}
                            disabled={updatingId === user.id}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)]"
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                            style={{ color: user.is_active ? '#ef4444' : '#10b981' }}
                          >
                            {user.is_active ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          </button>
                        </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
        </div>
      </div>

      {/* User details card */}
      <Modal open={!!viewingUser} onClose={() => setViewingUser(null)} title="User Details">
        {viewingUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              {viewingUser.avatar_url ? (
                <img src={viewingUser.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-fg)' }}>
                  {(viewingUser.full_name ?? viewingUser.email ?? '?')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-base" style={{ color: 'var(--text)' }}>{viewingUser.full_name ?? '—'}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant={ROLE_COLORS[viewingUser.role] ?? 'outline'}>{viewingUser.role}</Badge>
                  {!viewingUser.is_active ? (
                    <Badge variant="destructive">Deactivated</Badge>
                  ) : isOnline(viewingUser.last_active_at) ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--primary)' }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active now
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Last seen {formatRelativeTime(viewingUser.last_active_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Email</p>
                <p style={{ color: 'var(--text)' }}>{viewingUser.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Phone</p>
                <p style={{ color: 'var(--text)' }}>{viewingUser.phone_number ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Location</p>
                <p style={{ color: 'var(--text)' }}>{viewingUser.location ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Farm Location</p>
                <p style={{ color: 'var(--text)' }}>{viewingUser.farm_location ?? '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Bio</p>
                <p style={{ color: 'var(--text)' }}>{viewingUser.bio ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Joined</p>
                <p style={{ color: 'var(--text)' }}>{viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleDateString() : '—'}</p>
              </div>
            </div>

            {canManage(viewingUser) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <Button variant="outline" onClick={() => { const u = viewingUser; setViewingUser(null); openEdit(u) }}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                </Button>
                <Button variant="outline" disabled={!viewingUser.email} onClick={() => handleSendResetLink(viewingUser)}>
                  <Mail className="h-3.5 w-3.5 mr-1.5" /> Send reset link
                </Button>
                <Button variant="outline" onClick={() => { const u = viewingUser; setViewingUser(null); openResetPassword(u) }}>
                  <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Set password
                </Button>
                <Button variant="outline" onClick={() => { const u = viewingUser; setViewingUser(null); setDeactivating(u) }}>
                  {viewingUser.is_active ? <Ban className="h-3.5 w-3.5 mr-1.5" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                  {viewingUser.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit User Details">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone Number</Label>
            <Input value={editForm.phone_number} onChange={e => setEditForm(f => ({ ...f, phone_number: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Farm Location</Label>
            <Input value={editForm.farm_location} onChange={e => setEditForm(f => ({ ...f, farm_location: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Input value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSaveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      </Modal>

      {/* Set password modal */}
      <Modal open={!!resettingFor} onClose={() => setResettingFor(null)} title="Set New Password">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            This immediately changes the password for <strong>{resettingFor?.full_name ?? resettingFor?.email}</strong>.
            Share it with them directly — no email is sent.
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>New Password</Label>
              <button
                type="button"
                onClick={() => setNewPassword(generateDefaultPassword())}
                className="text-xs font-medium hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                Generate new
              </button>
            </div>
            <Input value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setResettingFor(null)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSetPassword} disabled={resetSaving}>{resetSaving ? 'Saving...' : 'Set Password'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deactivating}
        onClose={() => setDeactivating(null)}
        onConfirm={handleToggleActive}
        loading={!!deactivating && updatingId === deactivating.id}
        title={deactivating?.is_active ? 'Deactivate Account' : 'Activate Account'}
        confirmLabel={deactivating?.is_active ? 'Deactivate' : 'Activate'}
        description={
          deactivating?.is_active
            ? `${deactivating?.full_name ?? 'This user'} will be signed out and unable to log back in until reactivated.`
            : `${deactivating?.full_name ?? 'This user'} will be able to log in again.`
        }
      />
    </div>
  )
}
