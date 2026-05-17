import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { supabase, BACKEND_URL } from '../lib/supabase'
import WeightLogger from '../components/WeightLogger'

const WORKOUT_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat']
const WORKOUT_TIME_OPTIONS = [
  'Early morning (5–7am)',
  'Morning (7–9am)',
  'Midday (11am–1pm)',
  'Early afternoon (2–4pm)',
  'Late afternoon (4–6pm)',
  'Evening (6–8pm)',
  'Night (8–10pm)',
]

const MILK_OPTIONS = [
  { value:'whole',   label:'🥛 Whole milk',          sub:'Full fat dairy' },
  { value:'2pct',    label:'🥛 2% milk',             sub:'Reduced fat dairy' },
  { value:'skim',    label:'🥛 Skim milk',            sub:'Fat-free dairy' },
  { value:'oat',     label:'🌾 Oat milk',             sub:'No dairy' },
  { value:'almond',  label:'🌰 Almond milk',          sub:'No dairy, low cal' },
  { value:'soy',     label:'🫘 Soy milk',             sub:'High protein, no dairy' },
  { value:'coconut', label:'🥥 Coconut milk',         sub:'Dairy-free, richer' },
  { value:'lactaid', label:'🥛 Lactaid / lactose-free', sub:'Dairy, no lactose' },
  { value:'none',    label:'❌ No milk / skip',       sub:'Prefer to leave it out' },
]

const STRUCTURE_OPTIONS = [
  'Cardio first, then weights',
  'Weights first, then cardio',
  'Cardio only',
  'Weights only',
  'Circuit / mixed throughout',
  "Whatever the plan says — I'm flexible",
]
const FITNESS_OPTIONS = [
  'Complete beginner',
  'Some experience (< 1 year)',
  'Intermediate (1–3 years)',
  'Advanced (3+ years)',
]
const TRAINING_DAY_OPTIONS = ['2 days','3 days','4 days','5 days','6 days']

