'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

interface Profile {
  id: string
  role: string
  full_name: string | null
  email: string | null
  location: string | null
  created_at: string | null
}

const ROLE_COLORS: Record<string, 'success' | 'secondary' | 'destructive' | 'outline'> = {
  farmer: 'success',
  admin: 'secondary',
  super_admin: 'outline',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name, email, location, created_at')
        .order('created_at', { ascending: false })

      if (error) toast.error(error.message)
      else setUsers(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingId(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Role updated')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    }
    setUpdatingId(null)
  }

  const roleCount = (role: string) => users.filter(u => u.role === role).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Users</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {users.length} total · {roleCount('farmer')} farmers · {roleCount('admin')} admins
          </p>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--surface-2)' }}>
          <Users className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{users.length}</span>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Email', 'Location', 'Role', 'Joined'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-2.5"><div className="h-6 rounded shimmer" /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No users found.
                  </td>
                </tr>
              ) : users.map(user => {
                const isSelf = user.id === currentUserId
                const isSuperAdmin = user.role === 'super_admin'
                const canChangeRole = !isSelf && !isSuperAdmin

                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}
                    className="transition-colors hover:bg-[var(--surface-2)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-fg)' }}>
                          {(user.full_name ?? user.email ?? '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--text)' }}>
                            {user.full_name ?? '—'}
                            {isSelf && <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>(you)</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{user.email ?? '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{user.location ?? '—'}</td>
                    <td className="px-4 py-3">
                      {canChangeRole ? (
                        <select
                          value={user.role}
                          disabled={updatingId === user.id}
                          onChange={e => handleRoleChange(user.id, e.target.value)}
                          className="h-7 rounded-md border px-2 text-xs"
                          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                          <option value="farmer">farmer</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        <Badge variant={ROLE_COLORS[user.role] ?? 'outline'}>{user.role}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
