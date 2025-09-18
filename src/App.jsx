import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useGlobalStore } from './hooks/useGlobalStore'
import useConnectivity from './hooks/useConnectivity'
import Login from './components/Login'
import TimeDate from './components/TimeDate'
import Weather from './components/Weather'
import NewsHeadlines from './components/NewsHeadlines'
import QuoteOfDay from './components/QuoteOfDay'
import LightControl from './components/LightControl'
import ClimateControl from './components/ClimateControl'
import FanControl from './components/FanControl'
import SmartAssistant from './components/ChatGPTAssistant'
import ShuttersControl from './components/ShuttersControl'
import CurtainsControl from './components/CurtainsControl'
import ErrorBoundary from './components/ErrorBoundary'
import SettingsModal from './components/SettingsModal'
import OfflineMode from './components/OfflineMode'
import './App.css'

// Modern Icon Components
const LightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z"/>
    <path d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
  </svg>
)

const ClimateIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
  </svg>
)

const AssistantIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
)

const ShuttersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="3" y1="15" x2="21" y2="15"/>
    <line x1="9" y1="9" x2="9" y2="15"/>
    <line x1="15" y1="9" x2="15" y2="15"/>
  </svg>
)

const CurtainsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3h18v18H3z"/>
    <path d="M12 3v18"/>
    <path d="M3 3l9 9"/>
    <path d="M21 3l-9 9"/>
    <path d="M3 21l9-9"/>
    <path d="M21 21l-9-9"/>
  </svg>
)

const FanIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.2 5.2a1 1 0 0 0-1.4 0l-7.5 7.5a1 1 0 0 0 0 1.4l7.5 7.5a1 1 0 0 0 1.4-1.4L9.4 14l5.8-5.8a1 1 0 0 0 0-1.4z"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
)

const LogoutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

