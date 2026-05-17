import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { GROCERY } from '../data/grocery'

export default function Grocery() {
  const { data, toggleGrocery } = useApp()

  const grocery = useMemo(() => {
    const plan = data.generatedPlan
    if (!plan?.grocery || Object.keys(plan).length === 0) return GROCERY
    const g = plan.grocery
    const result = []
    // Map generated store sections to user's preferred stores
    // preferredStores can be array (from profile) or comma string (legacy)
    const rawStores = data.userProfile?.preferredStores
    const preferred = Array.isArray(rawStores)
      ? rawStores.map(s => s.trim()).filter(Boolean)
      : (rawStores || '').split(',').map(s => s.trim()).filter(Boolean)
    const storeEmoji = s => {
      const sl = s.toLowerCase()
      if (sl.includes('costco')) return '🔵'
      if (sl.includes('walmart')) return '🟢'
      if (sl.includes('sam')) return '🔵'
      if (sl.includes('pueblo')) return '🟠'
      if (sl.includes('supermax')) return '🟣'
      if (sl.includes('selectos')) return '🟤'
      if (sl.includes('pricesmart')) return '🟡'
      if (sl.includes('colmado') || sl.includes('corner')) return '🟡'
      if (sl.includes('amazon')) return '📦'
      return '🛒'
    }
    // Map backend store keys to user's actual chosen stores
    // Support both new keys (store1/store2/store3) and legacy (costco/walmart/colmado)
    const s1name = preferred[0] || 'Store 1'
    const s2name = preferred[1] || 'Store 2'
    const s3name = preferred[2] || 'Local Store'
    const push = (items, storeName, key) => {
      if (items?.length) result.push({
        cat: `${storeEmoji(storeName)} ${storeName.toUpperCase()}`,
        store: key,
        items: items.map(i => ({ name: i.item, amt: i.amount || '', price: i.price || '', note: '' }))
      })
    }
    if (g.store1?.length || g.costco?.length)  push(g.store1 || g.costco,  s1name, 'store1')
    if (g.store2?.length || g.walmart?.length) push(g.store2 || g.walmart, s2name, 'store2')
    if (g.store3?.length || g.colmado?.length) push(g.store3 || g.colmado, s3name, 'store3')
    return result.length ? result : GROCERY
  }, [data.generatedPlan])

  const checked = data.groceryChecked || {}
  const totalItems = grocery.reduce((acc, cat) => acc + cat.items.length, 0)
  const doneItems  = grocery.reduce((acc, cat) => acc + cat.items.filter((_,i) => checked[`${cat.store}-${i}`]).length, 0)

  return (
    <div className="screen">
      <div className="page-title" style={{ marginBottom:2 }}>Grocery</div>
      <div className="page-sub" style={{ marginBottom:4 }}>Your weekly shopping list</div>

      {/* Progress */}
      <div className="card flex-between" style={{ marginBottom:16, padding:'12px 16px' }}>
        <div style={{ fontSize:13, fontWeight:600 }}>{doneItems}/{totalItems} items checked</div>
        <div className="syne fw7" style={{ color:'var(--accent)' }}>{Math.round((doneItems/totalItems)*100)||0}%</div>
      </div>
      <div className="prog-wrap" style={{ marginBottom:16, height:6 }}>
        <div className="prog-fill" style={{ width:`${Math.round((doneItems/totalItems)*100)||0}%`, background:'var(--accent)' }} />
      </div>

      {grocery.map(cat => (
        <div key={cat.store}>
          <div className="section-label">{cat.cat}</div>
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            {cat.items.map((item, i) => {
              const key     = `${cat.store}-${i}`
              const isChecked = !!checked[key]
              return (
                <div key={i} className={`grocery-item ${isChecked?'checked':''}`} onClick={() => toggleGrocery(key)}>
                  <div className={`g-check ${isChecked?'done':''}`}>
                    {isChecked && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div className="g-name" style={{ fontSize:14, fontWeight:500 }}>{item.name}</div>
                    <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{item.amt}{item.note ? ' · '+item.note : ''}</div>
                  </div>
                  <div style={{ fontSize:12, color:'var(--muted)', flexShrink:0 }}>{item.price}</div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
