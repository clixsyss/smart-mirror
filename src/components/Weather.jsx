import './Weather.css';

const Weather = ({ data }) => {
  const { current, loading, error } = data || {};

  if (loading) {
    return (
      <div className="weather">
        <div className="weather-loading">Loading weather...</div>
      </div>
    );
  }

  if (error || !current) {
    return (
      <div className="weather">
        <div className="weather-error">Weather unavailable</div>
      </div>
    );
  }

  return (
    <div className="weather">
      <div className="current-weather">
        <div className="weather-icon">🌤️</div>
        <div className="current-temp">{current.temperature}°C</div>
        <div className="current-description">{current.description}</div>
        <div className="current-location">{current.location}</div>
      </div>
    </div>
  );
};

export default Weather;