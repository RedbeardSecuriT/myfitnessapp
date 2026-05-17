import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { RECIPES } from '../data/recipes'

// Milk keywords to detect and replace in ingredient names
const MILK_PATTERNS = [
  /unsweetened almond milk/gi,
  /almond milk/gi,
  /oat milk/gi,
  /soy milk/gi,
  /unsweetened soy milk/gi,
  /whole milk/gi,
  /2%\s*milk/gi,
  /skim milk/gi,
  /low-fat milk/gi,
  /non-fat milk/gi,
  /lactaid/gi,
  /light coconut milk/gi,
  /coconut milk/gi,
  /plant-based milk/gi,
  /dairy-free milk/gi,
  /\bmilk\b/gi,
]

const MILK_LABELS = {
  whole:   'whole milk',
  '2pct':  '2% milk',
  skim:    'skim milk',
  oat:     'oat milk',
  almond:  'unsweetened almond milk',
  soy:     'unsweetened soy milk',
  coconut: 'light coconut milk',
  lactaid: 'Lactaid milk',
  none:    null,
}

function applyMilkPref(text, milkPref) {
  if (!milkPref || milkPref === 'none' || !text) return text
  const replacement = MILK_LABELS[milkPref]
  if (!replacement) return text
  let result = text
  for (const pat of MILK_PATTERNS) {
    result = result.replace(pat, replacement)
  }
  return result
}

export default function Meals() {
  const { data } = useApp()
  const [catIdx, setCatIdx] = useState(0)
  const [varIdx, setVarIdx] = useState(0)

  const milkPref = data.userProfile?.milkPreference || null

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

    // Oats — merge daily oat jars into breakfast variants with day labels
    const oatVariants = (plan.meals.oats || []).map(o => {
      const raw = o.instructions || 'Prepare as described.'
      let steps = raw.split(/\s*\|\s*/).map(s => s.trim()).filter(Boolean)
      if (steps.length <= 1) steps = raw.split(/\.\s+/).map(s => s.trim().replace(/\.$/, '')).filter(s => s.length > 4)
      if (!steps.length) steps = [raw]
      return { name: o.name || 'Overnight Oats', tabLabel: o.day ? o.day.slice(0,3) : '', macros: o.macros || '', ingredients: o.ingredients || [], steps }
    })

    const breakfastVariants = [
      ...oatVariants,
      ...(plan.meals.breakfast || []).map(meal => {
        const raw = meal.instructions || 'Prepare as described.'
        let steps = raw.split(/\s*\|\s*/).map(s => s.trim()).filter(Boolean)
        if (steps.length <= 1) steps = raw.split(/\.\s+/).map(s => s.trim().replace(/\.$/, '')).filter(s => s.length > 4)
        if (!steps.length) steps = [raw]
        return { name: meal.name || 'Breakfast', macros: meal.macros || '', ingredients: meal.ingredients || [], steps }
      })
    ]

    const bfCat = breakfastVariants.length > 0 ? { emoji:'🥣', name:'Breakfast', sub:'Overnight oats by day + breakfast options', variants: breakfastVariants } : null

    return [
      bfCat,
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
              {v.tabLabel || (() => { const words = v.name.split(' '); const allNames = cat.variants.map(x => x.name); const firstWord = allNames[0]?.split(' ')[0]; const allSameFirst = allNames.every(n => n.startsWith(firstWord)); return allSameFirst ? words.slice(-2).join(' ') : words.slice(0,2).join(' '); })()}
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
                    <div style={{ fontSize:14 }}>{applyMilkPref(ing.item || ing.name, milkPref)}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>Steps</div>
          {vr.steps?.map((s, i) => (
            <div key={i} style={{ display:'flex', gap:10, marginBottom:10 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--accent)', color:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:12, flexShrink:0 }}>{i+1}</div>
              <div style={{ fontSize:13, lineHeight:1.6, paddingTop:2 }}>{applyMilkPref(s, milkPref)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
