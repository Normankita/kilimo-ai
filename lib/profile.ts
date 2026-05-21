import { createClient } from './supabase/client'

export type UserRole = 'farmer' | 'admin' | 'super_admin'

export interface Profile {
  id: string
  role: UserRole
  full_name?: string
  location?: string
  email?: string
  created_at?: string
}

export function roleRedirectPath(role: UserRole): string {
  return role === 'farmer' ? '/dashboard' : '/admin'
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
