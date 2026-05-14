// ── Week/day calculations ─────────────────────────────────────────────────────
// Week always starts Monday, ends Sunday.
// Week number is based on ISO calendar weeks from the Monday of the user's
// onboard week — NOT from first login day. Opening the app on a Wednesday
// does NOT make it "Day 3 of Week 1". It's just Wednesday of that week.

export function getProgramInfo(date = new Date(), userProfile = null) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)

  // JS getDay(): 0=Sun, 1=Mon ... 6=Sat
  // Convert to Mon=0 ... Sun=6
  const jsDow    = d.getDay()
  const dow      = jsDow === 0 ? 6 : jsDow - 1  // Mon=0, Tue=1 ... Sun=6
  const isRestDay = dow === 6                     // Sunday
  const isSunday  = dow === 6

  // Monday of the current week
  const weekStart = new Date(d)
  weekStart.setDate(d.getDate() - dow)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  // Week number: count from Monday of onboard week (or program start)
  // Use Monday of the week the user onboarded, not the exact onboard date
  let originMonday
  if (userProfile?.programStart) {
    const ps = new Date(userProfile.programStart)
    ps.setHours(0, 0, 0, 0)
    const psDow = ps.getDay() === 0 ? 6 : ps.getDay() - 1
    originMonday = new Date(ps)
    originMonday.setDate(ps.getDate() - psDow)
  } else {
    // Default origin: May 4 2026 (a Monday)
    originMonday = new Date('2026-05-04')
  }
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weekNum   = Math.max(1, Math.floor((weekStart - originMonday) / msPerWeek) + 1)

  const fmt = dt => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // Goal info from profile
  const goalDateStr = userProfile?.goalDate || '2026-12-15'
  const goalDate    = new Date(goalDateStr)
  const goalWeight  = parseFloat(userProfile?.goalWeight) || 285
  const startWeight = parseFloat(userProfile?.currentWeight) || 0

  // Gym days from profile — array of dow indices (Mon=0...Sun=6)
  // gymDays stored as e.g. ['Mon','Wed','Fri'] or ['0','2','4']
  const gymDayNames   = userProfile?.gymDays || []
  const gymDayMap     = { Mon:0, Tue:1, Wed:2, Thu:3, Fri:4, Sat:5, Sun:6 }
  const gymDowSet     = new Set(gymDayNames.map(d => typeof d === 'number' ? d : (gymDayMap[d] ?? parseInt(d))))
  const isGymDay      = !isRestDay && (gymDowSet.size === 0 || gymDowSet.has(dow))
  const isHomeDay     = !isRestDay && gymDowSet.size > 0 && !gymDowSet.has(dow)
  const workoutIdx    = isRestDay ? null : dow  // Mon=0...Sat=5

  const dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

  return {
    weekNum, dow, jsDow, isRestDay, isSunday,
    isGymDay, isHomeDay,
    isGymDay: !isRestDay && (gymDowSet.size === 0 || gymDowSet.has(dow)),
    workoutIdx,
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
    const h  = Math.floor(mins / 60) % 24
    const m  = mins % 60
    const ap = h >= 12 ? 'PM' : 'AM'
    const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h)
    return `${h12}:${String(m).padStart(2, '0')} ${ap}`
  }

  return { openMin, closeMin, openHour, durationH, isIF, fmt }
}
