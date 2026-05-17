import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { supabase, BACKEND_URL } from '../lib/supabase'

// ── Quick-add items (PR-first) ────────────────────────────────────────────────
const QUICK_ITEMS = [
  { emoji:'☕', name:'Coffee / Café',          cal:5,   cat:'drink' },
  { emoji:'☕', name:'Coffee with milk',        cal:45,  cat:'drink' },
  { emoji:'🧃', name:'Jugo / Juice',            cal:120, cat:'drink' },
  { emoji:'🥤', name:'Soda / Refresco',         cal:150, cat:'drink' },
  { emoji:'🥛', name:'Milk / Leche',            cal:120, cat:'drink' },
  { emoji:'🍺', name:'Beer / Cerveza',          cal:150, cat:'drink' },
  { emoji:'🥃', name:'Rum / Ron',               cal:100, cat:'drink' },
  { emoji:'🍌', name:'Banana',                  cal:105, cat:'fruit'  },
  { emoji:'🥚', name:'Eggs (2)',                cal:140, cat:'food'   },
  { emoji:'🍳', name:'Huevos revueltos',        cal:200, cat:'food'   },
  { emoji:'🥣', name:'Overnight oats',          cal:420, cat:'food'   },
  { emoji:'🍗', name:'Chicken thigh (6oz)',     cal:280, cat:'food'   },
  { emoji:'🍖', name:'Chicken breast (6oz)',    cal:240, cat:'food'   },
  { emoji:'🍛', name:'Arroz con pollo',         cal:520, cat:'food'   },
  { emoji:'🍚', name:'Brown rice (½ cup)',      cal:110, cat:'food'   },
  { emoji:'🫘', name:'Habichuelas (½ cup)',     cal:115, cat:'food'   },
  { emoji:'🌯', name:'Turkey wrap',             cal:380, cat:'food'   },
  { emoji:'🥑', name:'Aguacate (½)',            cal:120, cat:'food'   },
  { emoji:'🫔', name:'Tostones (4)',            cal:160, cat:'food'   },
  { emoji:'🐟', name:'Tuna (4oz)',              cal:120, cat:'food'   },
  { emoji:'🍞', name:'Pan sobao (1)',           cal:140, cat:'food'   },
  { emoji:'🥜', name:'Peanut butter (2 tbsp)', cal:190, cat:'snack'  },
  { emoji:'🧁', name:'Pastellito',             cal:220, cat:'snack'  },
  { emoji:'🍪', name:'Cookie / galleta',        cal:160, cat:'snack'  },
  { emoji:'🍫', name:'Chocolate',               cal:170, cat:'snack'  },
  { emoji:'🍕', name:'Pizza slice',             cal:285, cat:'food'   },
  { emoji:'🍔', name:'Burger',                  cal:550, cat:'food'   },
]

const STATUS_STYLES = {
  green:  { bg:'rgba(0,200,150,.1)',  border:'var(--accent)', color:'var(--accent)' },
  amber:  { bg:'rgba(251,191,36,.1)', border:'var(--amber)',  color:'var(--amber)'  },
  red:    { bg:'rgba(239,68,68,.1)',  border:'var(--red)',    color:'var(--red)'    },
  blue:   { bg:'rgba(59,130,246,.1)', border:'var(--blue)',   color:'var(--blue)'   },
}

