import { useState, useEffect } from 'react'
import './SettingsModal.css'

const SettingsModal = ({ onClose, state, actions, logout }) => {
  const [settings, setSettings] = useState({
    // Display settings
    showTime: true,
    showWeather: true,
    showQuote: true,
    showNews: true,
    showLights: true,
    showClimate: true,
    showAssistant: true,
    
    // Clock settings
    clockFormat: '24', // '12' or '24'
    
    // Location settings
    weatherLocation: 'New York, NY',
    
    // Device settings
    selectedDevices: {
      lights: [],
      climate: []
    }
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('smartMirrorSettings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('smartMirrorSettings', JSON.stringify(settings))
  }, [settings])

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleDeviceToggle = (category, deviceId) => {
    setSettings(prev => ({
      ...prev,
      selectedDevices: {
        ...prev.selectedDevices,
        [category]: prev.selectedDevices[category].includes(deviceId)
          ? prev.selectedDevices[category].filter(id => id !== deviceId)
          : [...prev.selectedDevices[category], deviceId]
      }
    }))
  }

  const handleLocationChange = (e) => {
    const newLocation = e.target.value
    setSettings(prev => ({
      ...prev,
      weatherLocation: newLocation
    }))
    
    // Update weather with new location
    if (actions.updateWeatherLocation) {
      actions.updateWeatherLocation(newLocation)
    }
  }

  const handleLogout = () => {
    logout()
    onClose()
  }

  // Get available devices from smart home data
  const availableLights = state.smartHome?.rooms?.flatMap(room => 
    room.devices?.filter(device => device.type === 'light') || []
  ) || []

  const availableClimate = state.smartHome?.rooms?.flatMap(room => 
    room.devices?.filter(device => device.type === 'climate') || []
  ) || []

  return (
    <div className="settings-modal">
      <div className="settings-content">
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
            <h3>Clock Format</h3>
            <div className="radio-group">
              <label className="radio-item">
                <input
                  type="radio"
                  name="clockFormat"
                  value="24"
                  checked={settings.clockFormat === '24'}
                  onChange={(e) => handleSettingChange('clockFormat', e.target.value)}
                />
                <span>24 Hour</span>
              </label>
              
              <label className="radio-item">
                <input
                  type="radio"
                  name="clockFormat"
                  value="12"
                  checked={settings.clockFormat === '12'}
                  onChange={(e) => handleSettingChange('clockFormat', e.target.value)}
                />
                <span>12 Hour (AM/PM)</span>
              </label>
            </div>
          </div>

          {/* Location Settings */}
          <div className="settings-section">
            <h3>Weather Location</h3>
            <div className="input-group">
              <input
                type="text"
                value={settings.weatherLocation}
                onChange={handleLocationChange}
                placeholder="Enter city, state or country"
                className="location-input"
              />
            </div>
          </div>

          {/* Device Selection */}
          <div className="settings-section">
            <h3>Smart Home Devices</h3>
            
            {/* Lights */}
            <div className="device-category">
              <h4>Lights</h4>
              <div className="device-list">
                {availableLights.map(device => (
                  <label key={device.id} className="device-item">
                    <input
                      type="checkbox"
                      checked={settings.selectedDevices.lights.includes(device.id)}
                      onChange={() => handleDeviceToggle('lights', device.id)}
                    />
                    <span>{device.name}</span>
                  </label>
                ))}
                {availableLights.length === 0 && (
                  <p className="no-devices">No lights found</p>
                )}
              </div>
            </div>

            {/* Climate */}
            <div className="device-category">
              <h4>Climate Control</h4>
              <div className="device-list">
                {availableClimate.map(device => (
                  <label key={device.id} className="device-item">
                    <input
                      type="checkbox"
                      checked={settings.selectedDevices.climate.includes(device.id)}
                      onChange={() => handleDeviceToggle('climate', device.id)}
                    />
                    <span>{device.name}</span>
                  </label>
                ))}
                {availableClimate.length === 0 && (
                  <p className="no-devices">No climate devices found</p>
                )}
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
