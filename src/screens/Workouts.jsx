import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { getProgramInfo } from '../lib/program'
import { WORKOUTS } from '../data/workouts'
import { supabase } from '../lib/supabase'

const ACTIVITY_QUICK = [
  { emoji:'🥋', name:'BJJ / Jiu-Jitsu',      cat:'martial arts' },
  { emoji:'🥊', name:'Boxing',                cat:'martial arts' },
  { emoji:'🦵', name:'Muay Thai',             cat:'martial arts' },
  { emoji:'⚽', name:'Soccer / Fútbol',       cat:'sport' },
  { emoji:'🏀', name:'Basketball',            cat:'sport' },
  { emoji:'🏊', name:'Swimming',              cat:'cardio' },
  { emoji:'🚴', name:'Cycling',               cat:'cardio' },
  { emoji:'🏃', name:'Running',               cat:'cardio' },
  { emoji:'🧘', name:'Yoga',                  cat:'recovery' },
  { emoji:'🤸', name:'Pilates',               cat:'recovery' },
  { emoji:'🏋️', name:'CrossFit',             cat:'strength' },
  { emoji:'🧗', name:'Rock climbing',         cat:'sport' },
  { emoji:'💃', name:'Dancing',               cat:'sport' },
  { emoji:'🎾', name:'Tennis',                cat:'sport' },
  { emoji:'🏄', name:'Surfing',               cat:'sport' },
  { emoji:'🥅', name:'Volleyball',            cat:'sport' },
]

