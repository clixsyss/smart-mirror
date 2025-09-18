import { useState, useEffect } from 'react'
import './SettingsModal.css'

const SettingsModal = ({ onClose, state, actions, logout, onInteraction }) => {
  const settings = state.settings || {}
  const [locationInput, setLocationInput] = useState(settings.weatherLocation || 'New York, NY')
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [timezone, setTimezone] = useState(settings.timezone || '')
  const [dstAdjustment, setDstAdjustment] = useState(settings.dstAdjustment || 'auto')
  const [voiceSettings, setVoiceSettings] = useState(() => {
    const saved = localStorage.getItem('voiceSettings')
    return saved ? JSON.parse(saved) : {
      voiceId: 'female-google-us',
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      lang: 'en-US'
    }
  })
  
  // Update local state when settings change
  useEffect(() => {
    setLocationInput(settings.weatherLocation || 'New York, NY')
    setTimezone(settings.timezone || '')
    setDstAdjustment(settings.dstAdjustment || 'auto')
  }, [settings.weatherLocation, settings.timezone, settings.dstAdjustment])

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
  }

  const handleTimezoneChange = (e) => {
    const newTimezone = e.target.value
    setTimezone(newTimezone)
    handleSettingChange('timezone', newTimezone)
  }

  const handleLocationUpdate = (newLocation) => {
    setLocationInput(newLocation)
    // Update both weather location and timezone together
    if (actions && actions.updateWeatherLocation) {
      actions.updateWeatherLocation(newLocation)
      
      // Also auto-detect and update timezone based on location
      if (actions.getTimezoneFromLocation) {
        const detectedTimezone = actions.getTimezoneFromLocation(newLocation)
        if (detectedTimezone) {
          setTimezone(detectedTimezone)
          handleSettingChange('timezone', detectedTimezone)
        }
      }
    }
  }

  const handleDstChange = (e) => {
    const newDst = e.target.value
    setDstAdjustment(newDst)
    handleSettingChange('dstAdjustment', newDst)
  }

  const updateWeatherLocation = () => {
    // Update when user clicks "Update" or presses Enter
    if (locationInput.trim()) {
      handleLocationUpdate(locationInput.trim())
    }
  }

  const handleLocationKeyPress = (e) => {
    if (e.key === 'Enter') {
      updateWeatherLocation()
    }
  }

  // Function to detect user's location using browser geolocation
  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsDetectingLocation(true)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Use reverse geocoding to get location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          
          if (!response.ok) {
            throw new Error('Reverse geocoding failed')
          }
          
          const data = await response.json()
          
          // Construct location string from address components
          const { city, town, village, state, country } = data.address
          const locationName = [city || town || village, state, country]
            .filter(Boolean)
            .join(', ')
          
          if (locationName) {
            // Use the new unified location update function
            handleLocationUpdate(locationName)
          } else {
            throw new Error('Could not determine location name')
          }
          
          // Try to get timezone from coordinates
          try {
            // Using a free timezone API
            const tzResponse = await fetch(
              `https://timeapi.io/api/TimeZone/coordinate?latitude=${latitude}&longitude=${longitude}`
            )
            
            if (tzResponse.ok) {
              const tzData = await tzResponse.json()
              if (tzData.timeZone) {
                setTimezone(tzData.timeZone)
                handleSettingChange('timezone', tzData.timeZone)
              }
            }
          } catch (tzError) {
            console.warn('Could not fetch timezone from coordinates:', tzError)
            // Fallback to location-based timezone detection
            const detectedTimezone = actions.getTimezoneFromLocation(locationName)
            setTimezone(detectedTimezone)
            handleSettingChange('timezone', detectedTimezone)
          }
        } catch (error) {
          console.error('Error getting location name:', error)
          // Fallback to coordinates
          const locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          handleLocationUpdate(locationName)
        } finally {
          setIsDetectingLocation(false)
        }
      },
      (error) => {
        console.error('Error getting location:', error)
        alert('Unable to retrieve your location. Please enter manually.')
        setIsDetectingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  const handleLogout = () => {
    logout()
    onClose()
  }

  // Handle voice settings changes
  const handleVoiceSettingChange = (key, value) => {
    const newSettings = { ...voiceSettings, [key]: value }
    setVoiceSettings(newSettings)
    localStorage.setItem('voiceSettings', JSON.stringify(newSettings))
  }

  // Common timezones list
  const commonTimezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET) - New York' },
    { value: 'America/Chicago', label: 'Central Time (CT) - Chicago' },
    { value: 'America/Denver', label: 'Mountain Time (MT) - Denver' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT) - Los Angeles' },
    { value: 'Europe/London', label: 'GMT/BST - London' },
    { value: 'Europe/Paris', label: 'CET/CEST - Paris' },
    { value: 'Asia/Tokyo', label: 'JST - Tokyo' },
    { value: 'Asia/Shanghai', label: 'CST - Shanghai' },
    { value: 'Australia/Sydney', label: 'AEST/AEDT - Sydney' },
    { value: 'UTC', label: 'UTC' }
  ]

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
              
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={settings.showClimate !== false}
                  onChange={(e) => handleSettingChange('showClimate', e.target.checked)}
                />
                <span>Show Climate Control</span>
              </label>
              
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={settings.showAssistant !== false}
                  onChange={(e) => handleSettingChange('showAssistant', e.target.checked)}
                />
                <span>Show Smart Assistant</span>
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

          {/* Clock Format - Show for both digital and analog clocks */}
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
            
            {/* Timezone Override */}
            <div className="timezone-override">
              <h4>Timezone Override (Optional)</h4>
              <select
                value={timezone}
                onChange={handleTimezoneChange}
                className="location-select"
              >
                <option value="">Auto-detect from location above</option>
                {commonTimezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <div className="location-hint">
                Leave blank to auto-detect timezone from your location
              </div>
            </div>
          </div>

          {/* Daylight Saving Time Settings */}
          <div className="settings-section">
            <h3>Daylight Saving Time</h3>
            <div className="radio-group">
              <label className="radio-item">
                <input
                  type="radio"
                  name="dstAdjustment"
                  value="auto"
                  checked={dstAdjustment === 'auto'}
                  onChange={handleDstChange}
                />
                <span>Auto Detect</span>
              </label>
              
              <label className="radio-item">
                <input
                  type="radio"
                  name="dstAdjustment"
                  value="summer"
                  checked={dstAdjustment === 'summer'}
                  onChange={handleDstChange}
                />
                <span>Summer Time (DST)</span>
              </label>
              
              <label className="radio-item">
                <input
                  type="radio"
                  name="dstAdjustment"
                  value="winter"
                  checked={dstAdjustment === 'winter'}
                  onChange={handleDstChange}
                />
                <span>Winter Time (Standard)</span>
              </label>
            </div>
            <div className="location-hint">
              Choose how daylight saving time should be handled
            </div>
          </div>

          {/* Date/Time Settings - Only show for analog clock */}
          {settings.clockType === 'analog' && (
            <div className="settings-section">
              <h3>Date/Time Display</h3>
              <div className="settings-grid">
                <label className="setting-item">
                  <input
                    type="checkbox"
                    checked={settings.showAnalogDate !== false} // Default to true
                    onChange={(e) => handleSettingChange('showAnalogDate', e.target.checked)}
                  />
                  <span>Show Date</span>
                </label>
                
                <label className="setting-item">
                  <input
                    type="checkbox"
                    checked={settings.showAnalogDigitalTime !== false} // Default to true
                    onChange={(e) => handleSettingChange('showAnalogDigitalTime', e.target.checked)}
                  />
                  <span>Show Digital Time</span>
                </label>
              </div>
            </div>
          )}

          {/* Voice Settings */}
          <div className="settings-section">
            <h3>Voice Assistant Settings</h3>
            <div className="settings-grid">
              <div className="setting-item full-width">
                <label>Voice:</label>
                <select
                  value={voiceSettings.voiceId}
                  onChange={(e) => handleVoiceSettingChange('voiceId', e.target.value)}
                  className="voice-select"
                >
                  <optgroup label="Female Voices">
                    <option value="female-google-us">Google US English Female</option>
                    <option value="female-microsoft-us">Microsoft US English Female</option>
                    <option value="female-siri">Siri (iOS)</option>
                    <option value="female-uk">British English Female</option>
                    <option value="female-australian">Australian English Female</option>
                    <option value="female-indian">Indian English Female</option>
                    <option value="female-canadian">Canadian English Female</option>
                  </optgroup>
                  <optgroup label="Male Voices">
                    <option value="male-google-us">Google US English Male</option>
                    <option value="male-microsoft-us">Microsoft US English Male</option>
                    <option value="male-siri">Siri Male (iOS)</option>
                    <option value="male-uk">British English Male</option>
                    <option value="male-australian">Australian English Male</option>
                    <option value="male-indian">Indian English Male</option>
                    <option value="male-canadian">Canadian English Male</option>
                  </optgroup>
                  <optgroup label="Neutral Voices">
                    <option value="neutral-google">Google Neutral</option>
                    <option value="neutral-compact">Compact Voice</option>
                    <option value="neutral-robot">Robot Voice</option>
                    <option value="neutral-echo">Echo Voice</option>
                  </optgroup>
                  <optgroup label="Premium Voices">
                    <option value="premium-alloy">Alloy - Balanced & Clear</option>
                    <option value="premium-echo">Echo - Warm & Human</option>
                    <option value="premium-fable">Fable - Expressive & Deep</option>
                    <option value="premium-onyx">Onyx - Deep & Smooth</option>
                    <option value="premium-nova">Nova - Warm & Clear</option>
                    <option value="premium-shimmer">Shimmer - Clear & Soft</option>
                  </optgroup>
                </select>
              </div>
              
              <div className="setting-item">
                <label>Speed: {voiceSettings.rate.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={voiceSettings.rate}
                  onChange={(e) => handleVoiceSettingChange('rate', parseFloat(e.target.value))}
                  className="slider"
                />
              </div>
              
              <div className="setting-item">
                <label>Pitch: {voiceSettings.pitch.toFixed(1)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={voiceSettings.pitch}
                  onChange={(e) => handleVoiceSettingChange('pitch', parseFloat(e.target.value))}
                  className="slider"
                />
              </div>
              
              <div className="setting-item">
                <label>Volume: {Math.round(voiceSettings.volume * 100)}%</label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={voiceSettings.volume}
                  onChange={(e) => handleVoiceSettingChange('volume', parseFloat(e.target.value))}
                  className="slider"
                />
              </div>
            </div>
          </div>

          {/* Unified Location Settings */}
          <div className="settings-section">
            <h3>Location & Time Zone</h3>
            <div className="input-group">
              <input
                type="text"
                value={locationInput}
                onChange={handleLocationChange}
                onKeyPress={handleLocationKeyPress}
                placeholder="Enter your city and country (e.g., London, UK)"
                className="location-input"
                disabled={isDetectingLocation}
              />
              <div className="location-buttons-row">
                <button 
                  className="update-location-btn" 
                  onClick={updateWeatherLocation}
                  disabled={isDetectingLocation}
                >
                  Update Location & Time
                </button>
                <button 
                  className="detect-location-btn" 
                  onClick={detectUserLocation}
                  disabled={isDetectingLocation}
                >
                  {isDetectingLocation ? 'Detecting...' : 'Detect My Location'}
                </button>
              </div>
              <div className="location-hint">
                This location is used for both weather data and timezone detection
              </div>
            </div>
            
            {/* Popular locations as quick select options */}
            <div className="quick-locations">
              <h4>Quick Select:</h4>
              <div className="location-buttons">
                {['London, UK', 'New York, NY', 'Paris, France', 'Tokyo, Japan', 'Sydney, Australia'].map((location) => (
                  <button
                    key={location}
                    className="location-btn"
                    onClick={() => handleLocationUpdate(location)}
                  >
                    {location}
                  </button>
                ))}
              </div>
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