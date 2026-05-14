import { useApp } from '../context/AppContext'

const MILESTONES = [
  { weight:325, label:'First 25 lbs', icon:'💪' },
  { weight:315, label:'Halfway to first goal', icon:'🏃' },
  { weight:305, label:'45 lbs down', icon:'⚡' },
  { weight:295, label:'Under 300 — massive', icon:'🔥' },
  { weight:285, label:'Japan goal — Dec 15 2026', icon:'🇯🇵' },
]

export default function Milestones() {
  const { data } = useApp()
  const latestDate   = Object.keys(data.checkins || {}).sort().reverse()[0]
  const currentWeight = latestDate ? (parseFloat(data.checkins[latestDate]?.weight) || data.lastWeight || 335.4) : (data.lastWeight || 335.4)
  const start = 350, goal = 285
  const lost  = +(start - currentWeight).toFixed(1)
  const pctOverall = Math.round((lost / (start - goal)) * 100)

  return (
    <div className="card">
      <div className="flex-between" style={{ marginBottom:12 }}>
        <div>
          <div className="syne fw7" style={{ fontSize:13 }}>
            Current: <span style={{ color:'var(--accent)' }}>{currentWeight.toFixed(1)} lbs</span>
          </div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>
            {lost} lbs lost · {(currentWeight - goal).toFixed(1)} lbs to goal
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div className="syne fw8" style={{ fontSize:20, color:'var(--accent)' }}>{pctOverall}%</div>
          <div style={{ fontSize:10, color:'var(--muted)' }}>to goal</div>
        </div>
      </div>

      {MILESTONES.map(m => {
        const achieved = currentWeight <= m.weight
        const pct = Math.min(100, Math.max(0, Math.round(((start - currentWeight) / (start - m.weight)) * 100)))
        return (
          <div key={m.weight} className="milestone-row">
            <div className="milestone-dot" style={{ background: achieved ? 'var(--accent)' : 'var(--faint)' }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color: achieved ? 'var(--accent)' : 'var(--text)' }}>
                {m.icon} {m.label}
              </div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>
                {m.weight} lbs {achieved ? '✅ Achieved!' : `· ${pct}% there`}
              </div>
            </div>
            <div style={{ fontSize:16 }}>{achieved ? '🏆' : ''}</div>
          </div>
        )
      })}
    </div>
  )
}
