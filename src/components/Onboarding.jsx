import { useState, useEffect } from 'react'
import { BACKEND_URL } from '../lib/supabase'
import { useApp } from '../context/AppContext'

const DOW_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const DOW_FULL   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const STEPS = [
  { id:'name',         type:'text',        q:"What's your name?",              hint:'We personalize everything for you.',                         placeholder:'Your first name',   validate: v => v.trim().length >= 2 },
  { id:'age',          type:'number',      q:'How old are you?',               hint:'Age helps calibrate caloric needs and recovery.',            placeholder:'e.g. 32',           validate: v => +v >= 16 && +v <= 80 },
  { id:'weights',      type:'two-number',  q:'Current and goal weight?',       hint:'Be honest — this sets your entire plan.',                    labels:['Current weight (lbs)','Goal weight (lbs)'], ids:['currentWeight','goalWeight'], placeholders:['e.g. 280','e.g. 220'], validate: v => v.currentWeight > 0 && v.goalWeight > 0 && v.currentWeight > v.goalWeight },
  { id:'goalDate', type:'date-picker', q:'Target date to hit your goal?', hint:'Your milestones, weekly pace, and AI plan are all built around this date. Be ambitious but realistic.', validate: v => !!v && v.length === 10 },
  { id:'medical',      type:'chips-multi', q:'Any medical conditions?',        hint:'Directly changes your workout and nutrition plan.',           options:['None','Hypoglycemia','Type 2 Diabetes','Type 1 Diabetes','Pre-diabetes','Asthma','Hypertension','High Cholesterol','Heart Disease','Anemia','PCOS','Hypothyroidism','Hyperthyroidism','Celiac Disease',"Crohn's / IBS",'GERD / Acid Reflux','Kidney Disease','Joint Pain / Arthritis','Osteoporosis','Lower Back Pain','Sleep Apnea','Depression / Anxiety','Fibromyalgia','High Uric Acid / Gout','Fatty Liver'], validate: v => v.length >= 1 },
  { id:'dietary',      type:'chips-multi', q:'Dietary restrictions?',          hint:'Your meal plan works around these.',                         options:['None','No pork','No red meat','No beef','No chicken','No fish','No shellfish','Vegetarian','Vegan','Pescatarian','Gluten intolerant','Lactose intolerant','No dairy','No eggs','Nut allergy','Soy allergy','Halal','Kosher','Low sodium','Low sugar'], validate: v => v.length >= 1 },
  { id:'favFoods',     type:'chips-multi', allowOther:true, q:'Foods you love?', hint:"We build meals around these.",                            options:['Eggs','Chicken breast','Chicken thighs','Ground turkey','Salmon','Tuna','Shrimp','Bacalao','Arroz blanco','Brown rice','Pasta','Habichuelas','Gandules','Platanos maduros','Tostones','Yuca','Chayote','Avocado / Aguacate','Mangoes','Bananas','Oats','Greek yogurt','Peanut butter','Arroz con pollo','Pernil','Sancocho','Wraps','Sandwiches'], validate: v => v.length >= 1 },
  { id:'avoidFoods',   type:'chips-multi', allowOther:true, q:'Foods you hate or refuse to eat?', hint:"These never appear in your plan.",       options:['Nothing — I eat everything','Liver / organ meats','Sardines','Mushrooms','Beets','Brussels sprouts','Cottage cheese','Tofu','Quinoa','Chia seeds','Olives','Onions','Cilantro','Spicy food','Protein shakes / powders','Artificial sweeteners'], validate: v => v.length >= 1 },
  { id:'gymType',      type:'chips-single',q:'What gym or equipment do you have access to?', hint:'Used to build your workout plan.',             options:['Planet Fitness','Full gym (other)','Gym + Home setup','Home — dumbbells only','Home — resistance bands','Home — no equipment','Outdoors / bodyweight only'], validate: v => !!v },
  { id:'gymDays',      type:'day-picker',  q:'Which days can you go to the gym?', hint:'Leave unchecked = home workout or rest that day. Pick the days you realistically show up.', validate: v => true },
  { id:'homeDays',     type:'display-only',q:'Your workout split',             hint:'Based on your selections. You can always adjust.',           validate: () => true },
  { id:'fitnessLevel', type:'chips-single',q:'Current fitness level?',        hint:'Sets starting weights and cardio intensity.',                 options:['Complete beginner','Some experience (< 1 year)','Intermediate (1–3 years)','Advanced (3+ years)'], validate: v => !!v },
  { id:'trainingDays', type:'chips-single',q:'Total days per week you can train?', hint:'Gym + home combined.',                                   options:['2 days','3 days','4 days','5 days','6 days'], validate: v => !!v },
  { id:'additionalSports', type:'chips-multi', allowOther:true, q:'Any additional sports or activities?', hint:'These get factored into your recovery and calorie needs.', options:['None','Martial arts / BJJ','Boxing','Muay Thai','Soccer / Fútbol','Basketball','Swimming','Cycling / biking','Running','Tennis','Yoga','Pilates','CrossFit','Rock climbing','Dancing'], validate: v => v.length >= 1 },
  { id:'workoutTime',  type:'chips-single',q:'Preferred workout time?',        hint:'Affects pre-workout meal and eating window timing.',          options:['Early morning (5–7am)','Morning (7–9am)','Midday (11am–1pm)','Early afternoon (2–4pm)','Late afternoon (4–6pm)','Evening (6–8pm)','Night (8–10pm)'], validate: v => !!v },
  { id:'sleepQuality', type:'chips-single',q:'How is your sleep?',             hint:'Sleep is when your body recovers and burns fat.',             options:['Great — 7–9h, wake rested','OK — 6–7h, sometimes tired','Poor — under 6h or restless','Night shifts / irregular'], validate: v => !!v },
  { id:'primaryGoal',  type:'chips-single',q:'Beyond weight — what matters most?', hint:'Shapes whether we prioritize strength, endurance, or energy.', options:['Feel more energetic daily','Get stronger','Improve cardiovascular health','Look better / body composition','Manage a health condition'], validate: v => !!v },
  { id:'eatingSchedule', type:'chips-single', q:'Eating schedule?',            hint:'Intermittent fasting works well for fat loss.',               options:['Intermittent fasting','3 meals a day','2 meals + snacks','No structure'], validate: v => !!v },
  { id:'ifWindow',     type:'chips-single',q:'Which fasting window?',           hint:'Eating window is when all meals happen.',                    options:['16:8 — Fast 16h, eat 8h','18:6 — Fast 18h, eat 6h','20:4 — Fast 20h, eat 4h','14:10 — Beginner friendly'], validate: v => !!v, conditional: d => d.eatingSchedule === 'Intermittent fasting' },
  { id:'ifStart',      type:'chips-single',q:'When does your eating window open?', hint:'Sets your break-fast time and all meal reminders.',       options:['7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM'], validate: v => !!v, conditional: d => d.eatingSchedule === 'Intermittent fasting' },
]

