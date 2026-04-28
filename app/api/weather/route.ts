/**
 * /api/weather — current weather for major Tamil Nadu cities
 * Uses Open-Meteo (free, no API key required)
 * Geocoding: Open-Meteo geocoding API
 */
import { NextResponse } from 'next/server'

export const revalidate = 1800 // cache 30 min

const CITIES = [
  { name: 'Chennai',     lat: 13.0827, lon: 80.2707 },
  { name: 'Coimbatore',  lat: 11.0168, lon: 76.9558 },
  { name: 'Madurai',     lat: 9.9252,  lon: 78.1198 },
  { name: 'Salem',       lat: 11.6643, lon: 78.1460 },
  { name: 'Trichy',      lat: 10.7905, lon: 78.7047 },
  { name: 'Tirunelveli', lat: 8.7139,  lon: 77.7567 },
]

const WMO_DESC: Record<number, { label: string; icon: string }> = {
  0:  { label: 'Clear sky',        icon: '☀️' },
  1:  { label: 'Mainly clear',     icon: '🌤️' },
  2:  { label: 'Partly cloudy',    icon: '⛅' },
  3:  { label: 'Overcast',         icon: '☁️' },
  45: { label: 'Foggy',            icon: '🌫️' },
  48: { label: 'Icy fog',          icon: '🌫️' },
  51: { label: 'Light drizzle',    icon: '🌦️' },
  53: { label: 'Drizzle',          icon: '🌦️' },
  55: { label: 'Heavy drizzle',    icon: '🌧️' },
  61: { label: 'Light rain',       icon: '🌧️' },
  63: { label: 'Rain',             icon: '🌧️' },
  65: { label: 'Heavy rain',       icon: '🌧️' },
  71: { label: 'Light snow',       icon: '🌨️' },
  80: { label: 'Rain showers',     icon: '🌦️' },
  95: { label: 'Thunderstorm',     icon: '⛈️' },
  99: { label: 'Thunderstorm',     icon: '⛈️' },
}

function describe(code: number) {
  return WMO_DESC[code] ?? { label: 'Unknown', icon: '🌡️' }
}

export async function GET() {
  try {
    const results = await Promise.all(
      CITIES.map(async city => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weathercode,windspeed_10m,apparent_temperature&wind_speed_unit=kmh&temperature_unit=celsius&timezone=Asia%2FKolkata`
          const res = await fetch(url, { signal: AbortSignal.timeout(5000), next: { revalidate: 1800 } })
          if (!res.ok) throw new Error(`status ${res.status}`)
          const data = await res.json()
          const cur = data.current
          const { label, icon } = describe(cur.weathercode)
          return {
            city: city.name,
            temp: Math.round(cur.temperature_2m),
            feelsLike: Math.round(cur.apparent_temperature),
            humidity: cur.relative_humidity_2m,
            wind: Math.round(cur.windspeed_10m),
            condition: label,
            icon,
          }
        } catch {
          return { city: city.name, temp: null, condition: 'Unavailable', icon: '❓', humidity: null, wind: null, feelsLike: null }
        }
      })
    )
    return NextResponse.json({ cities: results, updatedAt: new Date().toISOString() })
  } catch {
    return NextResponse.json({ cities: [], error: 'Failed' }, { status: 500 })
  }
}
