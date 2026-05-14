import { useMemo } from 'react'
import { useApp } from '../context/AppContext'

export default function WeightChart({ height = 180 }) {
  const { data } = useApp()
  const profile = data.userProfile

  const startWeight = parseFloat(profile?.currentWeight) || 350
  const goalWeight  = parseFloat(profile?.goalWeight)    || 285
  const goalDateStr = profile?.goalDate || '2026-12-15'

  const entries = useMemo(() =>
    Object.entries(data.checkins || {})
      .filter(([, d]) => d?.weight)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({ date, weight: parseFloat(d.weight) })),
  [data.checkins])

  if (entries.length < 2) return (
    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 13 }}>
      Log 2+ weight entries in Check-In to see your progress chart
    </div>
  )

  const W = 320, H = height, PAD = 28
  const weights  = entries.map(e => e.weight)
  const minW     = Math.min(...weights, goalWeight) - 5
  const maxW     = Math.max(...weights, startWeight) + 5
  const goalDate = new Date(goalDateStr)
  const minDate  = new Date(entries[0].date).getTime()
  const maxDate  = goalDate.getTime()

  const toX = d => PAD + ((new Date(d).getTime() - minDate) / (maxDate - minDate)) * (W - PAD * 2)
  const toY = w => PAD + ((maxW - w) / (maxW - minW)) * (H - PAD * 2)

  // Dynamic grid lines based on user's range
  const range     = maxW - minW
  const step      = range > 80 ? 25 : range > 40 ? 10 : 5
  const gridStart = Math.ceil(minW / step) * step
  const gridLines = []
  for (let w = gridStart; w <= maxW; w += step) gridLines.push(w)

  const pts = entries.map(e => `${toX(e.date)},${toY(e.weight)}`).join(' ')
  const gx  = toX(goalDate), gy = toY(goalWeight)
  const fx  = toX(entries[0].date), fy = toY(entries[0].weight)

  let svg = ''
  gridLines.forEach(w => {
    const y = toY(w)
    svg += `<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="rgba(255,255,255,.06)" stroke-width="1"/>`
    svg += `<text x="${PAD - 3}" y="${y + 4}" text-anchor="end" fill="rgba(255,255,255,.25)" font-size="9" font-family="DM Sans">${w}</text>`
  })
  // Goal projection dashed line from first entry to goal
  svg += `<line x1="${fx}" y1="${fy}" x2="${gx}" y2="${gy}" stroke="rgba(251,191,36,.3)" stroke-width="1.5" stroke-dasharray="4,3"/>`
  // Actual path
  svg += `<polyline points="${pts}" fill="none" stroke="#00c896" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
  // Dots
  entries.forEach((e, i) => {
    const x = toX(e.date), y = toY(e.weight)
    svg += `<circle cx="${x}" cy="${y}" r="4" fill="#00c896" stroke="#0f1923" stroke-width="2"/>`
    if (i === entries.length - 1)
      svg += `<text x="${x}" y="${y - 10}" text-anchor="middle" fill="#00c896" font-size="10" font-family="Syne" font-weight="700">${e.weight}</text>`
  })
  // Goal marker
  svg += `<circle cx="${gx}" cy="${gy}" r="5" fill="none" stroke="rgba(251,191,36,.6)" stroke-width="2"/>`
  svg += `<text x="${gx}" y="${gy - 10}" text-anchor="middle" fill="rgba(251,191,36,.8)" font-size="9" font-family="DM Sans">${goalWeight} 🎯</text>`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, overflow: 'visible' }}
      dangerouslySetInnerHTML={{ __html: svg }} />
  )
}
