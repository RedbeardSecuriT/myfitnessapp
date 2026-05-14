import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'

// Common PR foods for quick-add
const QUICK_ITEMS = [
  { emoji: '☕', name: 'Coffee / Café', cal: 5, cat: 'drink' },
  { emoji: '☕', name: 'Coffee with milk', cal: 45, cat: 'drink' },
  { emoji: '🧃', name: 'Jugo / Juice', cal: 120, cat: 'drink' },
  { emoji: '🥤', name: 'Protein shake', cal: 160, cat: 'drink' },
  { emoji: '🥛', name: 'Milk / Leche', cal: 120, cat: 'drink' },
  { emoji: '🍌', name: 'Banana', cal: 105, cat: 'fruit' },
  { emoji: '🥚', name: 'Eggs (2)', cal: 140, cat: 'food' },
  { emoji: '🍳', name: 'Huevos revueltos', cal: 200, cat: 'food' },
  { emoji: '🥣', name: 'Overnight oats', cal: 420, cat: 'food' },
  { emoji: '🍗', name: 'Chicken thigh (6oz)', cal: 280, cat: 'food' },
  { emoji: '🍛', name: 'Arroz con pollo', cal: 520, cat: 'food' },
  { emoji: '🍚', name: 'Brown rice (½ cup)', cal: 110, cat: 'food' },
  { emoji: '🫘', name: 'Habichuelas (½ cup)', cal: 115, cat: 'food' },
  { emoji: '🌯', name: 'Turkey wrap', cal: 380, cat: 'food' },
  { emoji: '🥑', name: 'Aguacate (½)', cal: 120, cat: 'food' },
  { emoji: '🍞', name: 'Pan sobao (1)', cal: 140, cat: 'food' },
  { emoji: '🫔', name: 'Tostones (4)', cal: 160, cat: 'food' },
  { emoji: '🍪', name: 'Cookie / galleta', cal: 160, cat: 'snack' },
  { emoji: '🍫', name: 'Chocolate', cal: 170, cat: 'snack' },
  { emoji: '🥜', name: 'Peanut butter (2 tbsp)', cal: 190, cat: 'snack' },
  { emoji: '🍕', name: 'Pizza slice', cal: 285, cat: 'food' },
  { emoji: '🍔', name: 'Burger', cal: 550, cat: 'food' },
  { emoji: '🧁', name: 'Pastellito', cal: 220, cat: 'snack' },
  { emoji: '🥤', name: 'Soda / Refresco', cal: 150, cat: 'drink' },
  { emoji: '🍺', name: 'Beer / Cerveza', cal: 150, cat: 'drink' },
  { emoji: '🥃', name: 'Rum / Ron', cal: 100, cat: 'drink' },
]

