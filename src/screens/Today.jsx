import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getProgramInfo, getIFWindow } from '../lib/program'
import { getMealTimes } from '../lib/mealTimes'
import WaterTracker from '../components/WaterTracker'
import WeightLogger from '../components/WeightLogger'
import StreakCard from '../components/StreakCard'
import Milestones from '../components/Milestones'

const OAT_NAMES = ['🍌 Banana PB','🥭 Mango Coconut','🍫 Choco PB','🍓 Strawberry Vanilla','🥜 PB Banana Honey','🫐 Blueberry Almond']

export default function Today({ setScreen }) {
  const { user, data, syncing } = useApp()
  const [now, setNow] = useState(new Date())

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
  const mt = getMealTimes(data.userProfile)

  const snackCard = isWorkoutDay
    ? { time: mt.preWorkoutTime, icon:'⚠️', name:'Banana + Peanut Butter', macro:`PRE-WORKOUT · 60 min before ${data.userProfile?.workoutTime || 'your workout'} · ~240 kcal`, color:'var(--red)' }
    : { time: mt.restSnackTime,  icon:'🍎', name:gen?.meals?.snacks?.[0]?.name||'Greek Yogurt + Banana', macro:gen?.meals?.snacks?.[0]?.macros||'Snack · ~200 kcal', color:'var(--amber)' }

  const cards = [
    { time: openFmt,      icon:'🥣', name: bf?.name||(wIdx!==null?OAT_NAMES[dayOatIdx]+' Oats':'Rest day — no oat jar'), macro: bf?.macros||'Break-fast · ~400 kcal', color:'var(--accent)' },
    { time: mt.lunchTime, icon:'🍛', name: lun?.name||'Chicken + Rice Bowl', macro: lun?.macros||'Main meal · ~500 kcal', color:'var(--blue)' },
    snackCard,
  ]

  // Day progress bar
  const dayBars = [0,1,2,3,4,5].map(i => {
    const today = new Date(); today.setHours(0,0,0,0)
    const d = new Date(today); d.setDate(today.getDate() - (info.dayOfWeek===0?6:info.dayOfWeek-1) + i)
    const key = `${d.toISOString().split('T')[0]}-${i}`
    const prog = data.workoutProgress?.[key] || {}
    const done = Object.values(prog).filter(Boolean).length
    return done >= 4 ? 'done' : done > 0 ? 'partial' : 'empty'
  })

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
            <div className="syne fw7" style={{ color:'var(--accent)' }}>WEEK {info.weekNum} · DAY 7</div>
            <div style={{ fontSize:12, color:'var(--muted)' }}>Last day of week</div>
          </div>
          <div style={{ fontSize:13, color:'var(--muted)', marginBottom:12 }}>{info.weekRange}</div>
          <div style={{ display:'flex', gap:6, marginBottom:16 }}>
            {dayBars.map((s,i) => <div key={i} style={{ flex:1, height:6, borderRadius:3, background: s==='done'?'var(--accent)':s==='partial'?'var(--amber)':'var(--faint)' }} />)}
          </div>
          <div className="syne fw7" style={{ fontSize:13, color:'var(--accent)', marginBottom:8 }}>🥣 THIS WEEK'S OAT JARS — PREP SUNDAY</div>
          {['Mon','Tue','Wed','Thu','Fri'].map((d,i) => (
            <div key={d} style={{ display:'flex', gap:10, padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
              <span style={{ color:'var(--muted)', width:34 }}>{d}</span>
              <span style={{ textDecoration:'line-through', color:'var(--muted)' }}>{OAT_NAMES[i]}</span>
            </div>
          ))}
          <button onClick={() => {}} style={{ width:'100%', marginTop:14, background:'var(--accent)', color:'#000', border:'none', borderRadius:12, padding:14, fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, cursor:'pointer' }}>
            🤖 Generate next week's AI plan
          </button>
        </div>
      ) : (
        <div className="card" style={{ background:'linear-gradient(135deg,#0d2a1a,#0d1a2a)', borderColor:'rgba(0,200,150,.2)' }}>
          <div className="flex-between" style={{ marginBottom:8 }}>
            <div className="syne fw7" style={{ color:'var(--accent)' }}>WEEK {info.weekNum} · DAY {info.dayOfWeek||7}</div>
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
