import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const location = request.nextUrl.searchParams.get('location') || 'Dodoma,TZ'
  const apiKey = process.env.OPENWEATHERMAP_API_KEY

  if (!apiKey || apiKey === 'your_openweathermap_api_key_here') {
    return NextResponse.json({ error: 'API key haipo' }, { status: 503 })
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric&lang=sw`
    const res = await fetch(url, { next: { revalidate: 1800 } })

    if (!res.ok) {
      return NextResponse.json({ error: 'Hali ya hewa haipatikani' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({
      temp: data.main.temp,
      feels_like: data.main.feels_like,
      humidity: data.main.humidity,
      wind_speed: data.wind.speed,
      description: data.weather[0].description,
      city: data.name,
      icon: data.weather[0].icon,
    })
  } catch {
    return NextResponse.json({ error: 'Hitilafu ya seva' }, { status: 500 })
  }
}
