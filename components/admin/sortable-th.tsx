'use client'

import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import type { SortDir } from '@/lib/use-sort'

interface SortableThProps<K extends string> {
  label: string
  sortKey: K
  activeKey: K
  direction: SortDir
  onClick: (key: K) => void
}

export function SortableTh<K extends string>({ label, sortKey, activeKey, direction, onClick }: SortableThProps<K>) {
  const active = activeKey === sortKey
  return (
    <th
      onClick={() => onClick(sortKey)}
      className="text-left px-4 py-3 text-xs font-semibold select-none cursor-pointer whitespace-nowrap"
      style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active
          ? direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
          : <ChevronsUpDown className="h-3 w-3 opacity-40" />
        }
      </span>
    </th>
  )
}
