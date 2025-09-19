import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { roomsStore } from './stores/roomsStore'
import Login from './components/Login'
import TimeDate from './components/TimeDate'
import Weather from './components/Weather'
import NewsHeadlines from './components/NewsHeadlines'
import QuoteOfDay from './components/QuoteOfDay'
import LightControl from './components/LightControl'
import ClimateControl from './components/ClimateControl'
import './App.css'

function KioskApp() {
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const [currentPage, setCurrentPage] = useState('mirror') // 'mirror', 'lights', or 'climate'
  const [showNavigation, setShowNavigation] = useState(false)
  const [rooms, setRooms] = useState([])
  const { user, userProfile, loading, logout } = useAuth()

  useEffect(() => {
    // Auto-refresh every 15 minutes
    const interval = setInterval(() => {
      setLastRefresh(Date.now())
    }, 15 * 60 * 1000) // 15 minutes

    return () => clearInterval(interval)
  }, [])

  // Show navigation on mouse movement or touch, hide after 3 seconds
  useEffect(() => {
    let hideTimeout

    const handleUserActivity = () => {
      setShowNavigation(true)
      clearTimeout(hideTimeout)
      hideTimeout = setTimeout(() => {
        setShowNavigation(false)
      }, 3000)
    }

    document.addEventListener('mousemove', handleUserActivity)
    document.addEventListener('touchstart', handleUserActivity)

    return () => {
      document.removeEventListener('mousemove', handleUserActivity)
      document.removeEventListener('touchstart', handleUserActivity)
      clearTimeout(hideTimeout)
    }
  }, [])

  // Set up real-time rooms subscription for stats
  useEffect(() => {
    let unsubscribe
    if (user) {
      // Initialize rooms data
      roomsStore.fetchRooms(user.uid).then(() => {
        setRooms([...roomsStore.rooms])
      })
      
      // Subscribe to real-time updates
      unsubscribe = roomsStore.subscribe((updatedRooms) => {
        console.log('🏠 KioskApp: Received rooms update for stats')
        setRooms([...updatedRooms])
      })
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [user])

  if (loading) {
    return (
      <div className="kiosk-loading">
        <h1>🏠 Clixsys Kiosk</h1>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  if (currentPage === 'lights') {
    return (
      <div className="kiosk-app">
        <nav className={`navigation ${showNavigation ? 'visible' : ''}`}>
          <button 
            className="nav-button"
            onClick={() => setCurrentPage('mirror')}
          >
            🪞 Mirror
          </button>
          <button 
            className="nav-button active"
            onClick={() => setCurrentPage('lights')}
          >
            💡 Lights
          </button>
          <button 
            className="nav-button"
            onClick={() => setCurrentPage('climate')}
          >
            🌡️ Climate
          </button>
          <button 
            className="nav-button logout"
            onClick={logout}
          >
            🚪 Logout
          </button>
        </nav>
        <LightControl />
      </div>
    )
  }

  if (currentPage === 'climate') {
    return (
      <div className="kiosk-app">
        <nav className={`navigation ${showNavigation ? 'visible' : ''}`}>
          <button 
            className="nav-button"
            onClick={() => setCurrentPage('mirror')}
          >
            🪞 Mirror
          </button>
          <button 
            className="nav-button"
            onClick={() => setCurrentPage('lights')}
          >
            💡 Lights
          </button>
          <button 
            className="nav-button active"
            onClick={() => setCurrentPage('climate')}
          >
            🌡️ Climate
          </button>
          <button 
            className="nav-button logout"
            onClick={logout}
          >
            🚪 Logout
          </button>
        </nav>
        <ClimateControl />
      </div>
    )
  }

  return (
    <div className="kiosk-app">
      <nav className={`navigation ${showNavigation ? 'visible' : ''}`}>
        <button 
          className="nav-button active"
          onClick={() => setCurrentPage('mirror')}
        >
          🪞 Mirror
        </button>
        <button 
          className="nav-button"
          onClick={() => setCurrentPage('lights')}
        >
          💡 Lights
        </button>
        <button 
          className="nav-button"
          onClick={() => setCurrentPage('climate')}
        >
          🌡️ Climate
        </button>
        <button 
          className="nav-button logout"
          onClick={logout}
        >
          🚪 Logout
        </button>
      </nav>
      
      <div className="mirror-grid">
        <div className="time-section">
          <TimeDate />
        </div>
        
        <div className="weather-section">
          <Weather refreshTrigger={lastRefresh} />
        </div>
        
        <div className="news-section">
          <NewsHeadlines refreshTrigger={lastRefresh} />
        </div>
        
        <div className="quote-section">
          <QuoteOfDay refreshTrigger={lastRefresh} />
        </div>
        
        <div className="user-info">
          <p>Welcome, {userProfile?.name || user.email}</p>
          <p>Role: {userProfile?.role || 'User'}</p>
          <div className="device-stats">
            <p>💡 Lights: {rooms.reduce((acc, room) => acc + room.devices?.filter(d => d.type === 'light' && d.state).length || 0, 0)} / {rooms.reduce((acc, room) => acc + room.devices?.filter(d => d.type === 'light').length || 0, 0)} on</p>
            <p>🌡️ Climate: {rooms.reduce((acc, room) => acc + room.devices?.filter(d => ['thermostat', 'fan', 'air_conditioner'].includes(d.type) && d.state).length || 0, 0)} / {rooms.reduce((acc, room) => acc + room.devices?.filter(d => ['thermostat', 'fan', 'air_conditioner'].includes(d.type)).length || 0, 0)} on</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <KioskApp />
    </AuthProvider>
  )
}

export default App