function SmartMirror() {
  const [activePanel, setActivePanel] = useState(null) // 'lights', 'climate', 'fans', 'assistant', 'settings', or null
  const [showControls, setShowControls] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [modalTimeout, setModalTimeout] = useState(null)
  const { user, userProfile, loading, logout } = useAuth()
  const { state, actions } = useGlobalStore()
  const connectivity = useConnectivity()

  useEffect(() => {
    if (user && !state.app.isInitialized) {
      actions.initialize(user.uid).catch(error => {
        console.error('Initialization error:', error)
      })
    } else if (!user && state.app.isInitialized) {
      actions.reset()
      // Also clear local component state
      setActivePanel(null)
      setShowControls(false)
      setShowSettings(false)
      if (modalTimeout) {
        clearTimeout(modalTimeout)
        setModalTimeout(null)
      }
    }
  }, [user, state.app.isInitialized, actions])

  useEffect(() => {
    let hideTimeout

    const handleUserActivity = () => {
      setShowControls(true)
      clearTimeout(hideTimeout)
      hideTimeout = setTimeout(() => {
        setShowControls(false)
        // Don't auto-close panels - only hide the control buttons
        // Panels will stay open until manually closed
      }, 10000) // Hide control buttons after 10 seconds
    }

    document.addEventListener('mousemove', handleUserActivity)
    document.addEventListener('touchstart', handleUserActivity)

    return () => {
      document.removeEventListener('mousemove', handleUserActivity)
      document.removeEventListener('touchstart', handleUserActivity)
      clearTimeout(hideTimeout)
      clearModalTimeout() // Clean up modal timeout
    }
  }, [])

  const clearModalTimeout = () => {
    if (modalTimeout) {
      clearTimeout(modalTimeout)
      setModalTimeout(null)
    }
  }

  const openPanel = (panel) => {
    setActivePanel(panel)
    // Removed automatic timeout - panel stays open until manually closed
  }

  const closePanel = () => {
    setActivePanel(null)
    clearModalTimeout()
  }

  const openSettings = () => {
    setShowSettings(true)
    // Removed automatic timeout - settings stay open until manually closed
  }

  const closeSettings = () => {
    setShowSettings(false)
    clearModalTimeout()
  }

  const handleModalInteraction = () => {
    // Modal interaction no longer resets timeout since we removed auto-close
    // Panels stay open until manually closed
  }

  // Show offline mode if no internet connection
  if (!connectivity.isOnline) {
    return <OfflineMode connectionStatus={connectivity.getConnectionStatus()} />
  }

  if (loading) {
    return (
      <div className="mirror-loading">
        <div className="loading-content">
          <h1>Smart Mirror</h1>
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Always check for user first - redirect to login if no user
  if (!user) {
    return <Login />
  }

  // Show basic interface even if not fully initialized (but only if user is logged in)
  if (!state.app.isInitialized) {
    return (
      <div className="smart-mirror">
        <div className="mirror-content">
          <div className="card time-card">
            <TimeDate />
          </div>
          <div className="card weather-card">
            <Weather data={state.weather} />
          </div>
          <div className="card quote-card">
            <QuoteOfDay data={state.quote} settings={state.settings} />
          </div>
          <div className="services-grid">
            <div className="service-card" onClick={() => openPanel('lights')}>
              <div className="service-icon">
                <LightIcon />
              </div>
              <div className="service-title">Lights</div>
            </div>
            <div className="service-card" onClick={() => openPanel('climate')}>
              <div className="service-icon">
                <ClimateIcon />
              </div>
              <div className="service-title">Climate</div>
            </div>
            <div className="service-card" onClick={() => openPanel('assistant')}>
              <div className="service-icon">
                <AssistantIcon />
              </div>
              <div className="service-title">Assistant</div>
            </div>
          </div>
          <div className="news-card">
            <NewsHeadlines data={state.news} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="smart-mirror">
      {/* Main Content - Two Column Grid */}
      <div className="mirror-content">
        {/* Time & Date Card */}
        {state.settings?.showTime !== false && (
          <div className={`card time-card ${state.settings?.clockType === 'analog' ? 'analog-clock-active' : ''}`}>
            <TimeDate />
          </div>
        )}

        {/* Weather Card */}
        {state.settings?.showWeather !== false && (
          <div className="card weather-card">
            <Weather data={state.weather} />
          </div>
        )}

        {/* Quote Card */}
        {state.settings?.showQuote !== false && (
          <div className="card quote-card">
            <QuoteOfDay data={state.quote} settings={state.settings} />
          </div>
        )}

        {/* Services Grid */}
        <div className="services-grid">
          {/* Lights Service Card */}
          {state.settings?.showLights !== false && (
            <div className="service-card" onClick={() => openPanel('lights')}>
              <div className="service-icon">
                <LightIcon />
              </div>
              <div className="service-title">Lights</div>
            </div>
          )}

          {/* Climate Service Card */}
          {state.settings?.showClimate !== false && (
            <div className="service-card" onClick={() => openPanel('climate')}>
              <div className="service-icon">
                <ClimateIcon />
              </div>
              <div className="service-title">Climate</div>
            </div>
          )}

          {/* Fan Service Card */}
          {state.settings?.showClimate !== false && (
            <div className="service-card" onClick={() => openPanel('fans')}>
              <div className="service-icon">
                <FanIcon />
              </div>
              <div className="service-title">Fans</div>
            </div>
          )}

          {/* AI Assistant Service Card */}
          {state.settings?.showAssistant !== false && (
            <div className="service-card" onClick={() => openPanel('assistant')}>
              <div className="service-icon">
                <AssistantIcon />
              </div>
              <div className="service-title">Assistant</div>
            </div>
          )}

          {/* Shutters Service Card */}
          {state.settings?.showShutters !== false && (
            <div className="service-card" onClick={() => openPanel('shutters')}>
              <div className="service-icon">
                <ShuttersIcon />
              </div>
              <div className="service-title">Shutters</div>
            </div>
          )}

          {/* Curtains Service Card */}
          {state.settings?.showCurtains !== false && (
            <div className="service-card" onClick={() => openPanel('curtains')}>
              <div className="service-icon">
                <CurtainsIcon />
              </div>
              <div className="service-title">Curtains</div>
            </div>
          )}
        </div>

        {/* News Card */}
        {state.settings?.showNews !== false && (
          <div className="news-card">
            <NewsHeadlines data={state.news} />
          </div>
        )}
      </div>

      {/* Control Dock - Bottom */}
      {/* <div className={`control-dock ${showControls ? 'visible' : ''}`}>
        {state.settings?.showLights !== false && (
          <button 
            className="control-btn lights-btn"
            onClick={() => openPanel('lights')}
            title="Lights Control"
          >
            <div className="btn-icon">
              <LightIcon />
            </div>
          </button>
        )}
        
        {state.settings?.showClimate !== false && (
          <button 
            className="control-btn climate-btn"
            onClick={() => openPanel('climate')}
            title="Climate Control"
          >
            <div className="btn-icon">
              <ClimateIcon />
            </div>
          </button>
        )}
        
        {state.settings?.showClimate !== false && (
          <button 
            className="control-btn fans-btn"
            onClick={() => openPanel('fans')}
            title="Fan Control"
          >
            <div className="btn-icon">
              <FanIcon />
            </div>
          </button>
        )}
        
        {state.settings?.showAssistant !== false && (
          <button 
            className="control-btn assistant-btn"
            onClick={() => openPanel('assistant')}
            title="AI Assistant"
          >
            <div className="btn-icon">
              <AssistantIcon />
            </div>
          </button>
        )}
        
        <button 
          className="control-btn logout-btn"
          onClick={logout}
          title="Logout"
        >
          <div className="btn-icon">
            <LogoutIcon />
          </div>
        </button>
      </div> */}

      {/* Beautiful Modal Panels */}
      {activePanel === 'lights' && (
        <div className="modal-overlay" onClick={closePanel}>
          <div className="control-modal lights-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">
                <LightIcon />
              </div>
              <div className="modal-title">
                <h2>Lights Control</h2>
                <p>Manage your smart lighting</p>
              </div>
              <button className="modal-close-btn" onClick={closePanel}>×</button>
            </div>
            <div className="modal-content" onMouseMove={handleModalInteraction} onTouchStart={handleModalInteraction}>
              <LightControl data={state.smartHome} actions={actions} userId={user?.uid} />
            </div>
          </div>
        </div>
      )}

      {activePanel === 'climate' && (
        <div className="modal-overlay" onClick={closePanel}>
          <div className="control-modal climate-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">
                <ClimateIcon />
              </div>
              <div className="modal-title">
                <h2>Climate Control</h2>
                <p>Adjust temperature and climate</p>
              </div>
              <button className="modal-close-btn" onClick={closePanel}>×</button>
            </div>
            <div className="modal-content" onMouseMove={handleModalInteraction} onTouchStart={handleModalInteraction}>
              <ClimateControl data={state.smartHome} actions={actions} userId={user?.uid} />
            </div>
          </div>
        </div>
      )}

      {activePanel === 'fans' && (
        <div className="modal-overlay" onClick={closePanel}>
          <div className="control-modal fans-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">
                <FanIcon />
              </div>
              <div className="modal-title">
                <h2>Fan Control</h2>
                <p>Adjust fan speeds</p>
              </div>
              <button className="modal-close-btn" onClick={closePanel}>×</button>
            </div>
            <div className="modal-content" onMouseMove={handleModalInteraction} onTouchStart={handleModalInteraction}>
              <FanControl data={state.smartHome} actions={actions} userId={user?.uid} />
            </div>
          </div>
        </div>
      )}

      {activePanel === 'assistant' && (
        <div className="modal-overlay" onClick={closePanel}>
          <div className="control-modal assistant-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">
                <AssistantIcon />
              </div>
              <div className="modal-title">
                <h2>Smart Assistant</h2>
                <p>Voice-controlled smart home assistant</p>
              </div>
              <button className="modal-close-btn" onClick={closePanel}>×</button>
            </div>
            <div className="modal-content" onMouseMove={handleModalInteraction} onTouchStart={handleModalInteraction}>
              <SmartAssistant data={state.assistant} actions={actions} userId={user?.uid} userProfile={userProfile} />
            </div>
          </div>
        </div>
      )}

      {activePanel === 'shutters' && (
        <div className="modal-overlay" onClick={closePanel}>
          <div className="control-modal shutters-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">
                <ShuttersIcon />
              </div>
              <div className="modal-title">
                <h2>Shutters Control</h2>
                <p>Manage your smart shutters</p>
              </div>
              <button className="modal-close-btn" onClick={closePanel}>×</button>
            </div>
            <div className="modal-content" onMouseMove={handleModalInteraction} onTouchStart={handleModalInteraction}>
              <ShuttersControl data={state.smartHome} actions={actions} userId={user?.uid} />
            </div>
          </div>
        </div>
      )}

      {activePanel === 'curtains' && (
        <div className="modal-overlay" onClick={closePanel}>
          <div className="control-modal curtains-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">
                <CurtainsIcon />
              </div>
              <div className="modal-title">
                <h2>Curtains Control</h2>
                <p>Manage your smart curtains</p>
              </div>
              <button className="modal-close-btn" onClick={closePanel}>×</button>
            </div>
            <div className="modal-content" onMouseMove={handleModalInteraction} onTouchStart={handleModalInteraction}>
              <CurtainsControl data={state.smartHome} actions={actions} userId={user?.uid} />
            </div>
          </div>
        </div>
      )}

      {/* Settings Button - Bottom Right */}
      <button 
        className="settings-btn"
        onClick={openSettings}
        title="Settings"
      >
        <SettingsIcon />
      </button>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={closeSettings}>
          <SettingsModal 
            onClose={closeSettings}
            state={state}
            actions={actions}
            logout={logout}
            onInteraction={handleModalInteraction}
          />
        </div>
      )}

      {/* Connection Status Indicator */}
      {connectivity.isConnecting && (
        <div className="connection-status">
          <div className="connection-indicator">
            <div className="connection-spinner"></div>
            <span>Reconnecting...</span>
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