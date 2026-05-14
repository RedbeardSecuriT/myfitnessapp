import { useApp } from '../context/AppContext'

function buildMilestones(startWeight, goalWeight, goalDate) {
  const totalLoss = startWeight - goalWeight
  if (totalLoss <= 0) return []

  const steps = [0.25, 0.50, 0.75, 1.0]
  const icons  = ['💪','🔥','⚡','🏆']
  const goalFmt = goalDate
    ? new Date(goalDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    : ''

  return steps.map((pct, i) => ({
    weight: Math.round((startWeight - totalLoss * pct) * 10) / 10,
    label:  pct === 1.0
      ? `Goal${goalFmt ? ' · ' + goalFmt : ''}` // NO hardcoded "Japan"
      : `${Math.round(pct * 100)}% there`,
    icon:    icons[i],
    isGoal:  pct === 1.0,
  }))
}

export default function Milestones() {
  const { data } = useApp()
  const profile     = data.userProfile
  const startWeight = parseFloat(profile?.currentWeight) || null
  const goalWeight  = parseFloat(profile?.goalWeight)    || null

  // If no profile yet, show setup prompt — never show someone else's numbers
  if (!startWeight || !goalWeight) {
    return (
      <div className="card" style={{ textAlign:'center', color:'var(--muted)', padding:24 }}>
        <div style={{ fontSize:24, marginBottom:8 }}>🎯</div>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>No milestones yet</div>
        <div style={{ fontSize:13 }}>Complete onboarding to set your goal and unlock your milestone tracker.</div>
      </div>
    )
  }

  const goalDate    = profile?.goalDate || null
  const dates       = Object.keys(data.checkins || {}).sort()
  const latestDate  = dates[dates.length - 1]
  const currentWeight = latestDate
    ? (parseFloat(data.checkins[latestDate]?.weight) || data.lastWeight || startWeight)
    : (data.lastWeight || startWeight)

  const totalToLose = startWeight - goalWeight
  const lost        = +(startWeight - currentWeight).toFixed(1)
  const pctOverall  = totalToLose > 0 ? Math.min(100, Math.max(0, Math.round((lost / totalToLose) * 100))) : 0
  const milestones  = buildMilestones(startWeight, goalWeight, goalDate)

  const goalFmt = goalDate
    ? new Date(goalDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    : null

  return (
    <div className="card">
      <div className="flex-between" style={{ marginBottom:12 }}>
        <div>
          <div className="syne fw7" style={{ fontSize:13 }}>
            Current: <span style={{ color:'var(--accent)' }}>{currentWeight.toFixed(1)} lbs</span>
          </div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>
            {lost > 0 ? `${lost} lbs lost · ` : ''}
            {Math.max(0, currentWeight - goalWeight).toFixed(1)} lbs to goal
            {goalFmt ? ` · ${goalFmt}` : ''}
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div className="syne fw8" style={{ fontSize:20, color:'var(--accent)' }}>{pctOverall}%</div>
          <div style={{ fontSize:10, color:'var(--muted)' }}>to goal</div>
        </div>
      </div>

      <div className="prog-wrap" style={{ marginBottom:16 }}>
        <div className="prog-fill" style={{ width:`${pctOverall}%`, background:'var(--accent)' }} />
      </div>

      {milestones.map((m, i) => {
        const achieved = currentWeight <= m.weight
        const pct = Math.min(100, Math.max(0, Math.round(
          ((startWeight - currentWeight) / (startWeight - m.weight)) * 100
        )))
        return (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:10, padding:'10px 0',
            borderBottom: i < milestones.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{
              width:14, height:14, borderRadius:'50%', flexShrink:0,
              background: achieved ? 'var(--accent)' : 'var(--faint)',
              border: m.isGoal ? '2px solid var(--amber)' : 'none',
            }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color: achieved ? 'var(--accent)' : 'var(--text)' }}>
                {m.icon} {m.label}
              </div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>
                {m.weight} lbs · {achieved ? '✅ Achieved!' : `${pct}% there`}
              </div>
            </div>
            {achieved && <div style={{ fontSize:16 }}>🏆</div>}
          </div>
        )
      })}
    </div>
  )
}
