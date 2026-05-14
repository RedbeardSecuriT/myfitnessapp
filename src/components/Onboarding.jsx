import { useState, useEffect, useRef } from 'react'
import { BACKEND_URL } from '../lib/supabase'
import { useApp } from '../context/AppContext'

const STEPS = [
  { id:'name', type:'text', q:"What's your name?", hint:"We'll personalize everything for you.", placeholder:'Your first name', validate: v => v.trim().length >= 2 },
  { id:'age', type:'number', q:'How old are you?', hint:'Age helps calibrate your caloric needs and recovery.', placeholder:'e.g. 32', validate: v => +v >= 16 && +v <= 80 },
  { id:'weights', type:'two-number', q:'Current and goal weight?', hint:'Be honest — this sets your entire plan.', labels:['Current weight (lbs)','Goal weight (lbs)'], ids:['currentWeight','goalWeight'], placeholders:['e.g. 280','e.g. 220'], validate: v => v.currentWeight > 0 && v.goalWeight > 0 && v.currentWeight > v.goalWeight },
  { id:'medical', type:'chips-multi', q:'Any medical conditions?', hint:'These directly change your workout and nutrition plan. Select all that apply.', options:['None','Hypoglycemia','Type 2 Diabetes','Type 1 Diabetes','Pre-diabetes','Asthma','Hypertension','High Cholesterol','Heart Disease','Anemia','PCOS','Hypothyroidism','Hyperthyroidism','Celiac Disease','Crohn\'s / IBS','GERD / Acid Reflux','Kidney Disease','Joint Pain / Arthritis','Osteoporosis','Lower Back Pain','Sleep Apnea','Depression / Anxiety','Fibromyalgia','High Uric Acid / Gout','Fatty Liver'], validate: v => v.length >= 1 },
  { id:'dietary', type:'chips-multi', q:'Dietary restrictions?', hint:'Your meal plan will work around these.', options:['None','No pork','No red meat','No beef','No chicken','No fish','No shellfish','Vegetarian','Vegan','Pescatarian','Gluten intolerant','Lactose intolerant','No dairy','No eggs','Nut allergy','Soy allergy','Halal','Kosher','No alcohol in cooking','Low sodium','Low sugar'], validate: v => v.length >= 1 },
  { id:'favFoods', type:'chips-multi', allowOther:true, q:'Foods you love?', hint:"Pick everything you enjoy — we'll build meals around these.", options:['Eggs','Chicken breast','Chicken thighs','Ground turkey','Salmon','Tuna','Shrimp','Bacalao','Arroz blanco','Brown rice','Pasta','Habichuelas','Gandules','Platanos maduros','Tostones','Yuca','Chayote','Avocado / Aguacate','Mangoes','Bananas','Oats','Greek yogurt','Peanut butter','Arroz con pollo','Pernil','Sancocho','Wraps','Sandwiches'], validate: v => v.length >= 1 },
  { id:'avoidFoods', type:'chips-multi', allowOther:true, q:'Foods you hate or refuse to eat?', hint:"These will never appear in your plan.", options:['Nothing — I eat everything','Liver / organ meats','Sardines','Mushrooms','Beets','Brussels sprouts','Cottage cheese','Tofu','Quinoa','Chia seeds','Olives','Onions','Cilantro','Spicy food','Protein shakes / powders','Artificial sweeteners'], validate: v => v.length >= 1 },
  { id:'gymAccess', type:'chips-single', q:'What gym access do you have?', hint:'Your workout plan is built around your actual equipment.', options:['Planet Fitness','Full gym (other)','Home — dumbbells only','Home — no equipment','Outdoors / bodyweight only'], validate: v => !!v },
  { id:'fitnessLevel', type:'chips-single', q:'Current fitness level?', hint:'Honest answer — sets your starting weights and cardio intensity.', options:['Complete beginner','Some experience (< 1 year)','Intermediate (1–3 years)','Advanced (3+ years)'], validate: v => !!v },
  { id:'trainingDays', type:'chips-single', q:'How many days per week can you train?', hint:'Be realistic. Consistency beats perfection. Rest days are part of the program.', options:['3 days','4 days','5 days','6 days'], validate: v => !!v },
  { id:'workoutTime', type:'chips-single', q:'Preferred workout time?', hint:'This affects your pre-workout meal and eating window timing.', options:['Early morning (5–7am)','Morning (7–9am)','Midday (11am–1pm)','Early afternoon (2–4pm)','Late afternoon (4–6pm)','Evening (6–8pm)','Night (8–10pm)'], validate: v => !!v },
  { id:'sleepQuality', type:'chips-single', q:'How is your sleep?', hint:'Sleep is when your body recovers and burns fat.', options:['Great — 7–9h, wake rested','OK — 6–7h, sometimes tired','Poor — under 6h or restless','Night shifts / irregular'], validate: v => !!v },
  { id:'primaryGoal', type:'chips-single', q:'Beyond weight — what matters most?', hint:'This shapes whether we prioritize strength, endurance, or energy.', options:['Feel more energetic daily','Get stronger','Improve cardiovascular health','Look better / body composition','Manage a health condition'], validate: v => !!v },
  { id:'eatingSchedule', type:'chips-single', q:'Eating schedule?', hint:'Intermittent fasting works well for fat loss. Requires care with diabetes/hypoglycemia.', options:['Intermittent fasting','3 meals a day','2 meals + snacks','No structure'], validate: v => !!v },
  { id:'ifWindow', type:'chips-single', q:'Which fasting window?', hint:'Eating window is when all meals happen. Rest is fasting — water, black coffee only.', options:['16:8 — Fast 16h, eat 8h','18:6 — Fast 18h, eat 6h','20:4 — Fast 20h, eat 4h','14:10 — Beginner friendly'], validate: v => !!v, conditional: data => data.eatingSchedule === 'Intermittent fasting' },
  { id:'ifStart', type:'chips-single', q:'When does your eating window open?', hint:'Sets your break-fast time and all meal reminders.', options:['7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM'], validate: v => !!v, conditional: data => data.eatingSchedule === 'Intermittent fasting' },
]

