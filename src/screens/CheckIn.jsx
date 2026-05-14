import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { getProgramInfo } from '../lib/program'

const WORKOUTS_LABELS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function CheckIn() {
  const { data, submitCheckin } = useApp()
  const info = getProgramInfo()
  const today = new Date().toISOString().split('T')[0]

  const existing   = data.checkins?.[today] || {}
  const [weight, setWeight]   = useState(existing.weight || '')
  const [energy, setEnergy]   = useState(existing.energy || '3')
  const [wellbeing, setWell]  = useState(existing.well || '3')
  const [hard, setHard]       = useState(existing.hard || '')
  const [improve, setImprove] = useState(existing.improve || '')
  const [toggles, setToggles] = useState(existing.workouts || {})
  const [saved, setSaved]     = useState(false)

  const toggle = (k) => setToggles(t => ({ ...t, [k]: !t[k] }))
  const doneCount = Object.values(toggles).filter(Boolean).length

  const handleSave = async () => {
    await submitCheckin(today, weight, { workouts: toggles, energy, well: wellbeing, hard, improve })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // Weight chart
  const chartData = useMemo(() => {
    const entries = Object.entries(data.checkins || {})
      .filter(([,d]) => d?.weight)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([date, d]) => ({ date, weight: parseFloat(d.weight) }))
    return entries
  }, [data.checkins])

  const renderChart = () => {
    if (chartData.length < 2) return (
      <div style={{ textAlign:'center', padding:'24px 0', color:'var(--muted)', fontSize:13 }}>Log 2+ weight entries to see your progress chart</div>
    )

    const W = 320, H = 160, PAD = 28
    const weights    = chartData.map(e => e.weight)
    const minW       = Math.min(...weights, 285) - 5
    const maxW       = Math.max(...weights, 350) + 5
    const goalDate   = new Date('2026-12-15')
    const minDate    = new Date(chartData[0].date).getTime()
    const maxDate    = goalDate.getTime()

    const toX = d => PAD + ((new Date(d).getTime() - minDate) / (maxDate - minDate)) * (W - PAD*2)
    const toY = w => PAD + ((maxW - w) / (maxW - minW)) * (H - PAD*2)

    let content = ''

    // Grid lines
    ;[350, 325, 300, 285].forEach(w => {
      if (w < minW || w > maxW) return
      const y = toY(w)
      content += `<line x1="${PAD}" y1="${y}" x2="${W-PAD}" y2="${y}" stroke="rgba(255,255,255,.06)" stroke-width="1"/><text x="${PAD-3}" y="${y+4}" text-anchor="end" fill="rgba(255,255,255,.25)" font-size="9" font-family="DM Sans">${w}</text>`
    })

    // Goal projection dashed line
    const fx = toX(chartData[0].date), fy = toY(chartData[0].weight)
    const gx = toX(goalDate), gy = toY(285)
    content += `<line x1="${fx}" y1="${fy}" x2="${gx}" y2="${gy}" stroke="rgba(251,191,36,.3)" stroke-width="1.5" stroke-dasharray="4,3"/>`

    // Actual path
    const pts = chartData.map(e => `${toX(e.date)},${toY(e.weight)}`).join(' ')
    content += `<polyline points="${pts}" fill="none" stroke="#00c896" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`

    // Dots
    chartData.forEach((e, i) => {
      const x = toX(e.date), y = toY(e.weight)
      content += `<circle cx="${x}" cy="${y}" r="4" fill="#00c896" stroke="#0f1923" stroke-width="2"/>`
      if (i === chartData.length - 1) content += `<text x="${x}" y="${y-10}" text-anchor="middle" fill="#00c896" font-size="10" font-family="Syne" font-weight="700">${e.weight}</text>`
    })

    // Goal dot
    content += `<circle cx="${gx}" cy="${gy}" r="5" fill="none" stroke="rgba(251,191,36,.6)" stroke-width="2"/><text x="${gx}" y="${gy-10}" text-anchor="middle" fill="rgba(251,191,36,.8)" font-size="9" font-family="DM Sans">285 🇯🇵</text>`

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
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>Log your weight first thing in the morning, before eating.</div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <input type="number" inputMode="decimal" placeholder="335.4" value={weight}
            onChange={e => setWeight(e.target.value)}
            style={{ flex:1, background:'var(--bg)', border:'2px solid var(--accent)', borderRadius:12, padding:'12px 16px', color:'var(--text)', fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, outline:'none', textAlign:'center' }}
          />
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
                <div className="toggle-sub">{['Cardio + Circuit + Upper','Cardio + Core','Cardio + Circuit + Lower','Cardio + Core','Cardio + Circuit + Pull','Cardio + Core + Stretch'][i]}</div>
              </div>
              <button className={`toggle ${toggles[k]?'on':''}`} onClick={() => toggle(k)}>
                <div className="toggle-thumb" />
              </button>
            </div>
          )
        })}
        <div style={{ marginTop:10, padding:'8px 12px', background:'var(--faint)', borderRadius:8, fontSize:12, color:'var(--muted)' }}>
          {doneCount}/6 sessions · {Math.round((doneCount/6)*100)}% compliance
          {doneCount >= 4 && <span style={{ color:'var(--accent)', marginLeft:8 }}>✅ Goal met</span>}
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

      {/* Reflections */}
      <div className="section-label">📝 Reflections</div>
      <div className="card" style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>What went well this week?</div>
          <textarea value={hard} onChange={e => setHard(e.target.value)} rows={2}
            placeholder="Hits a new PR, stayed consistent..."
            style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px', color:'var(--text)', fontFamily:"'DM Sans',sans-serif", fontSize:13, resize:'none', outline:'none' }} />
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>What needs improvement?</div>
          <textarea value={improve} onChange={e => setImprove(e.target.value)} rows={2}
            placeholder="Sleep, meal prep, hydration..."
            style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px', color:'var(--text)', fontFamily:"'DM Sans',sans-serif", fontSize:13, resize:'none', outline:'none' }} />
        </div>
      </div>

      {/* Weight Chart */}
      <div className="section-label">📈 Weight journey</div>
      <div className="chart-wrap">{renderChart()}</div>

      {/* Save */}
      <button className="submit-btn" onClick={handleSave}>
        {saved ? '✅ Check-in saved!' : '💾 Save this week\'s check-in'}
      </button>
    </div>
  )
}