export default function MealTracker() {
  const { user } = useApp()
  const today = new Date().toISOString().split('T')[0]

  const [log, setLog]         = useState([])
  const [loaded, setLoaded]   = useState(false)
  const [custom, setCustom]   = useState({ name: '', cal: '', emoji: '🍽️' })
  const [showCustom, setShowCustom] = useState(false)
  const [filter, setFilter]   = useState('all')
  const [saving, setSaving]   = useState(false)

  // Load today's log from Supabase
  useState(() => {
    if (!user || loaded) return
    supabase.from('meal_log').select('*').eq('user_id', user.id).eq('date', today)
      .order('logged_at', { ascending: true })
      .then(({ data }) => {
        if (data) setLog(data)
        setLoaded(true)
      })
  })

  const saveEntry = async (entry) => {
    setSaving(true)
    const row = {
      user_id: user.id,
      date: today,
      name: entry.name,
      emoji: entry.emoji,
      calories: entry.cal || 0,
      category: entry.cat || 'food',
      note: entry.note || '',
      logged_at: new Date().toISOString(),
    }
    const { data } = await supabase.from('meal_log').insert(row).select().single()
    if (data) setLog(l => [...l, data])
    setSaving(false)
  }

  const deleteEntry = async (id) => {
    await supabase.from('meal_log').delete().eq('id', id)
    setLog(l => l.filter(e => e.id !== id))
  }

  const totalCal = log.reduce((acc, e) => acc + (e.calories || 0), 0)

  const filtered = filter === 'all' ? log : log.filter(e => e.category === filter)

  const addCustom = () => {
    if (!custom.name.trim()) return
    saveEntry({ ...custom, cal: +custom.cal || 0, cat: 'custom' })
    setCustom({ name: '', cal: '', emoji: '🍽️' })
    setShowCustom(false)
  }

  const timeLabel = (ts) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  return (
    <div className="screen">
      <div className="page-title" style={{ marginBottom: 2 }}>Food Log</div>
      <div className="page-sub" style={{ marginBottom: 16 }}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>

      {/* Daily summary */}
      <div className="card flex-between" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: totalCal > 2400 ? 'var(--red)' : 'var(--accent)' }}>
            {totalCal.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>kcal logged today</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{log.length} items</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>tracked</div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="tab-strip" style={{ marginBottom: 16 }}>
        {[['all','All'],['drink','Drinks'],['food','Food'],['snack','Snacks'],['custom','Custom']].map(([v, l]) => (
          <button key={v} className={`tab-chip ${filter===v?'active':''}`} onClick={() => setFilter(v)}
            style={{ fontSize: 12, padding: '6px 12px' }}>{l}</button>
        ))}
      </div>

      {/* Quick add */}
      <div className="section-label">⚡ Quick add</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {QUICK_ITEMS.filter(i => filter === 'all' || i.cat === filter).map((item, idx) => (
          <button key={idx} onClick={() => saveEntry(item)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '8px 12px', cursor: 'pointer',
              fontSize: 13, color: 'var(--text)', transition: 'all .15s',
            }}>
            <span>{item.emoji}</span>
            <span>{item.name}</span>
            {item.cal > 0 && <span style={{ color: 'var(--muted)', fontSize: 11 }}>{item.cal}</span>}
          </button>
        ))}
      </div>

      {/* Custom entry */}
      {!showCustom ? (
        <button onClick={() => setShowCustom(true)} style={{
          width: '100%', background: 'var(--bg3)', border: '1px dashed var(--border)',
          borderRadius: 12, padding: 12, color: 'var(--muted)', fontSize: 14, cursor: 'pointer', marginBottom: 16,
        }}>
          ✏️ Add something custom...
        </button>
      ) : (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Custom item</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={custom.emoji} onChange={e => setCustom(c => ({...c, emoji: e.target.value}))}
              style={{ width: 48, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, color: 'var(--text)', fontSize: 18, textAlign: 'center', outline: 'none' }} />
            <input placeholder="What did you eat/drink?" value={custom.name}
              onChange={e => setCustom(c => ({...c, name: e.target.value}))}
              style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: 'none' }} />
            <input placeholder="cal" type="number" value={custom.cal}
              onChange={e => setCustom(c => ({...c, cal: e.target.value}))}
              style={{ width: 64, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, color: 'var(--text)', fontFamily: "'Syne',sans-serif", fontSize: 14, textAlign: 'center', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addCustom} style={{ flex: 1, background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 10, padding: 10, fontFamily: "'Syne',sans-serif", fontWeight: 700, cursor: 'pointer' }}>Add</button>
            <button onClick={() => setShowCustom(false)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 10, padding: '10px 16px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Log */}
      <div className="section-label">📋 Today's log {saving && '· saving...'}</div>
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
          Nothing logged yet — tap anything above to add it
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.map((entry, i) => (
            <div key={entry.id || i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontSize: 22 }}>{entry.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{entry.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{timeLabel(entry.logged_at)}</div>
              </div>
              {entry.calories > 0 && (
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                  {entry.calories} kcal
                </div>
              )}
              <button onClick={() => deleteEntry(entry.id)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, padding: 4 }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
