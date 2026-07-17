import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { canManageUser, type UserRole } from '@/lib/profile'

export async function POST(request: Request) {
  const { userId, password } = await request.json()

  if (!userId || typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: 'A userId and a password of at least 6 characters are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!callerProfile || callerProfile.role === 'farmer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data: targetProfile } = await supabase.from('profiles').select('id, role').eq('id', userId).single()
  if (!targetProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (!canManageUser(callerProfile.role as UserRole, user.id, targetProfile as { id: string; role: UserRole })) {
    return NextResponse.json({ error: 'You are not allowed to manage this account' }, { status: 403 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'Server not configured for password resets (missing SUPABASE_SERVICE_ROLE_KEY)' }, { status: 500 })
  }

  const admin = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await admin.auth.admin.updateUserById(userId, { password })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
