import { useState, useEffect } from 'react';
import { cacheManager } from '../utils/cacheManager';
import './Weather.css';

const Weather = ({ refreshTrigger }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // You'll need to set your OpenWeatherMap API key here
  const API_KEY = 'YOUR_API_KEY'; // Replace with your actual API key
  const CITY = 'London'; // Default city, can be made configurable

  const fetchWeather = async () => {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${API_KEY}&units=metric`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process the data to get current weather and 3-day forecast
    const current = data.list[0];
    const forecast = data.list.filter((item, index) => index % 8 === 0).slice(0, 3); // Every 8th item (24 hours) for 3 days
    
    return {
      current: {
        temp: Math.round(current.main.temp),
        description: current.weather[0].description,
        icon: current.weather[0].icon,
        humidity: current.main.humidity,
        windSpeed: current.wind.speed
      },
      forecast: forecast.map(item => ({
        date: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        temp: Math.round(item.main.temp),
        description: item.weather[0].description,
        icon: item.weather[0].icon
      })),
      city: data.city.name,
      country: data.city.country
    };
  };

  useEffect(() => {
    const loadWeather = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if we have a valid API key
        if (API_KEY === 'YOUR_API_KEY') {
          // Use mock data if no API key is set
          const mockData = {
            current: {
              temp: 22,
              description: 'partly cloudy',
              icon: '02d',
              humidity: 65,
              windSpeed: 3.2
            },
            forecast: [
              { date: 'Thu', temp: 24, description: 'sunny', icon: '01d' },
              { date: 'Fri', temp: 19, description: 'rainy', icon: '09d' },
              { date: 'Sat', temp: 21, description: 'cloudy', icon: '03d' }
            ],
            city: 'London',
            country: 'GB'
          };
          cacheManager.set('weather', mockData);
          setWeather(mockData);
        } else {
          const weatherData = await cacheManager.fetchWithCache('weather', fetchWeather);
          setWeather(weatherData);
        }
      } catch (err) {
        setError('Unable to load weather data');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWeather();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="weather">
        <div className="weather-loading">Loading weather...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather">
        <div className="weather-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="weather">
      <h2 className="weather-title">Weather</h2>
      
      <div className="current-weather">
        <div className="current-temp">{weather.current.temp}°C</div>
        <div className="current-description">{weather.current.description}</div>
        <div className="current-location">{weather.city}, {weather.country}</div>
        <div className="weather-details">
          <span>Humidity: {weather.current.humidity}%</span>
          <span>Wind: {weather.current.windSpeed} m/s</span>
        </div>
      </div>
      
      <div className="forecast">
        <h3 className="forecast-title">3-Day Forecast</h3>
        <div className="forecast-items">
          {weather.forecast.map((day, index) => (
            <div key={index} className="forecast-item">
              <div className="forecast-day">{day.date}</div>
              <div className="forecast-temp">{day.temp}°C</div>
              <div className="forecast-desc">{day.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Weather;