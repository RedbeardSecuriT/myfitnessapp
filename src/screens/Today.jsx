import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getProgramInfo, getIFWindow } from '../lib/program'
import { getMealTimes } from '../lib/mealTimes'
import { supabase, BACKEND_URL } from '../lib/supabase'
import WaterTracker from '../components/WaterTracker'
import WeightLogger from '../components/WeightLogger'
import StreakCard from '../components/StreakCard'
import Milestones from '../components/Milestones'

const OAT_NAMES = ['🍌 Banana PB','🥭 Mango Coconut','🍫 Choco PB','🍓 Strawberry Vanilla','🥜 PB Banana Honey','🫐 Blueberry Almond']

export default function Today({ setScreen }) {
  const { user, data, syncing, updatePlan } = useApp()
  const [now, setNow] = useState(new Date())
  const [genLoading, setGenLoading] = useState(false)
  const [genStatus,  setGenStatus]  = useState('')
  const [genDone,    setGenDone]    = useState(false)
  const [elapsed,    setElapsed]    = useState(0)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const info    = getProgramInfo(now, data.userProfile)
  const ifWin   = getIFWindow(data.userProfile)
  const name    = data.userProfile?.name || user?.email?.split('@')[0] || ''
  const hour    = now.getHours()
  const greeting= name ? `Hi, ${name} 👋` : (hour<12?'Good morning 👋':hour<17?'Good afternoon 👋':'Good evening 👋')

  // IF Clock
  const nowMin  = now.getHours()*60 + now.getMinutes()
  const inWindow= nowMin >= ifWin.openMin && nowMin < ifWin.closeMin
  const isFasting= !inWindow
  let timeLeftMin, statusLabel, barPct

  if (inWindow) {
    timeLeftMin = ifWin.closeMin - nowMin
    statusLabel = '🟢 EATING WINDOW OPEN'
    barPct      = Math.round(((nowMin - ifWin.openMin) / (ifWin.closeMin - ifWin.openMin)) * 100)
  } else if (nowMin < ifWin.openMin) {
    timeLeftMin = ifWin.openMin - nowMin
    statusLabel = '⏸️ FASTING'
    barPct      = 0
  } else {
    timeLeftMin = 1440 - nowMin + ifWin.openMin
    statusLabel = '⏸️ FASTING'
    barPct      = 100
  }

  const tlH = Math.floor(timeLeftMin/60), tlM = timeLeftMin%60
  const timeStr = inWindow ? `${tlH}h ${tlM}m left` : `${tlH}h ${tlM}m to open`

  const fmt = (m) => { const h=Math.floor(m/60)%24; const ap=h>=12?'PM':'AM'; const h12=h>12?h-12:(h===0?12:h); return `${h12}:${String(m%60).padStart(2,'0')} ${ap}` }

  // Today meals
  const gen = data.generatedPlan
  const wIdx = info.workoutIdx
  const dayOatIdx = wIdx !== null ? wIdx % OAT_NAMES.length : 0
  const openFmt = fmt(ifWin.openMin)

  const bf  = gen?.meals?.breakfast?.[0]
  const lun = gen?.meals?.lunch?.[0]

  const isWorkoutDay = !info.isRestDay
  const mt = getMealTimes(data.userProfile, info.dow)

  // Find a rest-appropriate snack — skip any with pre-workout language
  const PRE_WORKOUT_KEYWORDS = ['pre-workout','preworkout','mandatory','before workout','before your workout']
  const isPreWorkoutSnack = (s) => {
    if (!s?.name) return false
    const n = (s.name + ' ' + (s.macros||'')).toLowerCase()
    return PRE_WORKOUT_KEYWORDS.some(k => n.includes(k))
  }
  const snacks = gen?.meals?.snacks || []
  const restSnack = snacks.find(s => !isPreWorkoutSnack(s)) || snacks[1] || snacks[0]

  // Sunday is always rest — never show a pre-workout snack
  // Weekend / rest day flags — must be declared BEFORE snackCard and breakfastCard
  const isSat  = info.dow === 5
  const isSun  = info.dow === 6

  // Hard filter: tostones, bacalao, pernil, habichuelas are NEVER breakfast items.
  // If the AI generates one anyway (stale plan), fall back to a safe default.
  const BREAKFAST_BANNED = ['tostones', 'bacalao', 'pernil', 'lechon', 'habichuela', 'mofongo']
  const isBadBreakfast = (meal) => {
    if (!meal?.name) return false
    const n = meal.name.toLowerCase()
    return BREAKFAST_BANNED.some(b => n.includes(b))
  }
  const rawSatBf = gen?.meals?.breakfast?.[0]
  const rawSunBf = gen?.meals?.breakfast?.[1]
  const satBf = isBadBreakfast(rawSatBf) ? { name: 'Huevos Revueltos con Aguacate', macros: '~380 kcal · 22g protein' } : rawSatBf
  const sunBf = isBadBreakfast(rawSunBf) ? { name: 'Avena Caliente con Frutas', macros: '~350 kcal · 12g protein' } : rawSunBf

  const snackCard = (isWorkoutDay && !isSun)
    ? { time: mt.preWorkoutTime, icon:'⚠️', name:'Banana + Peanut Butter', macro:`PRE-WORKOUT · 60 min before ${data.userProfile?.workoutTime || 'your workout'} · ~240 kcal`, color:'var(--red)' }
    : { time: mt.restSnackTime,  icon:'🍎', name: restSnack?.name || 'Greek Yogurt + Banana', macro: restSnack?.macros || 'Rest day snack · ~200 kcal', color:'var(--amber)' }

  const breakfastCard = (() => {
    // Saturday — warm breakfast
    if (isSat) return {
      time: openFmt, icon:'🍳',
      name:  satBf?.name  || 'Warm Breakfast',
      macro: satBf?.macros || 'Weekend warm breakfast · ~400 kcal',
      color: 'var(--amber)',
    }
    // Sunday — rest day warm breakfast
    if (isSun) return {
      time: openFmt, icon:'🍳',
      name:  sunBf?.name  || satBf?.name || 'Rest Day Breakfast',
      macro: sunBf?.macros || satBf?.macros || 'Rest day · ~400 kcal',
      color: 'var(--purple)',
    }
    // Mon–Fri — overnight oats
    const oats = gen?.meals?.oats
    let oatName = OAT_NAMES[dayOatIdx] + ' Oats'
    if (oats) {
      if (Array.isArray(oats) && oats[0]?.day) {
        const dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday']
        const todayOat = oats.find(o => o.day === dayNames[info.dow])
        oatName = todayOat?.name || bf?.name || 'Overnight Oats'
      } else {
        oatName = bf?.name || (oats[info.dow]?.name || oatName)
      }
    }
    return {
      time: openFmt, icon:'🥣',
      name:  oatName,
      macro: bf?.macros || 'Break-fast · ~400 kcal',
      color: 'var(--accent)',
    }
  })()

  const cards = [
    breakfastCard,
    { time: mt.lunchTime, icon:'🍛', name: lun?.name||'Chicken + Rice Bowl', macro: lun?.macros||'Main meal · ~500 kcal', color:'var(--blue)' },
    snackCard,
  ]

  // Day progress bar
  const dayBars = [0,1,2,3,4,5].map(i => {
    const today = new Date(); today.setHours(0,0,0,0)
    // dow is Mon=0...Sun=6, so Monday of this week = today - dow days
    const d = new Date(today); d.setDate(today.getDate() - (info.dow || 0) + i)
    const key = `${d.toISOString().split('T')[0]}-${i}`
    const prog = data.workoutProgress?.[key] || {}
    const done = Object.values(prog).filter(Boolean).length
    return done >= 4 ? 'done' : done > 0 ? 'partial' : 'empty'
  })

  const handleGenerate = async () => {
    if (!user?.id || genLoading) return
    setGenLoading(true)
    setGenDone(false)
    setElapsed(0)

    const phases = [
      'Pulling your check-in data...',
      'Designing your meal plan...',
      'Building 5 oat variants...',
      'Adjusting workout intensity...',
      'Finalizing your week...',
    ]
    let pi = 0
    setGenStatus(phases[0])
    const phaseIv = setInterval(() => { pi = (pi+1) % phases.length; setGenStatus(phases[pi]) }, 12000)
    const startTs = Date.now()
    const elapsedIv = setInterval(() => setElapsed(Math.floor((Date.now()-startTs)/1000)), 1000)

    try {
      const res    = await fetch(`${BACKEND_URL}/generate-week`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, weekNum: info.weekNum }),
      })
      const result = await res.json()
      clearInterval(phaseIv); clearInterval(elapsedIv)
      if (!result.success) throw new Error(result.error || 'Generation failed')

      // Merge into context so Meals + Grocery update immediately
      const cur     = data.generatedPlan || {}
      const updated = {
        ...cur,
        meals: { ...cur.meals, oats: result.plan?.meals?.oats || cur.meals?.oats, lunch: result.plan?.meals?.lunch || cur.meals?.lunch, dinner: result.plan?.meals?.dinner || cur.meals?.dinner, snacks: result.plan?.meals?.snacks || cur.meals?.snacks },
        workoutNotes:     result.plan?.workoutNotes,
        groceryAdditions: result.plan?.groceryAdditions,
        weeklyMessage:    result.plan?.personalMessage,
        _generatedWeek:   result.weekNum,
        _generatedAt:     result.generatedAt,
      }
      updatePlan(data.userProfile, updated)
      setGenDone(true)
      setGenStatus(`✅ Week ${result.weekNum} ready — check Meals tab!`)
    } catch(e) {
      clearInterval(phaseIv); clearInterval(elapsedIv)
      setGenStatus('❌ ' + e.message)
    }
    setGenLoading(false)
  }

  return (
    <div className="screen">
      {syncing && <div className="sync-indicator">syncing...</div>}

      {/* Header */}
      <div className="flex-between" style={{ marginBottom:4 }}>
        <div>
          <div className="page-title">{greeting}</div>
          <div className="page-sub">{now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</div>
        </div>
        <div>
          {info.isRestDay
            ? <div className="badge badge-purple">😴 REST DAY</div>
            : <div className="badge badge-green">💪 WORKOUT DAY</div>}
        </div>
      </div>

      {/* IF Clock */}
      <div className="section-label">⏰ Eating window</div>
      <div className="if-clock-wrap">
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color: inWindow?'var(--accent)':'var(--muted)' }}>{statusLabel}</div>
        <div className="if-time-big">{timeStr}</div>
        <div className="if-bar-wrap">
          <div className="if-bar-fill" style={{ width:`${barPct}%` }} />
        </div>
        <div className="flex-between" style={{ fontSize:12, color:'var(--muted)' }}>
          <span>Fast ends: <strong style={{ color:'var(--text)' }}>{fmt(ifWin.openMin)}</strong></span>
          <span>Window closes: <strong style={{ color:'var(--text)' }}>{fmt(ifWin.closeMin)}</strong></span>
        </div>
      </div>

      {/* Week card */}
      {info.isSunday ? (
        <div className="card" style={{ background:'linear-gradient(135deg,#0d2a1a,#0d1a2a)', borderColor:'rgba(0,200,150,.2)' }}>
          <div className="flex-between" style={{ marginBottom:12 }}>
            <div className="syne fw7" style={{ color:'var(--accent)' }}>WEEK {info.weekNum} · {info.dayName.toUpperCase()}</div>
            <div style={{ fontSize:12, color:'var(--muted)' }}>Rest day · {info.weekRange}</div>
          </div>
          <div style={{ fontSize:13, color:'var(--muted)', marginBottom:12 }}>{info.weekRange}</div>
          <div style={{ display:'flex', gap:6, marginBottom:16 }}>
            {dayBars.map((s,i) => <div key={i} style={{ flex:1, height:6, borderRadius:3, background: s==='done'?'var(--accent)':s==='partial'?'var(--amber)':'var(--faint)' }} />)}
          </div>
          <div className="syne fw7" style={{ fontSize:13, color:'var(--accent)', marginBottom:8 }}>🥣 THIS WEEK'S OAT JARS — PREP SUNDAY</div>
          {(() => {
            const oats = gen?.meals?.oats
            const labels = ['Mon','Tue','Wed','Thu','Fri']
            return labels.map((d,i) => {
              const name = (oats && oats[i]?.name) ? oats[i].name : OAT_NAMES[i]
              return (
                <div key={d} style={{ display:'flex', gap:10, padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <span style={{ color:'var(--muted)', width:34 }}>{d}</span>
                  <span style={{ color:'var(--text)' }}>{name}</span>
                </div>
              )
            })
          })()}

          {genLoading && (
            <div style={{ marginTop:12, padding:'10px 14px', background:'var(--faint)', borderRadius:10, display:'flex', alignItems:'center', gap:10 }}>
              <div className="ob-spinner" style={{ width:18, height:18, minWidth:18, borderWidth:2 }} />
              <div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>{genStatus}</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{elapsed}s elapsed — usually 45–90 seconds</div>
              </div>
            </div>
          )}
          {!genLoading && genDone && (
            <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(0,200,150,.1)', border:'1px solid var(--accent)', borderRadius:10, fontSize:13, color:'var(--accent)' }}>
              {genStatus}
            </div>
          )}
          {!genLoading && !genDone && genStatus.startsWith('❌') && (
            <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(239,68,68,.1)', border:'1px solid var(--red)', borderRadius:10, fontSize:13, color:'var(--red)' }}>
              {genStatus}
            </div>
          )}

          <button onClick={handleGenerate} disabled={genLoading}
            style={{ width:'100%', marginTop:14, background: genLoading ? 'var(--faint)' : 'var(--accent)', color: genLoading ? 'var(--muted)' : '#000', border:'none', borderRadius:12, padding:14, fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, cursor: genLoading ? 'not-allowed' : 'pointer' }}>
            {genLoading ? `⏳ Generating... (${elapsed}s)` : genDone ? '🔄 Regenerate plan' : '🤖 Generate next week\'s AI plan'}
          </button>
          <div style={{ fontSize:11, color:'var(--muted)', textAlign:'center', marginTop:6 }}>
            Typically 45–90 seconds · Updates Meals + Grocery tabs
          </div>
        </div>
      ) : (
        <div className="card" style={{ background:'linear-gradient(135deg,#0d2a1a,#0d1a2a)', borderColor:'rgba(0,200,150,.2)' }}>
          <div className="flex-between" style={{ marginBottom:8 }}>
            <div className="syne fw7" style={{ color:'var(--accent)' }}>WEEK {info.weekNum} · {info.dayName.toUpperCase()}</div>
            <div style={{ fontSize:12, color:'var(--muted)' }}>{info.weekRange}</div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {dayBars.map((s,i) => <div key={i} style={{ flex:1, height:6, borderRadius:3, background: s==='done'?'var(--accent)':s==='partial'?'var(--amber)':'var(--faint)' }} />)}
          </div>
        </div>
      )}

      {/* Today's meals */}
      <div className="section-label">🍽️ Today's meals</div>
      {cards.map((c,i) => (
        <div key={i} className="card flex-between" style={{ padding:'12px 14px' }}>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ fontSize:24 }}>{c.icon}</div>
            <div>
              <div style={{ fontWeight:600, fontSize:14 }}>{c.name}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{c.macro}</div>
            </div>
          </div>
          <div className="syne fw7" style={{ fontSize:12, color:c.color, whiteSpace:'nowrap', marginLeft:8 }}>{c.time}</div>
        </div>
      ))}

      {/* Quick weight log */}
      <div className="section-label">⚖️ Today's weight</div>
      <WeightLogger compact />

      {/* Water */}
      <div className="section-label">💧 Water intake</div>
      <WaterTracker />

      {/* Streak */}
      <div className="section-label">🔥 Streak</div>
      <StreakCard />

      {/* Milestones */}
      <div className="section-label">🎯 Milestones</div>
      <Milestones />

      {/* Medical notes */}
      {gen?.medicalNotes?.length > 0 && (
        <>
          <div className="section-label">⚠️ Medical reminders</div>
          {gen.medicalNotes.slice(0,3).map((n,i) => (
            <div key={i} className="alert-card warning">
              <div className="alert-icon">⚕️</div>
              <div className="alert-body">{n}</div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
