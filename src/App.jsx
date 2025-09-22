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
import logoImage from './assets/logo.png'
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
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const RotateIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2v6h-6"/>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
    <path d="M3 22v-6h6"/>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
  </svg>
)

function SmartMirror() {
  const [activePanel, setActivePanel] = useState(null) // 'lights', 'climate', 'fans', 'assistant', or null
  const [showSettings, setShowSettings] = useState(false)
  const [showServices, setShowServices] = useState(false)
  const [modalTimeout, setModalTimeout] = useState(null)
  const [screenRotation, setScreenRotation] = useState(() => {
    // Load saved rotation from localStorage
    const saved = localStorage.getItem('screenRotation')
    return saved ? parseInt(saved) : 0
  }) // 0, 90, 180, 270 degrees
  const [isLocked, setIsLocked] = useState(false) // Lock feature state
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
      if (isLocked) return; // Prevent action if locked
      clearTimeout(hideTimeout)
      hideTimeout = setTimeout(() => {
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
  }, [isLocked]) // Add isLocked as dependency

  const clearModalTimeout = () => {
    if (modalTimeout) {
      clearTimeout(modalTimeout)
      setModalTimeout(null)
    }
  }

  const openPanel = (panel) => {
    if (isLocked) return; // Prevent action if locked
    setActivePanel(panel)
    // Removed automatic timeout - panel stays open until manually closed
  }

  const closePanel = () => {
    if (isLocked) return; // Prevent action if locked
    setActivePanel(null)
    clearModalTimeout()
  }

  const openSettings = () => {
    if (isLocked) return; // Prevent action if locked
    setShowSettings(true)
    // Removed automatic timeout - settings stay open until manually closed
  }

  const closeSettings = () => {
    if (isLocked) return; // Prevent action if locked
    setShowSettings(false)
    clearModalTimeout()
  }

  const openServices = () => {
    if (isLocked) return; // Prevent action if locked
    setShowServices(true)
  }

  const closeServices = () => {
    if (isLocked) return; // Prevent action if locked
    setShowServices(false)
  }

  const handleScreenRotation = () => {
    if (isLocked) return; // Prevent action if locked
    const nextRotation = (screenRotation + 180) % 360
    setScreenRotation(nextRotation)
    // Save rotation preference
    localStorage.setItem('screenRotation', nextRotation.toString())
  }

  // Toggle lock state
  const toggleLock = () => {
    setIsLocked(!isLocked);
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
      <div 
        className="smart-mirror" 
        style={{ 
          transform: `rotate(${screenRotation}deg)`,
          transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
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
          <div className="company-logo-section" onClick={openServices}>
            <div className="company-logo-container">
              <img 
                src={logoImage} 
                alt="Clixsys Logo" 
                className="company-logo"
              />
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
    <div 
      className={`smart-mirror ${isLocked ? 'locked' : ''}`} 
      style={{ 
        transform: `rotate(${screenRotation}deg)`,
        transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
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

        {/* Company Logo Section - Replaces Services Grid */}
        <div className="company-logo-section" onClick={openServices}>
          <div className="company-logo-container">
            <img 
              src={logoImage} 
              alt="Clixsys Logo" 
              className="company-logo"
            />
          </div>
        </div>

        {/* News Card */}
        {state.settings?.showNews !== false && (
          <div className="news-card">
            <NewsHeadlines data={state.news} />
          </div>
        )}
      </div>

      {/* Control Dock - Bottom */}
      {/*
      <div className={`control-dock ${showControls ? 'visible' : ''}`}>
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
      </div>
      */}

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
              <SmartAssistant data={state.assistant} actions={actions} userId={user?.uid} userProfile={userProfile} onOpenSettings={openSettings} />
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

      {/* Rotation Button - Bottom Left */}
      <button 
        className="rotate-btn"
        onClick={handleScreenRotation}
        title={`Rotate Screen (Currently ${screenRotation}°)`}
      >
        <RotateIcon />
      </button>

      {/* Lock Button - Next to Rotation Button */}
      <button 
        className={`lock-btn ${isLocked ? 'locked' : 'unlocked'}`}
        onClick={toggleLock}
        title={isLocked ? "Unlock Interface" : "Lock Interface"}
      >
        {isLocked ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            <path d="M12 11v4"/>
          </svg>
        )}
      </button>

      {/* Settings Button - Bottom Right */}
      <button 
        className="settings-btn"
        onClick={openSettings}
        title="Settings"
      >
        <SettingsIcon />
      </button>

      {/* Services Bottom Drawer */}
      {showServices && (
        <div className="services-modal-overlay" onClick={closeServices}>
          <div className="services-bottom-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="services-drawer-header">
              <div className="services-drawer-handle"></div>
              <h3>Smart Home Services</h3>
              <button className="services-close-btn" onClick={closeServices}>
                ✕
              </button>
            </div>
            <div className="services-drawer-grid">
              <div className="service-card" onClick={() => { openPanel('lights'); closeServices(); }}>
                <div className="service-icon">
                  <LightIcon />
                </div>
                <div className="service-title">Lights</div>
              </div>
              <div className="service-card" onClick={() => { openPanel('climate'); closeServices(); }}>
                <div className="service-icon">
                  <ClimateIcon />
                </div>
                <div className="service-title">Climate</div>
              </div>
              <div className="service-card" onClick={() => { openPanel('fans'); closeServices(); }}>
                <div className="service-icon">
                  <FanIcon />
                </div>
                <div className="service-title">Fans</div>
              </div>
              <div className="service-card" onClick={() => { openPanel('assistant'); closeServices(); }}>
                <div className="service-icon">
                  <AssistantIcon />
                </div>
                <div className="service-title">Assistant</div>
              </div>
              <div className="service-card" onClick={() => { openPanel('shutters'); closeServices(); }}>
                <div className="service-icon">
                  <ShuttersIcon />
                </div>
                <div className="service-title">Shutters</div>
              </div>
              <div className="service-card" onClick={() => { openPanel('curtains'); closeServices(); }}>
                <div className="service-icon">
                  <CurtainsIcon />
                </div>
                <div className="service-title">Curtains</div>
              </div>
            </div>
          </div>
        </div>
      )}

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