export default function Onboarding({ onComplete }) {
  const { user } = useApp()
  const [step, setStep]      = useState(0)
  const [obData, setObData]  = useState({})
  const [generating, setGen] = useState(false)
  const [genStatus, setStatus] = useState('Analyzing your profile...')
  const [done, setDone]      = useState(false)
  const [plan, setPlan]      = useState(null)
  const [error, setError]    = useState('')

  const activeSteps = STEPS.filter(s => !s.conditional || s.conditional(obData))
  const cur = activeSteps[step]
  const pct = Math.round(((step + 1) / (activeSteps.length + 1)) * 100)

  const isValid = () => {
    if (!cur) return false
    if (cur.type === 'display-only') return true
    const v = cur.type === 'two-number'
      ? { currentWeight: +obData.currentWeight, goalWeight: +obData.goalWeight }
      : cur.type === 'chips-multi' || cur.type === 'day-picker' ? (obData[cur.id] || [])
      : (obData[cur.id] || '')
    try { return cur.validate(v) } catch { return false }
  }

  const set  = (id, val) => setObData(d => ({ ...d, [id]: val }))
  const toggleChip = (id, val) => setObData(d => {
    const prev = d[id] || []
    if (val === 'Nothing — I eat everything' || val === 'None') return { ...d, [id]: prev.includes(val) ? [] : [val] }
    return { ...d, [id]: prev.includes(val) ? prev.filter(x => x !== val) : [...prev.filter(x => x !== 'None' && x !== 'Nothing — I eat everything'), val] }
  })
  const toggleDay = (day) => setObData(d => {
    const prev = d.gymDays || []
    return { ...d, gymDays: prev.includes(day) ? prev.filter(x => x !== day) : [...prev, day] }
  })

  // Compute goal date from chips
  // goalDate is now stored directly as YYYY-MM-DD from the date picker
  const resolveGoalDate = (val) => val || '2026-12-15'

  const handleNext = async () => {
    if (step < activeSteps.length - 1) {
      setStep(s => s + 1)
    } else {
      await generate()
    }
  }

  const generate = async () => {
    setGen(true)
    const statuses = ['Analyzing your profile...','Designing your workout split...','Building your meal plan...','Setting your milestones...','Finalizing your plan...']
    let si = 0
    const interval = setInterval(() => { si = (si + 1) % statuses.length; setStatus(statuses[si]) }, 3500)

    const favArr   = (obData.favFoods || []).filter(f => f !== '__other__')
    if (obData.favFoods_other) favArr.push(obData.favFoods_other)
    const avoidArr = (obData.avoidFoods || []).filter(f => f !== '__other__' && f !== 'Nothing — I eat everything')
    if (obData.avoidFoods_other) avoidArr.push(obData.avoidFoods_other)

    const today = new Date().toISOString().split('T')[0]
    const profile = {
      name: obData.name, age: +obData.age,
      currentWeight: +obData.currentWeight, goalWeight: +obData.goalWeight,
      goalDate: resolveGoalDate(obData.goalDate),
      programStart: today,
      medical: obData.medical || ['None'],
      dietary: obData.dietary || ['None'],
      favFoods: favArr.join(', '), avoidFoods: avoidArr.join(', ') || 'Nothing',
      gymType: obData.gymType, gymDays: obData.gymDays || [],
      fitnessLevel: obData.fitnessLevel,
      trainingDays: obData.trainingDays, workoutTime: obData.workoutTime,
      additionalSports: (obData.additionalSports || []).filter(s => s !== 'None').join(', ') || 'None',
      sleepQuality: obData.sleepQuality, primaryGoal: obData.primaryGoal,
      eatingSchedule: obData.eatingSchedule, ifWindow: obData.ifWindow || null, ifStart: obData.ifStart || null,
    }

    try {
      const res  = await fetch(`${BACKEND_URL}/onboard`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, profile }),
      })
      const data = await res.json()
      clearInterval(interval)
      if (!data.success) throw new Error(data.error || 'Generation failed')
      setPlan(data.plan); setDone(true)
      onComplete(profile, data.plan)
    } catch(e) {
      clearInterval(interval)
      setError(e.message); setGen(false)
    }
  }

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
        <div style={{ fontSize:13, color:'var(--muted)', maxWidth:260, margin:'0 auto 16px', lineHeight:1.6 }}>Claude is creating a fully personalized plan. ~30 seconds.</div>
        <div style={{ fontSize:12, color:'var(--muted)' }}>{genStatus}</div>
        {error && <div style={{ marginTop:20 }}><div style={{ color:'var(--red)', marginBottom:12 }}>{error}</div><button className="ob-next" style={{ maxWidth:200 }} onClick={generate}>Try again</button></div>}
      </div>
    </div>
  )

  // Compute home days for display-only step
  const gymDays  = obData.gymDays || []
  const homeDays = DOW_LABELS.filter((d, i) => i < 6 && !gymDays.includes(d))  // Mon-Sat, not Sunday

  return (
    <div className="ob-overlay">
      <div style={{ padding:'48px 24px 20px', textAlign:'center' }}>
        <div className="syne fw8" style={{ fontSize:26 }}>Let's build your plan 💪</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginTop:6 }}>Step {step + 1} of {activeSteps.length}</div>
      </div>
      <div className="ob-progress"><div className="ob-progress-fill" style={{ width:`${pct}%` }} /></div>

      <div style={{ flex:1, padding:'0 24px', overflowY:'auto' }}>
        <div className="ob-question">{cur?.q}</div>
        <div className="ob-hint">{cur?.hint}</div>

        {(cur?.type === 'text' || cur?.type === 'number') && (
          <input className="ob-input" type={cur.type}
            inputMode={cur.type === 'number' ? 'decimal' : 'text'}
            placeholder={cur.placeholder} value={obData[cur.id] || ''}
            onChange={e => set(cur.id, e.target.value)}
            onKeyDown={e => e.key === 'Enter' && isValid() && handleNext()}
            autoFocus />
        )}

        {cur?.type === 'two-number' && cur.ids.map((id, i) => (
          <div key={id} style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6, fontWeight:600 }}>{cur.labels[i]}</div>
            <input className="ob-input" type="number" inputMode="decimal"
              placeholder={cur.placeholders[i]} value={obData[id] || ''}
              onChange={e => set(id, e.target.value)} />
          </div>
        ))}

        {cur?.type === 'date-picker' && (
          <div>
            {/* Quick presets */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
              {[
                { label:'3 months', fn: () => { const d=new Date(); d.setMonth(d.getMonth()+3); return d.toISOString().split('T')[0] } },
                { label:'6 months', fn: () => { const d=new Date(); d.setMonth(d.getMonth()+6); return d.toISOString().split('T')[0] } },
                { label:'9 months', fn: () => { const d=new Date(); d.setMonth(d.getMonth()+9); return d.toISOString().split('T')[0] } },
                { label:'1 year',   fn: () => { const d=new Date(); d.setFullYear(d.getFullYear()+1); return d.toISOString().split('T')[0] } },
                { label:'Dec 15, 2026', fn: () => '2026-12-15' },
              ].map(p => {
                const val = p.fn()
                return (
                  <button key={p.label}
                    className={`ob-chip ${obData.goalDate === val ? 'selected' : ''}`}
                    onClick={() => set('goalDate', val)}>
                    {p.label}
                  </button>
                )
              })}
            </div>
            {/* Actual date input */}
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8, fontWeight:600 }}>Or pick a specific date:</div>
            <input type="date" className="ob-input"
              value={obData.goalDate || ''}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => set('goalDate', e.target.value)}
              style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }} />
            {obData.goalDate && (
              <div style={{ marginTop:12, padding:12, background:'rgba(0,200,150,.08)', border:'1px solid rgba(0,200,150,.2)', borderRadius:12 }}>
                <div style={{ fontSize:13, color:'var(--accent)', fontWeight:600 }}>
                  🎯 Goal: {new Date(obData.goalDate + 'T12:00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
                </div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>
                  {Math.max(0, Math.ceil((new Date(obData.goalDate) - new Date()) / (7 * 24 * 60 * 60 * 1000)))} weeks from today
                </div>
              </div>
            )}
          </div>
        )}

        {cur?.type === 'chips-single' && (
          <div className="ob-chips">
            {cur.options.map(o => (
              <button key={o} className={`ob-chip ${obData[cur.id] === o ? 'selected' : ''}`}
                onClick={() => set(cur.id, o)}>{o}</button>
            ))}
          </div>
        )}

        {cur?.type === 'chips-multi' && (
          <>
            <div className="ob-chips">
              {cur.options.map(o => (
                <button key={o} className={`ob-chip ${(obData[cur.id]||[]).includes(o) ? 'selected' : ''}`}
                  onClick={() => toggleChip(cur.id, o)}>{o}</button>
              ))}
              {cur.allowOther && (
                <button className={`ob-chip ${(obData[cur.id]||[]).includes('__other__') ? 'selected' : ''}`}
                  onClick={() => toggleChip(cur.id, '__other__')}>✏️ Other</button>
              )}
            </div>
            {cur.allowOther && (obData[cur.id]||[]).includes('__other__') && (
              <input className="ob-input" style={{ marginTop:8 }} type="text"
                placeholder="Type your own..."
                value={obData[cur.id + '_other'] || ''}
                onChange={e => set(cur.id + '_other', e.target.value)} autoFocus />
            )}
          </>
        )}

        {cur?.type === 'day-picker' && (
          <div>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              {DOW_LABELS.slice(0,6).map((day, i) => {
                const selected = gymDays.includes(day)
                return (
                  <button key={day} onClick={() => toggleDay(day)} style={{
                    flex: '1 0 calc(33% - 8px)', minWidth:80,
                    padding:'12px 8px', borderRadius:12,
                    border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                    background: selected ? 'rgba(0,200,150,.1)' : 'var(--bg3)',
                    color: selected ? 'var(--accent)' : 'var(--muted)',
                    fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13,
                    cursor:'pointer', textAlign:'center',
                  }}>
                    <div style={{ fontSize:18, marginBottom:4 }}>🏋️</div>
                    {DOW_FULL[i]}
                  </button>
                )
              })}
            </div>
            {gymDays.length > 0 && (
              <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.7 }}>
                <span style={{ color:'var(--accent)', fontWeight:600 }}>Gym days ({gymDays.length}):</span> {gymDays.join(', ')}<br/>
                <span style={{ color:'var(--blue)', fontWeight:600 }}>Home workout days:</span> {homeDays.join(', ') || 'None'}<br/>
                <span style={{ color:'var(--muted)', fontWeight:600 }}>Rest day:</span> Sunday (always)
              </div>
            )}
            {gymDays.length === 0 && (
              <div style={{ fontSize:12, color:'var(--muted)', padding:'12px 0' }}>
                Not selecting any gym days = home-only workout plan
              </div>
            )}
          </div>
        )}

        {cur?.type === 'display-only' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div className="card" style={{ background:'rgba(0,200,150,.08)', borderColor:'rgba(0,200,150,.3)' }}>
              <div className="syne fw7" style={{ color:'var(--accent)', marginBottom:8 }}>🏋️ Gym days ({gymDays.length})</div>
              <div style={{ fontSize:14 }}>{gymDays.length ? gymDays.join(' · ') : 'None selected'}</div>
            </div>
            <div className="card" style={{ background:'rgba(59,130,246,.08)', borderColor:'rgba(59,130,246,.3)' }}>
              <div className="syne fw7" style={{ color:'var(--blue)', marginBottom:8 }}>🏠 Home workout days</div>
              <div style={{ fontSize:14 }}>{homeDays.length ? homeDays.join(' · ') : 'None — all gym'}</div>
            </div>
            <div className="card" style={{ background:'rgba(139,92,246,.08)', borderColor:'rgba(139,92,246,.3)' }}>
              <div className="syne fw7" style={{ color:'var(--purple)', marginBottom:8 }}>😴 Rest day</div>
              <div style={{ fontSize:14 }}>Sunday — always</div>
            </div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>Your AI plan will match this split. You can adjust any day in the app.</div>
          </div>
        )}
      </div>

      <div style={{ padding:24, display:'flex', gap:12 }}>
        {step > 0 && <button className="ob-back" onClick={() => setStep(s => Math.max(0, s-1))}>← Back</button>}
        <button className="ob-next" disabled={!isValid()} onClick={handleNext}>
          {step === activeSteps.length - 1 ? 'Build my plan 🚀' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