function AdditionalTab({ user }) {
  const today = new Date().toISOString().split('T')[0]
  const [log, setLog]       = useState([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [duration, setDur]  = useState('60')
  const [intensity, setInt] = useState('moderate')
  const [notes, setNotes]   = useState('')
  const [custom, setCustom] = useState('')

  if (!loaded) {
    supabase.from('additional_workouts').select('*')
      .eq('user_id', user.id).eq('date', today)
      .order('logged_at', { ascending: true })
      .then(({ data }) => { setLog(data || []); setLoaded(true) })
  }

  const logActivity = async (activity) => {
    setSaving(true)
    const row = {
      user_id: user.id, date: today,
      activity: activity.name, emoji: activity.emoji,
      duration_min: parseInt(duration) || 60,
      intensity, notes,
      logged_at: new Date().toISOString(),
    }
    const { data } = await supabase.from('additional_workouts').insert(row).select().single()
    if (data) { setLog(l => [...l, data]); setNotes('') }
    setSaving(false)
  }

  const logCustom = async () => {
    if (!custom.trim()) return
    await logActivity({ name: custom, emoji: '⚡' })
    setCustom('')
  }

  const remove = async (id) => {
    await supabase.from('additional_workouts').delete().eq('id', id)
    setLog(l => l.filter(e => e.id !== id))
  }

  const totalMin = log.reduce((a, e) => a + (e.duration_min || 0), 0)

  return (
    <div>
      {/* Summary */}
      {log.length > 0 && (
        <div className="card flex-between" style={{ marginBottom:12 }}>
          <div>
            <div className="syne fw8" style={{ fontSize:22, color:'var(--purple)' }}>{totalMin} min</div>
            <div style={{ fontSize:12, color:'var(--muted)' }}>{log.length} activit{log.length === 1 ? 'y' : 'ies'} today</div>
          </div>
          <div style={{ fontSize:24 }}>🏆</div>
        </div>
      )}

      {/* Settings row */}
      <div className="card" style={{ marginBottom:12 }}>
        <div style={{ fontSize:12, fontWeight:600, marginBottom:10, color:'var(--muted)' }}>SESSION SETTINGS</div>
        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>Duration (min)</div>
            <input type="number" inputMode="numeric" value={duration}
              onChange={e => setDur(e.target.value)}
              style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', color:'var(--text)', fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, outline:'none', textAlign:'center' }} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>Intensity</div>
            <div style={{ display:'flex', gap:4 }}>
              {['light','moderate','hard'].map(v => (
                <button key={v} onClick={() => setInt(v)} style={{
                  flex:1, padding:'8px 4px', borderRadius:8, border:`1px solid ${intensity===v?'var(--accent)':'var(--border)'}`,
                  background: intensity===v ? 'rgba(0,200,150,.1)' : 'var(--faint)',
                  color: intensity===v ? 'var(--accent)' : 'var(--muted)',
                  fontSize:11, fontWeight:600, cursor:'pointer',
                }}>{v}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop:10 }}>
          <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>Notes (optional)</div>
          <input type="text" placeholder="e.g. sparring, drilled double leg..." value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', color:'var(--text)', fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:'none' }} />
        </div>
      </div>

      {/* Quick add */}
      <div className="section-label">⚡ Quick add activity</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
        {ACTIVITY_QUICK.map((act, i) => (
          <button key={i} onClick={() => logActivity(act)} disabled={saving}
            style={{
              display:'flex', alignItems:'center', gap:6,
              background:'var(--bg3)', border:'1px solid var(--border)',
              borderRadius:20, padding:'8px 12px', cursor:'pointer', fontSize:13, color:'var(--text)',
            }}>
            <span>{act.emoji}</span><span>{act.name}</span>
          </button>
        ))}
      </div>

      {/* Custom */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        <input type="text" placeholder="Custom activity..." value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && logCustom()}
          style={{ flex:1, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', color:'var(--text)', fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none' }} />
        <button onClick={logCustom} disabled={!custom.trim() || saving}
          style={{ background:'var(--purple)', border:'none', borderRadius:10, padding:'10px 16px', color:'#fff', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer' }}>
          + Log
        </button>
      </div>

      {/* Today's log */}
      <div className="section-label">📋 Today's log {saving && '· saving...'}</div>
      {log.length === 0 ? (
        <div className="card" style={{ textAlign:'center', color:'var(--muted)', padding:24, fontSize:13 }}>
          Nothing logged yet — tap an activity above to add it
        </div>
      ) : (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {log.map((entry, i) => (
            <div key={entry.id || i} style={{
              display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
              borderBottom: i < log.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontSize:22 }}>{entry.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600 }}>{entry.activity}</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>
                  {entry.duration_min} min · {entry.intensity}
                  {entry.notes ? ` · ${entry.notes}` : ''}
                </div>
              </div>
              <button onClick={() => remove(entry.id)} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:18, padding:4 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Workouts() {
  const { data, updateWorkout, updateProgWeight, user } = useApp()
  const info = getProgramInfo(new Date(), data.userProfile)

  const workouts = useMemo(() => {
    const plan = data.generatedPlan
    if (!plan?.workouts?.length || Object.keys(plan).length === 0) return WORKOUTS
    return plan.workouts.map((w, i) => ({
      name:      w.name || `Workout ${i + 1}`,
      subtitle:  w.subtitle || '',
      color:     WORKOUTS[i]?.color || 'var(--accent)',
      day:       WORKOUTS[i]?.day || '',
      exercises: (w.exercises || []).map(e => ({ name:e.name, sets:e.sets||'', note:e.note||'' })),
    }))
  }, [data.generatedPlan])

  const [activeTab, setActiveTab] = useState(info.dow !== 6 ? Math.min(info.dow, workouts.length - 1) : 0)
  const [mainTab, setMainTab]     = useState('workout')  // 'workout' | 'additional'

  const w = workouts[activeTab] || workouts[0]

  const today    = new Date().toISOString().split('T')[0]
  const progKey  = `${today}-${activeTab}`
  const progress = data.workoutProgress?.[progKey] || {}

  const toggleExercise = (idx, type) => {
    const cur  = progress[idx] || {}
    const next = { ...progress, [idx]: { ...cur, [type]: !cur[type] } }
    if (type === 'done' && !cur.done) next[idx].skip = false
    if (type === 'skip' && !cur.skip) next[idx].done = false
    updateWorkout(activeTab, next)
  }

  const weekNum  = info.weekNum
  const weekKey  = `${weekNum}-${activeTab}`
  const weights  = data.progWeights?.[weekKey] || {}
  const lastKey  = `${weekNum - 1}-${activeTab}`
  const lastW    = data.progWeights?.[lastKey] || {}

  const done  = Object.values(progress).filter(v => v.done).length
  const total = w.exercises.filter(e => !e.name.startsWith('—') && !e.name.startsWith('🏃') && !e.name.startsWith('🚴') && !e.name.startsWith('🔄') && !e.name.startsWith('🔵') && !e.name.startsWith('Cool')).length
  const comp  = total > 0 ? Math.round((done / total) * 100) : 0

  // Day location badge
  const isToday   = activeTab === (info.dow !== 6 ? info.dow : 0)
  const gymDays   = data.userProfile?.gymDays || []
  const dayLabel  = DOW_LABELS[activeTab]
  const isGym     = gymDays.length === 0 || gymDays.includes(dayLabel)
  const locBadge  = isGym ? '🏋️ Gym' : '🏠 Home'

  return (
    <div className="screen">
      <div className="flex-between" style={{ marginBottom:4 }}>
        <div>
          <div className="page-title">Workouts</div>
          <div className="page-sub">Week {info.weekNum} · {info.weekRange}</div>
        </div>
        {info.isRestDay && <div className="badge badge-purple">😴 Rest Day</div>}
      </div>

      {/* Main tab: Workout vs Additional */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['workout','💪 Workout'],['additional','⚡ Additional']].map(([id, lbl]) => (
          <button key={id} onClick={() => setMainTab(id)} style={{
            flex:1, padding:'10px', borderRadius:12,
            border:`2px solid ${mainTab===id?'var(--accent)':'var(--border)'}`,
            background: mainTab===id ? 'rgba(0,200,150,.1)' : 'var(--bg3)',
            color: mainTab===id ? 'var(--accent)' : 'var(--muted)',
            fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer',
          }}>{lbl}</button>
        ))}
      </div>

      {mainTab === 'additional' ? (
        <AdditionalTab user={user} />
      ) : (
        <>
          {/* Day tab strip */}
          <div className="tab-strip">
            {workouts.map((wo, i) => (
              <button key={i} className={`tab-chip ${activeTab===i?'active':''}`} onClick={() => setActiveTab(i)}
                style={{ position:'relative' }}>
                {DOW_LABELS[i]}
                {i === info.dow && !info.isRestDay && (
                  <span style={{ position:'absolute', top:-3, right:-3, width:7, height:7, borderRadius:'50%', background:'var(--accent)' }} />
                )}
              </button>
            ))}
          </div>

          {/* Workout header */}
          <div className="card" style={{ background:`linear-gradient(135deg, ${w.color}18, var(--bg3))`, borderColor:`${w.color}40`, marginBottom:12 }}>
            <div className="flex-between">
              <div className="syne fw7" style={{ fontSize:15, color:w.color }}>{w.name}</div>
              <div className="badge" style={{ background: isGym?'rgba(0,200,150,.12)':'rgba(59,130,246,.12)', color: isGym?'var(--accent)':'var(--blue)' }}>{locBadge}</div>
            </div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{w.subtitle}</div>
            {total > 0 && (
              <>
                <div className="prog-wrap" style={{ marginTop:10 }}>
                  <div className="prog-fill" style={{ width:`${comp}%`, background:w.color }} />
                </div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{done}/{total} exercises · {comp}% compliance</div>
              </>
            )}
          </div>

          {/* Exercises */}
          {w.exercises.map((e, i) => {
            const isHeader   = e.name.startsWith('—')
            const isCardio   = e.name.startsWith('🏃') || e.name.startsWith('🚴') || e.name.startsWith('🔄') || e.name.startsWith('🔵')
            const isCooldown = e.name.startsWith('Cool')
            const isDone     = progress[i]?.done
            const isSkipped  = progress[i]?.skip
            const hasWeight  = e.sets && !e.sets.includes('min') && !isHeader && !isCardio && !isCooldown

            if (isHeader) return (
              <div key={i} style={{ margin:'12px 0 6px', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)' }}>
                {e.name.replace(/—/g, '').trim()}
              </div>
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
                        placeholder={lastW[i] || '0'} value={weights[i] || ''}
                        onChange={e2 => updateProgWeight(weekNum, activeTab, { ...weights, [i]: e2.target.value })}
                        style={{ width:80, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--accent)', fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, outline:'none' }} />
                      <span style={{ fontSize:13, color:'var(--muted)' }}>lbs</span>
                    </div>
                    {lastW[i] ? <div style={{ fontSize:11, color:'var(--blue)', marginTop:4 }}>📈 Last week: {lastW[i]} lbs → try {parseFloat(lastW[i]) + 5} lbs</div>
                              : <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>First time — start light, nail the form</div>}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
