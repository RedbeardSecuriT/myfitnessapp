import { useState } from 'react'
import { BACKEND_URL } from '../lib/supabase'
import { useApp } from '../context/AppContext'

const DOW = ['Mon','Tue','Wed','Thu','Fri','Sat']
const DOW_FULL = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

const DATE_PRESETS = [
  { label:'3 months',     months: 3  },
  { label:'6 months',     months: 6  },
  { label:'9 months',     months: 9  },
  { label:'1 year',       months: 12 },
  { label:'Dec 15, 2026', iso: '2026-12-15' },
]

const STEPS = [
  { id:'name',         type:'text',        q:"What's your name?",                     hint:'We personalize everything for you.',            placeholder:'Your first name',                   req: v => v.trim().length >= 2 },
  { id:'age',          type:'number',      q:'How old are you?',                       hint:'Age calibrates caloric needs and recovery.',    placeholder:'e.g. 32',                           req: v => +v >= 16 && +v <= 80 },
  { id:'weights',      type:'two-number',  q:'Current and goal weight (lbs)?',         hint:'Be honest — this sets your entire plan.',       labels:['Current weight','Goal weight'],          ids:['currentWeight','goalWeight'], placeholders:['e.g. 280','e.g. 220'], req: v => v.currentWeight > 0 && v.goalWeight > 0 && v.currentWeight > v.goalWeight },
  { id:'goalDate',     type:'goal-date',   q:'Target date to reach your goal?',        hint:'Drives your milestones, weekly pace, and AI plan. You can always change it later.', req: v => true },
  { id:'medical',      type:'chips-multi', q:'Any medical conditions?',                hint:'Directly changes your workout and nutrition plan. Select all that apply.', options:['None','Hypoglycemia','Type 2 Diabetes','Type 1 Diabetes','Pre-diabetes','Asthma','Hypertension','High Cholesterol','Heart Disease','Anemia','PCOS','Hypothyroidism','Hyperthyroidism','Celiac Disease',"Crohn's / IBS",'GERD / Acid Reflux','Kidney Disease','Joint Pain / Arthritis','Osteoporosis','Lower Back Pain','Sleep Apnea','Depression / Anxiety','Fibromyalgia','High Uric Acid / Gout','Fatty Liver'], req: v => v.length >= 1 },
  { id:'dietary',      type:'chips-multi', q:'Dietary restrictions?',                  hint:'Your meal plan works around these.',             options:['None','No pork','No red meat','No beef','No chicken','No fish','No shellfish','Vegetarian','Vegan','Pescatarian','Gluten intolerant','Lactose intolerant','No dairy','No eggs','Nut allergy','Soy allergy','Halal','Kosher','Low sodium','Low sugar'], req: v => v.length >= 1 },
  { id:'favFoods',     type:'chips-multi', q:'Foods you love?',                        hint:"We build meals around these. Select all you enjoy.", allowOther:true, options:['Eggs','Chicken breast','Chicken thighs','Ground turkey','Salmon','Tuna','Shrimp','Bacalao','Arroz blanco','Brown rice','Pasta','Habichuelas','Gandules','Platanos maduros','Tostones','Yuca','Chayote','Avocado / Aguacate','Mangoes','Bananas','Oats','Greek yogurt','Peanut butter','Arroz con pollo','Pernil','Sancocho','Wraps','Sandwiches'], req: v => v.length >= 1 },
  { id:'avoidFoods',   type:'chips-multi', q:'Foods you hate or refuse to eat?',       hint:"These never appear in your plan.",               allowOther:true, options:['Nothing — I eat everything','Liver / organ meats','Sardines','Mushrooms','Beets','Brussels sprouts','Cottage cheese','Tofu','Quinoa','Chia seeds','Olives','Onions','Cilantro','Spicy food','Protein shakes / powders','Artificial sweeteners'], req: v => v.length >= 1 },
  { id:'gymType',      type:'chips-single',q:'What gym or equipment do you have access to?', hint:'Used to design your workout plan.',        options:['Planet Fitness','Full gym (other)','Gym + Home setup','Home — dumbbells only','Home — resistance bands','Home — no equipment','Outdoors / bodyweight only'], req: v => !!v },
  { id:'gymDays',      type:'gym-days',    q:'Which days can you go to the gym?',      hint:'Unchecked days = home workout. Sunday is always rest.', req: v => true },
  { id:'preferredStores', type:'chips-multi', q:'Where do you usually grocery shop?', hint:'Your meal plan and grocery list will be built around what you can actually find nearby.', options:['Walmart PR','Costco','Sam\'s Club','Plaza del Caribe / Puerto Rico local','Pueblo Supermarkets','Supermax','Selectos','PriceSmart','Colmado / Local corner store','Amazon Fresh / Delivery'], req: v => v.length >= 1 },
  { id:'workoutStructure', type:'chips-single', q:'How do you like to structure your workouts?', hint:'Your plan will match your natural flow.', options:['Cardio first, then weights','Weights first, then cardio','Cardio only','Weights only','Circuit / mixed throughout','Whatever the plan says — I\'m flexible'], req: v => !!v },
  { id:'fitnessLevel', type:'chips-single',q:'Current fitness level?',                 hint:'Sets starting weights and cardio intensity.',    options:['Complete beginner','Some experience (< 1 year)','Intermediate (1–3 years)','Advanced (3+ years)'], req: v => !!v },
  { id:'trainingDays', type:'chips-single',q:'Total days per week you can train?',     hint:'Gym + home combined.',                           options:['2 days','3 days','4 days','5 days','6 days'], req: v => !!v },
  { id:'additionalSports', type:'chips-multi', q:'Additional sports or activities?',   hint:'Factored into your recovery and calorie needs. Select None if not applicable.', allowOther:true, options:['None','Martial arts / BJJ','Boxing','Muay Thai','Soccer / Fútbol','Basketball','Swimming','Cycling / biking','Running','Tennis','Yoga','Pilates','CrossFit','Rock climbing','Dancing'], req: v => v.length >= 1 },
  { id:'workoutTime',  type:'chips-single',q:'Preferred workout time?',                hint:'Affects pre-workout meal timing.',               options:['Early morning (5–7am)','Morning (7–9am)','Midday (11am–1pm)','Early afternoon (2–4pm)','Late afternoon (4–6pm)','Evening (6–8pm)','Night (8–10pm)'], req: v => !!v },
  { id:'sleepQuality', type:'chips-single',q:'How is your sleep?',                     hint:'Sleep drives recovery and fat loss.',             options:['Great — 7–9h, wake rested','OK — 6–7h, sometimes tired','Poor — under 6h or restless','Night shifts / irregular'], req: v => !!v },
  { id:'primaryGoal',  type:'chips-single',q:'Beyond weight — what matters most?',    hint:'Shapes whether we prioritize strength, endurance, or energy.', options:['Feel more energetic daily','Get stronger','Improve cardiovascular health','Look better / body composition','Manage a health condition'], req: v => !!v },
  { id:'planNotes',    type:'plan-notes',  q:'Anything specific for your plan?',       hint:'Overnight oats every morning? Target 2 miles on treadmill? BJJ 3x/week already? Tell the AI — it will honor every request.', req: v => true },
  { id:'eatingSchedule',type:'chips-single',q:'Eating schedule?',                      hint:'Intermittent fasting works well for fat loss.',   options:['Intermittent fasting','3 meals a day','2 meals + snacks','No structure'], req: v => !!v },
  { id:'ifWindow',     type:'chips-single',q:'Which fasting window?',                  hint:'Eating window = when all meals happen.',          options:['16:8 — Fast 16h, eat 8h','18:6 — Fast 18h, eat 6h','20:4 — Fast 20h, eat 4h','14:10 — Beginner friendly'], req: v => !!v, cond: d => d.eatingSchedule === 'Intermittent fasting' },
  { id:'ifStart',      type:'chips-single',q:'When does your eating window open?',     hint:'Sets your break-fast time and all meal reminders.', options:['6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM'], req: v => !!v, cond: d => d.eatingSchedule === 'Intermittent fasting' },
]

