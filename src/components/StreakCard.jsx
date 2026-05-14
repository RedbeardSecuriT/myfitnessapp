import { useApp } from '../context/AppContext'

export default function StreakCard() {
  const { data } = useApp()
  const weeks = Object.keys(data.checkins || {}).sort((a,b) => b.localeCompare(a))

  let streak = 0, best = 0, cur = 0
  weeks.forEach(date => {
    const d = data.checkins[date] || {}
    const w = d.workouts || {}
    const done = ['a','b','c','d','e','f'].filter(k => w[k] === true).length
    if (done >= 4) cur++
    else { best = Math.max(best, cur); cur = 0 }
  })
  best = Math.max(best, cur)
  streak = cur

  const borderColor = streak >= 4 ? 'rgba(251,191,36,.6)' : streak >= 2 ? 'rgba(251,191,36,.3)' : 'rgba(255,255,255,.1)'

  return (
    <div className="streak-card" style={{ borderColor }}>
      <div style={{ fontSize:40, lineHeight:1 }}>🔥</div>
      <div>
        <div className="syne fw8" style={{ fontSize:48, color:'var(--amber)', lineHeight:1 }}>{streak}</div>
        <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>consecutive weeks · ≥4 sessions</div>
      </div>
      <div style={{ marginLeft:'auto', textAlign:'right' }}>
        <div className="syne fw7" style={{ fontSize:11, color:'var(--muted)' }}>Best</div>
        <div className="syne fw8" style={{ fontSize:18, color:'var(--amber)' }}>{best}</div>
      </div>
    </div>
  )
}