export default function Onboarding({ onComplete }) {
  const { user } = useApp()
  const [step, setStep]       = useState(0)
  const [obData, setObData]   = useState({})
  const [generating, setGen]  = useState(false)
  const [genStatus, setStatus]= useState('Analyzing your profile...')
  const [done, setDone]       = useState(false)
  const [plan, setPlan]       = useState(null)
  const [error, setError]     = useState('')
  const bodyRef               = useRef(null)

  const activeSteps = STEPS.filter((s, i) => {
    if (!s.conditional) return true
    // Include step if its condition passes with current data
    return s.conditional(obData)
  })

  const cur = activeSteps[step]
  const pct = Math.round(((step + 1) / (activeSteps.length + 1)) * 100)

  const isValid = () => {
    if (!cur) return false
    const v = cur.type === 'two-number'
      ? { currentWeight: +obData.currentWeight, goalWeight: +obData.goalWeight }
      : cur.type === 'chips-multi' ? (obData[cur.id] || [])
      : (obData[cur.id] || '')
    try { return cur.validate(v) } catch { return false }
  }

  // Clear handler flag on step change
  useEffect(() => {
    if (bodyRef.current) bodyRef.current._handler = null
  }, [step])

  const setValue = (id, val) => setObData(d => ({ ...d, [id]: val }))

  const toggleChip = (id, val) => {
    setObData(d => {
      const prev = d[id] || []
      if (val === 'Nothing — I eat everything') return { ...d, [id]: prev.includes(val) ? [] : [val] }
      if (val === 'None') return { ...d, [id]: prev.includes('None') ? [] : ['None'] }
      const next = prev.includes(val) ? prev.filter(x => x !== val) : [...prev.filter(x => x !== 'None'), val]
      return { ...d, [id]: next }
    })
  }

  const handleNext = async () => {
    if (step < activeSteps.length - 1) {
      setStep(s => {
        let next = s + 1
        // Re-filter with latest obData to skip conditionals
        return next
      })
    } else {
      await generate()
    }
  }

  const generate = async () => {
    setGen(true)
    const statuses = ['Analyzing your profile...','Designing your workout split...','Building your meal plan...','Selecting Puerto Rico ingredients...','Setting your milestones...','Finalizing your plan...']
    let si = 0
    const interval = setInterval(() => { si=(si+1)%statuses.length; setStatus(statuses[si]) }, 4000)

    const favArr  = (obData.favFoods || []).filter(f => f !== '__other__')
    if (obData.favFoods_other) favArr.push(obData.favFoods_other)
    const avoidArr = (obData.avoidFoods || []).filter(f => f !== '__other__' && f !== 'Nothing — I eat everything')
    if (obData.avoidFoods_other) avoidArr.push(obData.avoidFoods_other)

    const profile = {
      name: obData.name, age: +obData.age,
      currentWeight: +obData.currentWeight, goalWeight: +obData.goalWeight,
      medical: obData.medical || ['None'], dietary: obData.dietary || ['None'],
      favFoods: favArr.join(', '), avoidFoods: avoidArr.join(', ') || 'Nothing',
      gymAccess: obData.gymAccess, fitnessLevel: obData.fitnessLevel,
      trainingDays: obData.trainingDays, workoutTime: obData.workoutTime,
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
      setPlan(data.plan)
      setDone(true)
      onComplete(profile, data.plan)
    } catch(e) {
      clearInterval(interval)
      setError(e.message)
      setGen(false)
    }
  }

  if (done && plan) return (
    <div className="ob-overlay" style={{ alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:32, maxWidth:320 }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
        <div className="syne fw8" style={{ fontSize:24, marginBottom:12 }}>Your plan is ready!</div>
        <div style={{ fontSize:14, color:'var(--muted)', lineHeight:1.7, marginBottom:32 }}>{plan.greeting}</div>
        <button className="ob-next" onClick={() => onComplete(null, null, true)}>Lets go 🚀</button>
      </div>
    </div>
  )

  if (generating) return (
    <div className="ob-overlay" style={{ alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:32 }}>
        <div className="ob-spinner" style={{ margin:'0 auto 24px' }} />
        <div className="syne fw8" style={{ fontSize:20, marginBottom:12 }}>Building your plan...</div>
        <div style={{ fontSize:13, color:'var(--muted)', maxWidth:260, margin:'0 auto 16px', lineHeight:1.6 }}>Claude is analyzing your profile and creating a fully personalized plan. This takes about 30 seconds.</div>
        <div style={{ fontSize:12, color:'var(--muted)' }}>{genStatus}</div>
        {error && (
          <div style={{ marginTop:24 }}>
            <div style={{ color:'var(--red)', marginBottom:12 }}>{error}</div>
            <button className="ob-next" style={{ maxWidth:200 }} onClick={generate}>Try again</button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="ob-overlay">
      {/* Header */}
      <div style={{ padding:'48px 24px 24px', textAlign:'center' }}>
        <div className="syne fw8" style={{ fontSize:26 }}>Welcome 👋</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginTop:6 }}>Let's build your personal plan</div>
      </div>

      {/* Progress */}
      <div className="ob-progress">
        <div className="ob-progress-fill" style={{ width:`${pct}%` }} />
      </div>

      {/* Body */}
      <div ref={bodyRef} style={{ flex:1, padding:'0 24px', overflowY:'auto' }}>
        <div className="ob-question">{cur?.q}</div>
        <div className="ob-hint">{cur?.hint}</div>

        {(cur?.type === 'text' || cur?.type === 'number') && (
          <input
            className="ob-input" type={cur.type}
            inputMode={cur.type === 'number' ? 'decimal' : 'text'}
            placeholder={cur.placeholder} value={obData[cur.id] || ''}
            onChange={e => setValue(cur.id, e.target.value)}
            onKeyDown={e => e.key === 'Enter' && isValid() && handleNext()}
            autoFocus
          />
        )}

        {cur?.type === 'two-number' && cur.ids.map((id, i) => (
          <div key={id} style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6, fontWeight:600 }}>{cur.labels[i]}</div>
            <input className="ob-input" type="number" inputMode="decimal"
              placeholder={cur.placeholders[i]} value={obData[id] || ''}
              onChange={e => setValue(id, e.target.value)} />
          </div>
        ))}

        {cur?.type === 'chips-single' && (
          <div className="ob-chips">
            {cur.options.map(o => (
              <button key={o} className={`ob-chip ${obData[cur.id] === o ? 'selected' : ''}`}
                onClick={() => setValue(cur.id, o)}>{o}</button>
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
                onChange={e => setValue(cur.id + '_other', e.target.value)}
                autoFocus />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding:24, display:'flex', gap:12 }}>
        {step > 0 && <button className="ob-back" onClick={() => setStep(s => Math.max(0,s-1))}>← Back</button>}
        <button className="ob-next" disabled={!isValid()} onClick={handleNext}>
          {step === activeSteps.length - 1 ? 'Build my plan 🚀' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
