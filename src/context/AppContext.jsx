import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { loadUserData, saveWater, saveGrocery, saveWorkoutProgress, saveProgWeight, saveCheckin } from '../lib/db'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [syncing, setSyncing]         = useState(false)
  const [data, setData]               = useState({
    workoutProgress: {}, progWeights: {}, water: { oz: 0, log: [] },
    groceryChecked: {}, checkins: {}, lastWeight: 0,
    userProfile: null, generatedPlan: null,
  })

  // Load all user data after login
  const loadData = useCallback(async (userId) => {
    setSyncing(true)
    try {
      const d = await loadUserData(userId)
      setData(d)
    } catch(e) { console.error('loadData error:', e) }
    setSyncing(false)
  }, [])

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadData(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        setUser(session.user)
        loadData(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setData({ workoutProgress: {}, progWeights: {}, water: { oz: 0, log: [] },
          groceryChecked: {}, checkins: {}, lastWeight: 0, userProfile: null, generatedPlan: null })
      }
    })
    return () => subscription.unsubscribe()
  }, [loadData])

  // ── Actions ──────────────────────────────────────────────────────────────────
  const addWater = useCallback(async (oz) => {
    const newOz  = (data.water.oz || 0) + oz
    const newLog = [...(data.water.log || []), oz]
    setData(d => ({ ...d, water: { oz: newOz, log: newLog } }))
    if (user) { setSyncing(true); await saveWater(user.id, newOz, newLog); setSyncing(false) }
  }, [data.water, user])

  const resetWater = useCallback(async () => {
    setData(d => ({ ...d, water: { oz: 0, log: [] } }))
    if (user) { setSyncing(true); await saveWater(user.id, 0, []); setSyncing(false) }
  }, [user])

  const toggleGrocery = useCallback(async (key) => {
    const updated = { ...data.groceryChecked, [key]: !data.groceryChecked[key] }
    setData(d => ({ ...d, groceryChecked: updated }))
    if (user) { setSyncing(true); await saveGrocery(user.id, updated); setSyncing(false) }
  }, [data.groceryChecked, user])

  const updateWorkout = useCallback(async (dayIdx, progress) => {
    const today = new Date().toISOString().split('T')[0]
    const key   = `${today}-${dayIdx}`
    setData(d => ({ ...d, workoutProgress: { ...d.workoutProgress, [key]: progress } }))
    if (user) { setSyncing(true); await saveWorkoutProgress(user.id, dayIdx, progress); setSyncing(false) }
  }, [user])

  const updateProgWeight = useCallback(async (weekNum, dayIdx, weights) => {
    const key = `${weekNum}-${dayIdx}`
    setData(d => ({ ...d, progWeights: { ...d.progWeights, [key]: weights } }))
    if (user) { setSyncing(true); await saveProgWeight(user.id, weekNum, dayIdx, weights); setSyncing(false) }
  }, [user])

  const submitCheckin = useCallback(async (date, weight, checkData) => {
    setData(d => ({ ...d, checkins: { ...d.checkins, [date]: { ...checkData, weight } }, lastWeight: weight || d.lastWeight }))
    if (user) { setSyncing(true); await saveCheckin(user.id, date, weight, checkData); setSyncing(false) }
  }, [user])

  const updatePlan = useCallback((userProfile, generatedPlan) => {
    setData(d => ({ ...d, userProfile, generatedPlan }))
  }, [])

  const signOut = () => supabase.auth.signOut()

  return (
    <AppContext.Provider value={{
      user, loading, syncing, data,
      addWater, resetWater, toggleGrocery,
      updateWorkout, updateProgWeight, submitCheckin, updatePlan,
      signOut, reload: () => user && loadData(user.id),
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
