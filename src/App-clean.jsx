import React, { useState, useEffect } from 'react'
import './App-clean.css'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    onLogin(email)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🏠 Clixsys Kiosk</h1>
          <p>Smart Home Control Center</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>
        
        <div className="login-footer">
          <p>Access your smart home devices and mirror functions</p>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ user, onLogout }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentPage, setCurrentPage] = useState('mirror')
  const [showNavigation, setShowNavigation] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

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
        <div className="page-content">
          <h1>💡 Light Control</h1>
          <div className="control-grid">
            <div className="control-card">
              <h3>Living Room</h3>
              <button className="control-btn on">Main Light - ON</button>
              <button className="control-btn off">Table Lamp - OFF</button>
            </div>
            <div className="control-card">
              <h3>Kitchen</h3>
              <button className="control-btn on">Overhead - ON</button>
              <button className="control-btn on">Under Cabinet - ON</button>
            </div>
          </div>
        </div>
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
        <div className="page-content">
          <h1>🌡️ Climate Control</h1>
          <div className="control-grid">
            <div className="control-card">
              <h3>Living Room</h3>
              <div className="temp-display">22°C</div>
              <button className="control-btn">Thermostat - ON</button>
            </div>
            <div className="control-card">
              <h3>Bedroom</h3>
              <div className="temp-display">20°C</div>
              <button className="control-btn">Fan - Speed 2</button>
            </div>
          </div>
        </div>
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
              <p>Latest automation features now available...</p>
            </div>
          </div>
        </div>
        
        <div className="quote-section">
          <div className="widget">
            <h2>💭 Quote</h2>
            <blockquote>
              "The future belongs to those who believe in the beauty of their dreams."
            </blockquote>
            <cite>- Eleanor Roosevelt</cite>
          </div>
        </div>
        
        <div className="user-section">
          <div className="widget">
            <p>Welcome, {user}</p>
            <div className="stats">
              <p>💡 Lights: 3/8 on</p>
              <p>🌡️ Climate: 2/4 on</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)

  const handleLogin = (email) => {
    setUser(email)
  }

  const handleLogout = () => {
    setUser(null)
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return <Dashboard user={user} onLogout={handleLogout} />
}

export default App