import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { getProgramInfo } from '../lib/program'
import { BACKEND_URL } from '../lib/supabase'

const WORKOUTS_LABELS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const WORKOUT_SUBS   = [
  'Cardio + PF Circuit + Upper Body',
  'Cardio + 12-min Ab Circuit',
  'Cardio + PF Circuit + Lower Body',
  'Cardio + 12-min Ab Circuit',
  'Cardio + PF Circuit + Pull Day',
  'Cardio + 12-min Ab Circuit + Stretch',
]

export default function CheckIn() {
  const { data, submitCheckin, updatePlan, user } = useApp()
  const info  = getProgramInfo()
  const today = new Date().toISOString().split('T')[0]

  const existing = data.checkins?.[today] || {}
  const [weight,    setWeight]   = useState(existing.weight   || '')
  const [energy,    setEnergy]   = useState(existing.energy   || '3')
  const [wellbeing, setWell]     = useState(existing.well     || '3')
  const [well,      setWellText] = useState(existing.wellText || '')   // "What went well"
  const [hard,      setHard]     = useState(existing.hard     || '')   // "What was hard"
  const [improve,   setImprove]  = useState(existing.improve  || '')
  const [toggles,   setToggles]  = useState(existing.workouts || {})
  const [saved,     setSaved]    = useState(false)

  // Plan generation state
  const [generating, setGenerating] = useState(false)
  const [genStatus,  setGenStatus]  = useState('')
  const [genError,   setGenError]   = useState('')
  const [genDone,    setGenDone]    = useState(false)

  const toggle    = (k) => setToggles(t => ({ ...t, [k]: !t[k] }))
  const doneCount = Object.values(toggles).filter(Boolean).length
  const compPct   = Math.round((doneCount / 6) * 100)

  const handleSave = async () => {
    await submitCheckin(today, weight, {
      workouts: toggles,
      energy,
      well: wellbeing,      // emoji wellbeing rating → 'well' key
      wellText: well,       // text: what went well → 'wellText' key
      hard,                 // text: what was hard → 'hard' key
      improve,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleGenerateWeek = async () => {
    if (!user?.id) return
    setGenerating(true)
    setGenError('')
    setGenDone(false)

    const msgs = [
      'Analyzing your check-in data...',
      'Building next week\'s meal plan...',
      'Selecting overnight oat combinations...',
      'Adjusting workout intensity...',
      'Finalizing your personalized week...',
    ]
    let si = 0
    setGenStatus(msgs[0])
    const iv = setInterval(() => { si = (si + 1) % msgs.length; setGenStatus(msgs[si]) }, 3000)

    try {
      const res = await fetch(`${BACKEND_URL}/generate-week`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, weekNum: info.weekNum }),
      })
      const result = await res.json()
      clearInterval(iv)

      if (!result.success) throw new Error(result.error || 'Plan generation failed')

      // Merge generated weekly data into the existing plan in context
      const currentPlan = data.generatedPlan || {}
      const updatedPlan = {
        ...currentPlan,
        meals: {
          ...currentPlan.meals,
          oats:   result.plan?.meals?.oats   || currentPlan.meals?.oats,
          lunch:  result.plan?.meals?.lunch  || currentPlan.meals?.lunch,
          dinner: result.plan?.meals?.dinner || currentPlan.meals?.dinner,
          snacks: result.plan?.meals?.snacks || currentPlan.meals?.snacks,
        },
        workoutNotes:     result.plan?.workoutNotes,
        groceryAdditions: result.plan?.groceryAdditions,
        weeklyMessage:    result.plan?.personalMessage,
        _generatedWeek:   result.weekNum,
        _generatedAt:     result.generatedAt,
      }
      updatePlan(data.userProfile, updatedPlan)
      setGenDone(true)
      setGenStatus(`✅ Week ${result.weekNum} plan loaded!`)
    } catch (err) {
      clearInterval(iv)
      setGenError(err.message)
      setGenerating(false)
    }
  }

  // Weight chart
  const chartData = useMemo(() => {
    const entries = Object.entries(data.checkins || {})
      .filter(([, d]) => d?.weight)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({ date, weight: parseFloat(d.weight) }))
    return entries
  }, [data.checkins])

  const profile     = data.userProfile
  const startWeight = parseFloat(profile?.currentWeight) || 0
  const goalWeight  = parseFloat(profile?.goalWeight)    || 0
  const goalDateStr = profile?.goalDate || '2026-12-15'

  const renderChart = () => {
    if (chartData.length < 2) return (
      <div style={{ textAlign:'center', padding:'24px 0', color:'var(--muted)', fontSize:13 }}>
        Log 2+ weight entries to see your progress chart
      </div>
    )

    const W = 320, H = 160, PAD = 28
    const weights  = chartData.map(e => e.weight)
    const minW     = Math.min(...weights, goalWeight) - 5
    const maxW     = Math.max(...weights, startWeight > 0 ? startWeight : weights[0]) + 5
    const goalDate = new Date(goalDateStr)
    const minDate  = new Date(chartData[0].date).getTime()
    const maxDate  = goalDate.getTime()

    const toX = d => PAD + ((new Date(d).getTime() - minDate) / (maxDate - minDate)) * (W - PAD*2)
    const toY = w => PAD + ((maxW - w) / (maxW - minW)) * (H - PAD*2)

    let content = ''

    const range = maxW - minW
    const step  = range > 80 ? 25 : range > 40 ? 10 : 5
    const gridStart = Math.ceil(minW / step) * step
    for (let w = gridStart; w <= maxW; w += step) {
      const y = toY(w)
      content += `<line x1="${PAD}" y1="${y}" x2="${W-PAD}" y2="${y}" stroke="rgba(255,255,255,.06)" stroke-width="1"/>`
      content += `<text x="${PAD-3}" y="${y+4}" text-anchor="end" fill="rgba(255,255,255,.25)" font-size="9" font-family="DM Sans">${w}</text>`
    }

    if (chartData.length > 0) {
      const fx = toX(chartData[0].date), fy = toY(chartData[0].weight)
      const gx = toX(goalDate),          gy = toY(goalWeight)
      content += `<line x1="${fx}" y1="${fy}" x2="${gx}" y2="${gy}" stroke="rgba(251,191,36,.3)" stroke-width="1.5" stroke-dasharray="4,3"/>`
    }

    const pts = chartData.map(e => `${toX(e.date)},${toY(e.weight)}`).join(' ')
    content += `<polyline points="${pts}" fill="none" stroke="#00c896" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`

    chartData.forEach((e, i) => {
      const x = toX(e.date), y = toY(e.weight)
      content += `<circle cx="${x}" cy="${y}" r="4" fill="#00c896" stroke="#0f1923" stroke-width="2"/>`
      if (i === chartData.length - 1) {
        content += `<text x="${x}" y="${y-10}" text-anchor="middle" fill="#00c896" font-size="10" font-family="Syne" font-weight="700">${e.weight}</text>`
      }
    })

    if (goalWeight > 0) {
      const gx = toX(goalDate), gy = toY(goalWeight)
      content += `<circle cx="${gx}" cy="${gy}" r="5" fill="none" stroke="rgba(251,191,36,.6)" stroke-width="2"/>`
      content += `<text x="${gx}" y="${gy-10}" text-anchor="middle" fill="rgba(251,191,36,.8)" font-size="9" font-family="DM Sans">${goalWeight} 🎯</text>`
    }

    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:H, overflow:'visible' }}
        dangerouslySetInnerHTML={{ __html: content }} />
    )
  }

  const EmojiScale = ({ value, onChange, options }) => (
    <div style={{ display:'flex', gap:6 }}>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          flex:1, padding:'10px 6px', borderRadius:10, border:`2px solid ${value==o.v?o.color:'var(--border)'}`,
          background: value==o.v ? `${o.color}18` : 'var(--faint)',
          cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4,
        }}>
          <span style={{ fontSize:20 }}>{o.emoji}</span>
          <span style={{ fontSize:9, color: value==o.v?o.color:'var(--muted)' }}>{o.lbl}</span>
        </button>
      ))}
    </div>
  )

  return (
    <div className="screen">
      <div className="page-title" style={{ marginBottom:4 }}>Weekly Check-In</div>
      <div className="page-sub" style={{ marginBottom:16 }}>Week {info.weekNum} · {info.weekRange}</div>

      {/* Weight */}
      <div className="section-label">⚖️ This week's weight</div>
      <div className="card">
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>Log first thing in the morning, before eating.</div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <input type="number" inputMode="decimal"
            placeholder={startWeight > 0 ? startWeight.toFixed(1) : 'e.g. 220'}
            value={weight} onChange={e => setWeight(e.target.value)}
            style={{ flex:1, background:'var(--bg)', border:'2px solid var(--accent)', borderRadius:12, padding:'12px 16px', color:'var(--text)', fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, outline:'none', textAlign:'center' }} />
          <span style={{ fontSize:16, color:'var(--muted)' }}>lbs</span>
        </div>
      </div>

      {/* Workout compliance */}
      <div className="section-label">💪 Workouts completed this week</div>
      <div className="card">
        {WORKOUTS_LABELS.map((lbl, i) => {
          const k = String.fromCharCode(97+i)
          return (
            <div key={k} className="toggle-row">
              <div>
                <div className="toggle-lbl">{lbl}</div>
                <div className="toggle-sub">{WORKOUT_SUBS[i]}</div>
              </div>
              <button className={`toggle ${toggles[k]?'on':''}`} onClick={() => toggle(k)}>
                <div className="toggle-thumb" />
              </button>
            </div>
          )
        })}
        <div style={{ marginTop:10, padding:'8px 12px', background:'var(--faint)', borderRadius:8, fontSize:12, color:'var(--muted)' }}>
          {doneCount}/6 sessions · {compPct}% compliance
          {doneCount >= 4
            ? <span style={{ color:'var(--accent)', marginLeft:8 }}>✅ 70% goal met</span>
            : <span style={{ color:'var(--amber)', marginLeft:8 }}>⚠️ {4 - doneCount} more to hit 70%</span>
          }
        </div>
      </div>

      {/* Energy */}
      <div className="section-label">⚡ Energy levels this week</div>
      <div className="card">
        <EmojiScale value={energy} onChange={setEnergy} options={[
          {v:'1',emoji:'😴',lbl:'Exhausted',color:'var(--red)'},
          {v:'2',emoji:'😕',lbl:'Low',color:'var(--amber)'},
          {v:'3',emoji:'😐',lbl:'OK',color:'var(--muted)'},
          {v:'4',emoji:'😊',lbl:'Good',color:'var(--accent)'},
          {v:'5',emoji:'🔥',lbl:'Amazing',color:'var(--accent)'},
        ]} />
      </div>

      {/* Wellbeing */}
      <div className="section-label">❤️ Overall wellbeing</div>
      <div className="card">
        <EmojiScale value={wellbeing} onChange={setWell} options={[
          {v:'1',emoji:'😩',lbl:'Rough',color:'var(--red)'},
          {v:'2',emoji:'😟',lbl:'Meh',color:'var(--amber)'},
          {v:'3',emoji:'😌',lbl:'Fine',color:'var(--muted)'},
          {v:'4',emoji:'😁',lbl:'Great',color:'var(--accent)'},
          {v:'5',emoji:'🤩',lbl:'Best',color:'var(--accent)'},
        ]} />
      </div>

      {/* Reflections — FIXED: correct field mapping */}
      <div className="section-label">📝 Reflections</div>
      <div className="card" style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>✅ What went well this week?</div>
          <textarea value={well} onChange={e => setWellText(e.target.value)} rows={2}
            placeholder="Hit a new PR, stayed consistent, meal prepped Sunday..."
            style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px', color:'var(--text)', fontFamily:"'DM Sans',sans-serif", fontSize:13, resize:'none', outline:'none' }} />
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>😤 What was hard or went wrong?</div>
          <textarea value={hard} onChange={e => setHard(e.target.value)} rows={2}
            placeholder="Sleep was rough, skipped Thursday, ate off-plan Saturday..."
            style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px', color:'var(--text)', fontFamily:"'DM Sans',sans-serif", fontSize:13, resize:'none', outline:'none' }} />
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>🎯 One thing to improve next week</div>
          <textarea value={improve} onChange={e => setImprove(e.target.value)} rows={2}
            placeholder="Sleep, meal prep, hydration, showing up on Thursdays..."
            style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px', color:'var(--text)', fontFamily:"'DM Sans',sans-serif", fontSize:13, resize:'none', outline:'none' }} />
        </div>
      </div>

      {/* Weight Chart */}
      <div className="section-label">📈 Weight journey</div>
      <div className="chart-wrap">{renderChart()}</div>

      {/* Save */}
      <button className="submit-btn" onClick={handleSave}>
        {saved ? '✅ Check-in saved!' : "💾 Save this week's check-in"}
      </button>

      {/* ── AI Plan Generation ───────────────────────────────────────────────── */}
      <div className="section-label" style={{ marginTop:24 }}>🤖 Next week's AI plan</div>
      <div className="card">
        <div style={{ fontSize:13, color:'var(--muted)', marginBottom:16, lineHeight:1.6 }}>
          Claude analyzes your check-in data — compliance, energy, weight trend — and generates a personalized meal and workout plan for next week.
        </div>

        {genError && (
          <div style={{ padding:'10px 14px', background:'rgba(239,68,68,.1)', border:'1px solid var(--red)', borderRadius:10, fontSize:13, color:'var(--red)', marginBottom:12 }}>
            ⚠️ {genError}
          </div>
        )}

        {genDone && !genError && (
          <div style={{ padding:'10px 14px', background:'rgba(0,200,150,.1)', border:'1px solid var(--accent)', borderRadius:10, fontSize:13, color:'var(--accent)', marginBottom:12 }}>
            {genStatus}
          </div>
        )}

        {generating && !genDone && (
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--faint)', borderRadius:10, marginBottom:12 }}>
            <div className="ob-spinner" style={{ width:20, height:20, minWidth:20, borderWidth:2 }} />
            <div style={{ fontSize:13, color:'var(--muted)' }}>{genStatus}</div>
          </div>
        )}

        <button
          onClick={handleGenerateWeek}
          disabled={generating}
          style={{
            width:'100%', padding:'14px', borderRadius:14,
            background: generating ? 'var(--faint)' : 'linear-gradient(135deg, var(--accent), #00a878)',
            border:'none', color: generating ? 'var(--muted)' : '#fff',
            fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15,
            cursor: generating ? 'not-allowed' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          }}>
          {generating
            ? '⏳ Generating...'
            : genDone ? '🔄 Regenerate next week\'s plan' : '🤖 Generate next week\'s AI plan'
          }
        </button>
        <div style={{ fontSize:11, color:'var(--muted)', textAlign:'center', marginTop:8 }}>
          Takes ~30 seconds · Updates Meals and Grocery tabs
        </div>
      </div>
    </div>
  )
}
