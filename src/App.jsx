import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useGlobalStore } from './hooks/useGlobalStore'
import Login from './components/Login'
import TimeDate from './components/TimeDate'
import Weather from './components/Weather'
import NewsHeadlines from './components/NewsHeadlines'
import QuoteOfDay from './components/QuoteOfDay'
import LightControl from './components/LightControl'
import ClimateControl from './components/ClimateControl'
import ChatGPTAssistant from './components/ChatGPTAssistant'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function SmartMirror() {
  const [activePanel, setActivePanel] = useState(null) // 'lights', 'climate', 'assistant', or null
  const [showControls, setShowControls] = useState(false)
  const { user, userProfile, loading, logout } = useAuth()
  const { state, actions } = useGlobalStore()

  // Initialize global store when user is available
  useEffect(() => {
    if (user && !state.app.isInitialized) {
      console.log('🚀 Initializing smart mirror with user:', user.uid)
      // Initialize immediately without waiting
      actions.initialize(user.uid).catch(error => {
        console.error('Initialization error:', error)
      })
    }
  }, [user, state.app.isInitialized, actions])

  // Show controls on user activity
  useEffect(() => {
    let hideTimeout

    const handleUserActivity = () => {
      setShowControls(true)
      clearTimeout(hideTimeout)
      hideTimeout = setTimeout(() => {
        setShowControls(false)
        setActivePanel(null)
      }, 10000) // Hide after 10 seconds
    }

    document.addEventListener('mousemove', handleUserActivity)
    document.addEventListener('touchstart', handleUserActivity)

    return () => {
      document.removeEventListener('mousemove', handleUserActivity)
      document.removeEventListener('touchstart', handleUserActivity)
      clearTimeout(hideTimeout)
    }
  }, [])

  const openPanel = (panel) => {
    setActivePanel(panel)
    setShowControls(true)
  }

  const closePanel = () => {
    setActivePanel(null)
  }

  if (loading) {
    return (
      <div className="mirror-loading">
        <div className="loading-content">
          <h1>Clixsys Smart Mirror</h1>
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Show basic interface even if not fully initialized
  if (!state.app.isInitialized) {
    return (
      <div className="smart-mirror">
        <div className="mirror-content">
          <div className="time-display">
            <TimeDate />
          </div>
          <div className="weather-display">
            <div className="weather">
              <div className="current-weather">
                <div className="current-temp">22°C</div>
                <div className="current-description">Loading...</div>
                <div className="current-location">London</div>
              </div>
            </div>
          </div>
          <div className="quote-display">
            <div className="quote">
              <div className="quote-text">Loading inspirational quote...</div>
              <div className="quote-author">— Smart Mirror</div>
            </div>
          </div>
          <div className="news-ticker">
            <div className="news">
              <div className="news-ticker">
                <div className="news-ticker-content">
                  <div className="news-headline">Loading news headlines...</div>
                </div>
              </div>
            </div>
          </div>
          <div className="user-info">
            <div className="user-greeting">
              <span>Welcome, {userProfile?.name || user.email?.split('@')[0]}</span>
            </div>
            <div className="device-status">
              <span className="status-item">0 lights on</span>
              <span className="status-item">0 climate active</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="smart-mirror">
      {/* Main Content */}
      <div className="mirror-content">
        {/* Time & Date - Top Center */}
        <div className="time-display">
          <TimeDate />
        </div>

        {/* Weather - Top Right */}
        <div className="weather-display">
          <Weather data={state.weather} />
        </div>

        {/* Quote - Left Side */}
        <div className="quote-display">
          <QuoteOfDay data={state.quote} />
        </div>

        {/* News Ticker - Bottom */}
        <div className="news-ticker">
          <NewsHeadlines data={state.news} />
        </div>

        {/* User Info - Top Left */}
        <div className="user-info">
          <div className="user-greeting">
            <span>Welcome, {userProfile?.name || user.email?.split('@')[0]}</span>
            {(state.weather.loading || state.news.loading || state.smartHome.loading) && (
              <span className="refresh-indicator">🔄</span>
            )}
          </div>
          <div className="device-status">
            <span className="status-item">
              {state.smartHome.devices.filter(d => d.type === 'light' && d.state).length} lights on
            </span>
            <span className="status-item">
              {state.smartHome.devices.filter(d => ['thermostat', 'fan', 'air_conditioner'].includes(d.type) && d.state).length} climate active
            </span>
          </div>
        </div>
      </div>

      {/* Control Dock - Bottom Right */}
      <div className={`control-dock ${showControls ? 'visible' : ''}`}>
        <button 
          className="control-btn lights-btn"
          onClick={() => openPanel('lights')}
          title="Lights Control"
        >
          <div className="btn-icon">💡</div>
        </button>
        
        <button 
          className="control-btn climate-btn"
          onClick={() => openPanel('climate')}
          title="Climate Control"
        >
          <div className="btn-icon">🌡️</div>
        </button>
        
        <button 
          className="control-btn assistant-btn"
          onClick={() => openPanel('assistant')}
          title="AI Assistant"
        >
          <div className="btn-icon">🤖</div>
        </button>
        
        <button 
          className="control-btn logout-btn"
          onClick={logout}
          title="Logout"
        >
          <div className="btn-icon">🚪</div>
        </button>
      </div>

      {/* Overlay Panels */}
      {activePanel === 'lights' && (
        <div className="overlay-panel lights-panel">
          <div className="panel-header">
            <h2>Lights Control</h2>
            <button className="close-btn" onClick={closePanel}>×</button>
          </div>
          <div className="panel-content">
            <LightControl data={state.smartHome} />
          </div>
        </div>
      )}

      {activePanel === 'climate' && (
        <div className="overlay-panel climate-panel">
          <div className="panel-header">
            <h2>Climate Control</h2>
            <button className="close-btn" onClick={closePanel}>×</button>
          </div>
          <div className="panel-content">
            <ClimateControl data={state.smartHome} />
          </div>
        </div>
      )}

      {activePanel === 'assistant' && (
        <div className="overlay-panel assistant-panel">
          <div className="panel-header">
            <h2>AI Assistant</h2>
            <button className="close-btn" onClick={closePanel}>×</button>
          </div>
          <div className="panel-content">
            <ChatGPTAssistant data={state.assistant} actions={actions} />
          </div>
        </div>
      )}

      {/* Overlay Background */}
      {activePanel && (
        <div className="overlay-background" onClick={closePanel}></div>
      )}
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SmartMirror />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App