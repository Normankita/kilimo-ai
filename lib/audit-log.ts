import { createClient } from './supabase/client'

export type AuditAction =
  | 'role_change'
  | 'activate'
  | 'deactivate'
  | 'profile_edit'
  | 'password_reset_direct'
  | 'password_reset_link'

interface LogAuditActionParams {
  actorId: string
  actorName?: string | null
  actorRole: string
  action: AuditAction
  targetId: string
  targetName?: string | null
  details?: Record<string, unknown>
}

// Fire-and-forget: a failed audit write must never block or surface an error
// for the primary action it's recording.
export async function logAuditAction(params: LogAuditActionParams): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('audit_logs').insert({
    actor_id: params.actorId,
    actor_name: params.actorName ?? null,
    actor_role: params.actorRole,
    action: params.action,
    target_id: params.targetId,
    target_name: params.targetName ?? null,
    details: params.details ?? {},
  })
  if (error) console.error('Failed to write audit log:', error.message)
}

export function summarizeAuditDetails(action: AuditAction, details: Record<string, unknown>): string {
  switch (action) {
    case 'role_change':
      return `Role changed from ${details.from ?? '—'} to ${details.to ?? '—'}`
    case 'activate':
      return 'Account reactivated'
    case 'deactivate':
      return 'Account deactivated'
    case 'profile_edit': {
      const changed = Array.isArray(details.changed) ? details.changed : []
      return changed.length ? `Updated: ${changed.join(', ')}` : 'Details updated'
    }
    case 'password_reset_direct':
      return 'Password set directly by admin'
    case 'password_reset_link':
      return 'Password reset link sent'
    default:
      return 'Unknown action'
  }
}
