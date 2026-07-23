import { useMemo, useState } from 'react'

export type SortDir = 'asc' | 'desc'

// Shared client-side sort for the small admin/farmer lists in this app (all
// loaded in full already, so sorting in memory is simpler than round-tripping
// to Supabase for an `order by` on every click).
export function useSort<T, K extends string>(
  items: T[],
  defaultKey: K,
  getValue: (item: T, key: K) => string | number,
  initialDir: SortDir = 'asc'
) {
  const [sortKey, setSortKey] = useState<K>(defaultKey)
  const [sortDir, setSortDir] = useState<SortDir>(initialDir)

  function toggleSort(key: K) {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    const copy = [...items]
    copy.sort((a, b) => {
      const av = getValue(a, sortKey)
      const bv = getValue(b, sortKey)
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, sortKey, sortDir])

  return { sortKey, sortDir, toggleSort, sorted }
}
