import { useState, useEffect } from 'react';
import { useGlobalStore } from '../hooks/useGlobalStore';
import './Weather.css';

// Weather Icon Component
const WeatherIcon = ({ icon }) => {
  const getWeatherIcon = (iconCode) => {
    switch (iconCode) {
      case '01d':
      case '01n':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        );
      case '02d':
      case '02n':
      case '03d':
      case '03n':
      case '04d':
      case '04n':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
          </svg>
        );
      case '09d':
      case '09n':
      case '10d':
      case '10n':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="16" y1="13" x2="16" y2="21"/>
            <line x1="8" y1="13" x2="8" y2="21"/>
            <line x1="12" y1="15" x2="12" y2="23"/>
            <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
          </svg>
        );
      case '11d':
      case '11n':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
            <polyline points="8,16 12,12 16,16"/>
            <polyline points="12,12 12,21"/>
          </svg>
        );
      case '13d':
      case '13n':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
            <path d="M8 14l4 4 4-4"/>
          </svg>
        );
      case '50d':
      case '50n':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
            <path d="M8 14l4 4 4-4"/>
          </svg>
        );
      default:
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        );
    }
  };

  return getWeatherIcon(icon);
};

const Weather = ({ data }) => {
  const { current, loading, error } = data || {};
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const { actions } = useGlobalStore();

  // Format last updated time
  useEffect(() => {
    if (current?.timestamp) {
      const updated = new Date(current.timestamp);
      setLastUpdated(updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      
      // Show updating animation briefly
      setIsUpdating(true);
      const timer = setTimeout(() => setIsUpdating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [current?.timestamp]);

  const handleRetry = async () => {
    // Use the global store refresh method to retry fetching weather data
    try {
      await actions.refreshWeather();
    } catch (err) {
      console.error('Failed to refresh weather:', err);
    }
  };

  if (loading) {
    return (
      <div className="weather">
        <div className="weather-loading">Loading weather data...</div>
      </div>
    );
  }

  if (error && !current) {
    return (
      <div className="weather">
        <div className="weather-error">
          Weather data unavailable
          <div className="error-details">{error}</div>
          <button className="retry-button" onClick={handleRetry}>Retry</button>
        </div>
      </div>
    );
  }

  // Calculate feels like temperature with fallback
  const feelsLike = current?.feelsLike || Math.round((current?.temperature || 0) * 0.9);
  
  // Get wind direction from degrees
  const getWindDirection = (degrees) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 22.5) % 16;
    return directions[index];
  };

  return (
    <div className={`weather ${isUpdating ? 'weather-updating' : ''}`}>
      <div className="current-weather">
        <div className="weather-icon">
          <WeatherIcon icon={current?.icon || '01d'} />
        </div>
        <div className="current-temp">
          {current?.temperature ? `${Math.round(current.temperature)}°C` : '--°C'}
        </div>
        <div className="current-description">
          {current?.description || 'No data'}
        </div>
        <div className="current-location">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          {current?.location || 'Location not set'}
        </div>
        
        {current && (
          <div className="weather-details">
            <div className="weather-detail">
              <span className="detail-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
                </svg>
                Feels Like
              </span>
              <span className="detail-value">{feelsLike}°C</span>
            </div>
            <div className="weather-detail">
              <span className="detail-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                </svg>
                Humidity
              </span>
              <span className="detail-value">{current.humidity}%</span>
            </div>
          </div>
        )}
        
        {lastUpdated && (
          <div className="last-updated">
            Updated: {lastUpdated}
          </div>
        )}
      </div>
    </div>
  );
};

// Default props for the Weather component
Weather.defaultProps = {
  data: {
    current: null,
    loading: false,
    error: false
  }
};

export default Weather;