import { useState } from 'react'
import { AppProvider, useApp, isProfileComplete } from './context/AppContext'
import LoginScreen from './components/LoginScreen'
import Onboarding from './components/Onboarding'
import Nav from './components/Nav'
import Notifications from './components/Notifications'
import Today from './screens/Today'
import Workouts from './screens/Workouts'
import Meals from './screens/Meals'
import MealTracker from './screens/MealTracker'
import Grocery from './screens/Grocery'
import CheckIn from './screens/CheckIn'
import Profile from './screens/Profile'
import './styles/global.css'

function AppInner() {
  const { user, loading, data, updatePlan } = useApp()
  const [screen, setScreen]   = useState('today')
  const [showNotes, setNotes] = useState(false)

  const needsOnboard = user && !loading && !isProfileComplete(data.userProfile)

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100dvh', background:'var(--bg)' }}>
      <div style={{ width:40, height:40, border:'3px solid rgba(255,255,255,.1)', borderTop:'3px solid #00c896', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
    </div>
  )

  if (!user) return <LoginScreen />
  if (needsOnboard) return <Onboarding onComplete={(profile, plan) => { if (profile && plan) updatePlan(profile, plan) }} />

  const screens = {
    today:    <Today setScreen={setScreen} onBell={() => setNotes(true)} />,
    workouts: <Workouts />,
    meals:    <Meals />,
    tracker:  <MealTracker />,
    grocery:  <Grocery />,
    checkin:  <CheckIn />,
    profile:  <Profile setScreen={setScreen} />,
  }

  return (
    <>
      {screens[screen] || screens.today}
      <Nav screen={screen} setScreen={setScreen} />
      {showNotes && <Notifications onClose={() => setNotes(false)} />}
    </>
  )
}

export default function App() {
  return <AppProvider><AppInner /></AppProvider>
}