export default function Onboarding({ onComplete }) {
  const { user } = useApp()
  const [step, setStep]      = useState(0)
  const [data, setData]      = useState({})
  const [generating, setGen] = useState(false)
  const [status, setStatus]  = useState('Analyzing your profile...')
  const [done, setDone]      = useState(false)
  const [plan, setPlan]      = useState(null)
  const [error, setError]    = useState('')

  const active = STEPS.filter(s => !s.cond || s.cond(data))
  const cur    = active[step]
  const pct    = Math.round(((step + 1) / (active.length + 1)) * 100)

  // ── Validate current step ────────────────────────────────────────────────────
  const valid = () => {
    if (!cur) return false
    const val = cur.type === 'two-number'
      ? { currentWeight: +data.currentWeight, goalWeight: +data.goalWeight }
      : cur.type === 'chips-multi' ? (data[cur.id] || [])
      : (data[cur.id] || '')
    try { return cur.req(val) } catch { return false }
  }

  // ── Setters ──────────────────────────────────────────────────────────────────
  const set = (id, val) => setData(d => ({ ...d, [id]: val }))

  const toggleMulti = (id, val) => setData(d => {
    const prev = d[id] || []
    if (val === 'None' || val === 'Nothing — I eat everything') {
      return { ...d, [id]: prev.includes(val) ? [] : [val] }
    }
    const next = prev.includes(val)
      ? prev.filter(x => x !== val)
      : [...prev.filter(x => x !== 'None' && x !== 'Nothing — I eat everything'), val]
    return { ...d, [id]: next }
  })

  const toggleDay = day => setData(d => {
    const prev = d.gymDays || []
    return { ...d, gymDays: prev.includes(day) ? prev.filter(x => x !== day) : [...prev, day] }
  })

  // ── Navigation ───────────────────────────────────────────────────────────────
  const next = async () => {
    if (step < active.length - 1) {
      setStep(s => s + 1)
    } else {
      await generate()
    }
  }

  const back = () => setStep(s => Math.max(0, s - 1))

  // ── Generate plan ────────────────────────────────────────────────────────────
  const generate = async () => {
    setGen(true)
    const msgs = ['Analyzing your profile...','Designing your workout split...','Building your meal plan...','Selecting ingredients you love...','Finalizing your plan...']
    let si = 0
    const iv = setInterval(() => { si = (si + 1) % msgs.length; setStatus(msgs[si]) }, 3500)

    const fav   = (data.favFoods || []).filter(f => f !== '__other__').concat(data.favFoods_other ? [data.favFoods_other] : [])
    const avoid = (data.avoidFoods || []).filter(f => f !== '__other__' && f !== 'Nothing — I eat everything').concat(data.avoidFoods_other ? [data.avoidFoods_other] : [])
    const sports = (data.additionalSports || []).filter(s => s !== 'None' && s !== '__other__').concat(data.additionalSports_other ? [data.additionalSports_other] : [])

    const goalDate = data.goalDate || (() => { const d = new Date(); d.setMonth(d.getMonth() + 6); return d.toISOString().split('T')[0] })()
    const today    = new Date().toISOString().split('T')[0]

    const profile = {
      name: data.name, age: +data.age,
      currentWeight: +data.currentWeight, goalWeight: +data.goalWeight,
      goalDate, programStart: today, _version: 3,
      medical: data.medical || ['None'], dietary: data.dietary || ['None'],
      favFoods: fav.join(', ') || 'No preference', avoidFoods: avoid.join(', ') || 'Nothing',
      gymType: data.gymType, gymDays: data.gymDays || [],
      fitnessLevel: data.fitnessLevel, trainingDays: data.trainingDays,
      additionalSports: sports.join(', ') || 'None',
      workoutTime: data.workoutTime, sleepQuality: data.sleepQuality, primaryGoal: data.primaryGoal,
      planNotes: data.planNotes || '',
      preferredStores: (data.preferredStores || []).join(', ') || 'Walmart PR, Colmado',
      workoutStructure: data.workoutStructure || 'Flexible',
      eatingSchedule: data.eatingSchedule, ifWindow: data.ifWindow || null, ifStart: data.ifStart || null,
    }

    try {
      const res  = await fetch(`${BACKEND_URL}/onboard`, {
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

  // ── Screens ──────────────────────────────────────────────────────────────────
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

  if (generating) return (
    <div className="ob-overlay" style={{ alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:32 }}>
        <div className="ob-spinner" style={{ margin:'0 auto 24px' }} />
        <div className="syne fw8" style={{ fontSize:20, marginBottom:12 }}>Building your plan...</div>
        <div style={{ fontSize:13, color:'var(--muted)', maxWidth:260, margin:'0 auto 16px', lineHeight:1.6 }}>Claude is creating your personalized plan. About 30 seconds.</div>
        <div style={{ fontSize:12, color:'var(--muted)' }}>{status}</div>
        {error && <>
          <div style={{ color:'var(--red)', marginTop:20, marginBottom:12 }}>{error}</div>
          <button className="ob-next" style={{ maxWidth:200 }} onClick={generate}>Try again</button>
        </>}
      </div>
    </div>
  )

  // ── Main questionnaire ───────────────────────────────────────────────────────
  const renderStep = () => {
    const t = cur?.type

    if (t === 'text' || t === 'number') return (
      <input className="ob-input" type={t} inputMode={t === 'number' ? 'decimal' : 'text'}
        placeholder={cur.placeholder} value={data[cur.id] || ''}
        onChange={e => set(cur.id, e.target.value)}
        onKeyDown={e => e.key === 'Enter' && valid() && next()}
        autoFocus />
    )

    if (t === 'two-number') return (
      <div>
        {cur.ids.map((id, i) => (
          <div key={id} style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6, fontWeight:600 }}>{cur.labels[i]}</div>
            <input className="ob-input" type="number" inputMode="decimal"
              placeholder={cur.placeholders[i]} value={data[id] || ''}
              onChange={e => set(id, e.target.value)} />
          </div>
        ))}
      </div>
    )

    if (t === 'chips-single') return (
      <div className="ob-chips">
        {cur.options.map(o => (
          <button key={o} className={`ob-chip ${data[cur.id] === o ? 'selected' : ''}`}
            onClick={() => set(cur.id, o)}>{o}</button>
        ))}
      </div>
    )

    if (t === 'chips-multi') return (
      <div>
        <div className="ob-chips">
          {cur.options.map(o => (
            <button key={o} className={`ob-chip ${(data[cur.id]||[]).includes(o) ? 'selected' : ''}`}
              onClick={() => toggleMulti(cur.id, o)}>{o}</button>
          ))}
          {cur.allowOther && (
            <button className={`ob-chip ${(data[cur.id]||[]).includes('__other__') ? 'selected' : ''}`}
              onClick={() => toggleMulti(cur.id, '__other__')}>✏️ Other</button>
          )}
        </div>
        {cur.allowOther && (data[cur.id]||[]).includes('__other__') && (
          <input className="ob-input" style={{ marginTop:10 }} type="text"
            placeholder="Type your own..." value={data[cur.id + '_other'] || ''}
            onChange={e => set(cur.id + '_other', e.target.value)} autoFocus />
        )}
      </div>
    )

    if (t === 'goal-date') return (
      <div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {DATE_PRESETS.map(p => {
            const d   = new Date()
            if (p.months) d.setMonth(d.getMonth() + p.months)
            const iso = p.iso || d.toISOString().split('T')[0]
            const sel = data.goalDate === iso
            const lbl = new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })
            return (
              <button key={iso} onClick={() => set('goalDate', iso)} style={{
                padding:'14px 20px', borderRadius:14, textAlign:'left',
                border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
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
        </div>
        {!data.goalDate && (
          <div style={{ marginTop:12, fontSize:12, color:'var(--muted)', textAlign:'center' }}>
            Skip = defaults to 6 months from today
          </div>
        )}
      </div>
    )

    if (t === 'gym-days') {
      const gymDays = data.gymDays || []
      const homeDays = DOW.filter(d => !gymDays.includes(d))
      return (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
            {DOW.map((day, i) => {
              const sel = gymDays.includes(day)
              return (
                <button key={day} onClick={() => toggleDay(day)} style={{
                  padding:'14px 8px', borderRadius:12, textAlign:'center',
                  border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                  background: sel ? 'rgba(0,200,150,.1)' : 'var(--bg3)',
                  cursor:'pointer',
                }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>🏋️</div>
                  <div className="syne fw7" style={{ fontSize:13, color: sel ? 'var(--accent)' : 'var(--muted)' }}>{DOW_FULL[i]}</div>
                </button>
              )
            })}
          </div>
          <div style={{ padding:14, background:'var(--faint)', borderRadius:12, fontSize:12, lineHeight:1.8 }}>
            <div><span style={{ color:'var(--accent)', fontWeight:700 }}>🏋️ Gym:</span> {gymDays.length ? gymDays.join(', ') : 'None selected'}</div>
            <div><span style={{ color:'var(--blue)', fontWeight:700 }}>🏠 Home:</span> {homeDays.length < 6 ? homeDays.join(', ') || 'None' : 'All days'}</div>
            <div><span style={{ color:'var(--purple)', fontWeight:700 }}>😴 Rest:</span> Sunday (always)</div>
          </div>
        </div>
      )
    }

    if (t === 'plan-notes') return (
      <div>
        <textarea
          rows={6}
          placeholder={cur.placeholder || 'Type your requests here...'}
          value={data.planNotes || ''}
          onChange={e => set('planNotes', e.target.value)}
          style={{
            width:'100%', background:'var(--bg3)', border:'1px solid var(--border)',
            borderRadius:14, padding:'14px 16px', color:'var(--text)',
            fontFamily:"'DM Sans',sans-serif", fontSize:14, lineHeight:1.7,
            resize:'none', outline:'none',
            borderColor: data.planNotes ? 'rgba(0,200,150,.4)' : 'var(--border)',
          }}
        />
        <div style={{ fontSize:12, color:'var(--muted)', marginTop:8 }}>
          Optional — tap Continue to skip
        </div>
      </div>
    )

    return <div style={{ color:'var(--muted)' }}>Unknown step type: {t}</div>
  }

  return (
    <div className="ob-overlay">
      {/* Header */}
      <div style={{ padding:'48px 24px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div className="syne fw8" style={{ fontSize:22 }}>Setup <span style={{fontSize:11,color:'var(--accent)',fontWeight:400}}>v4</span></div>
          <div style={{ fontSize:12, color:'var(--muted)', fontFamily:"'Syne',sans-serif", fontWeight:700 }}>
            {step + 1} / {active.length}
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
