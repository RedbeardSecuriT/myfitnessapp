// ── Program info — all values derived from user profile ──────────────────────
// NEVER hardcode start/goal weights or dates here. Always pass userProfile in.

export function getProgramInfo(date = new Date(), userProfile = null) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)

  // Program start: from profile or default to May 4 2026
  const startStr   = userProfile?.programStart || '2026-05-04'
  const start      = new Date(startStr)
  start.setHours(0, 0, 0, 0)

  const diffMs     = d - start
  const diffDay    = Math.floor(diffMs / 86400000)
  const weekNum    = Math.max(1, Math.floor(diffDay / 7) + 1)
  const dayOfWeek  = d.getDay()
  const isRestDay  = dayOfWeek === 0
  const isSunday   = dayOfWeek === 0
  const workoutIdx = dayOfWeek === 0 ? null : dayOfWeek - 1

  const weekStart = new Date(d)
  weekStart.setDate(d.getDate() - ((dayOfWeek === 0 ? 7 : dayOfWeek) - 1))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const fmt = dt => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // Goal date: from profile or default Dec 15 2026
  const goalDateStr = userProfile?.goalDate || '2026-12-15'
  const goalDate    = new Date(goalDateStr)
  const goalWeight  = parseFloat(userProfile?.goalWeight) || 285
  const startWeight = parseFloat(userProfile?.currentWeight) || 0

  return {
    weekNum, dayOfWeek, isRestDay, isGymDay: !isRestDay, isSunday,
    workoutIdx, diffDay,
    weekRange: `${fmt(weekStart)} – ${fmt(weekEnd)}`,
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
    const h = Math.floor(mins / 60) % 24
    const m = mins % 60
    const ap = h >= 12 ? 'PM' : 'AM'
    const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h)
    return `${h12}:${String(m).padStart(2, '0')} ${ap}`
  }

  return { openMin, closeMin, openHour, durationH, isIF, fmt }
}