export default function MealTracker() {
  const { user, data } = useApp()
  const today = new Date().toISOString().split('T')[0]

  const [log,        setLog]        = useState([])
  const [loaded,     setLoaded]     = useState(false)
  const [custom,     setCustom]     = useState({ name:'', cal:'', emoji:'🍽️' })
  const [showCustom, setShowCustom] = useState(false)
  const [filter,     setFilter]     = useState('all')
  const [saving,     setSaving]     = useState(false)

  // AI feedback state
  const [feedback,      setFeedback]      = useState(null)
  const [analyzing,     setAnalyzing]     = useState(false)
  const [analyzeError,  setAnalyzeError]  = useState('')
  const [lastAnalyzed,  setLastAnalyzed]  = useState(null)

  // Load today's log on mount
  useEffect(() => {
    if (!user || loaded) return
    supabase.from('meal_log').select('*')
      .eq('user_id', user.id).eq('date', today)
      .order('logged_at', { ascending: true })
      .then(({ data: rows }) => {
        if (rows) setLog(rows)
        setLoaded(true)
      })
  }, [user, loaded, today])

  const saveEntry = async (entry) => {
    setSaving(true)
    const row = {
      user_id:   user.id,
      date:      today,
      name:      entry.name,
      emoji:     entry.emoji,
      calories:  entry.cal || 0,
      category:  entry.cat || 'food',
      note:      entry.note || '',
      logged_at: new Date().toISOString(),
    }
    const { data: saved } = await supabase.from('meal_log').insert(row).select().single()
    if (saved) setLog(l => [...l, saved])
    setSaving(false)
  }

  const deleteEntry = async (id) => {
    await supabase.from('meal_log').delete().eq('id', id)
    setLog(l => l.filter(e => e.id !== id))
    // Clear stale feedback when log changes
    setFeedback(null)
  }

  const totalCal = log.reduce((acc, e) => acc + (e.calories || 0), 0)
  const filtered = filter === 'all' ? log : log.filter(e => e.category === filter)

  const addCustom = () => {
    if (!custom.name.trim()) return
    saveEntry({ ...custom, cal: +custom.cal || 0, cat: 'custom' })
    setCustom({ name:'', cal:'', emoji:'🍽️' })
    setShowCustom(false)
    setFeedback(null)
  }

  const timeLabel = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true })

  // ── AI Feedback ────────────────────────────────────────────────────────────
  const analyzeDay = async () => {
    if (!user?.id) return
    setAnalyzing(true)
    setAnalyzeError('')
    setFeedback(null)

    try {
      const res = await fetch(`${BACKEND_URL}/meal-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:   user.id,
          log:      log.map(e => ({
            name:      e.name,
            calories:  e.calories,
            category:  e.category,
            emoji:     e.emoji,
            logged_at: e.logged_at,
          })),
          totalCal,
          date: today,
        }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error || 'Analysis failed')
      setFeedback(result.feedback)
      setLastAnalyzed(new Date())
    } catch (err) {
      setAnalyzeError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  // ── Calorie bar color ──────────────────────────────────────────────────────
  const caloricTarget = data.generatedPlan?.caloricTarget || 1900
  const calPct        = Math.min(100, Math.round((totalCal / caloricTarget) * 100))
  const calColor      = calPct > 105 ? 'var(--red)' : calPct >= 80 ? 'var(--accent)' : 'var(--amber)'

  return (
    <div className="screen">
      <div className="page-title" style={{ marginBottom:2 }}>Food Log</div>
      <div className="page-sub" style={{ marginBottom:16 }}>
        {new Date().toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}
      </div>

      {/* ── Daily summary card ─────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <div>
            <div style={{ fontSize:32, fontWeight:800, fontFamily:"'Syne',sans-serif", color:calColor, lineHeight:1 }}>
              {totalCal.toLocaleString()}
            </div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>kcal logged · {log.length} items</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:18, fontWeight:800, fontFamily:"'Syne',sans-serif", color:'var(--muted)' }}>
              / {caloricTarget.toLocaleString()}
            </div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{calPct}% of target</div>
          </div>
        </div>
        {/* Calorie progress bar */}
        <div style={{ height:6, background:'var(--faint)', borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${calPct}%`, background:calColor, borderRadius:3, transition:'width .4s ease' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:11, color:'var(--muted)' }}>
          <span>0</span>
          <span style={{ color: totalCal < caloricTarget ? 'var(--accent)' : 'var(--red)' }}>
            {totalCal < caloricTarget
              ? `${(caloricTarget - totalCal).toLocaleString()} kcal remaining`
              : `${(totalCal - caloricTarget).toLocaleString()} kcal over`
            }
          </span>
          <span>{caloricTarget.toLocaleString()}</span>
        </div>
      </div>

      {/* ── Filter chips ───────────────────────────────────────────────────── */}
      <div className="tab-strip" style={{ marginBottom:16 }}>
        {[['all','All'],['food','Food'],['drink','Drinks'],['snack','Snacks'],['fruit','Fruit'],['custom','Custom']].map(([v, l]) => (
          <button key={v} className={`tab-chip ${filter===v?'active':''}`} onClick={() => setFilter(v)}
            style={{ fontSize:12, padding:'6px 12px' }}>{l}</button>
        ))}
      </div>

      {/* ── Quick add ──────────────────────────────────────────────────────── */}
      <div className="section-label">⚡ Quick add</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
        {QUICK_ITEMS.filter(i => filter === 'all' || i.cat === filter).map((item, idx) => (
          <button key={idx} onClick={() => { saveEntry(item); setFeedback(null) }} disabled={saving}
            style={{
              display:'flex', alignItems:'center', gap:6,
              background:'var(--bg3)', border:'1px solid var(--border)',
              borderRadius:20, padding:'8px 12px', cursor:'pointer',
              fontSize:13, color:'var(--text)',
            }}>
            <span>{item.emoji}</span>
            <span>{item.name}</span>
            {item.cal > 0 && <span style={{ color:'var(--muted)', fontSize:11 }}>{item.cal}</span>}
          </button>
        ))}
      </div>

      {/* ── Custom entry ───────────────────────────────────────────────────── */}
      {!showCustom ? (
        <button onClick={() => setShowCustom(true)} style={{
          width:'100%', background:'var(--bg3)', border:'1px dashed var(--border)',
          borderRadius:12, padding:12, color:'var(--muted)', fontSize:14, cursor:'pointer', marginBottom:16,
        }}>
          ✏️ Add something custom...
        </button>
      ) : (
        <div className="card" style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Custom item</div>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <input value={custom.emoji} onChange={e => setCustom(c => ({...c, emoji:e.target.value}))}
              style={{ width:48, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:8, color:'var(--text)', fontSize:18, textAlign:'center', outline:'none' }} />
            <input placeholder="What did you eat/drink?" value={custom.name}
              onChange={e => setCustom(c => ({...c, name:e.target.value}))}
              style={{ flex:1, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', color:'var(--text)', fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none' }} />
            <input placeholder="kcal" type="number" value={custom.cal}
              onChange={e => setCustom(c => ({...c, cal:e.target.value}))}
              style={{ width:64, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:8, color:'var(--text)', fontFamily:"'Syne',sans-serif", fontSize:14, textAlign:'center', outline:'none' }} />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={addCustom} style={{ flex:1, background:'var(--accent)', color:'#000', border:'none', borderRadius:10, padding:10, fontFamily:"'Syne',sans-serif", fontWeight:700, cursor:'pointer' }}>Add</button>
            <button onClick={() => setShowCustom(false)} style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--muted)', borderRadius:10, padding:'10px 16px', cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Today's log ────────────────────────────────────────────────────── */}
      <div className="section-label">📋 Today's log {saving && '· saving...'}</div>
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign:'center', color:'var(--muted)', padding:24 }}>
          Nothing logged yet — tap anything above to add it
        </div>
      ) : (
        <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:24 }}>
          {filtered.map((entry, i) => (
            <div key={entry.id || i} style={{
              display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontSize:22 }}>{entry.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:500 }}>{entry.name}</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{timeLabel(entry.logged_at)}</div>
              </div>
              {entry.calories > 0 && (
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13 }}>
                  {entry.calories} kcal
                </div>
              )}
              <button onClick={() => deleteEntry(entry.id)}
                style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:16, padding:4 }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── AI Feedback section ────────────────────────────────────────────── */}
      <div className="section-label">🤖 Ask Claude</div>

      {analyzeError && (
        <div style={{ padding:'10px 14px', background:'rgba(239,68,68,.1)', border:'1px solid var(--red)', borderRadius:10, fontSize:13, color:'var(--red)', marginBottom:12 }}>
          ⚠️ {analyzeError}
        </div>
      )}

      {/* Feedback card */}
      {feedback && (() => {
        const s = STATUS_STYLES[feedback.statusColor] || STATUS_STYLES.green
        return (
          <div style={{ marginBottom:16 }}>
            {/* Status banner */}
            <div style={{ padding:'12px 16px', background:s.bg, border:`1px solid ${s.border}`, borderRadius:'12px 12px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:s.color }}>
                {feedback.statusLabel}
              </div>
              {lastAnalyzed && (
                <div style={{ fontSize:11, color:'var(--muted)' }}>
                  {lastAnalyzed.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true })}
                </div>
              )}
            </div>

            {/* Body */}
            <div style={{ background:'var(--bg3)', border:`1px solid ${s.border}`, borderTop:'none', borderRadius:'0 0 12px 12px', padding:16, display:'flex', flexDirection:'column', gap:14 }}>

              {/* Summary */}
              <div style={{ fontSize:14, lineHeight:1.7, color:'var(--text)' }}>
                {feedback.summary}
              </div>

              {/* Calorie bar */}
              <div style={{ background:'var(--faint)', borderRadius:10, padding:'10px 14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:12, fontWeight:600 }}>📊 Calories</span>
                  <span style={{ fontSize:12, color:'var(--muted)' }}>
                    {feedback.calorieAssessment?.logged?.toLocaleString()} / {feedback.calorieAssessment?.target?.toLocaleString()} kcal
                  </span>
                </div>
                <div style={{ height:5, background:'var(--border)', borderRadius:3, overflow:'hidden', marginBottom:6 }}>
                  <div style={{
                    height:'100%', borderRadius:3,
                    width:`${Math.min(100, Math.round(((feedback.calorieAssessment?.logged || 0) / (feedback.calorieAssessment?.target || 1)) * 100))}%`,
                    background: s.color,
                  }} />
                </div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>{feedback.calorieAssessment?.message}</div>
              </div>

              {/* Medical flags — only show if any */}
              {feedback.medicalFlags?.length > 0 && (
                <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.3)', borderRadius:10, padding:'10px 14px' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--red)', marginBottom:6 }}>⚠️ Medical Flags</div>
                  {feedback.medicalFlags.map((flag, i) => (
                    <div key={i} style={{ fontSize:13, color:'var(--text)', lineHeight:1.6, marginBottom: i < feedback.medicalFlags.length - 1 ? 4 : 0 }}>
                      • {flag}
                    </div>
                  ))}
                </div>
              )}

              {/* Macro feedback */}
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--muted)', marginBottom:6 }}>💪 Macros</div>
                <div style={{ fontSize:13, lineHeight:1.6, color:'var(--text)' }}>{feedback.macroFeedback}</div>
              </div>

              {/* Suggestions */}
              {feedback.suggestions?.length > 0 && (
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--muted)', marginBottom:8 }}>✅ For the rest of the day</div>
                  {feedback.suggestions.map((s2, i) => (
                    <div key={i} style={{ display:'flex', gap:10, marginBottom:8, alignItems:'flex-start' }}>
                      <span style={{ color:'var(--accent)', fontWeight:700, marginTop:1, flexShrink:0 }}>→</span>
                      <span style={{ fontSize:13, lineHeight:1.6, color:'var(--text)' }}>{s2}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Next meal idea */}
              {feedback.nextMealIdea && (
                <div style={{ background:'rgba(0,200,150,.08)', border:'1px solid rgba(0,200,150,.2)', borderRadius:10, padding:'10px 14px' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--accent)', marginBottom:4 }}>🍽️ Next meal idea</div>
                  <div style={{ fontSize:13, lineHeight:1.6, color:'var(--text)' }}>{feedback.nextMealIdea}</div>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Analyze button */}
      <button
        onClick={analyzeDay}
        disabled={analyzing || log.length === 0}
        style={{
          width:'100%', padding:'14px', borderRadius:14,
          background: analyzing || log.length === 0
            ? 'var(--faint)'
            : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
          border:'none',
          color: analyzing || log.length === 0 ? 'var(--muted)' : '#fff',
          fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15,
          cursor: analyzing || log.length === 0 ? 'not-allowed' : 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          marginBottom:8,
        }}>
        {analyzing
          ? <><div className="ob-spinner" style={{ width:18, height:18, borderWidth:2, borderColor:'rgba(255,255,255,.3)', borderTopColor:'#fff' }} /> Analyzing your day...</>
          : log.length === 0
            ? '🤖 Log something first'
            : feedback ? '🔄 Re-analyze' : '🤖 Analyze my day'
        }
      </button>

      {log.length === 0 && (
        <div style={{ fontSize:12, color:'var(--muted)', textAlign:'center' }}>
          Add at least one item to get AI feedback
        </div>
      )}
      {log.length > 0 && !feedback && !analyzing && (
        <div style={{ fontSize:12, color:'var(--muted)', textAlign:'center' }}>
          Claude will check your calories, macros, medical flags, and give you a next-meal suggestion
        </div>
      )}

      <div style={{ height:32 }} />
    </div>
  )
}
