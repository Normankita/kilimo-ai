'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { ScrollText, Search } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { summarizeAuditDetails, type AuditAction } from '@/lib/audit-log'
import { SortableTh } from '@/components/admin/sortable-th'
import { useSort } from '@/lib/use-sort'

interface AuditLogEntry {
  id: number
  actor_id: string | null
  actor_name: string | null
  actor_role: string | null
  action: AuditAction
  target_id: string | null
  target_name: string | null
  details: Record<string, unknown>
  created_at: string
}

const ACTION_LABELS: Record<AuditAction, string> = {
  role_change: 'Role change',
  activate: 'Activate',
  deactivate: 'Deactivate',
  profile_edit: 'Profile edit',
  password_reset_direct: 'Password set',
  password_reset_link: 'Reset link sent',
  delete: 'Delete',
  restore: 'Restore',
}

const ACTION_COLORS: Record<AuditAction, 'success' | 'secondary' | 'destructive' | 'outline'> = {
  role_change: 'secondary',
  activate: 'success',
  deactivate: 'destructive',
  profile_edit: 'outline',
  password_reset_direct: 'outline',
  password_reset_link: 'outline',
  delete: 'destructive',
  restore: 'success',
}

export default function AuditLogPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all')
  const [detailed, setDetailed] = useState(false)
  const [viewing, setViewing] = useState<AuditLogEntry | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: viewer } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (viewer?.role !== 'super_admin') {
        // A plain admin may still be granted access via the
        // admin_can_view_audit_log toggle — fetched directly here (rather
        // than trusting the shared SiteSettingsProvider) to avoid a race
        // where its own fetch hasn't resolved yet and would wrongly redirect.
        if (viewer?.role === 'admin') {
          const { data: siteSettings } = await supabase.from('site_settings').select('admin_can_view_audit_log').eq('id', 1).single()
          if (siteSettings?.admin_can_view_audit_log) {
            setAuthorized(true)
            setChecking(false)
          } else {
            router.replace('/admin')
            return
          }
        } else {
          router.replace('/admin')
          return
        }
      } else {
        setAuthorized(true)
        setChecking(false)
      }

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) toast.error(error.message)
      else setEntries((data ?? []) as AuditLogEntry[])
      setLoading(false)
    }
    init()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter(e => {
      if (actionFilter !== 'all' && e.action !== actionFilter) return false
      if (!q) return true
      return (e.actor_name ?? '').toLowerCase().includes(q) || (e.target_name ?? '').toLowerCase().includes(q)
    })
  }, [entries, search, actionFilter])

  type SortKey = 'created_at' | 'actor_name' | 'action' | 'target_name'
  const { sortKey, sortDir, toggleSort, sorted } = useSort<AuditLogEntry, SortKey>(filtered, 'created_at', (e, key) => {
    if (key === 'created_at') return new Date(e[key]).getTime()
    return (e[key] ?? '').toLowerCase()
  }, 'desc')

  if (checking) return null
  if (!authorized) return null

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <ScrollText className="h-5 w-5" /> Audit Log
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {entries.length} critical actions recorded — role changes, activation, password resets, and edits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <Input
              placeholder="Search actor or target..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value as AuditAction | 'all')}
            className="h-9 rounded-md border px-2 text-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
            <option value="all">All actions</option>
            {(Object.keys(ACTION_LABELS) as AuditAction[]).map(a => (
              <option key={a} value={a}>{ACTION_LABELS[a]}</option>
            ))}
          </select>
          <div className="flex rounded-md border p-0.5" style={{ borderColor: 'var(--border)' }}>
            {(['brief', 'detailed'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setDetailed(mode === 'detailed')}
                className="px-3 py-1 rounded text-xs font-medium capitalize transition-colors"
                style={{
                  backgroundColor: (mode === 'detailed') === detailed ? 'var(--primary)' : 'transparent',
                  color: (mode === 'detailed') === detailed ? 'var(--primary-fg)' : 'var(--text-muted)',
                }}>
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <SortableTh label="Time" sortKey="created_at" activeKey={sortKey} direction={sortDir} onClick={toggleSort} />
                <SortableTh label="Actor" sortKey="actor_name" activeKey={sortKey} direction={sortDir} onClick={toggleSort} />
                <SortableTh label="Action" sortKey="action" activeKey={sortKey} direction={sortDir} onClick={toggleSort} />
                <SortableTh label="Target" sortKey="target_name" activeKey={sortKey} direction={sortDir} onClick={toggleSort} />
                <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Summary</th>
                {detailed && ['Actor role', 'Target ID'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}><td colSpan={detailed ? 7 : 5} className="px-4 py-2.5"><div className="h-6 rounded shimmer" /></td></tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={detailed ? 7 : 5} className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No actions recorded yet.
                  </td>
                </tr>
              ) : sorted.map(entry => (
                <tr
                  key={entry.id}
                  onClick={() => setViewing(entry)}
                  style={{ borderBottom: '1px solid var(--border)' }}
                  className="cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
                >
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {formatRelativeTime(entry.created_at)}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>{entry.actor_name ?? 'Unknown'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ACTION_COLORS[entry.action] ?? 'outline'}>{ACTION_LABELS[entry.action] ?? entry.action}</Badge>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{entry.target_name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {summarizeAuditDetails(entry.action, entry.details)}
                  </td>
                  {detailed && (
                    <>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{entry.actor_role ?? '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{entry.target_id ?? '—'}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Audit Entry">
        {viewing && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={ACTION_COLORS[viewing.action] ?? 'outline'}>{ACTION_LABELS[viewing.action] ?? viewing.action}</Badge>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Date(viewing.created_at).toLocaleString()} ({formatRelativeTime(viewing.created_at)})
              </span>
            </div>
            <p style={{ color: 'var(--text)' }}>{summarizeAuditDetails(viewing.action, viewing.details)}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Actor</p>
                <p style={{ color: 'var(--text)' }}>{viewing.actor_name ?? 'Unknown'}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{viewing.actor_role ?? '—'} · {viewing.actor_id ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Target</p>
                <p style={{ color: 'var(--text)' }}>{viewing.target_name ?? '—'}</p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{viewing.target_id ?? '—'}</p>
              </div>
            </div>
            {Object.keys(viewing.details ?? {}).length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Raw details</p>
                <pre className="text-xs rounded-lg p-3 overflow-x-auto" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text)' }}>
                  {JSON.stringify(viewing.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
