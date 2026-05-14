import { supabase } from './supabase'

// ── READ ──────────────────────────────────────────────────────────────────────
export async function loadUserData(userId) {
  const today = new Date().toISOString().split('T')[0]
  const [wp, pw, wt, gr, ci, prof] = await Promise.allSettled([
    supabase.from('workout_progress').select('*').eq('user_id', userId),
    supabase.from('progression_weights').select('*').eq('user_id', userId),
    supabase.from('water_log').select('*').eq('user_id', userId).eq('date', today).maybeSingle(),
    supabase.from('grocery_checked').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('checkins').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(20),
    supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
  ])

  const workoutProgress = {}
  wp.value?.data?.forEach(r => { workoutProgress[`${r.date}-${r.day_idx}`] = r.progress || {} })

  const progWeights = {}
  pw.value?.data?.forEach(r => { progWeights[`${r.week_num}-${r.day_idx}`] = r.weights || {} })

  const water = wt.value?.data ? { oz: wt.value.data.oz || 0, log: wt.value.data.log || [] } : { oz: 0, log: [] }

  const groceryChecked = gr.value?.data?.checked || {}

  const checkins = {}
  let lastWeight = 0
  ci.value?.data?.forEach(r => {
    checkins[r.date] = { ...r.data, weight: r.weight }
    if (r.weight && !lastWeight) lastWeight = r.weight
  })

  const userProfile   = prof.value?.data?.profile || null
  const generatedPlan = prof.value?.data?.generated_plan || null

  return { workoutProgress, progWeights, water, groceryChecked, checkins, lastWeight, userProfile, generatedPlan }
}

// ── WRITE ─────────────────────────────────────────────────────────────────────
export async function saveWorkoutProgress(userId, dayIdx, progress) {
  const date = new Date().toISOString().split('T')[0]
  return supabase.from('workout_progress').upsert(
    { user_id: userId, date, day_idx: dayIdx, progress, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,date,day_idx' }
  )
}

export async function saveProgWeight(userId, weekNum, dayIdx, weights) {
  return supabase.from('progression_weights').upsert(
    { user_id: userId, week_num: weekNum, day_idx: dayIdx, weights, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,week_num,day_idx' }
  )
}

export async function saveWater(userId, oz, log) {
  const date = new Date().toISOString().split('T')[0]
  return supabase.from('water_log').upsert(
    { user_id: userId, date, oz, log, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,date' }
  )
}

export async function saveGrocery(userId, checked) {
  return supabase.from('grocery_checked').upsert(
    { user_id: userId, checked, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
}

export async function saveCheckin(userId, date, weight, data) {
  return supabase.from('checkins').upsert(
    { user_id: userId, date, weight: parseFloat(weight) || null, data, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,date' }
  )
}

export async function checkUserProfile(userId) {
  const { data } = await supabase.from('user_profiles').select('profile, generated_plan').eq('user_id', userId).maybeSingle()
  return data
}
