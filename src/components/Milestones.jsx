import { useApp } from '../context/AppContext'

// Generate milestones dynamically from start→goal weight
function buildMilestones(startWeight, goalWeight) {
  const totalLoss = startWeight - goalWeight
  if (totalLoss <= 0) return []

  const milestones = []
  const increments = [0.15, 0.30, 0.50, 0.70, 0.85, 1.0]
  const labels     = ['First 15%', '30% there', 'Halfway', '70% done', 'Almost there', 'Goal reached!']
  const icons      = ['💪', '🏃', '🔥', '⚡', '🚀', '🏆']

  increments.forEach((pct, i) => {
    const targetWeight = Math.round((startWeight - totalLoss * pct) * 10) / 10
    milestones.push({
      weight:  targetWeight,
      label:   labels[i],
      icon:    icons[i],
      isGoal:  pct === 1.0,
    })
  })

  return milestones
}

export default function Milestones() {
  const { data } = useApp()
  const profile = data.userProfile

  const startWeight = parseFloat(profile?.currentWeight) || 350
  const goalWeight  = parseFloat(profile?.goalWeight)    || 285
  const goalDate    = profile?.goalDate ? new Date(profile.goalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Dec 15, 2026'

  const dates       = Object.keys(data.checkins || {}).sort()
  const latestDate  = dates[dates.length - 1]
  const currentWeight = latestDate
    ? parseFloat(data.checkins[latestDate]?.weight) || data.lastWeight || startWeight
    : data.lastWeight || startWeight

  const lost        = +(startWeight - currentWeight).toFixed(1)
  const totalToLose = startWeight - goalWeight
  const pctOverall  = totalToLose > 0 ? Math.min(100, Math.round((lost / totalToLose) * 100)) : 0

  const milestones  = buildMilestones(startWeight, goalWeight)

  return (
    <div className="card">
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <div>
          <div className="syne fw7" style={{ fontSize: 13 }}>
            Current: <span style={{ color: 'var(--accent)' }}>{currentWeight.toFixed(1)} lbs</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            {lost > 0 ? `${lost} lbs lost · ` : ''}{(currentWeight - goalWeight).toFixed(1)} lbs to goal · {goalDate}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="syne fw8" style={{ fontSize: 20, color: 'var(--accent)' }}>{pctOverall}%</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>to goal</div>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="prog-wrap" style={{ marginBottom: 16 }}>
        <div className="prog-fill" style={{ width: `${pctOverall}%`, background: 'var(--accent)' }} />
      </div>

      {milestones.map((m, i) => {
        const achieved = currentWeight <= m.weight
        const pct = Math.min(100, Math.max(0, Math.round(
          ((startWeight - currentWeight) / (startWeight - m.weight)) * 100
        )))
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 0',
            borderBottom: i < milestones.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
              background: achieved ? 'var(--accent)' : 'var(--faint)',
              border: m.isGoal ? '2px solid var(--amber)' : 'none',
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: achieved ? 'var(--accent)' : 'var(--text)' }}>
                {m.icon} {m.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {m.weight} lbs {achieved ? '✅ Achieved!' : `· ${pct}% there`}
                {m.isGoal && !achieved ? ` · Goal by ${goalDate}` : ''}
              </div>
            </div>
            {achieved && <div style={{ fontSize: 16 }}>🏆</div>}
          </div>
        )
      })}
    </div>
  )
}
