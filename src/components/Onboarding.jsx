import { useState } from 'react'
import { BACKEND_URL } from '../lib/supabase'
import { useApp } from '../context/AppContext'

// ── Helpers ───────────────────────────────────────────────────────────────────
function inferUnitFromText(text) {
  const t = (text || '').toLowerCase()
  const imperial = ['united states','usa','u.s.','puerto rico','liberia','myanmar','american samoa','guam','virgin islands','northern mariana']
  return imperial.some(k => t.includes(k)) ? 'imperial' : 'metric'
}

const DATE_PRESETS = [
  { label:'3 months',  months: 3  },
  { label:'6 months',  months: 6  },
  { label:'9 months',  months: 9  },
  { label:'1 year',    months: 12 },
]

// 10-step flow (+ 2 conditional for IF) ───────────────────────────────────────
const STEPS = [
  {
    id:'location', type:'location',
    q:'Where are you based?',
    hint:'Sets local food options, grocery store types, and your weight unit (lbs vs kg).',
    req: v => v && typeof v === 'object' && (v.country || v.city) && (v.country || v.city).length > 1,
  },
  {
    id:'_nameAge', type:'name-age',
    q:"Let's get to know you.",
    hint:'Your name personalizes every message. Age calibrates caloric needs and recovery.',
    req: v => v.name?.trim().length >= 2 && +v.age >= 16 && +v.age <= 80,
  },
  {
    id:'weights', type:'two-number',
    q:'Current and goal weight?',
    hint:'Be honest — this drives your entire plan.',
    ids:['currentWeight','goalWeight'], labels:['Current weight','Goal weight'],
    req: v => v.currentWeight > 0 && v.goalWeight > 0 && v.currentWeight > v.goalWeight,
  },
  {
    id:'goalDate', type:'goal-date',
    q:'Target date to reach your goal?',
    hint:'Drives milestones, weekly pace, and your AI plan. Defaults to 6 months if skipped.',
    req: v => true,
  },
  {
    id:'medical', type:'chips-multi',
    q:'Any medical conditions?',
    hint:'Directly changes your workout and nutrition plan. Select all that apply.',
    options:['None','Hypoglycemia','Type 2 Diabetes','Type 1 Diabetes','Pre-diabetes','Asthma','Hypertension','High Cholesterol','Heart Disease','Anemia','PMOS','Hypothyroidism','Hyperthyroidism','Celiac Disease',"Crohn's / IBS",'GERD / Acid Reflux','Kidney Disease','Joint Pain / Arthritis','Osteoporosis','Lower Back Pain','Sleep Apnea','Depression / Anxiety','Fibromyalgia','High Uric Acid / Gout','Fatty Liver'],
    req: v => v.length >= 1,
  },
  {
    id:'dietary', type:'chips-multi',
    q:'Dietary restrictions?',
    hint:'Your meal plan works around these completely.',
    options:['None','No pork','No red meat','No beef','No chicken','No fish','No shellfish','Vegetarian','Vegan','Pescatarian','Gluten intolerant','Lactose intolerant','No dairy','No eggs','Nut allergy','Soy allergy','Halal','Kosher','Low sodium','Low sugar'],
    req: v => v.length >= 1,
  },
  {
    id:'gymType', type:'chips-single',
    q:'Gym or equipment access?',
    hint:'Used to design your workout plan.',
    options:['Commercial gym (full equipment)','Planet Fitness','Gym + Home setup','Home — dumbbells only','Home — resistance bands','Home — no equipment','Outdoors / bodyweight only'],
    req: v => !!v,
  },
  {
    id:'workoutTime', type:'chips-single',
    q:'Preferred workout time?',
    hint:'Affects pre-workout meal and fasting window timing.',
    options:['Early morning (5–7am)','Morning (7–9am)','Midday (11am–1pm)','Early afternoon (2–4pm)','Late afternoon (4–6pm)','Evening (6–8pm)','Night (8–10pm)'],
    req: v => !!v,
  },
  {
    id:'eatingSchedule', type:'chips-single',
    q:'Eating schedule?',
    hint:'Intermittent fasting works well for fat loss — but not for everyone.',
    options:['Intermittent fasting','3 meals a day','2 meals + snacks','No structure'],
    req: v => !!v,
  },
  {
    id:'ifWindow', type:'chips-single',
    q:'Which fasting window?',
    hint:'Eating window = when all your meals happen.',
    options:['16:8 — Fast 16h, eat 8h','18:6 — Fast 18h, eat 6h','20:4 — Fast 20h, eat 4h','14:10 — Beginner friendly'],
    req: v => !!v,
    cond: d => d.eatingSchedule === 'Intermittent fasting',
  },
  {
    id:'ifStart', type:'chips-single',
    q:'When does your eating window open?',
    hint:'Sets your break-fast time and all meal reminders.',
    options:['6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM'],
    req: v => !!v,
    cond: d => d.eatingSchedule === 'Intermittent fasting',
  },
  {
    id:'planNotes', type:'plan-notes',
    q:'Anything else for your plan?',
    hint:'Favorite foods, things you hate eating, sports you play, weekly schedule constraints, specific requests. The AI reads every word — more detail = better plan.',
    req: v => true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
export default function Onboarding({ onComplete }) {
  const { user } = useApp()
  const [step, setStep]      = useState(0)
  const [data, setData]      = useState({})
  const [generating, setGen] = useState(false)
  const [status, setStatus]  = useState('Analyzing your profile...')
  const [done, setDone]      = useState(false)
  const [plan, setPlan]      = useState(null)
  const [error, setError]    = useState('')

  // Location detection state
  const [detecting,  setDetecting]  = useState(false)
  const [detectErr,  setDetectErr]  = useState('')
  const [showManual, setShowManual] = useState(false)
  const [manualText, setManualText] = useState('')

  const active = STEPS.filter(s => !s.cond || s.cond(data))
  const cur    = active[step]
  const pct    = Math.round(((step + 1) / (active.length + 1)) * 100)

  const set = (id, val) => setData(d => ({ ...d, [id]: val }))

  // ── Validation ──────────────────────────────────────────────────────────────
  const valid = () => {
    if (!cur) return false
    let val
    switch (cur.type) {
      case 'two-number':  val = { currentWeight: +data.currentWeight, goalWeight: +data.goalWeight }; break
      case 'chips-multi': val = data[cur.id] || []; break
      case 'name-age':    val = { name: data.name || '', age: data.age || '' }; break
      case 'location':    val = data.location || {}; break
      default:            val = data[cur.id] || ''
    }
    try { return cur.req(val) } catch { return false }
  }

  const toggleMulti = (id, val) => setData(d => {
    const prev = d[id] || []
    if (val === 'None' || val === 'Nothing — I eat everything')
      return { ...d, [id]: prev.includes(val) ? [] : [val] }
    const next = prev.includes(val)
      ? prev.filter(x => x !== val)
      : [...prev.filter(x => x !== 'None' && x !== 'Nothing — I eat everything'), val]
    return { ...d, [id]: next }
  })

  // ── Location detection ──────────────────────────────────────────────────────
  const detectLocation = async () => {
    setDetecting(true)
    setDetectErr('')
    setShowManual(false)
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      )
      const { latitude, longitude } = pos.coords
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const geo = await r.json()
      const city    = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.county || ''
      const country = geo.address?.country || ''
      const cc      = (geo.address?.country_code || '').toLowerCase()
      const unit    = ['us', 'lr', 'mm'].includes(cc) ? 'imperial' : 'metric'
      set('location',   { city, country, country_code: cc, lat: latitude, lng: longitude, detected: true })
      set('unitSystem', unit)
    } catch {
      setDetectErr('Could not detect location — type it below instead.')
      setShowManual(true)
    }
    setDetecting(false)
  }

  const applyManual = () => {
    if (!manualText.trim()) return
    const unit = inferUnitFromText(manualText)
    const parts = manualText.split(',').map(s => s.trim())
    const city  = parts[0] || manualText
    const country = parts[1] || parts[0] || manualText
    set('location',   { city, country, detected: true, manual: manualText })
    set('unitSystem', unit)
    setShowManual(false)
    setManualText('')
    setDetectErr('')
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  const next = async () => {
    if (step < active.length - 1) setStep(s => s + 1)
    else await generate()
  }
  const back = () => setStep(s => Math.max(0, s - 1))

  // ── Generate plan ───────────────────────────────────────────────────────────
  const generate = async () => {
    setGen(true)
    const msgs = ['Analyzing your profile...','Designing your workout split...','Building your meal plan...','Crafting local recipes for you...','Finalizing your personalized plan...']
    let si = 0
    const iv = setInterval(() => { si = (si + 1) % msgs.length; setStatus(msgs[si]) }, 3500)

    const goalDate = data.goalDate || (() => { const d = new Date(); d.setMonth(d.getMonth() + 6); return d.toISOString().split('T')[0] })()

    const profile = {
      name:            data.name,
      age:             +data.age,
      currentWeight:   +data.currentWeight,
      goalWeight:      +data.goalWeight,
      goalDate,
      programStart:    new Date().toISOString().split('T')[0],
      _version:        4,
      // Location + units
      location:        data.location || { city: '', country: '', detected: false },
      unitSystem:      data.unitSystem || 'imperial',
      // Medical + dietary
      medical:         data.medical   || ['None'],
      dietary:         data.dietary   || ['None'],
      // Gym + schedule
      gymType:         data.gymType,
      workoutTime:     data.workoutTime,
      eatingSchedule:  data.eatingSchedule,
      ifWindow:        data.ifWindow  || null,
      ifStart:         data.ifStart   || null,
      // Free-text catches all: foods, sports, preferences, special requests
      planNotes:       data.planNotes || '',
      // Defaults for progressive-completion fields (filled later in Profile tab)
      preferredStores: [],
      workoutStructure:'Whatever the plan says — I\'m flexible',
      gymDays:         [],
      trainingDays:    '5 days',
      fitnessLevel:    'Some experience (< 1 year)',
      additionalSports:'None',
      primaryGoal:     'Feel more energetic daily',
      sleepQuality:    'OK — 6–7h, sometimes tired',
    }

    try {
      const res    = await fetch(`${BACKEND_URL}/onboard`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, profile }),
      })
      const result = await res.json()
      clearInterval(iv)
      if (!result.success) throw new Error(result.error || 'Plan generation failed')
      setPlan(result.plan); setDone(true)
      onComplete(profile, result.plan)
    } catch(e) {
      clearInterval(iv)
      setError(e.message); setGen(false)
    }
  }

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (done && plan) return (
    <div className="ob-overlay" style={{ alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:32, maxWidth:320 }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
        <div className="syne fw8" style={{ fontSize:24, marginBottom:12 }}>Your plan is ready!</div>
        <div style={{ fontSize:14, color:'var(--muted)', lineHeight:1.7, marginBottom:32 }}>{plan.greeting}</div>
        <button className="ob-next" onClick={() => onComplete(null, null, true)}>Let's go 🚀</button>
      </div>
    </div>
  )

  // ── Generating screen ───────────────────────────────────────────────────────
  if (generating) return (
    <div className="ob-overlay" style={{ alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:32 }}>
        <div className="ob-spinner" style={{ margin:'0 auto 24px' }} />
        <div className="syne fw8" style={{ fontSize:20, marginBottom:12 }}>Building your plan...</div>
        <div style={{ fontSize:13, color:'var(--muted)', maxWidth:260, margin:'0 auto 16px', lineHeight:1.6 }}>
          Claude is creating your personalized plan. About 30 seconds.
        </div>
        <div style={{ fontSize:12, color:'var(--muted)' }}>{status}</div>
        {error && <>
          <div style={{ color:'var(--red)', marginTop:20, marginBottom:12 }}>{error}</div>
          <button className="ob-next" style={{ maxWidth:200 }} onClick={generate}>Try again</button>
        </>}
      </div>
    </div>
  )

  // ── Step renderer ───────────────────────────────────────────────────────────
  const unit = data.unitSystem === 'metric' ? 'kg' : 'lbs'

  const renderStep = () => {
    const t = cur?.type

    // ── Location ──────────────────────────────────────────────────────────────
    if (t === 'location') {
      const loc = data.location
      const detected = loc?.detected
      return (
        <div>
          {!detected && !detecting && (
            <button className="ob-next" style={{ marginBottom:16, background:'var(--blue)' }} onClick={detectLocation}>
              📍 Detect my location automatically
            </button>
          )}

          {detecting && (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div className="ob-spinner" style={{ margin:'0 auto 16px' }} />
              <div style={{ fontSize:13, color:'var(--muted)' }}>Detecting your location...</div>
            </div>
          )}

          {detected && !detecting && (
            <div style={{ padding:'16px', background:'rgba(0,200,150,.08)', border:'1px solid var(--accent)', borderRadius:14, marginBottom:16 }}>
              <div style={{ fontSize:18, marginBottom:8 }}>
                📍 {loc.city}{loc.city && loc.country ? ', ' : ''}{loc.country || loc.manual}
              </div>
              <div style={{ display:'flex', gap:16, fontSize:13, color:'var(--muted)', marginBottom:10 }}>
                <span>⚖️ Weight: <strong style={{ color:'var(--text)' }}>{unit}</strong></span>
                <span>{data.unitSystem === 'imperial' ? '🇺🇸 Imperial' : '🌍 Metric'}</span>
              </div>
              <button onClick={() => { set('location', null); set('unitSystem', null); setShowManual(false); setDetectErr('') }}
                style={{ fontSize:12, color:'var(--muted)', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                ✏️ Change location
              </button>
            </div>
          )}

          {detectErr && (
            <div style={{ fontSize:13, color:'var(--amber)', marginBottom:10 }}>{detectErr}</div>
          )}

          {(!detected || showManual) && !detecting && (
            <div>
              {!detected && (
                <div style={{ fontSize:13, color:'var(--muted)', marginBottom:8, textAlign:'center' }}>
                  — or type it manually —
                </div>
              )}
              <div style={{ display:'flex', gap:8 }}>
                <input
                  className="ob-input" style={{ flex:1, marginBottom:0 }}
                  placeholder="e.g. San Juan, Puerto Rico"
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && manualText.trim() && applyManual()}
                />
                <button onClick={applyManual} disabled={!manualText.trim()}
                  style={{ background:'var(--accent)', border:'none', borderRadius:12, padding:'0 16px', color:'#000', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>
                  Set
                </button>
              </div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:8 }}>
                Enter city and country for best results. Unit system is auto-detected.
              </div>
            </div>
          )}
        </div>
      )
    }

    // ── Name + Age ────────────────────────────────────────────────────────────
    if (t === 'name-age') return (
      <div>
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6, fontWeight:600 }}>Your first name</div>
        <input className="ob-input" type="text" placeholder="e.g. Luis"
          value={data.name || ''}
          onChange={e => set('name', e.target.value)}
          autoFocus />
        <div style={{ fontSize:12, color:'var(--muted)', margin:'16px 0 6px', fontWeight:600 }}>Your age</div>
        <input className="ob-input" type="number" inputMode="numeric" placeholder="e.g. 32"
          value={data.age || ''}
          onChange={e => set('age', e.target.value)}
          onKeyDown={e => e.key === 'Enter' && valid() && next()} />
      </div>
    )

    // ── Two numbers (weights, unit-aware) ─────────────────────────────────────
    if (t === 'two-number') {
      const metricPH = ['e.g. 120 kg','e.g. 85 kg']
      const imperialPH = ['e.g. 260 lbs','e.g. 180 lbs']
      const placeholders = data.unitSystem === 'metric' ? metricPH : imperialPH
      return (
        <div>
          {cur.ids.map((id, i) => (
            <div key={id} style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6, fontWeight:600 }}>
                {cur.labels[i]} <span style={{ color:'var(--accent)' }}>({unit})</span>
              </div>
              <input className="ob-input" type="number" inputMode="decimal"
                placeholder={placeholders[i]}
                value={data[id] || ''}
                onChange={e => set(id, e.target.value)} />
            </div>
          ))}
          {+data.currentWeight > 0 && +data.goalWeight > 0 && +data.currentWeight <= +data.goalWeight && (
            <div style={{ fontSize:13, color:'var(--red)', marginTop:4 }}>
              ⚠️ Goal weight must be less than current weight.
            </div>
          )}
        </div>
      )
    }

    // ── Chips single ──────────────────────────────────────────────────────────
    if (t === 'chips-single') return (
      <div className="ob-chips">
        {cur.options.map(o => (
          <button key={o} className={`ob-chip ${data[cur.id] === o ? 'selected' : ''}`}
            onClick={() => set(cur.id, o)}>{o}</button>
        ))}
      </div>
    )

    // ── Chips multi ───────────────────────────────────────────────────────────
    if (t === 'chips-multi') return (
      <div className="ob-chips">
        {cur.options.map(o => (
          <button key={o} className={`ob-chip ${(data[cur.id]||[]).includes(o) ? 'selected' : ''}`}
            onClick={() => toggleMulti(cur.id, o)}>{o}</button>
        ))}
      </div>
    )

    // ── Goal date ─────────────────────────────────────────────────────────────
    if (t === 'goal-date') return (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {DATE_PRESETS.map(p => {
          const d = new Date()
          d.setMonth(d.getMonth() + p.months)
          const iso = d.toISOString().split('T')[0]
          const sel = data.goalDate === iso
          const lbl = new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })
          return (
            <button key={iso} onClick={() => set('goalDate', iso)} style={{
              padding:'14px 20px', borderRadius:14, textAlign:'left',
              border:`2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
              background: sel ? 'rgba(0,200,150,.1)' : 'var(--bg3)',
              cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              <div>
                <div className="syne fw7" style={{ fontSize:15, color: sel ? 'var(--accent)' : 'var(--text)' }}>{p.label}</div>
                <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{lbl}</div>
              </div>
              {sel && <span style={{ fontSize:20 }}>✅</span>}
            </button>
          )
        })}
        {!data.goalDate && (
          <div style={{ fontSize:12, color:'var(--muted)', textAlign:'center', marginTop:4 }}>
            Skip → defaults to 6 months from today
          </div>
        )}
      </div>
    )

    // ── Plan notes (free text) ────────────────────────────────────────────────
    if (t === 'plan-notes') return (
      <div>
        <textarea rows={7}
          placeholder={'Examples:\n• "I love chicken, eggs, and rice. Hate mushrooms and beets."\n• "I do BJJ on Tuesday and Thursday nights"\n• "I want overnight oats every morning"\n• "Beginner — never lifted before"\n• "I work night shifts, 10pm–6am"'}
          value={data.planNotes || ''}
          onChange={e => set('planNotes', e.target.value)}
          style={{
            width:'100%', background:'var(--bg3)', border:'1px solid var(--border)',
            borderRadius:14, padding:'14px 16px', color:'var(--text)',
            fontFamily:"'DM Sans',sans-serif", fontSize:14, lineHeight:1.7,
            resize:'none', outline:'none',
            borderColor: data.planNotes ? 'rgba(0,200,150,.4)' : 'var(--border)',
          }} />
        <div style={{ fontSize:12, color:'var(--muted)', marginTop:8 }}>
          Optional but powerful — Claude uses every detail to personalize your plan.
        </div>
      </div>
    )

    return <div style={{ color:'var(--muted)' }}>Unknown step type: {t}</div>
  }

  // ── Step number display ───────────────────────────────────────────────────
  const displayStep  = step + 1
  const displayTotal = active.length

  return (
    <div className="ob-overlay">
      {/* Header */}
      <div style={{ padding:'48px 24px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div className="syne fw8" style={{ fontSize:22 }}>
            Setup <span style={{ fontSize:11, color:'var(--accent)', fontWeight:400 }}>v5</span>
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', fontFamily:"'Syne',sans-serif", fontWeight:700 }}>
            {displayStep} / {displayTotal}
          </div>
        </div>
        <div className="ob-progress">
          <div className="ob-progress-fill" style={{ width:`${pct}%` }} />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, padding:'0 24px', overflowY:'auto' }}>
        <div className="ob-question" style={{ marginBottom:6 }}>{cur?.q}</div>
        <div className="ob-hint" style={{ marginBottom:24 }}>{cur?.hint}</div>
        {renderStep()}
      </div>

      {/* Footer */}
      <div style={{ padding:24, display:'flex', gap:12 }}>
        {step > 0 && (
          <button className="ob-back" onClick={back}>← Back</button>
        )}
        <button className="ob-next" disabled={!valid()} onClick={next}>
          {step === active.length - 1 ? 'Build my plan 🚀' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
