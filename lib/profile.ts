import { createClient } from './supabase/client'

export type UserRole = 'farmer' | 'admin' | 'super_admin'

export interface Profile {
  id: string
  role: UserRole
  full_name?: string
  location?: string
  email?: string
  phone_number?: string
  farm_location?: string
  bio?: string
  is_active?: boolean
  last_active_at?: string | null
  first_active_at?: string | null
  created_at?: string
}

export function roleRedirectPath(role: UserRole): string {
  return role === 'farmer' ? '/dashboard' : '/admin'
}

// Mirrors the guard_profile_privileged_fields trigger in supabase/schema.sql:
// - nobody can act on their own row (self-lockout protection)
// - admins may manage farmers and other admins, but never super_admins
// - super_admin may manage anyone else, including other super_admins
export function canManageUser(
  actingRole: UserRole,
  actingId: string,
  target: { id: string; role: UserRole }
): boolean {
  if (target.id === actingId) return false
  if (actingRole === 'admin') return target.role !== 'super_admin'
  return actingRole === 'super_admin'
}

export async function fetchOrCreateProfile(userId: string, fallbackData?: Partial<Profile>): Promise<Profile | null> {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (existing) return existing as Profile

  // Create a farmer profile if none exists
  const { data: created } = await supabase
    .from('profiles')
    .insert({ id: userId, role: 'farmer', ...fallbackData })
    .select('*')
    .single()

  return created as Profile | null
}
