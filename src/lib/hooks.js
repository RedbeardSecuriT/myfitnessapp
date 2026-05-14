import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { WORKOUTS } from '../data/workouts'
import { RECIPES } from '../data/recipes'
import { GROCERY } from '../data/grocery'
import { getProgramInfo } from './program'

// Returns the active workout list — generated plan if available, else static
export function useWorkouts() {
  const { data } = useApp()
  return useMemo(() => {
    const plan = data.generatedPlan
    if (!plan?.workouts?.length || Object.keys(plan).length === 0) return WORKOUTS
    return plan.workouts.map((w, i) => ({
      name:      w.name || `Workout ${i + 1}`,
      subtitle:  w.subtitle || '',
      color:     WORKOUTS[i]?.color || 'var(--accent)',
      day:       WORKOUTS[i]?.day || `Day ${i + 1}`,
      exercises: (w.exercises || []).map(e => ({ name: e.name, sets: e.sets || '', note: e.note || '' })),
    }))
  }, [data.generatedPlan])
}

// Returns the active recipe list
export function useRecipes() {
  const { data } = useApp()
  return useMemo(() => {
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
          return { name: meal.name || name, macros: meal.macros || '', ingredients: [], steps }
        }),
      }
    }
    return [
      tocat('🥣', 'Breakfast', 'Your personalized breakfast options', plan.meals.breakfast),
      tocat('🍛', 'Lunch',     'Your personalized lunch options',      plan.meals.lunch),
      tocat('🍎', 'Snacks',    'Quick healthy options',                plan.meals.snacks),
      tocat('🌙', 'Dinner',    'Your personalized dinner options',     plan.meals.dinner),
    ].filter(Boolean)
  }, [data.generatedPlan])
}

// Returns active grocery list
export function useGrocery() {
  const { data } = useApp()
  return useMemo(() => {
    const plan = data.generatedPlan
    if (!plan?.grocery || Object.keys(plan).length === 0) return GROCERY
    const g = plan.grocery
    const result = []
    if (g.costco?.length)  result.push({ cat:'🔵 COSTCO',    store:'costco',  items: g.costco.map(i => ({ name:i.item, amt:i.amount||'', price:i.price||'', note:'' })) })
    if (g.walmart?.length) result.push({ cat:'🟢 WALMART PR', store:'walmart', items: g.walmart.map(i => ({ name:i.item, amt:i.amount||'', price:i.price||'', note:'' })) })
    if (g.colmado?.length) result.push({ cat:'🟡 COLMADO',   store:'colmado', items: g.colmado.map(i => ({ name:i.item, amt:i.amount||'', price:i.price||'', note:'' })) })
    return result.length ? result : GROCERY
  }, [data.generatedPlan])
}

// Returns current streak
export function useStreak() {
  const { data } = useApp()
  return useMemo(() => {
    const weeks = Object.keys(data.checkins || {}).sort((a, b) => b.localeCompare(a))
    let streak = 0, best = 0, cur = 0
    weeks.forEach(date => {
      const w = data.checkins[date]?.workouts || {}
      const done = ['a','b','c','d','e','f'].filter(k => w[k]).length
      if (done >= 4) cur++
      else { best = Math.max(best, cur); cur = 0 }
    })
    best = Math.max(best, cur)
    return { streak: cur, best }
  }, [data.checkins])
}

// Returns current weight and progress
export function useWeightProgress() {
  const { data } = useApp()
  return useMemo(() => {
    const dates       = Object.keys(data.checkins || {}).sort()
    const latestDate  = dates[dates.length - 1]
    const currentWeight = latestDate ? parseFloat(data.checkins[latestDate]?.weight) || data.lastWeight || 335.4 : data.lastWeight || 335.4
    const startWeight = 350
    const goalWeight  = 285
    const lost        = +(startWeight - currentWeight).toFixed(1)
    const pct         = Math.round((lost / (startWeight - goalWeight)) * 100)
    return { currentWeight, startWeight, goalWeight, lost, pct }
  }, [data.checkins, data.lastWeight])
}

// Returns today's workout index and program info
export function useProgramInfo() {
  return useMemo(() => getProgramInfo(), [])
}
