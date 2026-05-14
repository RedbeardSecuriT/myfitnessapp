import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { supabase, BACKEND_URL } from '../lib/supabase'

export default function Profile({ setScreen }) {
  const { user, data, signOut, reload } = useApp()
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenMsg, setRegenMsg] = useState('')

  const profile = data.userProfile
  const plan    = data.generatedPlan

  const regeneratePlan = async () => {
    setRegenLoading(true)
    setRegenMsg('Generating your new plan...')
    try {
      const res  = await fetch(`${BACKEND_URL}/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, profile }),
      })
      const data = await res.json()
      if (data.success) {
        setRegenMsg('✅ New plan generated! Reloading...')
        setTimeout(() => { reload(); setRegenMsg('') }, 2000)
      } else throw new Error(data.error)
    } catch(e) {
      setRegenMsg('❌ ' + e.message)
    }
    setRegenLoading(false)
  }

  const stat = (label, value) => (
    <div style={{ textAlign:'center' }}>
      <div className="syne fw8" style={{ fontSize:22, color:'var(--accent)' }}>{value}</div>
      <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{label}</div>
    </div>
  )

  const checkinCount  = Object.keys(data.checkins || {}).length
  const currentWeight = Object.keys(data.checkins || {}).sort().reverse()
    .reduce((acc, k) => acc || data.checkins[k]?.weight, 0) || data.lastWeight || '—'
  const startWeight   = parseFloat(profile?.currentWeight) || 0
  const lostSoFar     = currentWeight !== '—' ? (startWeight - currentWeight).toFixed(1) : '—'

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
        <div style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>{user?.email}</div>
      </div>

      {/* Stats row */}
      <div className="card flex-between" style={{ marginBottom:16 }}>
        {stat('Current weight', currentWeight !== '—' ? currentWeight + ' lbs' : '—')}
        {stat('Goal weight', (profile?.goalWeight || '—') + (profile?.goalWeight ? ' lbs' : ''))}
        {stat('Lbs lost', lostSoFar)}
        {stat('Check-ins', checkinCount)}
      </div>

      {/* Profile info */}
      {profile && (
        <>
          <div className="section-label">👤 Your profile</div>
          <div className="card">
            {[
              ['Gym', profile.gymAccess],
              ['Training days', profile.trainingDays],
              ['Workout time', profile.workoutTime],
              ['Eating schedule', profile.eatingSchedule],
              ['IF window', profile.ifWindow],
              ['Fitness level', profile.fitnessLevel],
              ['Medical', Array.isArray(profile.medical) ? profile.medical.join(', ') : profile.medical],
              ['Dietary', Array.isArray(profile.dietary) ? profile.dietary.join(', ') : profile.dietary],
            ].filter(([, v]) => v && v !== 'null' && v !== 'None').map(([label, value]) => (
              <div key={label} className="toggle-row">
                <div className="toggle-lbl" style={{ color:'var(--muted)', fontSize:13 }}>{label}</div>
                <div style={{ fontSize:13, textAlign:'right', maxWidth:'60%', color:'var(--text)' }}>{value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Plan status */}
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
              <div className="flex-between">
                <span style={{ fontSize:12, color:'var(--muted)' }}>Macros</span>
                <span style={{ fontSize:12 }}>{plan.macros.protein}g P · {plan.macros.carbs}g C · {plan.macros.fat}g F</span>
              </div>
            )}
            <button onClick={regeneratePlan} disabled={regenLoading}
              style={{ width:'100%', marginTop:14, background:'rgba(0,200,150,.1)', border:'1px solid rgba(0,200,150,.3)', color:'var(--accent)', borderRadius:12, padding:12, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, cursor:'pointer' }}>
              {regenLoading ? '⏳ Generating...' : '🔄 Regenerate plan'}
            </button>
            {regenMsg && <div style={{ fontSize:12, color:'var(--muted)', marginTop:8, textAlign:'center' }}>{regenMsg}</div>}
          </>
        ) : (
          <div style={{ textAlign:'center', padding:16, color:'var(--muted)' }}>
            No plan yet — complete onboarding to generate yours.
          </div>
        )}
      </div>

      {/* Sign out */}
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

      <div style={{ height:20 }} />
    </div>
  )
}
