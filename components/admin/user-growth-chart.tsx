'use client'

import { useMemo, useRef, useState } from 'react'

interface Series {
  key: string
  label: string
  color: string
  dates: (string | null | undefined)[]
}

interface Props {
  series: Series[]
  days?: number
}

// Sized for the ~320px sidebar column it renders in (app/admin/users/page.tsx).
// SVG text is sized in viewBox units, so this must track the actual render
// width — dropping it into a much narrower or wider container without
// adjusting these would make the axis labels illegibly small or oversized.
const WIDTH = 320
const HEIGHT = 200
const PAD_LEFT = 30
const PAD_RIGHT = 8
const PAD_TOP = 14
const PAD_BOTTOM = 22

function niceMax(value: number): number {
  if (value <= 4) return 4
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const steps = [1, 2, 2.5, 5, 10]
  for (const step of steps) {
    const candidate = step * magnitude
    if (candidate >= value) return candidate
  }
  return Math.ceil(value / magnitude) * magnitude
}

function buildCumulative(dates: (string | null | undefined)[], days: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - (days - 1))

  const validDates = dates
    .filter((d): d is string => !!d)
    .map(d => {
      const dt = new Date(d)
      dt.setHours(0, 0, 0, 0)
      return dt
    })

  const baseline = validDates.filter(d => d.getTime() < start.getTime()).length
  const newCounts = Array(days).fill(0)
  for (const d of validDates) {
    const idx = Math.round((d.getTime() - start.getTime()) / 86_400_000)
    if (idx >= 0 && idx < days) newCounts[idx]++
  }

  let running = baseline
  return newCounts.map((count, i) => {
    running += count
    const date = new Date(start)
    date.setDate(date.getDate() + i)
    return { date, total: running, newCount: count }
  })
}

export function UserGrowthChart({ series, days = 30 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const computed = useMemo(
    () => series.map(s => ({ ...s, points: buildCumulative(s.dates, days) })),
    [series, days]
  )

  const pointCount = computed[0]?.points.length ?? days
  const maxTotal = niceMax(Math.max(...computed.flatMap(s => s.points.map(p => p.total)), 1))
  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM

  const xFor = (i: number) => PAD_LEFT + (i / (pointCount - 1)) * plotW
  const yFor = (v: number) => PAD_TOP + plotH - (v / maxTotal) * plotH

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(maxTotal * f))

  const labelEvery = Math.ceil(pointCount / 3)
  const xLabels = (computed[0]?.points ?? [])
    .map((p, i) => ({ ...p, i }))
    .filter(({ i }) => i % labelEvery === 0 || i === pointCount - 1)

  const isSingleSeries = computed.length === 1

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH
    const idx = Math.round(((relX - PAD_LEFT) / plotW) * (pointCount - 1))
    setHoverIndex(Math.max(0, Math.min(pointCount - 1, idx)))
  }

  return (
    <div>
      {/* Legend — only needed once there's more than one series to tell apart */}
      {!isSingleSeries && (
        <div className="flex items-center gap-4 mb-3">
          {computed.map(s => (
            <div key={s.key} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              <span className="inline-block w-3 h-0.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto touch-none"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          {yTicks.map(v => (
            <line key={v} x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={yFor(v)} y2={yFor(v)} stroke="var(--border)" strokeWidth={1} />
          ))}

          {computed.map(s => {
            const linePath = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.total)}`).join(' ')
            const areaPath = `${linePath} L ${xFor(pointCount - 1)} ${PAD_TOP + plotH} L ${xFor(0)} ${PAD_TOP + plotH} Z`
            return (
              <g key={s.key}>
                {/* Area fill: only for a single series — overlapping fills on multi-series muddy the read */}
                {isSingleSeries && (
                  <path d={areaPath} fill={`color-mix(in srgb, ${s.color} 12%, transparent)`} stroke="none" />
                )}
                <path d={linePath} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              </g>
            )
          })}

          {yTicks.map(v => (
            <text key={v} x={PAD_LEFT - 8} y={yFor(v)} textAnchor="end" dominantBaseline="middle" className="text-[10px]" fill="var(--text-muted)">
              {v}
            </text>
          ))}

          {xLabels.map(({ date, i }) => (
            <text key={i} x={xFor(i)} y={HEIGHT - 8} textAnchor="middle" className="text-[10px]" fill="var(--text-muted)">
              {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </text>
          ))}

          {hoverIndex !== null && (
            <>
              <line
                x1={xFor(hoverIndex)} x2={xFor(hoverIndex)}
                y1={PAD_TOP} y2={PAD_TOP + plotH}
                stroke="var(--text-muted)" strokeWidth={1} opacity={0.35}
              />
              {computed.map(s => (
                <circle key={s.key} cx={xFor(hoverIndex)} cy={yFor(s.points[hoverIndex].total)} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
              ))}
            </>
          )}
        </svg>

        {/* Tooltip — one readout listing every series at the hovered date */}
        {hoverIndex !== null && (
          <div
            className="absolute pointer-events-none rounded-lg px-3 py-2 text-xs shadow-lg z-10"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              left: `${(xFor(hoverIndex) / WIDTH) * 100}%`,
              top: 0,
              transform: `translateX(${hoverIndex > pointCount / 2 ? '-105%' : '5%'})`,
            }}
          >
            <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
              {computed[0].points[hoverIndex].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            {computed.map(s => {
              const p = s.points[hoverIndex]
              return (
                <p key={s.key} className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <span className="inline-block w-2 h-0.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <strong style={{ color: 'var(--text)' }}>{p.total}</strong> {s.label.toLowerCase()}
                  {p.newCount > 0 && <> (+{p.newCount})</>}
                </p>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