export default function Profile({ setScreen }) {
  const { user, data, signOut, reload, saveProfile } = useApp()

  // Regen state
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenMsg,     setRegenMsg]     = useState('')

  // Progressive completion edit state
  const [editStores,    setEditStores]    = useState(false)
  const [editStructure, setEditStructure] = useState(false)
  const [editFitness,   setEditFitness]   = useState(false)
  const [editNotes,     setEditNotes]     = useState(false)
  const [editMilk,      setEditMilk]      = useState(false)
  const [editSchedule,  setEditSchedule]  = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [saveMsg,       setSaveMsg]       = useState('')

  // Local editable copies
  const profile = data.userProfile
  const plan    = data.generatedPlan
  const unit    = profile?.unitSystem === 'metric' ? 'kg' : 'lbs'

  const rawStores = profile?.preferredStores || []
  const stores = Array.isArray(rawStores) ? rawStores : (rawStores || '').split(',').map(s => s.trim())

  const [store1, setStore1] = useState(stores[0] || '')
  const [store2, setStore2] = useState(stores[1] || '')
  const [store3, setStore3] = useState(stores[2] || '')
  const [structure, setStructure] = useState(profile?.workoutStructure || "Whatever the plan says — I'm flexible")
  const [fitnessLevel, setFitnessLevel] = useState(profile?.fitnessLevel || 'Some experience (< 1 year)')
  const [trainingDays, setTrainingDays] = useState(profile?.trainingDays || '5 days')
  const [planNotes,    setPlanNotes]    = useState(profile?.planNotes || '')
  const [milkPref,     setMilkPref]     = useState(profile?.milkPreference || '')
  const [timeByDay,    setTimeByDay]    = useState(profile?.workoutTimeByDay || {})

  // ── Completion audit ────────────────────────────────────────────────────────
  const completionItems = [
    { key:'stores',    label:'Preferred grocery stores', done: stores.filter(Boolean).length >= 1, action: () => setEditStores(v => !v) },
    { key:'structure', label:'Workout structure',        done: profile?.workoutStructure && !profile.workoutStructure.includes('flexible') && !profile.workoutStructure.includes('Flexible'), action: () => setEditStructure(v => !v) },
    { key:'fitness',   label:'Fitness level',           done: profile?.fitnessLevel && profile.fitnessLevel !== 'Some experience (< 1 year)', action: () => setEditFitness(v => !v) },
    { key:'notes',     label:'Personal preferences',    done: !!(profile?.planNotes && profile.planNotes.trim().length > 10), action: () => setEditNotes(v => !v) },
  ]
  const completedCount = completionItems.filter(i => i.done).length
  const completionPct  = Math.round((completedCount / completionItems.length) * 100)

  // ── Save helpers ────────────────────────────────────────────────────────────
  const flash = (msg) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 3000) }

  const persistProfile = async (patch) => {
    setSaving(true)
    const updated = { ...profile, ...patch }
    await saveProfile(updated)
    setSaving(false)
    flash('✅ Saved')
  }

  const saveStores = async () => {
    const s = [store1, store2, store3].map(s => s.trim()).filter(Boolean)
    await persistProfile({ preferredStores: s })
    setEditStores(false)
  }

  const saveStructure = async () => {
    await persistProfile({ workoutStructure: structure })
    setEditStructure(false)
  }

  const saveFitness = async () => {
    await persistProfile({ fitnessLevel, trainingDays })
    setEditFitness(false)
  }

  const saveSchedule = async () => {
    await persistProfile({ workoutTimeByDay: timeByDay })
    setEditSchedule(false)
  }

  const saveMilk = async () => {
    await persistProfile({ milkPreference: milkPref })
    setEditMilk(false)
  }

  const saveNotes = async () => {
    await persistProfile({ planNotes })
    setEditNotes(false)
  }

  // ── Full plan regeneration (uses updated profile) ───────────────────────────
  const regeneratePlan = async () => {
    setRegenLoading(true)
    setRegenMsg('Generating your new plan...')
    try {
      const res  = await fetch(`${BACKEND_URL}/onboard`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, profile: data.userProfile }),
      })
      const result = await res.json()
      if (result.success) {
        setRegenMsg('✅ New plan generated! Reloading...')
        setTimeout(() => { reload(); setRegenMsg('') }, 2000)
      } else throw new Error(result.error)
    } catch(e) { setRegenMsg('❌ ' + e.message) }
    setRegenLoading(false)
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stat = (label, value) => (
    <div style={{ textAlign:'center' }}>
      <div className="syne fw8" style={{ fontSize:20, color:'var(--accent)' }}>{value}</div>
      <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{label}</div>
    </div>
  )

  const checkinCount  = Object.keys(data.checkins || {}).length
  const currentWeight = Object.keys(data.checkins || {}).sort().reverse()
    .reduce((acc, k) => acc || data.checkins[k]?.weight, 0) || data.lastWeight || '—'
  const startWeight   = parseFloat(profile?.currentWeight) || 0
  const lostSoFar     = currentWeight !== '—' ? (startWeight - currentWeight).toFixed(1) : '—'

  const Chip = ({ label, active, onClick }) => (
    <button onClick={onClick} style={{
      padding:'8px 14px', borderRadius:20,
      border:`2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'rgba(0,200,150,.1)' : 'var(--faint)',
      color: active ? 'var(--accent)' : 'var(--muted)',
      fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor:'pointer', marginBottom:8, marginRight:8,
    }}>{label}</button>
  )

  return (
    <div className="screen">
      {/* Avatar + name */}
      <div style={{ textAlign:'center', padding:'20px 0 24px' }}>
        <div style={{
          width:72, height:72, borderRadius:'50%', margin:'0 auto 12px',
          background:'linear-gradient(135deg, var(--accent), var(--blue))',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:28, fontWeight:800, fontFamily:"'Syne',sans-serif", color:'#000',
        }}>
          {(profile?.name || user?.email || '?')[0].toUpperCase()}
        </div>
        <div className="syne fw8" style={{ fontSize:22 }}>{profile?.name || 'Athlete'}</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>{user?.email}</div>
        {profile?.location?.city && (
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>
            📍 {profile.location.city}{profile.location.country ? ', ' + profile.location.country : ''} · {unit}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="card flex-between" style={{ marginBottom:16 }}>
        {stat('Weight now', currentWeight !== '—' ? `${currentWeight} ${unit}` : '—')}
        {stat('Goal', profile?.goalWeight ? `${profile.goalWeight} ${unit}` : '—')}
        {stat(unit === 'kg' ? 'kg lost' : 'lbs lost', lostSoFar !== '—' ? lostSoFar : '—')}
        {stat('Check-ins', checkinCount)}
      </div>

      {/* ── Profile completion ──────────────────────────────────────────────── */}
      <div className="section-label">⚡ Complete your profile</div>
      <div className="card" style={{ marginBottom:16 }}>
        {/* Completion bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <span style={{ fontSize:13, fontWeight:600 }}>Profile strength</span>
          <span style={{ fontSize:13, color: completionPct === 100 ? 'var(--accent)' : 'var(--amber)', fontWeight:700 }}>
            {completionPct === 100 ? '✅ Complete' : `${completedCount}/${completionItems.length} done`}
          </span>
        </div>
        <div style={{ height:6, background:'var(--faint)', borderRadius:3, overflow:'hidden', marginBottom:16 }}>
          <div style={{ height:'100%', width:`${completionPct}%`, background: completionPct === 100 ? 'var(--accent)' : 'var(--amber)', borderRadius:3, transition:'width .4s' }} />
        </div>

        {saveMsg && (
          <div style={{ padding:'8px 12px', background:'rgba(0,200,150,.1)', border:'1px solid var(--accent)', borderRadius:10, fontSize:13, color:'var(--accent)', marginBottom:12 }}>
            {saveMsg}
          </div>
        )}

        {/* ── Stores ── */}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:12, marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
            onClick={() => setEditStores(v => !v)}>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>
                {completionItems[0].done ? '✅' : '⬜'} 🛒 Preferred grocery stores
              </div>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
                {stores.filter(Boolean).length > 0
                  ? stores.filter(Boolean).join(' · ')
                  : 'Unlocks a personalized grocery list'}
              </div>
            </div>
            <span style={{ color:'var(--muted)', fontSize:18 }}>{editStores ? '▲' : '▼'}</span>
          </div>

          {editStores && (
            <div style={{ marginTop:12 }}>
              {[
                ['Large supermarket', store1, setStore1, 'e.g. Walmart, Carrefour, Tesco'],
                ['Bulk / warehouse store', store2, setStore2, 'e.g. Costco, Sam\'s Club, Makro'],
                ['Local / corner store', store3, setStore3, 'e.g. Colmado, bodega, co-op'],
              ].map(([label, val, setter, ph]) => (
                <div key={label} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4, fontWeight:600 }}>{label}</div>
                  <input value={val} onChange={e => setter(e.target.value)} placeholder={ph}
                    style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px', color:'var(--text)', fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none' }} />
                </div>
              ))}
              <button onClick={saveStores} disabled={saving}
                style={{ background:'var(--accent)', color:'#000', border:'none', borderRadius:10, padding:'10px 16px', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', width:'100%' }}>
                {saving ? 'Saving...' : '💾 Save stores'}
              </button>
            </div>
          )}
        </div>

        {/* ── Workout structure ── */}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:12, marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
            onClick={() => setEditStructure(v => !v)}>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>
                {completionItems[1].done ? '✅' : '⬜'} 💪 Workout structure
              </div>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
                {profile?.workoutStructure || 'How do you prefer to order your sessions?'}
              </div>
            </div>
            <span style={{ color:'var(--muted)', fontSize:18 }}>{editStructure ? '▲' : '▼'}</span>
          </div>

          {editStructure && (
            <div style={{ marginTop:12 }}>
              <div style={{ flexWrap:'wrap', display:'flex' }}>
                {STRUCTURE_OPTIONS.map(o => (
                  <Chip key={o} label={o} active={structure === o} onClick={() => setStructure(o)} />
                ))}
              </div>
              <button onClick={saveStructure} disabled={saving}
                style={{ background:'var(--accent)', color:'#000', border:'none', borderRadius:10, padding:'10px 16px', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', width:'100%', marginTop:8 }}>
                {saving ? 'Saving...' : '💾 Save structure'}
              </button>
            </div>
          )}
        </div>

        {/* ── Fitness level ── */}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
            onClick={() => setEditFitness(v => !v)}>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>
                {completionItems[2].done ? '✅' : '⬜'} 🏋️ Fitness level & training days
              </div>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
                {profile?.fitnessLevel || 'Calibrates workout intensity and volume'}
                {profile?.trainingDays ? ` · ${profile.trainingDays}/week` : ''}
              </div>
            </div>
            <span style={{ color:'var(--muted)', fontSize:18 }}>{editFitness ? '▲' : '▼'}</span>
          </div>

          {editFitness && (
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6, fontWeight:600 }}>Experience level</div>
              <div style={{ flexWrap:'wrap', display:'flex', marginBottom:12 }}>
                {FITNESS_OPTIONS.map(o => (
                  <Chip key={o} label={o} active={fitnessLevel === o} onClick={() => setFitnessLevel(o)} />
                ))}
              </div>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6, fontWeight:600 }}>Training days per week</div>
              <div style={{ flexWrap:'wrap', display:'flex', marginBottom:12 }}>
                {TRAINING_DAY_OPTIONS.map(o => (
                  <Chip key={o} label={o} active={trainingDays === o} onClick={() => setTrainingDays(o)} />
                ))}
              </div>
              <button onClick={saveFitness} disabled={saving}
                style={{ background:'var(--accent)', color:'#000', border:'none', borderRadius:10, padding:'10px 16px', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', width:'100%' }}>
                {saving ? 'Saving...' : '💾 Save fitness level'}
              </button>
            </div>
          )}
        </div>

        {/* ── Per-day workout schedule ── */}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:12, marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
            onClick={() => setEditSchedule(v => !v)}>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>
                ⬜ 🕐 Per-day workout times
              </div>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
                {Object.keys(timeByDay).filter(d => timeByDay[d]).length > 0
                  ? Object.entries(timeByDay).filter(([,v]) => v).map(([d,v]) => `${d}: ${v.split('(')[0].trim()}`).join(' · ')
                  : `Default: ${profile?.workoutTime || 'Not set'} · Override per day here`}
              </div>
            </div>
            <span style={{ color:'var(--muted)', fontSize:18, flexShrink:0, marginLeft:8 }}>{editSchedule ? '▲' : '▼'}</span>
          </div>

          {editSchedule && (
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10, lineHeight:1.5 }}>
                Default: <strong style={{ color:'var(--text)' }}>{profile?.workoutTime || 'Not set'}</strong> — override any day below. Leave blank to use default.
              </div>
              {WORKOUT_DAYS.map(day => (
                <div key={day} style={{ marginBottom:12 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--muted)', marginBottom:6 }}>{day}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    <button onClick={() => setTimeByDay(t => ({ ...t, [day]: null }))}
                      style={{ padding:'6px 12px', borderRadius:16, fontSize:12, cursor:'pointer',
                        border:`1px solid ${!timeByDay[day] ? 'var(--accent)' : 'var(--border)'}`,
                        background: !timeByDay[day] ? 'rgba(0,200,150,.1)' : 'var(--faint)',
                        color: !timeByDay[day] ? 'var(--accent)' : 'var(--muted)' }}>
                      Use default
                    </button>
                    {WORKOUT_TIME_OPTIONS.map(opt => (
                      <button key={opt} onClick={() => setTimeByDay(t => ({ ...t, [day]: opt }))}
                        style={{ padding:'6px 12px', borderRadius:16, fontSize:12, cursor:'pointer',
                          border:`1px solid ${timeByDay[day] === opt ? 'var(--accent)' : 'var(--border)'}`,
                          background: timeByDay[day] === opt ? 'rgba(0,200,150,.1)' : 'var(--faint)',
                          color: timeByDay[day] === opt ? 'var(--accent)' : 'var(--muted)' }}>
                        {opt.split('(')[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={saveSchedule} disabled={saving}
                style={{ background:'var(--accent)', color:'#000', border:'none', borderRadius:10, padding:'10px 16px', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', width:'100%', marginTop:4 }}>
                {saving ? 'Saving...' : '💾 Save workout schedule'}
              </button>
            </div>
          )}
        </div>

        {/* ── Milk preference ── */}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:12, marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
            onClick={() => setEditMilk(v => !v)}>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>
                {milkPref ? '✅' : '⬜'} 🥛 Milk / dairy preference
              </div>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
                {milkPref
                  ? MILK_OPTIONS.find(m => m.value === milkPref)?.label || milkPref
                  : 'Used in oats, smoothies, and recipes — affects every meal'}
              </div>
            </div>
            <span style={{ color:'var(--muted)', fontSize:18, flexShrink:0, marginLeft:8 }}>{editMilk ? '▲' : '▼'}</span>
          </div>

          {editMilk && (
            <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
              {MILK_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setMilkPref(opt.value)}
                  style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'12px 14px', borderRadius:12, cursor:'pointer', textAlign:'left',
                    border:`2px solid ${milkPref === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: milkPref === opt.value ? 'rgba(0,200,150,.1)' : 'var(--faint)',
                  }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color: milkPref === opt.value ? 'var(--accent)' : 'var(--text)' }}>{opt.label}</div>
                    <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{opt.sub}</div>
                  </div>
                  {milkPref === opt.value && <span style={{ fontSize:18 }}>✅</span>}
                </button>
              ))}
              <button onClick={saveMilk} disabled={saving || !milkPref}
                style={{ background:'var(--accent)', color:'#000', border:'none', borderRadius:10, padding:'10px 16px', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', width:'100%', marginTop:4 }}>
                {saving ? 'Saving...' : '💾 Save milk preference'}
              </button>
            </div>
          )}
        </div>

        {/* ── Plan notes ── */}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
            onClick={() => setEditNotes(v => !v)}>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>
                {completionItems[3].done ? '✅' : '⬜'} 📝 Personal preferences & requests
              </div>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:2, lineHeight:1.5 }}>
                {profile?.planNotes && profile.planNotes.trim()
                  ? profile.planNotes.length > 80
                    ? profile.planNotes.slice(0, 80) + '...'
                    : profile.planNotes
                  : 'Favorite foods, dislikes, sports, schedule constraints — Claude uses every word'}
              </div>
            </div>
            <span style={{ color:'var(--muted)', fontSize:18, flexShrink:0, marginLeft:8 }}>{editNotes ? '▲' : '▼'}</span>
          </div>

          {editNotes && (
            <div style={{ marginTop:12 }}>
              <textarea
                value={planNotes}
                onChange={e => setPlanNotes(e.target.value)}
                rows={6}
                placeholder={'Tell Claude anything that should shape your plan:\n• "I love chicken, rice, and eggs. Hate mushrooms."\n• "I do BJJ on Tuesday and Thursday nights"\n• "I work night shifts 10pm–6am"\n• "I want overnight oats every weekday morning"\n• "Complete beginner — never lifted before"'}
                style={{
                  width:'100%', background:'var(--bg)', border:'1px solid var(--border)',
                  borderRadius:12, padding:'12px 14px', color:'var(--text)',
                  fontFamily:"'DM Sans',sans-serif", fontSize:13, lineHeight:1.7,
                  resize:'none', outline:'none', marginBottom:10,
                  borderColor: planNotes.trim() ? 'rgba(0,200,150,.4)' : 'var(--border)',
                }}
              />
              <div style={{ fontSize:11, color:'var(--muted)', marginBottom:10 }}>
                These notes are included every time Claude generates or refreshes your plan. Hit "Regenerate full plan" below to apply them immediately.
              </div>
              <button onClick={saveNotes} disabled={saving}
                style={{ background:'var(--accent)', color:'#000', border:'none', borderRadius:10, padding:'10px 16px', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', width:'100%' }}>
                {saving ? 'Saving...' : '💾 Save preferences'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Profile info ────────────────────────────────────────────────────── */}
      {profile && (
        <>
          <div className="section-label">👤 Your profile</div>
          <div className="card">
            {[
              ['Location', profile.location?.city ? `${profile.location.city}${profile.location.country ? ', '+profile.location.country : ''}` : null],
              ['Gym', profile.gymType || profile.gymAccess],
              ['Workout time', profile.workoutTime],
              ['Eating schedule', profile.eatingSchedule],
              ['IF window', profile.ifWindow],
              ['Medical', Array.isArray(profile.medical) ? profile.medical.filter(m => m !== 'None').join(', ') : profile.medical],
              ['Dietary', Array.isArray(profile.dietary) ? profile.dietary.filter(d => d !== 'None').join(', ') : profile.dietary],
              ['Goal date', profile.goalDate],
            ].filter(([, v]) => v && v !== 'null' && v !== 'None' && v !== '').map(([label, value]) => (
              <div key={label} className="toggle-row">
                <div className="toggle-lbl" style={{ color:'var(--muted)', fontSize:13 }}>{label}</div>
                <div style={{ fontSize:13, textAlign:'right', maxWidth:'60%', color:'var(--text)' }}>{value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Weight ─────────────────────────────────────────────────────────── */}
      <div className="section-label">⚖️ Weight</div>
      <WeightLogger />

      {/* ── AI Plan ────────────────────────────────────────────────────────── */}
      <div className="section-label">🤖 AI Plan</div>
      <div className="card">
        {plan?.greeting ? (
          <>
            <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6, marginBottom:12 }}>{plan.greeting}</div>
            <div className="flex-between" style={{ marginBottom:8 }}>
              <span style={{ fontSize:12, color:'var(--muted)' }}>Caloric target</span>
              <span className="badge badge-green">{plan.caloricTarget} kcal</span>
            </div>
            {plan.macros && (
              <div className="flex-between" style={{ marginBottom:14 }}>
                <span style={{ fontSize:12, color:'var(--muted)' }}>Macros</span>
                <span style={{ fontSize:12 }}>{plan.macros.protein}g P · {plan.macros.carbs}g C · {plan.macros.fat}g F</span>
              </div>
            )}
            {plan._safetyOverride && (
              <div style={{ padding:'8px 12px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, fontSize:12, color:'var(--red)', marginBottom:12 }}>
                ⚠️ IF overridden to 3 meals/day (hypoglycemia safety)
              </div>
            )}
            <button onClick={regeneratePlan} disabled={regenLoading}
              style={{ width:'100%', background:'rgba(0,200,150,.1)', border:'1px solid rgba(0,200,150,.3)', color:'var(--accent)', borderRadius:12, padding:12, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, cursor:'pointer' }}>
              {regenLoading ? '⏳ Generating...' : '🔄 Regenerate full plan'}
            </button>
            {regenMsg && <div style={{ fontSize:12, color:'var(--muted)', marginTop:8, textAlign:'center' }}>{regenMsg}</div>}
          </>
        ) : (
          <div style={{ textAlign:'center', padding:16, color:'var(--muted)' }}>
            No plan yet — complete onboarding to generate yours.
          </div>
        )}
      </div>

      {/* ── Sign out ────────────────────────────────────────────────────────── */}
      <div className="section-label">⚙️ Account</div>
      <div className="card">
        <button onClick={signOut} style={{
          width:'100%', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)',
          color:'var(--red)', borderRadius:12, padding:14, fontFamily:"'Syne',sans-serif",
          fontWeight:700, fontSize:15, cursor:'pointer',
        }}>
          Sign out
        </button>
      </div>

      <div style={{ height:24 }} />
    </div>
  )
}
