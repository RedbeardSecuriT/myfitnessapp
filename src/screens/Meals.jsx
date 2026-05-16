import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { RECIPES } from '../data/recipes'

export default function Meals() {
  const { data } = useApp()
  const [catIdx, setCatIdx] = useState(0)
  const [varIdx, setVarIdx] = useState(0)

  const recipes = useMemo(() => {
    const plan = data.generatedPlan
    if (!plan?.meals || Object.keys(plan).length === 0) return RECIPES

    const tocat = (emoji, name, sub, items) => {
      if (!items?.length) return null
      return {
        emoji, name, sub,
        variants: items.map(meal => {
          const raw   = meal.instructions || 'Prepare as described.'
          let steps   = raw.split(/\s*\|\s*/).map(s => s.trim()).filter(Boolean)
          if (steps.length <= 1) steps = raw.split(/\.\s+/).map(s => s.trim().replace(/\.$/, '')).filter(s => s.length > 4)
          if (!steps.length) steps = [raw]
          return { name: meal.name || name, macros: meal.macros || '', ingredients: meal.ingredients || [], steps }
        })
      }
    }

    return [
      tocat('🥣','Breakfast','Your personalized breakfast options', plan.meals.breakfast),
      tocat('🍛','Lunch','Your personalized lunch options', plan.meals.lunch),
      tocat('🍎','Snacks','Quick healthy options', plan.meals.snacks),
      tocat('🌙','Dinner','Your personalized dinner options', plan.meals.dinner),
    ].filter(Boolean)
  }, [data.generatedPlan])

  const cat = recipes[catIdx] || recipes[0]
  const vr  = cat?.variants?.[varIdx] || cat?.variants?.[0]

  const handleCatChange = (i) => { setCatIdx(i); setVarIdx(0) }

  return (
    <div className="screen">
      <div className="page-title" style={{ marginBottom:2 }}>Recipes</div>
      <div className="page-sub" style={{ marginBottom:12 }}>All meals, snacks & oats · Full ingredients</div>

      {/* Store legend */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
        {[['🔵','Costco'],['🟢','Walmart PR'],['🟡','Colmado'],['🟣','Pantry'],['🔴','Medical']].map(([dot,lbl]) => (
          <div key={lbl} style={{ padding:'4px 10px', borderRadius:20, background:'var(--faint)', fontSize:12, color:'var(--muted)' }}>{dot} {lbl}</div>
        ))}
      </div>

      {/* Category tabs */}
      <div className="tab-strip">
        {recipes.map((r, i) => (
          <button key={i} className={`tab-chip ${catIdx===i?'active':''}`} onClick={() => handleCatChange(i)}>
            {r.emoji} {r.name}
          </button>
        ))}
      </div>

      {/* Category header */}
      <div className="card" style={{ background:'linear-gradient(135deg,#1a2a3a,var(--bg3))', borderColor:'rgba(139,92,246,.3)', marginBottom:12 }}>
        <div className="syne fw7" style={{ fontSize:16 }}>🔖 {cat?.name}</div>
        <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{cat?.sub}</div>
        {cat?.prepNote && (
          <div style={{ marginTop:10, padding:10, background:'rgba(251,191,36,.08)', border:'1px solid rgba(251,191,36,.2)', borderRadius:8, fontSize:12, color:'var(--amber)', lineHeight:1.5 }}>
            ⚠️ {cat.prepNote}
          </div>
        )}
      </div>

      {/* Variant tabs */}
      {cat?.variants?.length > 1 && (
        <div className="tab-strip" style={{ marginBottom:12 }}>
          {cat.variants.map((v, i) => (
            <button key={i} className={`tab-chip ${varIdx===i?'active':''}`} onClick={() => setVarIdx(i)}
              style={{ fontSize:12, padding:'6px 12px' }}>
              {(() => { const words = v.name.split(' '); const allNames = cat.variants.map(x => x.name); const firstWord = allNames[0]?.split(' ')[0]; const allSameFirst = allNames.every(n => n.startsWith(firstWord)); return allSameFirst ? words.slice(-2).join(' ') : words.slice(0,2).join(' '); })()}
            </button>
          ))}
        </div>
      )}

      {/* Recipe card */}
      {vr && (
        <div className="card">
          <div style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>{vr.name}</div>
          {vr.macros && <div className="badge badge-amber" style={{ marginBottom:14 }}>{vr.macros}</div>}

          {vr.ingredients?.length > 0 && (
            <>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>Ingredients</div>
              <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:16 }}>
                <thead>
                  <tr>{['Amount','Ingredient','Store · Est. Cost'].map(h => <th key={h} style={{ textAlign:'left', fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)', paddingBottom:8 }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {vr.ingredients.map((ing, i) => (
                    <tr key={i} style={{ borderTop:'1px solid var(--border)' }}>
                      <td style={{ padding:'10px 0', fontSize:13, color:'var(--accent)', fontWeight:600, whiteSpace:'nowrap', paddingRight:12 }}>{ing.amt}</td>
                      <td style={{ padding:'10px 0', fontSize:13, paddingRight:12 }}>{ing.name}</td>
                      <td style={{ padding:'10px 0', fontSize:11, color:'var(--muted)' }}>{ing.store}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {vr.ingredients?.length > 0 && (
            <>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>Ingredients</div>
              <div style={{ marginBottom:16, borderRadius:10, overflow:'hidden', border:'1px solid var(--border)' }}>
                {vr.ingredients.map((ing, ii) => (
                  <div key={ii} style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'10px 14px',
                    background: ii % 2 === 0 ? 'var(--faint)' : 'transparent',
                    borderBottom: ii < vr.ingredients.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:'var(--accent)', minWidth:60, flexShrink:0 }}>
                      {ing.qty || ing.amount || '—'}
                    </div>
                    <div style={{ fontSize:14 }}>{ing.item || ing.name}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>Steps</div>
          {vr.steps?.map((s, i) => (
            <div key={i} style={{ display:'flex', gap:10, marginBottom:10 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--accent)', color:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:12, flexShrink:0 }}>{i+1}</div>
              <div style={{ fontSize:13, lineHeight:1.6, paddingTop:2 }}>{s}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
