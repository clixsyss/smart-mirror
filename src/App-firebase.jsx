import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { roomsStore } from './stores/roomsStore'
import Login from './components/Login'
import './App-clean.css'

function TimeWidget() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="widget">
      <div className="time">{currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })}</div>
      <div className="date">{currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</div>
    </div>
  )
}

function LightControlPage({ user, onBack }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRooms = async () => {
      if (user) {
        setLoading(true)
        try {
          await roomsStore.fetchRooms(user.uid)
          setRooms([...roomsStore.rooms])
        } catch (error) {
          console.error('Error loading rooms:', error)
        }
        setLoading(false)
      }
    }

    loadRooms()

    // Subscribe to real-time updates
    let unsubscribe
    if (user) {
      unsubscribe = roomsStore.subscribe((updatedRooms) => {
        console.log('💡 LightControl: Received rooms update', updatedRooms.length)
        setRooms([...updatedRooms])
      })
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [user])

  const toggleLight = async (roomId, deviceId) => {
    try {
      const device = roomsStore.getDeviceById(deviceId)
      if (device && user) {
        const newState = !device.state
        await roomsStore.updateDevice(user.uid, roomId, deviceId, { state: newState })
      }
    } catch (error) {
      console.error('Error toggling light:', error)
    }
  }

  if (loading) {
    return (
      <div className="page-content">
        <h1>💡 Light Control</h1>
        <p>Loading lights...</p>
        <button className="control-btn" onClick={onBack}>← Back to Mirror</button>
      </div>
    )
  }

  return (
    <div className="page-content">
      <h1>💡 Light Control</h1>
      <button className="control-btn" onClick={onBack} style={{marginBottom: '2rem'}}>← Back to Mirror</button>
      
      <div className="control-grid">
        {rooms.map(room => {
          const lightDevices = room.devices ? room.devices.filter(device => device.type === 'light') : []
          
          if (lightDevices.length === 0) return null

          return (
            <div key={room.id} className="control-card">
              <h3>{room.name}</h3>
              {lightDevices.map(device => (
                <button
                  key={device.id}
                  className={`control-btn ${device.state ? 'on' : 'off'}`}
                  onClick={() => toggleLight(room.id, device.id)}
                >
                  {device.name} - {device.state ? 'ON' : 'OFF'}
                </button>
              ))}
            </div>
          )
        })}
        
        {rooms.length === 0 && (
          <div className="control-card">
            <h3>No Lights Found</h3>
            <p>Add some devices in the main Clixsys app first</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ClimateControlPage({ user, onBack }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRooms = async () => {
      if (user) {
        setLoading(true)
        try {
          await roomsStore.fetchRooms(user.uid)
          setRooms([...roomsStore.rooms])
        } catch (error) {
          console.error('Error loading rooms:', error)
        }
        setLoading(false)
      }
    }

    loadRooms()

    // Subscribe to real-time updates
    let unsubscribe
    if (user) {
      unsubscribe = roomsStore.subscribe((updatedRooms) => {
        console.log('🌡️ ClimateControl: Received rooms update', updatedRooms.length)
        setRooms([...updatedRooms])
      })
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [user])

  const toggleDevice = async (roomId, deviceId) => {
    try {
      const device = roomsStore.getDeviceById(deviceId)
      if (device && user) {
        const newState = !device.state
        await roomsStore.updateDevice(user.uid, roomId, deviceId, { state: newState })
      }
    } catch (error) {
      console.error('Error toggling device:', error)
    }
  }

  const updateTemperature = async (roomId, deviceId, temperature) => {
    try {
      if (user) {
        await roomsStore.updateDevice(user.uid, roomId, deviceId, { temperature: parseInt(temperature) })
      }
    } catch (error) {
      console.error('Error updating temperature:', error)
    }
  }

  if (loading) {
    return (
      <div className="page-content">
        <h1>🌡️ Climate Control</h1>
        <p>Loading climate devices...</p>
        <button className="control-btn" onClick={onBack}>← Back to Mirror</button>
      </div>
    )
  }

  return (
    <div className="page-content">
      <h1>🌡️ Climate Control</h1>
      <button className="control-btn" onClick={onBack} style={{marginBottom: '2rem'}}>← Back to Mirror</button>
      
      <div className="control-grid">
        {rooms.map(room => {
          const climateDevices = room.devices ? room.devices.filter(device => 
            device.type === 'thermostat' || device.type === 'fan' || device.type === 'air_conditioner'
          ) : []
          
          if (climateDevices.length === 0) return null

          return (
            <div key={room.id} className="control-card">
              <h3>{room.name}</h3>
              {climateDevices.map(device => (
                <div key={device.id} style={{margin: '1rem 0'}}>
                  <div className="temp-display">{device.temperature || 22}°C</div>
                  <button
                    className={`control-btn ${device.state ? 'on' : 'off'}`}
                    onClick={() => toggleDevice(room.id, device.id)}
                  >
                    {device.name} - {device.state ? 'ON' : 'OFF'}
                  </button>
                  {device.state && (device.type === 'thermostat' || device.type === 'air_conditioner') && (
                    <input
                      type="range"
                      min="16"
                      max="30"
                      value={device.temperature || 22}
                      onChange={(e) => updateTemperature(room.id, device.id, e.target.value)}
                      style={{width: '100%', marginTop: '0.5rem'}}
                    />
                  )}
                </div>
              ))}
            </div>
          )
        })}
        
        {rooms.length === 0 && (
          <div className="control-card">
            <h3>No Climate Devices Found</h3>
            <p>Add some devices in the main Clixsys app first</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Dashboard({ user, userProfile, onLogout }) {
  const [currentPage, setCurrentPage] = useState('mirror')
  const [showNavigation, setShowNavigation] = useState(false)
  const [rooms, setRooms] = useState([])

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
      }).catch(err => {
        console.error('Error loading rooms:', err)
      })
      
      // Subscribe to real-time updates
      unsubscribe = roomsStore.subscribe((updatedRooms) => {
        console.log('🏠 Dashboard: Received rooms update for stats')
        console.log('📋 Rooms data:', updatedRooms.map(r => ({
          id: r.id,
          name: r.name,
          deviceCount: r.devices?.length || 0,
          lights: r.devices?.filter(d => d.type === 'light').map(d => ({ id: d.id, name: d.name, state: d.state })) || []
        })))
        setRooms([...updatedRooms])
      })
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [user])

  const toggleQuickLight = async (roomId, deviceId) => {
    try {
      console.log('🔧 Click detected! Attempting to toggle light:', { roomId, deviceId })
      const device = roomsStore.getDeviceById(deviceId)
      console.log('📱 Found device:', device)
      
      if (device && user) {
        const newState = !device.state
        console.log(`💡 Toggling ${device.name} from ${device.state} to ${newState}`)
        await roomsStore.updateDevice(user.uid, roomId, deviceId, { state: newState })
        console.log(`✅ Successfully toggled: ${device.name} is now ${newState ? 'ON' : 'OFF'}`)
      } else {
        console.error('❌ Device or user not found:', { device: !!device, user: !!user })
      }
    } catch (error) {
      console.error('💥 Error toggling quick light:', error)
    }
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
            onClick={onLogout}
          >
            🚪 Logout
          </button>
        </nav>
        <LightControlPage user={user} onBack={() => setCurrentPage('mirror')} />
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
            onClick={onLogout}
          >
            🚪 Logout
          </button>
        </nav>
        <ClimateControlPage user={user} onBack={() => setCurrentPage('mirror')} />
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
          onClick={onLogout}
        >
          🚪 Logout
        </button>
      </nav>
      
      <div className="mirror-grid">
        <div className="time-section">
          <TimeWidget />
        </div>
        
        <div className="weather-section">
          <div className="widget">
            <h2>🌤️ Weather</h2>
            <div className="temp">22°C</div>
            <div className="desc">Partly cloudy</div>
            <div className="details">
              <span>💧 Humidity: 65%</span>
              <span>💨 Wind: 3.2 m/s</span>
            </div>
          </div>
        </div>
        
        <div className="news-section">
          <div className="widget">
            <h2>📰 News</h2>
            <div className="news-item">
              <h3>Smart Home Update</h3>
              <p>Your Clixsys system is connected and operational...</p>
            </div>
          </div>
        </div>
        
        <div className="quote-section">
          <div className="widget">
            <h2>💭 Quote</h2>
            <blockquote>
              "The best way to predict the future is to create it."
            </blockquote>
            <cite>- Peter Drucker</cite>
            <div className="user-info" style={{marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem'}}>
              <p>Welcome, {userProfile?.name || user.email}</p>
              <p>Role: {userProfile?.role || 'User'}</p>
              <div className="stats">
                <p>💡 Lights: {rooms.reduce((acc, room) => acc + (room.devices?.filter(d => d.type === 'light' && d.state).length || 0), 0)} / {rooms.reduce((acc, room) => acc + (room.devices?.filter(d => d.type === 'light').length || 0), 0)} on</p>
                <p>🌡️ Climate: {rooms.reduce((acc, room) => acc + (room.devices?.filter(d => ['thermostat', 'fan', 'air_conditioner'].includes(d.type) && d.state).length || 0), 0)} / {rooms.reduce((acc, room) => acc + (room.devices?.filter(d => ['thermostat', 'fan', 'air_conditioner'].includes(d.type)).length || 0), 0)} on</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lights-section">
          <div className="widget">
            <h2>💡 Quick Lights</h2>
            <div style={{marginBottom: '1rem', fontSize: '0.8rem', color: '#ccc'}}>
              Debug: {rooms.length} rooms loaded, Total devices: {rooms.reduce((acc, room) => acc + (room.devices?.length || 0), 0)}
            </div>
            <div className="quick-controls">
              <button 
                onClick={() => {
                  console.log('🔔 TEST: Click event working!')
                  console.log('📋 Current rooms:', rooms)
                  alert('Click test successful! Check console for room data.')
                }}
                style={{background: 'green', color: 'white', padding: '10px', margin: '5px', borderRadius: '5px', border: 'none', cursor: 'pointer'}}
              >
                TEST CLICK & SHOW DATA
              </button>
              {rooms.slice(0, 2).map(room => {
                const lightDevices = room.devices ? room.devices.filter(device => device.type === 'light').slice(0, 2) : []
                console.log(`🏠 Room ${room.name} has ${lightDevices.length} lights:`, lightDevices)
                return lightDevices.map(device => (
                  <button
                    key={device.id}
                    className={`quick-light-btn ${device.state ? 'on' : 'off'}`}
                    onClick={() => {
                      console.log('🔎 Light button clicked for device:', device.id, device.name)
                      alert(`Clicking light: ${device.name} (${device.state ? 'ON' : 'OFF'})`)
                      toggleQuickLight(room.id, device.id)
                    }}
                    title={`${room.name} - ${device.name}`}
                  >
                    {device.state ? '💡' : '🔘'} {device.name}
                  </button>
                ))
              }).flat().slice(0, 4)}
              {rooms.reduce((acc, room) => acc + (room.devices?.filter(d => d.type === 'light').length || 0), 0) === 0 && (
                <p style={{margin: 0, color: '#888', fontSize: '0.9rem'}}>No lights available - Add some devices in the main Clixsys app first</p>
              )}
            </div>
            <button 
              className="open-control-btn"
              onClick={() => setCurrentPage('lights')}
            >
              🔧 All Lights
            </button>
          </div>
        </div>
        
        <div className="climate-section">
          <div className="widget">
            <h2>🌡️ Climate</h2>
            <div className="climate-stats">
              {rooms.slice(0, 2).map(room => {
                const climateDevices = room.devices ? room.devices.filter(device => 
                  ['thermostat', 'fan', 'air_conditioner'].includes(device.type)
                ).slice(0, 1) : []
                return climateDevices.map(device => (
                  <div key={device.id} className="climate-item">
                    <span className={`climate-status ${device.state ? 'on' : 'off'}`}>
                      {device.type === 'thermostat' ? '🌡️' : device.type === 'fan' ? '🌀' : '❄️'}
                      {device.name}
                    </span>
                    <span className="temp-display">{device.temperature || 22}°C</span>
                  </div>
                ))
              }).flat().slice(0, 3)}
            </div>
            <button 
              className="open-control-btn"
              onClick={() => setCurrentPage('climate')}
            >
              🔧 Climate Control
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function KioskApp() {
  const { user, userProfile, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="kiosk-app">
        <div className="page-content">
          <h1>🏠 Clixsys Kiosk</h1>
          <p>Connecting to Firebase...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return <Dashboard user={user} userProfile={userProfile} onLogout={logout} />
}

function App() {
  return (
    <AuthProvider>
      <KioskApp />
    </AuthProvider>
  )
}

export default App