// ── Derive all meal times from user's workout time + eating window ─────────────
// Every time shown in the app comes from here — nothing hardcoded.

const WORKOUT_HOUR_MAP = {
  'Early morning (5–7am)':    6,
  'Morning (7–9am)':          8,
  'Midday (11am–1pm)':       12,
  'Early afternoon (2–4pm)': 14,
  'Late afternoon (4–6pm)':  16,
  'Evening (6–8pm)':         18,
  'Night (8–10pm)':          20,
}

function fmt(h, m = 0) {
  const clamped = Math.max(0, Math.min(23, h))
  const ap  = clamped >= 12 ? 'PM' : 'AM'
  const h12 = clamped > 12 ? clamped - 12 : (clamped === 0 ? 12 : clamped)
  return `${h12}${m ? ':' + String(m).padStart(2, '0') : ':00'} ${ap}`
}

function parseIfStart(ifStart) {
  if (!ifStart) return 10
  const m = ifStart.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i)
  if (!m) return 10
  let h = parseInt(m[1])
  const mer = (m[3] || '').toUpperCase()
  if (mer === 'PM' && h !== 12) h += 12
  if (mer === 'AM' && h === 12) h = 0
  return h
}

export function getMealTimes(userProfile, dow = null) {
  // Per-day override: workoutTimeByDay = { Mon: 'Morning (7-9am)', Sat: 'Morning (7-9am)', ... }
  const DAY_KEYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const byDay    = userProfile?.workoutTimeByDay || {}
  const dayKey   = dow !== null ? DAY_KEYS[dow] : null
  const workoutStr  = (dayKey && byDay[dayKey]) || userProfile?.workoutTime || 'Evening (6–8pm)'
  const workoutHour = WORKOUT_HOUR_MAP[workoutStr] ?? 18
  const openHour    = parseIfStart(userProfile?.ifStart)
  const isIF        = (userProfile?.eatingSchedule || '').toLowerCase().includes('intermittent')

  // Pre-workout snack: 60 min before workout
  const preWorkoutHour = workoutHour - 1

  // Early workout edge case: workout is at or before the eating window
  const isEarlyWorkout = preWorkoutHour <= openHour

  // Breakfast = eating window open (or first meal if not IF)
  const breakfastHour = openHour

  // Lunch: 
  // - Normal: midpoint between 1h after breakfast and pre-workout snack
  // - Early workout: after post-workout (first real meal post-workout)
  const postWorkoutHour = workoutHour + 1  // ~1h after workout ends (~75min session)
  let lunchHour
  if (isEarlyWorkout) {
    // Worked out at 6-8am, eating window opens after: lunch is first solid meal
    lunchHour = Math.max(openHour, postWorkoutHour)
  } else {
    // Normal: midday meal
    lunchHour = Math.round((breakfastHour + 1 + preWorkoutHour) / 2)
    lunchHour = Math.max(breakfastHour + 2, lunchHour) // at least 2h after breakfast
  }

  // Dinner / post-workout meal
  const dinnerHour = isEarlyWorkout
    ? Math.max(lunchHour + 3, 17)        // early workout: dinner in evening
    : Math.min(postWorkoutHour + 1, 21)  // evening workout: ~2-3h after workout

  // Rest day snack: mid-afternoon
  const restSnackHour = Math.round((breakfastHour + dinnerHour) / 2)

  // Pre-workout label
  const preWorkoutLabel = isEarlyWorkout
    ? `Before ${fmt(workoutHour)} workout`
    : `Pre-workout · 60 min before ${workoutStr.split('(')[0].trim()}`

  return {
    breakfastTime:    fmt(breakfastHour),
    lunchTime:        fmt(lunchHour),
    preWorkoutTime:   isEarlyWorkout ? fmt(Math.max(openHour - 1, workoutHour - 1)) : fmt(preWorkoutHour),
    postWorkoutTime:  fmt(postWorkoutHour),
    dinnerTime:       fmt(dinnerHour),
    restSnackTime:    fmt(restSnackHour),
    isEarlyWorkout,
    preWorkoutLabel,
    workoutHour,
    openHour,
    dinnerSub: `Post-workout recovery · eat within 1h of finishing`,
  }
}
