'use client'

import { useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, Phone, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/lib/profile'

const ROLE_COLORS: Record<string, 'success' | 'secondary' | 'destructive' | 'outline'> = {
  farmer: 'success',
  admin: 'secondary',
  super_admin: 'outline',
}

interface HoverUser {
  full_name: string | null
  email: string | null
  phone_number: string | null
  location: string | null
  avatar_url: string | null
  role: UserRole
}

const HOVER_DELAY_MS = 600

export function UserContactHoverCard({ user, children }: { user: HoverUser; children: ReactNode }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleEnter() {
    timerRef.current = setTimeout(() => setVisible(true), HOVER_DELAY_MS)
  }

  function handleLeave() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }

  return (
    <div className="relative inline-block" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            className="absolute left-0 top-full mt-2 z-30 w-64 rounded-xl p-3.5 pointer-events-none"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--surface) 90%, transparent)',
              border: '1px solid var(--border)',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 0.97, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-fg)' }}>
                  {(user.full_name ?? user.email ?? '?')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                  {user.full_name ?? 'Unnamed user'}
                </p>
                <Badge variant={ROLE_COLORS[user.role] ?? 'outline'}>{user.role}</Badge>
              </div>
            </div>
            <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user.email ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user.phone_number ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user.location ?? '—'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
