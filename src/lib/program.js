// ── Week/day calculations ─────────────────────────────────────────────────────
// Week always starts Monday, ends Sunday.
// GLOBAL week number: all users share the same week count from the app's
// launch date (May 4 2026). A user joining in week 10 is IN week 10,
// not week 1. This keeps the community in sync.

const GLOBAL_LAUNCH = new Date('2026-05-04') // Must be a Monday

export function getProgramInfo(date = new Date(), userProfile = null) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)

  // JS getDay(): 0=Sun,1=Mon...6=Sat → convert to Mon=0...Sun=6
  const jsDow    = d.getDay()
  const dow      = jsDow === 0 ? 6 : jsDow - 1
  const isRestDay = dow === 6
  const isSunday  = dow === 6

  // Monday of the current week
  const weekStart = new Date(d)
  weekStart.setDate(d.getDate() - dow)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  // Global week number — same for ALL users regardless of when they joined
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weekNum   = Math.max(1, Math.floor((weekStart - GLOBAL_LAUNCH) / msPerWeek) + 1)

  const fmt = dt => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // Goal info from profile
  const goalDateStr = userProfile?.goalDate || '2026-12-15'
  const goalDate    = new Date(goalDateStr)
  const goalWeight  = parseFloat(userProfile?.goalWeight)   || null
  const startWeight = parseFloat(userProfile?.currentWeight) || null

  // Gym day mapping
  const gymDayNames = userProfile?.gymDays || []
  const gymDayMap   = { Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6 }
  const gymDowSet   = new Set(gymDayNames.map(d => typeof d === 'number' ? d : (gymDayMap[d] ?? parseInt(d))))
  const isGymDay    = !isRestDay && (gymDowSet.size === 0 || gymDowSet.has(dow))
  const isHomeDay   = !isRestDay && gymDowSet.size > 0 && !gymDowSet.has(dow)

  const dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

  return {
    weekNum, dow, jsDow, isRestDay, isSunday,
    isGymDay, isHomeDay,
    workoutIdx: isRestDay ? null : dow,
    dayName: dayNames[dow],
    weekRange: `${fmt(weekStart)} – ${fmt(weekEnd)}`,
    weekStart, weekEnd,
    goalDate, goalWeight, startWeight,
    daysToGoal: Math.max(0, Math.ceil((goalDate - d) / 86400000)),
  }
}

export function getIFWindow(userProfile) {
  const schedule = userProfile?.eatingSchedule || ''
  const isIF     = schedule.toLowerCase().includes('intermittent') || schedule.toLowerCase().includes('fasting')

  let openHour = 10, durationH = 8
  if (userProfile?.ifStart) {
    const m = userProfile.ifStart.match(/(\d+):?(\d*)\s*(AM|PM)?/i)
    if (m) {
      let h = parseInt(m[1])
      const mer = (m[3] || '').toUpperCase()
      if (mer === 'PM' && h !== 12) h += 12
      if (mer === 'AM' && h === 12) h = 0
      openHour = h
    }
  }
  if (userProfile?.ifWindow) {
    const m = userProfile.ifWindow.match(/:(\d+)/)
    if (m) durationH = parseInt(m[1])
  } else if (!isIF) {
    openHour = 7; durationH = 12
  }

  const openMin  = openHour * 60
  const closeMin = openMin + durationH * 60
  const fmt = (mins) => {
    const h = Math.floor(mins / 60) % 24, m = mins % 60
    const ap = h >= 12 ? 'PM' : 'AM'
    const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h)
    return `${h12}:${String(m).padStart(2,'0')} ${ap}`
  }
  return { openMin, closeMin, openHour, durationH, isIF, fmt }
}
