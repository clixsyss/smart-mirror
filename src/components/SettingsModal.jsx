import { useState, useEffect } from 'react'
import './SettingsModal.css'

const SettingsModal = ({ onClose, state, actions, logout, onInteraction }) => {
  const settings = state.settings || {}
  const [locationInput, setLocationInput] = useState(settings.weatherLocation || 'New York, NY')
  
  // Update local state when settings change
  useEffect(() => {
    setLocationInput(settings.weatherLocation || 'New York, NY')
  }, [settings.weatherLocation])

  const handleSettingChange = (key, value) => {
    if (actions && actions.updateDisplaySetting) {
      actions.updateDisplaySetting(key, value)
    } else {
      console.error('updateDisplaySetting action not available')
    }
  }

  const handleLocationChange = (e) => {
    const newLocation = e.target.value
    setLocationInput(newLocation)
    // Automatically update when selection changes
    if (newLocation.trim() && actions && actions.updateWeatherLocation) {
      actions.updateWeatherLocation(newLocation.trim())
    }
  }

  const handleLogout = () => {
    logout()
    onClose()
  }

  return (
    <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
      <div className="settings-content" onMouseMove={onInteraction} onTouchStart={onInteraction}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-body">
          {/* Display Settings */}
          <div className="settings-section">
            <h3>Display Options</h3>
            <div className="settings-grid">
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={settings.showTime}
                  onChange={(e) => handleSettingChange('showTime', e.target.checked)}
                />
                <span>Show Clock</span>
              </label>
              
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={settings.showWeather}
                  onChange={(e) => handleSettingChange('showWeather', e.target.checked)}
                />
                <span>Show Weather</span>
              </label>
              
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={settings.showQuote}
                  onChange={(e) => handleSettingChange('showQuote', e.target.checked)}
                />
                <span>Show Daily Quote</span>
              </label>
              
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={settings.showNews}
                  onChange={(e) => handleSettingChange('showNews', e.target.checked)}
                />
                <span>Show News</span>
              </label>
            </div>
          </div>

          {/* Clock Settings */}
          <div className="settings-section">
            <h3>Clock Type</h3>
            <div className="radio-group">
              <label className="radio-item">
                <input
                  type="radio"
                  name="clockType"
                  value="digital"
                  checked={settings.clockType === 'digital' || !settings.clockType}
                  onChange={(e) => handleSettingChange('clockType', e.target.value)}
                />
                <span>Digital Clock</span>
              </label>
              
              <label className="radio-item">
                <input
                  type="radio"
                  name="clockType"
                  value="analog"
                  checked={settings.clockType === 'analog'}
                  onChange={(e) => handleSettingChange('clockType', e.target.value)}
                />
                <span>Analog Clock</span>
              </label>
            </div>
          </div>

          {/* Clock Format - Only show for digital clock */}
          {(settings.clockType === 'digital' || !settings.clockType) && (
            <div className="settings-section">
              <h3>Clock Format</h3>
              <div className="radio-group">
                <label className="radio-item">
                  <input
                    type="radio"
                    name="clockFormat"
                    value="24"
                    checked={settings.clockFormat === '24'}
                    onChange={(e) => actions.updateClockFormat(e.target.value)}
                  />
                  <span>24 Hour</span>
                </label>
                
                <label className="radio-item">
                  <input
                    type="radio"
                    name="clockFormat"
                    value="12"
                    checked={settings.clockFormat === '12'}
                    onChange={(e) => actions.updateClockFormat(e.target.value)}
                  />
                  <span>12 Hour (AM/PM)</span>
                </label>
              </div>
            </div>
          )}

          {/* Location Settings */}
          <div className="settings-section">
            <h3>Weather Location</h3>
            <div className="input-group">
              <select
                value={locationInput}
                onChange={handleLocationChange}
                className="location-select"
              >
                <option value="London, UK">London, UK</option>
                <option value="New York, NY">New York, NY</option>
                <option value="Cairo, Egypt">Cairo, Egypt</option>
                <option value="Dubai, UAE">Dubai, UAE</option>
                <option value="Paris, France">Paris, France</option>
                <option value="Tokyo, Japan">Tokyo, Japan</option>
                <option value="Sydney, Australia">Sydney, Australia</option>
                <option value="Toronto, Canada">Toronto, Canada</option>
                <option value="Berlin, Germany">Berlin, Germany</option>
                <option value="Mumbai, India">Mumbai, India</option>
                <option value="São Paulo, Brazil">São Paulo, Brazil</option>
                <option value="Moscow, Russia">Moscow, Russia</option>
                <option value="Bangkok, Thailand">Bangkok, Thailand</option>
                <option value="Singapore">Singapore</option>
                <option value="Hong Kong">Hong Kong</option>
                <option value="Seoul, South Korea">Seoul, South Korea</option>
                <option value="Mexico City, Mexico">Mexico City, Mexico</option>
                <option value="Istanbul, Turkey">Istanbul, Turkey</option>
                <option value="Lagos, Nigeria">Lagos, Nigeria</option>
                <option value="Buenos Aires, Argentina">Buenos Aires, Argentina</option>
              </select>
            </div>
          </div>

          {/* Logout */}
          <div className="settings-section">
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
