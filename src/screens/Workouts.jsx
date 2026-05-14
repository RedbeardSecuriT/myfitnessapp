import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { getProgramInfo } from '../lib/program'
import { WORKOUTS } from '../data/workouts'

export default function Workouts() {
  const { data, updateWorkout, updateProgWeight } = useApp()
  const info = getProgramInfo()

  const workouts = useMemo(() => {
    const plan = data.generatedPlan
    if (!plan?.workouts?.length || Object.keys(plan).length === 0) return WORKOUTS
    return plan.workouts.map((w, i) => ({
      name:      w.name || `Workout ${i+1}`,
      subtitle:  w.subtitle || '',
      color:     WORKOUTS[i]?.color || 'var(--accent)',
      day:       WORKOUTS[i]?.day || '',
      exercises: (w.exercises || []).map(e => ({ name:e.name, sets:e.sets||'', note:e.note||'' }))
    }))
  }, [data.generatedPlan])

  const [activeTab, setActiveTab] = useState(Math.max(0, (info.workoutIdx ?? 0)))
  const w = workouts[activeTab] || workouts[0]

  const today    = new Date().toISOString().split('T')[0]
  const progKey  = `${today}-${activeTab}`
  const progress = data.workoutProgress?.[progKey] || {}

  const toggleExercise = (idx, type) => {
    const cur = progress[idx] || {}
    const next = { ...progress, [idx]: { ...cur, [type]: type === 'done' ? !cur.done : !cur.skip } }
    if (type === 'done' && !cur.done) next[idx].skip = false
    if (type === 'skip' && !cur.skip) next[idx].done = false
    updateWorkout(activeTab, next)
  }

  const weekNum  = info.weekNum
  const weekKey  = `${weekNum}-${activeTab}`
  const weights  = data.progWeights?.[weekKey] || {}
  const lastKey  = `${weekNum-1}-${activeTab}`
  const lastW    = data.progWeights?.[lastKey] || {}

  const done  = Object.values(progress).filter(v => v.done).length
  const total = w.exercises.filter(e => !e.name.startsWith('—') && !e.name.startsWith('🏃') && !e.name.startsWith('🚴') && !e.name.startsWith('🔄') && !e.name.startsWith('🔵') && !e.name.startsWith('Cool')).length
  const compliance = total > 0 ? Math.round((done/total)*100) : 0

  return (
    <div className="screen">
      <div className="page-title" style={{ marginBottom:4 }}>Workouts</div>
      <div className="page-sub" style={{ marginBottom:16 }}>Week {info.weekNum} · Track every set</div>

      {/* Tab strip */}
      <div className="tab-strip">
        {workouts.map((wo, i) => (
          <button key={i} className={`tab-chip ${activeTab===i?'active':''}`} onClick={() => setActiveTab(i)}>
            {wo.day?.substring(0,3) || `W${i+1}`}
          </button>
        ))}
      </div>

      {/* Workout header */}
      <div className="card" style={{ background:`linear-gradient(135deg, ${w.color}18, var(--bg3))`, borderColor:`${w.color}40`, marginBottom:12 }}>
        <div className="syne fw7" style={{ fontSize:16, color:w.color }}>{w.name}</div>
        <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{w.subtitle}</div>
        {total > 0 && (
          <>
            <div className="prog-wrap" style={{ marginTop:10 }}>
              <div className="prog-fill" style={{ width:`${compliance}%`, background:w.color }} />
            </div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{done}/{total} exercises · {compliance}% compliance</div>
          </>
        )}
      </div>

      {/* Exercises */}
      {w.exercises.map((e, i) => {
        const isHeader    = e.name.startsWith('—')
        const isCardio    = e.name.startsWith('🏃')||e.name.startsWith('🚴')||e.name.startsWith('🔄')||e.name.startsWith('🔵')
        const isCooldown  = e.name.startsWith('Cool')
        const isDone      = progress[i]?.done
        const isSkipped   = progress[i]?.skip
        const hasWeight   = e.sets && !e.sets.includes('min') && !isHeader && !isCardio && !isCooldown

        if (isHeader) return (
          <div key={i} style={{ margin:'12px 0 6px', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)' }}>{e.name.replace('—','').trim()}</div>
        )

        return (
          <div key={i} className={`ex-card ${isDone?'ex-done':isSkipped?'ex-skipped':''}`}>
            <div className="flex-between" style={{ marginBottom:6 }}>
              <div style={{ flex:1, marginRight:12 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{e.name}</div>
                {e.sets && <div className="badge badge-green" style={{ marginTop:4 }}>{e.sets}</div>}
              </div>
              {!isCardio && !isCooldown && !isHeader && (
                <div style={{ display:'flex', gap:6 }}>
                  <button className={`ex-btn ex-btn-done ${isDone?'active':''}`} onClick={() => toggleExercise(i,'done')}>✓ Done</button>
                  <button className={`ex-btn ex-btn-skip ${isSkipped?'active':''}`} onClick={() => toggleExercise(i,'skip')}>Skip</button>
                </div>
              )}
            </div>

            {e.note && <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.5 }}>{e.note}</div>}

            {hasWeight && (
              <div style={{ marginTop:10, padding:10, background:'var(--faint)', borderRadius:8 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)', marginBottom:6 }}>Weight used</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="number" inputMode="decimal"
                    placeholder={lastW[i] || '0'}
                    value={weights[i] || ''}
                    onChange={e => {
                      const next = { ...weights, [i]: e.target.value }
                      updateProgWeight(weekNum, activeTab, next)
                    }}
                    style={{ width:80, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--accent)', fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, outline:'none' }}
                  />
                  <span style={{ fontSize:13, color:'var(--muted)' }}>lbs</span>
                </div>
                {lastW[i] && <div style={{ fontSize:11, color:'var(--blue)', marginTop:4 }}>📈 Last week: {lastW[i]} lbs → try {parseFloat(lastW[i])+5} lbs</div>}
                {!lastW[i] && <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>First time — start light, nail the form</div>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
