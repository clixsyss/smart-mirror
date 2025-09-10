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
import SettingsModal from './components/SettingsModal'
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
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

function SmartMirror() {
  const [activePanel, setActivePanel] = useState(null) // 'lights', 'climate', 'assistant', 'settings', or null
  const [showControls, setShowControls] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [modalTimeout, setModalTimeout] = useState(null)
  const { user, userProfile, loading, logout } = useAuth()
  const { state, actions } = useGlobalStore()

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
        setActivePanel(null)
      }, 10000) // Hide after 10 seconds
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

  const startModalTimeout = () => {
    // Clear existing timeout
    if (modalTimeout) {
      clearTimeout(modalTimeout)
    }
    
    // Set new timeout for 45 seconds
    const timeout = setTimeout(() => {
      closePanel()
      closeSettings()
    }, 45000)
    
    setModalTimeout(timeout)
  }

  const clearModalTimeout = () => {
    if (modalTimeout) {
      clearTimeout(modalTimeout)
      setModalTimeout(null)
    }
  }

  const openPanel = (panel) => {
    setActivePanel(panel)
    setShowControls(true)
    startModalTimeout()
  }

  const closePanel = () => {
    setActivePanel(null)
    clearModalTimeout()
  }

  const openSettings = () => {
    setShowSettings(true)
    setShowControls(true)
    startModalTimeout()
  }

  const closeSettings = () => {
    setShowSettings(false)
    clearModalTimeout()
  }

  const handleModalInteraction = () => {
    // Reset the timeout when user interacts with modal
    if (activePanel || showSettings) {
      startModalTimeout()
    }
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
            <QuoteOfDay data={state.quote} />
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
          <div className="card time-card">
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
            <QuoteOfDay data={state.quote} />
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

          {/* AI Assistant Service Card */}
          {state.settings?.showAssistant !== false && (
            <div className="service-card" onClick={() => openPanel('assistant')}>
              <div className="service-icon">
                <AssistantIcon />
              </div>
              <div className="service-title">Assistant</div>
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

      {activePanel === 'assistant' && (
        <div className="modal-overlay" onClick={closePanel}>
          <div className="control-modal assistant-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">
                <AssistantIcon />
              </div>
              <div className="modal-title">
                <h2>AI Assistant</h2>
                <p>Chat with your smart assistant</p>
              </div>
              <button className="modal-close-btn" onClick={closePanel}>×</button>
            </div>
            <div className="modal-content" onMouseMove={handleModalInteraction} onTouchStart={handleModalInteraction}>
              <ChatGPTAssistant data={state.assistant} actions={actions} />
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