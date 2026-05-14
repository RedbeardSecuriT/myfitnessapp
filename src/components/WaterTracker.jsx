import { useState } from 'react'
import { useApp } from '../context/AppContext'

const TARGET = 100

export default function WaterTracker() {
  const { data, addWater, resetWater } = useApp()
  const [custom, setCustom] = useState('')
  const oz  = data.water?.oz || 0
  const pct = Math.min(100, Math.round((oz / TARGET) * 100))

  const handleCustom = () => {
    const v = parseFloat(custom)
    if (v > 0 && v <= 200) { addWater(v); setCustom('') }
  }

  return (
    <div className="water-wrap">
      <div className="flex-between" style={{ marginBottom:8 }}>
        <div className="syne fw7" style={{ fontSize:13 }}>
          <span style={{ fontSize:28, color:'var(--blue)' }}>{oz.toFixed(0)}</span>
          <span style={{ color:'var(--muted)', marginLeft:4 }}>/ {TARGET} oz</span>
        </div>
        <div className="syne fw7" style={{ fontSize:18, color: pct>=100?'var(--accent)':'var(--blue)' }}>{pct}%</div>
      </div>

      <div className="prog-wrap" style={{ height:8, marginBottom:14 }}>
        <div className="prog-fill" style={{ width:`${pct}%`, background:'var(--blue)' }} />
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
        <button className="water-btn" onClick={() => addWater(16.9)}>+16.9 oz<br/><span style={{ fontSize:10, opacity:.7 }}>Small bottle</span></button>
        <button className="water-btn" onClick={() => addWater(40)}>+40 oz<br/><span style={{ fontSize:10, opacity:.7 }}>Big bottle</span></button>
        <button className="water-btn" onClick={() => addWater(8)}>+8 oz<br/><span style={{ fontSize:10, opacity:.7 }}>Cup</span></button>
        <button onClick={resetWater} style={{ background:'rgba(255,255,255,.04)', border:'1px solid var(--faint)', borderRadius:12, padding:'12px 10px', color:'var(--muted)', fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:'pointer' }}>Reset</button>
      </div>

      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input type="number" inputMode="decimal" placeholder="Custom oz"
          value={custom} onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key==='Enter' && handleCustom()}
          style={{ flex:1, background:'rgba(59,130,246,.08)', border:'1px solid rgba(59,130,246,.2)', borderRadius:10, padding:'10px 12px', color:'var(--text)', fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none' }}
        />
        <button onClick={handleCustom} style={{ background:'rgba(59,130,246,.15)', border:'1px solid rgba(59,130,246,.3)', borderRadius:10, padding:'10px 16px', color:'var(--blue)', fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, cursor:'pointer' }}>+ Add</button>
      </div>
    </div>
  )
}
