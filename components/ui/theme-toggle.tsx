'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="h-8 w-8" />

  const options: { value: string; icon: React.ReactNode; label: string }[] = [
    { value: 'light',  icon: <Sun  className="h-3.5 w-3.5" />, label: 'Light'  },
    { value: 'dark',   icon: <Moon className="h-3.5 w-3.5" />, label: 'Dark'   },
    { value: 'system', icon: <Monitor className="h-3.5 w-3.5" />, label: 'Auto' },
  ]

  return (
    <div className={`flex items-center rounded-lg bg-[var(--surface-2)] p-0.5 gap-0.5 ${className ?? ''}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          title={opt.label}
          className={`flex items-center justify-center h-7 w-7 rounded-md transition-all duration-200 ${
            theme === opt.value
              ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}
