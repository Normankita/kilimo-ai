'use client'

import { useEffect, useState } from 'react'
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, CloudSnow, CloudLightning } from 'lucide-react'

interface WeatherData {
  temp: number; feels_like: number; humidity: number
  wind_speed: number; description: string; city: string; icon: string
}

function WeatherIcon({ icon, cls }: { icon: string; cls?: string }) {
  const c = cls ?? 'h-14 w-14'
  if (icon.includes('01')) return <Sun className={`${c} text-amber-300`} />
  if (icon.match(/0[234]/))  return <Cloud className={`${c} text-slate-300`} />
  if (icon.match(/0[91]0?/)) return <CloudRain className={`${c} text-blue-300`} />
  if (icon.includes('11'))   return <CloudLightning className={`${c} text-yellow-300`} />
  if (icon.includes('13'))   return <CloudSnow className={`${c} text-blue-200`} />
  return <Sun className={`${c} text-amber-300`} />
}

function Skeleton() {
  return (
    <div className="rounded-xl p-5 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #1c4a6e 0%, #153a56 100%)' }}>
      <div className="animate-pulse space-y-3">
        <div className="h-3 bg-white/20 rounded w-28" />
        <div className="h-12 bg-white/20 rounded w-20" />
        <div className="h-3 bg-white/20 rounded w-36" />
        <div className="flex gap-4 pt-2">
          <div className="h-3 bg-white/20 rounded w-16" />
          <div className="h-3 bg-white/20 rounded w-16" />
          <div className="h-3 bg-white/20 rounded w-20" />
        </div>
      </div>
    </div>
  )
}

export default function WeatherWidget({ location }: { location?: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const q = location || 'Dodoma,TZ'
    fetch(`/api/weather?location=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(true); else setWeather(d) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [location])

  if (loading) return <Skeleton />

  if (error || !weather) {
    return (
      <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)' }}>
        <Cloud className="h-10 w-10 text-white/40 shrink-0" />
        <div>
          <p className="font-semibold text-white">Hali ya Hewa</p>
          <p className="text-sm text-white/60">Weka OPENWEATHERMAP_API_KEY kwenye .env.local</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-5 overflow-hidden relative text-white"
      style={{ background: 'linear-gradient(135deg, #1c6a9e 0%, #0f4a72 100%)' }}>
      {/* Decorative circle */}
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute top-10 -right-2 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-blue-200 text-xs font-medium mb-1">{weather.city}</p>
          <div className="flex items-end gap-1">
            <span className="text-5xl font-bold tracking-tight">{Math.round(weather.temp)}°</span>
            <span className="text-blue-300 mb-2 text-lg">C</span>
          </div>
          <p className="text-blue-100 capitalize text-sm mt-0.5">{weather.description}</p>
        </div>
        <WeatherIcon icon={weather.icon} />
      </div>

      <div className="flex gap-5 mt-4 pt-4 border-t border-white/15 text-sm">
        <div className="flex items-center gap-1.5">
          <Droplets className="h-3.5 w-3.5 text-blue-300" />
          <span className="text-blue-100">{weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="h-3.5 w-3.5 text-blue-300" />
          <span className="text-blue-100">{weather.wind_speed} m/s</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Thermometer className="h-3.5 w-3.5 text-blue-300" />
          <span className="text-blue-100">{Math.round(weather.feels_like)}°C</span>
        </div>
      </div>
    </div>
  )
}
