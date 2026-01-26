import { useState, useEffect, useMemo } from 'react'
import { prioritizeCountry } from '../utils/prioritizeCountry'
import './SettingsModal.css'

const SettingsModal = ({ onClose, state, actions, logout, onInteraction }) => {
  const settings = state.settings || {}
  const [locationInput, setLocationInput] = useState(settings.weatherLocation || 'New York, NY')
  const [timezone, setTimezone] = useState(settings.timezone || '')
  const [dstAdjustment, setDstAdjustment] = useState(settings.dstAdjustment || 'auto')
  const [voiceSettings, setVoiceSettings] = useState(() => {
    const saved = localStorage.getItem('voiceSettings')
    return saved ? JSON.parse(saved) : {
      voiceId: 'premium-alloy',
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      lang: 'en-US'
    }
  })

  // Comprehensive locations with cities and timezones - moved to top for availability
  const worldLocationsRaw = [
    // North America
    {
      country: 'United States',
      cities: [
        { name: 'New York, NY', timezone: 'America/New_York' },
        { name: 'Los Angeles, CA', timezone: 'America/Los_Angeles' },
        { name: 'Chicago, IL', timezone: 'America/Chicago' },
        { name: 'Houston, TX', timezone: 'America/Chicago' },
        { name: 'Miami, FL', timezone: 'America/New_York' },
        { name: 'Seattle, WA', timezone: 'America/Los_Angeles' },
        { name: 'Denver, CO', timezone: 'America/Denver' },
        { name: 'Phoenix, AZ', timezone: 'America/Phoenix' },
        { name: 'Las Vegas, NV', timezone: 'America/Los_Angeles' },
        { name: 'Boston, MA', timezone: 'America/New_York' }
      ]
    },
    {
      country: 'Canada',
      cities: [
        { name: 'Toronto, ON', timezone: 'America/Toronto' },
        { name: 'Vancouver, BC', timezone: 'America/Vancouver' },
        { name: 'Montreal, QC', timezone: 'America/Montreal' },
        { name: 'Calgary, AB', timezone: 'America/Edmonton' },
        { name: 'Ottawa, ON', timezone: 'America/Toronto' }
      ]
    },
    // Europe
    {
      country: 'United Kingdom',
      cities: [
        { name: 'London, England', timezone: 'Europe/London' },
        { name: 'Manchester, England', timezone: 'Europe/London' },
        { name: 'Edinburgh, Scotland', timezone: 'Europe/London' },
        { name: 'Birmingham, England', timezone: 'Europe/London' }
      ]
    },
    {
      country: 'Germany',
      cities: [
        { name: 'Berlin, Germany', timezone: 'Europe/Berlin' },
        { name: 'Munich, Germany', timezone: 'Europe/Berlin' },
        { name: 'Hamburg, Germany', timezone: 'Europe/Berlin' },
        { name: 'Frankfurt, Germany', timezone: 'Europe/Berlin' }
      ]
    },
    {
      country: 'France',
      cities: [
        { name: 'Paris, France', timezone: 'Europe/Paris' },
        { name: 'Lyon, France', timezone: 'Europe/Paris' },
        { name: 'Marseille, France', timezone: 'Europe/Paris' },
        { name: 'Nice, France', timezone: 'Europe/Paris' }
      ]
    },
    {
      country: 'Italy',
      cities: [
        { name: 'Rome, Italy', timezone: 'Europe/Rome' },
        { name: 'Milan, Italy', timezone: 'Europe/Rome' },
        { name: 'Naples, Italy', timezone: 'Europe/Rome' },
        { name: 'Venice, Italy', timezone: 'Europe/Rome' }
      ]
    },
    {
      country: 'Spain',
      cities: [
        { name: 'Madrid, Spain', timezone: 'Europe/Madrid' },
        { name: 'Barcelona, Spain', timezone: 'Europe/Madrid' },
        { name: 'Seville, Spain', timezone: 'Europe/Madrid' },
        { name: 'Valencia, Spain', timezone: 'Europe/Madrid' }
      ]
    },
    // Asia
    {
      country: 'Japan',
      cities: [
        { name: 'Tokyo, Japan', timezone: 'Asia/Tokyo' },
        { name: 'Osaka, Japan', timezone: 'Asia/Tokyo' },
        { name: 'Kyoto, Japan', timezone: 'Asia/Tokyo' },
        { name: 'Yokohama, Japan', timezone: 'Asia/Tokyo' }
      ]
    },
    {
      country: 'China',
      cities: [
        { name: 'Beijing, China', timezone: 'Asia/Shanghai' },
        { name: 'Shanghai, China', timezone: 'Asia/Shanghai' },
        { name: 'Guangzhou, China', timezone: 'Asia/Shanghai' },
        { name: 'Shenzhen, China', timezone: 'Asia/Shanghai' }
      ]
    },
    {
      country: 'India',
      cities: [
        { name: 'Mumbai, India', timezone: 'Asia/Kolkata' },
        { name: 'Delhi, India', timezone: 'Asia/Kolkata' },
        { name: 'Bangalore, India', timezone: 'Asia/Kolkata' },
        { name: 'Chennai, India', timezone: 'Asia/Kolkata' }
      ]
    },
    {
      country: 'South Korea',
      cities: [
        { name: 'Seoul, South Korea', timezone: 'Asia/Seoul' },
        { name: 'Busan, South Korea', timezone: 'Asia/Seoul' },
        { name: 'Incheon, South Korea', timezone: 'Asia/Seoul' }
      ]
    },
    // Arab Countries & Middle East
    {
      country: 'United Arab Emirates',
      cities: [
        { name: 'Dubai, UAE', timezone: 'Asia/Dubai' },
        { name: 'Abu Dhabi, UAE', timezone: 'Asia/Dubai' },
        { name: 'Sharjah, UAE', timezone: 'Asia/Dubai' },
        { name: 'Ajman, UAE', timezone: 'Asia/Dubai' }
      ]
    },
    {
      country: 'Saudi Arabia',
      cities: [
        { name: 'Riyadh, Saudi Arabia', timezone: 'Asia/Riyadh' },
        { name: 'Jeddah, Saudi Arabia', timezone: 'Asia/Riyadh' },
        { name: 'Mecca, Saudi Arabia', timezone: 'Asia/Riyadh' },
        { name: 'Medina, Saudi Arabia', timezone: 'Asia/Riyadh' },
        { name: 'Dammam, Saudi Arabia', timezone: 'Asia/Riyadh' },
        { name: 'Khobar, Saudi Arabia', timezone: 'Asia/Riyadh' }
      ]
    },
    {
      country: 'Egypt',
      cities: [
        { name: 'Cairo, Egypt', timezone: 'Africa/Cairo' },
        { name: 'Alexandria, Egypt', timezone: 'Africa/Cairo' },
        { name: 'Giza, Egypt', timezone: 'Africa/Cairo' },
        { name: 'Sharm El Sheikh, Egypt', timezone: 'Africa/Cairo' },
        { name: 'Hurghada, Egypt', timezone: 'Africa/Cairo' },
        { name: 'Luxor, Egypt', timezone: 'Africa/Cairo' }
      ]
    },
    {
      country: 'Qatar',
      cities: [
        { name: 'Doha, Qatar', timezone: 'Asia/Qatar' },
        { name: 'Al Rayyan, Qatar', timezone: 'Asia/Qatar' },
        { name: 'Al Wakrah, Qatar', timezone: 'Asia/Qatar' }
      ]
    },
    {
      country: 'Kuwait',
      cities: [
        { name: 'Kuwait City, Kuwait', timezone: 'Asia/Kuwait' },
        { name: 'Hawalli, Kuwait', timezone: 'Asia/Kuwait' },
        { name: 'Salmiya, Kuwait', timezone: 'Asia/Kuwait' }
      ]
    },
    {
      country: 'Bahrain',
      cities: [
        { name: 'Manama, Bahrain', timezone: 'Asia/Bahrain' },
        { name: 'Riffa, Bahrain', timezone: 'Asia/Bahrain' },
        { name: 'Muharraq, Bahrain', timezone: 'Asia/Bahrain' }
      ]
    },
    {
      country: 'Oman',
      cities: [
        { name: 'Muscat, Oman', timezone: 'Asia/Muscat' },
        { name: 'Salalah, Oman', timezone: 'Asia/Muscat' },
        { name: 'Nizwa, Oman', timezone: 'Asia/Muscat' }
      ]
    },
    {
      country: 'Jordan',
      cities: [
        { name: 'Amman, Jordan', timezone: 'Asia/Amman' },
        { name: 'Irbid, Jordan', timezone: 'Asia/Amman' },
        { name: 'Zarqa, Jordan', timezone: 'Asia/Amman' },
        { name: 'Aqaba, Jordan', timezone: 'Asia/Amman' }
      ]
    },
    {
      country: 'Lebanon',
      cities: [
        { name: 'Beirut, Lebanon', timezone: 'Asia/Beirut' },
        { name: 'Tripoli, Lebanon', timezone: 'Asia/Beirut' },
        { name: 'Sidon, Lebanon', timezone: 'Asia/Beirut' }
      ]
    },
    {
      country: 'Syria',
      cities: [
        { name: 'Damascus, Syria', timezone: 'Asia/Damascus' },
        { name: 'Aleppo, Syria', timezone: 'Asia/Damascus' },
        { name: 'Homs, Syria', timezone: 'Asia/Damascus' }
      ]
    },
    {
      country: 'Iraq',
      cities: [
        { name: 'Baghdad, Iraq', timezone: 'Asia/Baghdad' },
        { name: 'Basra, Iraq', timezone: 'Asia/Baghdad' },
        { name: 'Erbil, Iraq', timezone: 'Asia/Baghdad' },
        { name: 'Mosul, Iraq', timezone: 'Asia/Baghdad' }
      ]
    },
    {
      country: 'Morocco',
      cities: [
        { name: 'Casablanca, Morocco', timezone: 'Africa/Casablanca' },
        { name: 'Rabat, Morocco', timezone: 'Africa/Casablanca' },
        { name: 'Marrakech, Morocco', timezone: 'Africa/Casablanca' },
        { name: 'Fes, Morocco', timezone: 'Africa/Casablanca' }
      ]
    },
    {
      country: 'Tunisia',
      cities: [
        { name: 'Tunis, Tunisia', timezone: 'Africa/Tunis' },
        { name: 'Sfax, Tunisia', timezone: 'Africa/Tunis' },
        { name: 'Sousse, Tunisia', timezone: 'Africa/Tunis' }
      ]
    },
    {
      country: 'Algeria',
      cities: [
        { name: 'Algiers, Algeria', timezone: 'Africa/Algiers' },
        { name: 'Oran, Algeria', timezone: 'Africa/Algiers' },
        { name: 'Constantine, Algeria', timezone: 'Africa/Algiers' }
      ]
    },
    {
      country: 'Libya',
      cities: [
        { name: 'Tripoli, Libya', timezone: 'Africa/Tripoli' },
        { name: 'Benghazi, Libya', timezone: 'Africa/Tripoli' }
      ]
    },
    {
      country: 'Sudan',
      cities: [
        { name: 'Khartoum, Sudan', timezone: 'Africa/Khartoum' },
        { name: 'Omdurman, Sudan', timezone: 'Africa/Khartoum' }
      ]
    },
    {
      country: 'Yemen',
      cities: [
        { name: 'Sanaa, Yemen', timezone: 'Asia/Aden' },
        { name: 'Aden, Yemen', timezone: 'Asia/Aden' }
      ]
    },
    {
      country: 'Palestine',
      cities: [
        { name: 'Jerusalem, Palestine', timezone: 'Asia/Jerusalem' },
        { name: 'Gaza, Palestine', timezone: 'Asia/Gaza' },
        { name: 'Ramallah, Palestine', timezone: 'Asia/Jerusalem' }
      ]
    },
    {
      country: 'South Africa',
      cities: [
        { name: 'Cape Town, South Africa', timezone: 'Africa/Johannesburg' },
        { name: 'Johannesburg, South Africa', timezone: 'Africa/Johannesburg' }
      ]
    },
    // Oceania
    {
      country: 'Australia',
      cities: [
        { name: 'Sydney, Australia', timezone: 'Australia/Sydney' },
        { name: 'Melbourne, Australia', timezone: 'Australia/Melbourne' },
        { name: 'Brisbane, Australia', timezone: 'Australia/Brisbane' },
        { name: 'Perth, Australia', timezone: 'Australia/Perth' }
      ]
    },
    {
      country: 'New Zealand',
      cities: [
        { name: 'Auckland, New Zealand', timezone: 'Pacific/Auckland' },
        { name: 'Wellington, New Zealand', timezone: 'Pacific/Auckland' }
      ]
    },
    // South America
    {
      country: 'Brazil',
      cities: [
        { name: 'São Paulo, Brazil', timezone: 'America/Sao_Paulo' },
        { name: 'Rio de Janeiro, Brazil', timezone: 'America/Sao_Paulo' },
        { name: 'Brasília, Brazil', timezone: 'America/Sao_Paulo' }
      ]
    },
    {
      country: 'Argentina',
      cities: [
        { name: 'Buenos Aires, Argentina', timezone: 'America/Argentina/Buenos_Aires' }
      ]
    }
  ]

  // Prioritize Egypt first in the list
  const worldLocations = useMemo(() => {
    return prioritizeCountry(worldLocationsRaw, 'Egypt');
  }, []);
  
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

  const handleLocationUpdate = (newLocation, detectedTimezone = null) => {
    setLocationInput(newLocation)
    
    // Update both weather location and timezone together
    if (actions && actions.updateWeatherLocation) {
      actions.updateWeatherLocation(newLocation)
      
      // Use provided timezone or auto-detect
      const timezoneToUse = detectedTimezone || (actions.getTimezoneFromLocation ? actions.getTimezoneFromLocation(newLocation) : null)
      
      if (timezoneToUse) {
        setTimezone(timezoneToUse)
        handleSettingChange('timezone', timezoneToUse)
      }
    } else {
      console.error('updateWeatherLocation action not available')
    }
  }

  const handleLocationDropdownChange = (e) => {
    const selectedValue = e.target.value
    
    if (selectedValue) {
      // Find the selected city data
      for (const country of worldLocations) {
        const city = country.cities.find(c => c.name === selectedValue)
        if (city) {
          handleLocationUpdate(city.name, city.timezone)
          break
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
                  <optgroup label="Premium Voices (OpenAI)">
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

          {/* Custom Message Settings */}
          <div className="settings-section">
            <h3>Custom Message</h3>
            <div className="settings-grid">
              <label className="setting-item full-width">
                <input
                  type="checkbox"
                  checked={settings.useCustomMessage || false}
                  onChange={(e) => handleSettingChange('useCustomMessage', e.target.checked)}
                />
                <span>Show Custom Message Instead of Quote</span>
              </label>
            </div>
            
            {settings.useCustomMessage && (
              <div className="input-group">
                <textarea
                  value={settings.customMessage || ''}
                  onChange={(e) => handleSettingChange('customMessage', e.target.value)}
                  placeholder="Enter your custom message here..."
                  className="custom-message-input"
                  rows="3"
                  maxLength="200"
                />
                
                <div className="custom-message-controls">
                  <div className="location-hint">
                    {(settings.customMessage || '').length}/200 characters
                  </div>
                  <div className="custom-message-buttons">
                    <button
                      type="button"
                      onClick={() => handleSettingChange('customMessage', '')}
                      className="clear-message-btn"
                      disabled={!(settings.customMessage || '').trim()}
                    >
                      Clear Message
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSettingChange('useCustomMessage', false);
                        handleSettingChange('customMessage', '');
                      }}
                      className="disable-custom-message-btn"
                    >
                      Use Quotes Instead
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Unified Location Settings */}
          <div className="settings-section">
            <h3>Location & Time Zone</h3>
            <div className="input-group">
              <select
                value={locationInput}
                onChange={handleLocationDropdownChange}
                className="location-select"
              >
                <option value="">Select your location...</option>
                {worldLocations.map((country) => (
                  <optgroup key={country.country} label={country.country}>
                    {country.cities.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <div className="location-hint">
                Select your city to automatically set weather data and timezone
              </div>

              {locationInput && (
                <div className="current-location">
                  <strong>Current:</strong> {locationInput}
                  {timezone && <span className="timezone-info"> ({timezone})</span>}
                </div>
              )}
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