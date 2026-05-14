import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function WeightLogger({ compact = false, onSaved }) {
  const { data, submitCheckin } = useApp()

  // Get today's logged weight if exists
  const today      = new Date().toISOString().split('T')[0]
  const todayEntry = data.checkins?.[today]
  const lastWeight = Object.keys(data.checkins || {}).sort().reverse()
    .reduce((acc, k) => acc || data.checkins[k]?.weight, 0) || ''

  const [weight, setWeight] = useState(todayEntry?.weight || '')
  const [saved, setSaved]   = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const val = parseFloat(weight)
    if (!val || val < 50 || val > 700) return
    setSaving(true)
    // Merge with existing today check-in data — don't overwrite workouts/notes
    const existing = data.checkins?.[today] || {}
    await submitCheckin(today, val, { ...existing, weight: val })
    setSaving(false)
    setSaved(true)
    onSaved?.()
    setTimeout(() => setSaved(false), 3000)
  }

  if (compact) return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <input
        type="number" inputMode="decimal"
        placeholder={lastWeight || 'Weight (lbs)'}
        value={weight}
        onChange={e => setWeight(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
        style={{
          flex:1, background:'var(--bg)', border:'2px solid var(--border)',
          borderRadius:10, padding:'10px 14px', color:'var(--text)',
          fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700,
          outline:'none', textAlign:'center',
          borderColor: saved ? 'var(--accent)' : 'var(--border)',
        }}
      />
      <span style={{ fontSize:13, color:'var(--muted)', flexShrink:0 }}>lbs</span>
      <button onClick={handleSave} disabled={!weight || saving}
        style={{
          background: saved ? 'rgba(0,200,150,.15)' : 'var(--accent)',
          border: saved ? '1px solid var(--accent)' : 'none',
          color: saved ? 'var(--accent)' : '#000',
          borderRadius:10, padding:'10px 16px',
          fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13,
          cursor:'pointer', flexShrink:0, transition:'all .2s',
          opacity: (!weight || saving) ? 0.4 : 1,
        }}>
        {saved ? '✅' : saving ? '...' : 'Save'}
      </button>
    </div>
  )

  return (
    <div className="card">
      <div style={{ fontSize:12, fontWeight:700, color:'var(--muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>
        ⚖️ Log Today's Weight
      </div>
      {todayEntry?.weight && (
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10 }}>
          Already logged today: <strong style={{ color:'var(--accent)' }}>{todayEntry.weight} lbs</strong> · updating will replace it
        </div>
      )}
      {!todayEntry?.weight && lastWeight && (
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10 }}>
          Last recorded: <strong style={{ color:'var(--text)' }}>{lastWeight} lbs</strong>
        </div>
      )}
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input
          type="number" inputMode="decimal"
          placeholder={lastWeight || 'e.g. 235.4'}
          value={weight}
          onChange={e => setWeight(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          style={{
            flex:1, background:'var(--bg)', border:'2px solid var(--border)',
            borderRadius:12, padding:'12px 16px', color:'var(--text)',
            fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800,
            outline:'none', textAlign:'center',
            borderColor: saved ? 'var(--accent)' : weight ? 'rgba(255,255,255,.15)' : 'var(--border)',
          }}
          autoFocus={false}
        />
        <span style={{ fontSize:16, color:'var(--muted)', flexShrink:0 }}>lbs</span>
      </div>
      <button onClick={handleSave} disabled={!weight || saving}
        className="submit-btn" style={{ marginTop:12,
          background: saved ? 'rgba(0,200,150,.15)' : undefined,
          border: saved ? '1px solid var(--accent)' : undefined,
          color: saved ? 'var(--accent)' : undefined,
        }}>
        {saved ? '✅ Saved!' : saving ? 'Saving...' : 'Log weight'}
      </button>
    </div>
  )
}
