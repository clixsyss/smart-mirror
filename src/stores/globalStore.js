import { roomsStore } from './roomsStore';
import { cacheManager } from '../utils/cacheManager';

class GlobalStore {
  constructor() {
    this.currentUserId = null;
    this.state = {
      // Weather data
      weather: {
        current: null,
        loading: false,
        error: null,
        lastUpdated: null
      },
      
      // News data
      news: {
        headlines: [],
        loading: false,
        error: null,
        lastUpdated: null
      },
      
      // Quote data
      quote: {
        content: null,
        author: null,
        loading: false,
        error: null,
        lastUpdated: null
      },
      
      // Smart home data
      smartHome: {
        rooms: [],
        devices: [],
        loading: false,
        error: null,
        lastUpdated: null
      },
      
      // AI Assistant data
      assistant: {
        messages: [],
        isTyping: false,
        isRecording: false,
        loading: false,
        error: null,
        context: {
          recentCommands: [],
          lastDevice: null
        }
      },
      
      // App state
      app: {
        isInitialized: false,
        lastRefresh: Date.now(),
        refreshInterval: null
      },
      
      // Settings
      settings: {
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
        
        // Custom message settings
        useCustomMessage: false,
        customMessage: '',
        
        // Device settings
        selectedDevices: {
          lights: [],
          climate: []
        }
      }
    };
    
    this.subscribers = [];
    this.refreshIntervals = new Map();
  }

  // Subscribe to state changes
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify all subscribers
  notify() {
    this.subscribers.forEach(callback => callback(this.state));
  }

  // Update state and notify subscribers
  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  // Update specific section
  updateSection(section, updates) {
    this.setState({
      [section]: { ...this.state[section], ...updates }
    });
  }

  // Weather methods
  async fetchWeather() {
    this.updateSection('weather', { loading: true, error: null });
    
    try {
      // Get location from settings
      const location = this.state.settings?.weatherLocation || 'New York, NY';
      console.log('🌤️ Fetching weather for location:', location);

      const weatherData = await cacheManager.fetchWithCache(`weather-${location}`, async () => {
        // Using Open-Meteo (completely free, no API key needed)
        // First, we need to get coordinates for the location
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
        
        const geocodeResponse = await fetch(geocodeUrl);
        if (!geocodeResponse.ok) {
          throw new Error(`Geocoding failed: ${geocodeResponse.status}`);
        }
        
        const geocodeData = await geocodeResponse.json();
        if (!geocodeData || geocodeData.length === 0) {
          throw new Error(`Location not found: ${location}`);
        }
        
        const { lat, lon } = geocodeData[0];
        
        // Now fetch weather data from Open-Meteo with hourly data to get humidity
        // We'll use the current hour's data for humidity
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature&temperature_unit=celsius&windspeed_unit=kmh&precipitation_unit=mm`;
        
        const response = await fetch(weatherUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Weather API error:', response.status, errorText);
          throw new Error(`Weather API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        // Get current hour humidity and feels like temperature
        const currentHour = new Date().getHours();
        console.log('Current hour:', currentHour);
        console.log('Hourly humidity data:', data.hourly?.relativehumidity_2m);
        console.log('Hourly feels like data:', data.hourly?.apparent_temperature);
        
        const humidity = data.hourly?.relativehumidity_2m?.[currentHour];
        const feelsLike = data.hourly?.apparent_temperature?.[currentHour];
        
        console.log('Extracted humidity:', humidity);
        console.log('Extracted feels like:', feelsLike);
        
        // Map Open-Meteo response to our expected format
        return {
          temperature: Math.round(data.current_weather.temperature),
          description: this.getWeatherDescription(data.current_weather.weathercode),
          location: location,
          icon: this.getWeatherIconCode(data.current_weather.weathercode),
          humidity: humidity !== undefined && humidity !== null ? Math.round(humidity) : null,
          windSpeed: data.current_weather.windspeed,
          windDeg: data.current_weather.winddirection,
          feelsLike: feelsLike !== undefined && feelsLike !== null ? Math.round(feelsLike) : null
        };
      }, 15 * 60 * 1000); // 15 minutes cache
      
      // If we got data (either fresh or cached), use it
      if (weatherData) {
        this.updateSection('weather', {
          current: weatherData,
          loading: false,
          lastUpdated: Date.now()
        });
      } else {
        // No data available at all, use fallback
        console.warn('No weather data available, using fallback');
        this.updateSection('weather', {
          current: {
            temperature: 22,
            description: 'partly cloudy',
            location: location,
            icon: '02d',
            humidity: 65,
            windSpeed: 12,
            feelsLike: 23
          },
          loading: false,
          error: 'No weather data available',
          lastUpdated: Date.now()
        });
      }
    } catch (error) {
      console.error('❌ Weather fetch error:', error);
      
      // Use fallback data with the actual location
      const location = this.state.settings?.weatherLocation || 'New York, NY';
      this.updateSection('weather', {
        current: {
          temperature: 22,
          description: 'partly cloudy',
          location: location,
          icon: '02d',
          humidity: 65,
          windSpeed: 12,
          feelsLike: 23
        },
        loading: false,
        error: error.message,
        lastUpdated: Date.now()
      });
    }
  }

  // Helper method to convert Open-Meteo weather codes to descriptions
  getWeatherDescription(weatherCode) {
    const weatherDescriptions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    
    return weatherDescriptions[weatherCode] || 'Unknown';
  }

  // Helper method to convert Open-Meteo weather codes to icon codes
  getWeatherIconCode(weatherCode) {
    // Mapping to OpenWeatherMap icon codes used in the UI
    if (weatherCode === 0) return '01d'; // Clear sky
    if (weatherCode === 1) return '01d'; // Mainly clear
    if (weatherCode === 2) return '02d'; // Partly cloudy
    if (weatherCode === 3) return '04d'; // Overcast
    if ([45, 48].includes(weatherCode)) return '50d'; // Fog
    if ([51, 53, 55, 56, 57].includes(weatherCode)) return '09d'; // Drizzle
    if ([61, 63, 65, 66, 67].includes(weatherCode)) return '10d'; // Rain
    if ([71, 73, 75, 77].includes(weatherCode)) return '13d'; // Snow
    if ([80, 81, 82].includes(weatherCode)) return '09d'; // Rain showers
    if ([85, 86].includes(weatherCode)) return '13d'; // Snow showers
    if ([95, 96, 99].includes(weatherCode)) return '11d'; // Thunderstorm
    return '01d'; // Default
  }

  // News methods
  async fetchNews() {
    this.updateSection('news', { loading: true, error: null });
    
    try {
      const newsData = await cacheManager.fetchWithCache('news', async () => {
        // Try multiple news sources for better reliability
        const newsSources = [
          'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/rss.xml',
          'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.reuters.com/reuters/topNews',
          'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.npr.org/1001/rss.xml'
        ];
        
        for (const source of newsSources) {
          try {
            const response = await fetch(source);
            if (response.ok) {
              const data = await response.json();
              if (data.status === 'ok' && data.items && data.items.length > 0) {
                return data.items.slice(0, 10).map(item => ({
                  title: item.title,
                  description: item.description?.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
                  pubDate: new Date(item.pubDate).toLocaleDateString(),
                  link: item.link
                }));
              }
            }
          } catch (err) {
            console.warn('News source failed:', source, err);
            continue;
          }
        }
        
        throw new Error('All news sources failed');
      });
      
      this.updateSection('news', {
        headlines: newsData,
        loading: false,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('News fetch error:', error);
      // Fallback to mock data
      const mockNews = [
        { title: "Smart home technology advances", description: "Latest developments in IoT and automation...", pubDate: new Date().toLocaleDateString() },
        { title: "Weather patterns changing globally", description: "Climate scientists report new trends...", pubDate: new Date().toLocaleDateString() },
        { title: "Renewable energy innovations", description: "Solar and wind technology breakthroughs...", pubDate: new Date().toLocaleDateString() },
        { title: "Healthcare digital transformation", description: "Medical institutions adopt new technologies...", pubDate: new Date().toLocaleDateString() },
        { title: "Space exploration achievements", description: "Recent discoveries from space missions...", pubDate: new Date().toLocaleDateString() }
      ];
      
      this.updateSection('news', {
        headlines: mockNews,
        loading: false,
        lastUpdated: Date.now()
      });
    }
  }

  // Quote methods
  async fetchQuote() {
    this.updateSection('quote', { loading: true, error: null });
    
    try {
      const quoteData = await cacheManager.fetchWithCache('quote', async () => {
        const response = await fetch('https://api.quotable.io/random?minLength=50&maxLength=150');
        
        if (!response.ok) {
          throw new Error(`Quote API error: ${response.status}`);
        }
        
        const data = await response.json();
        return {
          content: data.content,
          author: data.author,
          tags: data.tags
        };
      });
      
      // Check if quoteData is valid before using it
      if (quoteData && quoteData.content && quoteData.author) {
        this.updateSection('quote', {
          content: quoteData.content,
          author: quoteData.author,
          loading: false,
          lastUpdated: Date.now()
        });
      } else {
        throw new Error('Invalid quote data received');
      }
    } catch (error) {
      console.error('Quote fetch error:', error);
      // Fallback to inspirational quotes
      const fallbackQuotes = [
        { content: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
        { content: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
        { content: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { content: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { content: "Technology is nothing. What's important is that you have a faith in people, that they're basically good and smart.", author: "Steve Jobs" },
        { content: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
        { content: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" }
      ];
      
      const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      this.updateSection('quote', {
        content: randomQuote.content,
        author: randomQuote.author,
        loading: false,
        lastUpdated: Date.now()
      });
    }
  }

  // Smart home methods
  async fetchSmartHomeData(userId) {
    this.updateSection('smartHome', { loading: true, error: null });
    
    try {
      // Check if Firebase is properly configured
      if (!userId || userId === 'default') {
        console.warn('Invalid userId provided to fetchSmartHomeData:', userId);
        throw new Error('Valid User ID not provided');
      }

      console.log('Fetching smart home data for user:', userId);
      await roomsStore.fetchRooms(userId);
      const rooms = [...roomsStore.rooms];
      // const devices = rooms.flatMap(room => room.devices || []);
      
      // Ensure rooms have proper IDs
      const validRooms = rooms.filter(room => room.id);
      const validDevices = validRooms.flatMap(room => room.devices || []);
      
      this.updateSection('smartHome', {
        rooms: validRooms,
        devices: validDevices,
        loading: false,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Smart home fetch error:', error);
      // Provide fallback data for testing
      const fallbackRooms = [
        {
          id: 'living-room',
          name: 'Living Room',
          devices: [
            { id: 'light-1', name: 'Main Light', type: 'light', state: true, brightness: 80 },
            { id: 'light-2', name: 'Lamp', type: 'light', state: false, brightness: 0 },
            { id: 'ac-1', name: 'Living Room AC', type: 'air_conditioner', state: false, temperature: 24, mode: 'cool', modes: ['cool', 'heat', 'auto', 'fan'] },
            { id: 'fan-1', name: 'Ceiling Fan', type: 'fan', state: true, speed: 2, maxSpeed: 5 }
          ]
        },
        {
          id: 'bedroom',
          name: 'Bedroom',
          devices: [
            { id: 'light-3', name: 'Bedside Light', type: 'light', state: true, brightness: 60 },
            { id: 'thermostat-1', name: 'Thermostat', type: 'thermostat', state: true, temperature: 22, mode: 'heat', modes: ['heat', 'cool', 'auto'] },
            { id: 'ac-2', name: 'Bedroom AC', type: 'air_conditioner', state: true, temperature: 20, mode: 'cool', modes: ['cool', 'heat', 'auto', 'fan'] }
          ]
        },
        {
          id: 'kitchen',
          name: 'Kitchen',
          devices: [
            { id: 'light-4', name: 'Kitchen Light', type: 'light', state: false, brightness: 70 },
            { id: 'ac-3', name: 'Kitchen AC', type: 'air_conditioner', state: false, temperature: 25, mode: 'auto', modes: ['cool', 'heat', 'auto', 'fan'] },
            { id: 'fan-2', name: 'Exhaust Fan', type: 'fan', state: false, speed: 1, maxSpeed: 3 }
          ]
        }
      ];
      
      this.updateSection('smartHome', {
        rooms: fallbackRooms,
        devices: fallbackRooms.flatMap(room => room.devices || []),
        loading: false,
        lastUpdated: Date.now()
      });
    }
  }

  // Set up real-time listener for smart home data
  setupRealtimeListener() {
    if (!roomsStore || !roomsStore.subscribe) {
      console.log('❌ RoomsStore or subscribe method not available');
      return;
    }
    
    console.log('✅ Setting up real-time listener for smart home data');
    
    // Subscribe to roomsStore changes
    this.realtimeUnsubscribe = roomsStore.subscribe((rooms) => {
      // Ensure rooms have proper IDs
      const validRooms = rooms.filter(room => room.id);
      const devices = validRooms.flatMap(room => room.devices || []);
      
      this.updateSection('smartHome', {
        rooms: validRooms,
        devices: devices,
        loading: false,
        error: null,
        lastUpdated: Date.now()
      });
    });
  }

  // Reset all data when user logs out
  reset() {
    // Stop all background refresh intervals
    this.stopBackgroundRefresh();
    
    // Clean up real-time listener
    if (this.realtimeUnsubscribe) {
      this.realtimeUnsubscribe();
      this.realtimeUnsubscribe = null;
    }
    
    // Clear cache
    cacheManager.clearAll();
    
    // Clear all localStorage data
    localStorage.removeItem('smartMirrorSettings');
    
    // Clear any other user-related localStorage items
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('smartMirror') || key.includes('user') || key.includes('auth'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Cleanup Firebase listeners and clear roomsStore data
    if (roomsStore) {
      if (roomsStore.cleanup) {
        roomsStore.cleanup();
      }
      // Clear roomsStore data
      roomsStore.rooms = [];
      roomsStore.listeners = [];
      roomsStore.uiListeners = [];
    }
    
    // Reset state to initial values
    this.setState({
      weather: {
        current: null,
        loading: false,
        error: null,
        lastUpdated: null
      },
      news: {
        headlines: [],
        loading: false,
        error: null,
        lastUpdated: null
      },
      quote: {
        content: null,
        author: null,
        loading: false,
        error: null,
        lastUpdated: null
      },
      smartHome: {
        rooms: [],
        devices: [],
        loading: false,
        error: null,
        lastUpdated: null
      },
      assistant: {
        messages: [],
        loading: false,
        error: null,
        lastUpdated: null,
        context: {
          recentCommands: [],
          lastDevice: null
        }
      },
      settings: {
        showTime: true,
        showWeather: true,
        showQuote: true,
        showNews: true,
        showLights: true,
        showClimate: true,
        showAssistant: true,
        clockFormat: '12',
        weatherLocation: 'New York, NY',
        selectedDevices: {
          lights: [],
          climate: []
        }
      },
      app: {
        isInitialized: false,
        loading: false,
        error: null
      }
    });
    
  }

  // Initialize all data
  async initialize(userId) {
    if (this.state.app.isInitialized) return;
    
    // Store the current user ID
    this.currentUserId = userId;
    
    // Ensure we start with clean state
    if (this.state.smartHome.rooms.length > 0) {
      this.state.smartHome.rooms = [];
      this.state.smartHome.devices = [];
    }
    
    // Load settings first
    this.loadSettings();
    
    // Set initialized immediately to prevent loading screen issues
    this.setState({ app: { ...this.state.app, isInitialized: true } });
    
    // Start all data fetching in parallel with timeout
    const promises = [
      this.fetchWeatherWithTimeout(),
      this.fetchNewsWithTimeout(),
      this.fetchQuoteWithTimeout(),
      this.fetchSmartHomeDataWithTimeout(userId)
    ];
    
    try {
      await Promise.allSettled(promises);
      
      // Set up real-time listener for smart home data
      this.setupRealtimeListener(userId);
      
      this.startBackgroundRefresh();
    } catch (error) {
      console.error('❌ Global store initialization failed:', error);
    }
  }

  // Add timeout wrappers for each fetch method
  async fetchWeatherWithTimeout() {
    return Promise.race([
      this.fetchWeather(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Weather fetch timeout')), 5000)
      )
    ]).catch(error => {
      console.warn('Weather fetch failed, using fallback:', error);
      this.updateSection('weather', {
        current: {
          temperature: 22,
          description: 'partly cloudy',
          location: 'London',
          icon: '02d'
        },
        loading: false,
        lastUpdated: Date.now()
      });
    });
  }

  async fetchNewsWithTimeout() {
    return Promise.race([
      this.fetchNews(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('News fetch timeout')), 5000)
      )
    ]).catch(error => {
      console.warn('News fetch failed, using fallback:', error);
      const fallbackNews = [
        { title: "Smart home technology advances", description: "Latest developments...", pubDate: new Date().toLocaleDateString() },
        { title: "Weather patterns changing", description: "Climate updates...", pubDate: new Date().toLocaleDateString() },
        { title: "Innovation in renewable energy", description: "Green technology...", pubDate: new Date().toLocaleDateString() }
      ];
      this.updateSection('news', {
        headlines: fallbackNews,
        loading: false,
        lastUpdated: Date.now()
      });
    });
  }

  async fetchQuoteWithTimeout() {
    return Promise.race([
      this.fetchQuote(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Quote fetch timeout')), 3000)
      )
    ]).catch(error => {
      console.warn('Quote fetch failed, using fallback:', error);
      this.updateSection('quote', {
        content: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt",
        loading: false,
        lastUpdated: Date.now()
      });
    });
  }

  async fetchSmartHomeDataWithTimeout(userId) {
    return Promise.race([
      this.fetchSmartHomeData(userId),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Smart home fetch timeout')), 3000)
      )
    ]).catch(error => {
      console.warn('Smart home fetch failed, using fallback:', error);
      this.updateSection('smartHome', {
        rooms: [],
        devices: [],
        loading: false,
        lastUpdated: Date.now()
      });
    });
  }

  // Start background refresh
  startBackgroundRefresh() {
    // Weather: every 5 minutes
    this.refreshIntervals.set('weather', setInterval(() => {
      this.fetchWeather();
    }, 5 * 60 * 1000));
    
    // News: every 5 minutes
    this.refreshIntervals.set('news', setInterval(() => {
      this.fetchNews();
    }, 5 * 60 * 1000));
    
    // Quote: every hour
    this.refreshIntervals.set('quote', setInterval(() => {
      this.fetchQuote();
    }, 60 * 60 * 1000));
    
    // Smart home: every 30 seconds
    this.refreshIntervals.set('smartHome', setInterval(() => {
      if (this.state.smartHome.rooms.length > 0 && this.currentUserId) {
        this.fetchSmartHomeData(this.currentUserId);
      }
    }, 30 * 1000));
  }

  // Stop background refresh
  stopBackgroundRefresh() {
    this.refreshIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.refreshIntervals.clear();
  }

  // Manual refresh
  async refreshAll(userId) {
    this.setState({ app: { ...this.state.app, lastRefresh: Date.now() } });
    
    const promises = [
      this.fetchWeather(),
      this.fetchNews(),
      this.fetchQuote(),
      this.fetchSmartHomeData(userId)
    ];
    
    await Promise.allSettled(promises);
  }

  // Manual weather refresh
  async refreshWeather() {
    // Clear weather cache to force fresh fetch
    const location = this.state.settings?.weatherLocation || 'New York, NY';
    cacheManager.clear(`weather-${location}`);
    
    // Fetch fresh weather data
    await this.fetchWeather();
  }

  // AI Assistant methods
  addMessage(message) {
    this.updateSection('assistant', {
      messages: [...this.state.assistant.messages, message]
    });
  }

  setTyping(isTyping) {
    this.updateSection('assistant', { isTyping });
  }

  setRecording(isRecording) {
    this.updateSection('assistant', { isRecording });
  }

  clearMessages() {
    // Clear messages but preserve context for natural conversation
    this.updateSection('assistant', { 
      messages: [],
      context: this.state.assistant.context // Preserve context
    });
  }

  // Settings methods
  updateSettings(updates) {
    const newSettings = {
      ...this.state.settings,
      ...updates
    };
    
    this.updateSection('settings', newSettings);
    
    // Save to localStorage
    localStorage.setItem('smartMirrorSettings', JSON.stringify(newSettings));
  }

  loadSettings() {
    const savedSettings = localStorage.getItem('smartMirrorSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        this.updateSection('settings', parsed);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }

  updateWeatherLocation(location) {
    this.updateSettings({ weatherLocation: location });
    // Clear all weather cache to force refresh with new location
    cacheManager.clear('weather');
    // Also clear any location-specific cache
    const oldLocation = this.state.settings?.weatherLocation || 'New York, NY';
    cacheManager.clear(`weather-${oldLocation}`);
    // Trigger weather refresh with new location
    this.fetchWeather();
    
    // Auto-detect timezone when location changes
    if (!this.state.settings?.timezone) {
      const detectedTimezone = this.getTimezoneFromLocation(location);
      this.updateSettings({ timezone: detectedTimezone });
    }
  }

  // Test weather API directly (for debugging)
  async testWeatherAPI(location = 'New York, NY') {
    try {
      // Test with Open-Meteo (completely free)
      console.log('🧪 Testing Open-Meteo API for location:', location);
      
      // First, we need to get coordinates for the location
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
      
      const geocodeResponse = await fetch(geocodeUrl);
      if (!geocodeResponse.ok) {
        const errorText = await geocodeResponse.text();
        console.error('🧪 Geocoding error:', errorText);
        return { error: `Geocoding error: ${geocodeResponse.status} - ${errorText}` };
      }
      
      const geocodeData = await geocodeResponse.json();
      if (!geocodeData || geocodeData.length === 0) {
        return { error: `Location not found: ${location}` };
      }
      
      const { lat, lon } = geocodeData[0];
      
      // Now fetch weather data from Open-Meteo with hourly data to get humidity
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature&temperature_unit=celsius`;
      
      const response = await fetch(weatherUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🧪 API error response:', errorText);
        return { error: `API error: ${response.status} - ${errorText}` };
      }
      
      const data = await response.json();
      
      // Get current hour humidity and feels like temperature
      const currentHour = new Date().getHours();
      const humidity = data.hourly?.relativehumidity_2m?.[currentHour] || 'N/A';
      const feelsLike = data.hourly?.apparent_temperature?.[currentHour] || Math.round(data.current_weather.temperature);
      
      return {
        success: true,
        temperature: Math.round(data.current_weather.temperature),
        description: this.getWeatherDescription(data.current_weather.weathercode),
        location: location,
        icon: this.getWeatherIconCode(data.current_weather.weathercode),
        humidity: humidity,
        feelsLike: Math.round(feelsLike)
      };
    } catch (error) {
      console.error('🧪 Test API error:', error);
      return { error: error.message };
    }
  }

  updateClockFormat(format) {
    this.updateSettings({ clockFormat: format });
  }

  // Get timezone from location (improved mapping)
  getTimezoneFromLocation(location) {
    const locationLower = location.toLowerCase();
    
    // More comprehensive timezone mapping for common locations
    const timezoneMap = {
      // US Major Cities
      'new york': 'America/New_York',
      'los angeles': 'America/Los_Angeles',
      'chicago': 'America/Chicago',
      'houston': 'America/Chicago',
      'phoenix': 'America/Phoenix',
      'philadelphia': 'America/New_York',
      'san antonio': 'America/Chicago',
      'san diego': 'America/Los_Angeles',
      'dallas': 'America/Chicago',
      'san jose': 'America/Los_Angeles',
      'austin': 'America/Chicago',
      'jacksonville': 'America/New_York',
      'fort worth': 'America/Chicago',
      'columbus': 'America/New_York',
      'charlotte': 'America/New_York',
      'san francisco': 'America/Los_Angeles',
      'indianapolis': 'America/Indiana/Indianapolis',
      'seattle': 'America/Los_Angeles',
      'denver': 'America/Denver',
      'washington': 'America/New_York',
      'boston': 'America/New_York',
      'el paso': 'America/Denver',
      'nashville': 'America/Chicago',
      'detroit': 'America/Detroit',
      'oklahoma city': 'America/Chicago',
      'portland': 'America/Los_Angeles',
      'las vegas': 'America/Los_Angeles',
      'memphis': 'America/Chicago',
      'louisville': 'America/Kentucky/Louisville',
      'baltimore': 'America/New_York',
      'milwaukee': 'America/Chicago',
      'albuquerque': 'America/Denver',
      'tucson': 'America/Phoenix',
      'fresno': 'America/Los_Angeles',
      'sacramento': 'America/Los_Angeles',
      'mesa': 'America/Phoenix',
      'kansas city': 'America/Chicago',
      'atlanta': 'America/New_York',
      'long beach': 'America/Los_Angeles',
      'colorado springs': 'America/Denver',
      'raleigh': 'America/New_York',
      'miami': 'America/New_York',
      'virginia beach': 'America/New_York',
      'omaha': 'America/Chicago',
      'oakland': 'America/Los_Angeles',
      'minneapolis': 'America/Chicago',
      'tulsa': 'America/Chicago',
      'arlington': 'America/Chicago',
      'tampa': 'America/New_York',
      'new orleans': 'America/Chicago',
      'wichita': 'America/Chicago',
      'cleveland': 'America/New_York',
      'bakersfield': 'America/Los_Angeles',
      'aurora': 'America/Chicago',
      'anaheim': 'America/Los_Angeles',
      'honolulu': 'Pacific/Honolulu',
      'pittsburgh': 'America/New_York',
      'lexington': 'America/New_York',
      'stockton': 'America/Los_Angeles',
      'cincinnati': 'America/New_York',
      'st. paul': 'America/Chicago',
      'toledo': 'America/New_York',
      'greensboro': 'America/New_York',
      'newark': 'America/New_York',
      'plano': 'America/Chicago',
      'henderson': 'America/Los_Angeles',
      'lincoln': 'America/Chicago',
      'buffalo': 'America/New_York',
      'jersey city': 'America/New_York',
      'chula vista': 'America/Los_Angeles',
      'fort wayne': 'America/Indiana/Indianapolis',
      'orlando': 'America/New_York',
      'st. petersburg': 'America/New_York',
      'chandler': 'America/Phoenix',
      'laredo': 'America/Chicago',
      'norfolk': 'America/New_York',
      'durham': 'America/New_York',
      'madison': 'America/Chicago',
      'lubbock': 'America/Chicago',
      'winston-salem': 'America/New_York',
      'garland': 'America/Chicago',
      'glendale': 'America/Phoenix',
      'hialeah': 'America/New_York',
      'reno': 'America/Los_Angeles',
      'baton rouge': 'America/Chicago',
      'irving': 'America/Chicago',
      
      // Canada
      'toronto': 'America/Toronto',
      'montreal': 'America/Montreal',
      'vancouver': 'America/Vancouver',
      'calgary': 'America/Edmonton',
      'edmonton': 'America/Edmonton',
      'ottawa': 'America/Toronto',
      'winnipeg': 'America/Winnipeg',
      'quebec city': 'America/Montreal',
      'hamilton': 'America/Toronto',
      'halifax': 'America/Halifax',
      
      // Europe
      'london': 'Europe/London',
      'paris': 'Europe/Paris',
      'berlin': 'Europe/Berlin',
      'rome': 'Europe/Rome',
      'madrid': 'Europe/Madrid',
      'amsterdam': 'Europe/Amsterdam',
      'brussels': 'Europe/Brussels',
      'vienna': 'Europe/Vienna',
      'stockholm': 'Europe/Stockholm',
      'oslo': 'Europe/Oslo',
      'copenhagen': 'Europe/Copenhagen',
      'helsinki': 'Europe/Helsinki',
      'athens': 'Europe/Athens',
      'lisbon': 'Europe/Lisbon',
      'prague': 'Europe/Prague',
      'budapest': 'Europe/Budapest',
      'warsaw': 'Europe/Warsaw',
      'dublin': 'Europe/Dublin',
      'zurich': 'Europe/Zurich',
      'moscow': 'Europe/Moscow',
      
      // Asia
      'tokyo': 'Asia/Tokyo',
      'beijing': 'Asia/Shanghai',
      'shanghai': 'Asia/Shanghai',
      'hong kong': 'Asia/Hong_Kong',
      'singapore': 'Asia/Singapore',
      'dubai': 'Asia/Dubai',
      'bangkok': 'Asia/Bangkok',
      'kuala lumpur': 'Asia/Kuala_Lumpur',
      'jakarta': 'Asia/Jakarta',
      'manila': 'Asia/Manila',
      'seoul': 'Asia/Seoul',
      'taipei': 'Asia/Taipei',
      'mumbai': 'Asia/Kolkata',
      'delhi': 'Asia/Kolkata',
      'bangalore': 'Asia/Kolkata',
      'chennai': 'Asia/Kolkata',
      'kolkata': 'Asia/Kolkata',
      'dhaka': 'Asia/Dhaka',
      'karachi': 'Asia/Karachi',
      
      // Australia & New Zealand
      'sydney': 'Australia/Sydney',
      'melbourne': 'Australia/Melbourne',
      'brisbane': 'Australia/Brisbane',
      'perth': 'Australia/Perth',
      'adelaide': 'Australia/Adelaide',
      'auckland': 'Pacific/Auckland',
      'wellington': 'Pacific/Auckland',
      
      // Middle East & Africa
      'cairo': 'Africa/Cairo',
      'johannesburg': 'Africa/Johannesburg',
      'lagos': 'Africa/Lagos',
      'nairobi': 'Africa/Nairobi',
      'tel aviv': 'Asia/Jerusalem',
      'riyadh': 'Asia/Riyadh',
      'istanbul': 'Europe/Istanbul',
      
      // South America
      'sao paulo': 'America/Sao_Paulo',
      'buenos aires': 'America/Argentina/Buenos_Aires',
      'lima': 'America/Lima',
      'bogota': 'America/Bogota',
      'santiago': 'America/Santiago',
      'caracas': 'America/Caracas',
      'quito': 'America/Guayaquil',
      'montevideo': 'America/Montevideo',
      'la paz': 'America/La_Paz',
      'asuncion': 'America/Asuncion',
      'georgetown': 'America/Guyana',
      'paramaribo': 'America/Paramaribo',
      'cayenne': 'America/Cayenne'
    };
    
    // Try to find a match
    for (const [key, timezone] of Object.entries(timezoneMap)) {
      if (locationLower.includes(key)) {
        return timezone;
      }
    }
    
    // Default to system timezone if no match found
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  updateDisplaySetting(key, value) {
    this.updateSettings({ [key]: value });
  }

  updateDeviceSelection(category, deviceId, selected) {
    const currentDevices = this.state.settings.selectedDevices[category] || [];
    const updatedDevices = selected 
      ? [...currentDevices, deviceId]
      : currentDevices.filter(id => id !== deviceId);
    
    this.updateSettings({
      selectedDevices: {
        ...this.state.settings.selectedDevices,
        [category]: updatedDevices
      }
    });
  }

  // Helper method to update local device state immediately
  updateLocalDeviceState(roomId, deviceId, updates) {
    const currentRooms = [...this.state.smartHome.rooms];
    const roomIndex = currentRooms.findIndex(room => room.id === roomId);
    
    if (roomIndex !== -1) {
      const deviceIndex = currentRooms[roomIndex].devices.findIndex(device => device.id === deviceId);
      if (deviceIndex !== -1) {
        currentRooms[roomIndex].devices[deviceIndex] = {
          ...currentRooms[roomIndex].devices[deviceIndex],
          ...updates
        };
        
        this.updateSection('smartHome', {
          rooms: currentRooms,
          devices: currentRooms.flatMap(room => room.devices || [])
        });
      }
    }
  }

  // Smart home device control methods
  async toggleLight(userId, roomId, deviceId, state) {
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      if (!roomId) {
        throw new Error('Room ID is required');
      }
      if (!deviceId) {
        throw new Error('Device ID is required');
      }
      
      // Update local state immediately for responsive UI
      this.updateLocalDeviceState(roomId, deviceId, { state });
      
      // Try to update in Firebase if roomsStore is available
      if (roomsStore && roomsStore.updateDevice) {
        await roomsStore.updateDevice(userId, roomId, deviceId, { state });
        // Refresh smart home data to get updated state
        this.fetchSmartHomeData(userId);
      }
    } catch (error) {
      console.error('Error toggling light:', error);
      throw error;
    }
  }

  async setLightBrightness(userId, roomId, deviceId, brightness) {
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      if (!roomId) {
        throw new Error('Room ID is required');
      }
      if (!deviceId) {
        throw new Error('Device ID is required');
      }
      
      // Update local state immediately for responsive UI
      this.updateLocalDeviceState(roomId, deviceId, { brightness });
      
      // Try to update in Firebase if roomsStore is available
      if (roomsStore && roomsStore.updateDevice) {
        await roomsStore.updateDevice(userId, roomId, deviceId, { brightness });
        // Refresh smart home data to get updated state
        this.fetchSmartHomeData(userId);
      }
    } catch (error) {
      console.error('Error setting light brightness:', error);
      throw error;
    }
  }

  async setClimateState(userId, roomId, deviceId, state) {
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      if (!roomId) {
        throw new Error('Room ID is required');
      }
      if (!deviceId) {
        throw new Error('Device ID is required');
      }
      
      // Update local state immediately for responsive UI
      this.updateLocalDeviceState(roomId, deviceId, { state });
      
      // Try to update in Firebase if roomsStore is available
      if (roomsStore && roomsStore.updateDevice) {
        await roomsStore.updateDevice(userId, roomId, deviceId, { state });
        // Refresh smart home data to get updated state
        this.fetchSmartHomeData(userId);
      }
    } catch (error) {
      console.error('Error setting climate state:', error);
      throw error;
    }
  }

  async setClimateTemperature(userId, roomId, deviceId, temperature) {
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      if (!roomId) {
        throw new Error('Room ID is required');
      }
      if (!deviceId) {
        throw new Error('Device ID is required');
      }
      
      // Update local state immediately for responsive UI
      this.updateLocalDeviceState(roomId, deviceId, { temperature });
      
      // Try to update in Firebase if roomsStore is available
      if (roomsStore && roomsStore.updateDevice) {
        await roomsStore.updateDevice(userId, roomId, deviceId, { temperature });
        // Refresh smart home data to get updated state
        this.fetchSmartHomeData(userId);
      }
    } catch (error) {
      console.error('Error setting climate temperature:', error);
      throw error;
    }
  }

  async setClimateMode(userId, roomId, deviceId, mode) {
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      if (!roomId) {
        throw new Error('Room ID is required');
      }
      if (!deviceId) {
        throw new Error('Device ID is required');
      }
      
      // Update local state immediately for responsive UI
      this.updateLocalDeviceState(roomId, deviceId, { mode });
      
      // Try to update in Firebase if roomsStore is available
      if (roomsStore && roomsStore.updateDevice) {
        await roomsStore.updateDevice(userId, roomId, deviceId, { mode });
        // Refresh smart home data to get updated state
        this.fetchSmartHomeData(userId);
      }
    } catch (error) {
      console.error('Error setting climate mode:', error);
      throw error;
    }
  }

  async setFanSpeed(userId, roomId, deviceId, speed) {
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      if (!roomId) {
        throw new Error('Room ID is required');
      }
      if (!deviceId) {
        throw new Error('Device ID is required');
      }
      
      // Update local state immediately for responsive UI
      this.updateLocalDeviceState(roomId, deviceId, { speed });
      
      // Try to update in Firebase if roomsStore is available
      if (roomsStore && roomsStore.updateDevice) {
        await roomsStore.updateDevice(userId, roomId, deviceId, { speed });
        // Refresh smart home data to get updated state
        this.fetchSmartHomeData(userId);
      }
    } catch (error) {
      console.error('Error setting fan speed:', error);
      throw error;
    }
  }

  // AI Assistant methods
  async sendAssistantMessage(message, userId = null) {
    try {
      // Set typing indicator
      this.setTyping(true);
      
      // Get current smart home state for context
      const rooms = this.state.smartHome.rooms;
      const devices = this.state.smartHome.devices;
      
      // Get conversation context for natural interaction
      const conversationContext = this.getConversationContext();
      
      // Process the message using the enhanced system prompt
      const response = await this.processNaturalLanguageCommand(message, rooms, devices, userId, conversationContext);
      
      // Clear typing indicator
      this.setTyping(false);
      
      return response;
    } catch (error) {
      this.setTyping(false);
      console.error('Error sending assistant message:', error);
      return "I'm sorry, I encountered an error processing your request. Please try again.";
    }
  }

  async processNaturalLanguageCommand(message, rooms, devices, userId, context) {
    const systemPrompt = `
You are a smart home assistant.
- You control lights, fans, AC, and appliances.
- You remember recent user requests and device states to resolve pronouns like "it", "that", or "them".
- Always confirm ambiguous commands by asking clarifying questions.
- Example:
  User: "Turn it off"
  If the last controlled device was "bedroom fan", respond:
  {
    "reply": "Okay, I've turned off the fan in the bedroom.",
    "command": { "action": "turn_off", "device": "fan", "location": "bedroom" }
  }
- If unclear (multiple possible devices), ask:
  {
    "reply": "Which device would you like me to turn off? The fan or the AC?",
    "command": null
  }
- Respond ONLY in JSON with two fields:
  {
    "reply": "natural response to user",
    "command": { "action": "...", "device": "...", "location": "..." } | null
  }
- "command" must be null if the request is unclear.
- Never invent devices or locations.

Current available devices:
${this.generateDeviceList(rooms)}

Recent context:
${context.recentCommands.map(cmd => `- ${cmd.timestamp}: ${cmd.description}`).join('\n')}

Last controlled device: ${context.lastDevice ? `${context.lastDevice.name} in ${context.lastDevice.room}` : 'none'}
`;

    try {
      // Use OpenAI API if available, otherwise use local processing
      const openAIKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (openAIKey && openAIKey !== 'your_openai_api_key_here') {
        const response = await this.callOpenAI(systemPrompt, message);
        return await this.executeAssistantResponse(response, rooms, userId);
      } else {
        // Fallback to local processing
        console.log('OpenAI API key not configured, using local processing');
        const response = this.processLocalCommand(message, rooms, devices, context);
        return await this.executeAssistantResponse(response, rooms, userId);
      }
    } catch (error) {
      console.error('Error processing natural language command:', error);
      return "I'm sorry, I had trouble understanding that. Could you please rephrase your request?";
    }
  }

  async callOpenAI(systemPrompt, userMessage) {
    const openAIKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantReply = data.choices[0].message.content;
    
    try {
      return JSON.parse(assistantReply);
    } catch (error) {
      console.error('Failed to parse OpenAI response as JSON:', assistantReply, error);
      console.error('Failed to parse OpenAI response as JSON:', assistantReply);
      return {
        reply: assistantReply,
        command: null
      };
    }
  }

  processLocalCommand(message, rooms, devices, context) {
    const lowerMessage = message.toLowerCase();
    
    // Handle pronouns with context
    if (this.containsPronoun(lowerMessage) && context.lastDevice) {
      return this.handlePronounCommand(lowerMessage, context.lastDevice);
    }
    
    // Device status queries
    if (lowerMessage.includes('what devices') || lowerMessage.includes('list devices')) {
      return {
        reply: this.getDeviceStatus(rooms),
        command: null
      };
    }
    
    if (lowerMessage.includes('status') || lowerMessage.includes('what\'s on')) {
      return {
        reply: this.getActiveDevicesStatus(rooms),
        command: null
      };
    }
    
    // Extract command components
    const action = this.extractAction(lowerMessage);
    const deviceType = this.extractDeviceType(lowerMessage);
    const location = this.extractLocation(lowerMessage, rooms);
    const value = this.extractValue(lowerMessage);
    
    if (action && deviceType) {
      return {
        reply: this.generateConfirmationMessage(action, deviceType, location, value),
        command: {
          action: action,
          device: deviceType,
          location: location,
          value: value
        }
      };
    }
    
    // Default helpful response
    return {
      reply: "I understand you want to control your smart home, but I need more specific instructions. Try saying something like 'turn on the living room light' or 'set bedroom AC to 22 degrees'.",
      command: null
    };
  }

  async executeAssistantResponse(response, rooms, userId) {
    if (!response.command) {
      return response.reply;
    }

    const { action, device, location, value } = response.command;
    
    try {
      // Find the target device
      const targetRoom = rooms.find(r => 
        r.name.toLowerCase().includes(location?.toLowerCase() || '')
      );
      
      if (!targetRoom && location) {
        return `I couldn't find a room called "${location}". Please check the room name and try again.`;
      }
      
      const targetDevices = (targetRoom ? targetRoom.devices : rooms.flatMap(r => r.devices))
        .filter(d => this.matchesDeviceType(d.type, device));
      
      if (targetDevices.length === 0) {
        return `I couldn't find any ${device} devices${location ? ` in the ${location}` : ''}. Please check and try again.`;
      }
      
      if (targetDevices.length > 1 && !location) {
        const deviceList = targetDevices.map(d => `${d.name} in ${this.findDeviceRoom(d.id, rooms)?.name || 'unknown room'}`).join(', ');
        return `I found multiple ${device} devices: ${deviceList}. Please specify which room you'd like me to control.`;
      }
      
      // Execute the command
      const targetDevice = targetDevices[0];
      const targetRoomFinal = targetRoom || this.findDeviceRoom(targetDevice.id, rooms);
      
      await this.executeDeviceCommand(action, targetDevice, targetRoomFinal, userId, value);
      
      // Store command context for future reference
      this.storeCommandContext({
        device: targetDevice,
        room: targetRoomFinal,
        action: action,
        timestamp: new Date().toLocaleTimeString()
      });
      
      // Store in Firebase for persistent context
      if (userId) {
        await this.storeCommandInFirebase(userId, {
          deviceId: targetDevice.id,
          deviceName: targetDevice.name,
          deviceType: targetDevice.type,
          roomId: targetRoomFinal.id,
          roomName: targetRoomFinal.name,
          action: action,
          timestamp: Date.now()
        });
      }
      
      return response.reply;
    } catch (error) {
      console.error('Error executing device command:', error);
      return "I encountered an error while trying to control that device. Please try again.";
    }
  }

  async executeDeviceCommand(action, device, room, userId, value) {
    switch (action) {
      case 'turn_on':
        if (device.type === 'light') {
          await this.toggleLight(userId, room.id, device.id, true);
        } else {
          await this.setClimateState(userId, room.id, device.id, true);
        }
        break;
        
      case 'turn_off':
        if (device.type === 'light') {
          await this.toggleLight(userId, room.id, device.id, false);
        } else {
          await this.setClimateState(userId, room.id, device.id, false);
        }
        break;
        
      case 'set_temperature':
        if (device.type === 'air_conditioner' || device.type === 'thermostat') {
          await this.setClimateTemperature(userId, room.id, device.id, value);
        }
        break;
        
      case 'set_speed':
        if (device.type === 'fan') {
          await this.setFanSpeed(userId, room.id, device.id, value);
        }
        break;
        
      case 'set_brightness':
        if (device.type === 'light') {
          await this.setLightBrightness(userId, room.id, device.id, value);
        }
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async storeCommandInFirebase(userId, commandData) {
    try {
      // This would store command history in Firebase for persistent context
      // Implementation depends on your Firebase structure
      console.log('Storing command context in Firebase:', commandData);
      
      // Example implementation:
      // const { db } = await import('../config/firebase');
      // await addDoc(collection(db, 'users', userId, 'commandHistory'), commandData);
    } catch (error) {
      console.error('Error storing command in Firebase:', error);
    }
  }

  // Context management methods
  getConversationContext() {
    const context = this.state.assistant.context || {
      recentCommands: [],
      lastDevice: null
    };
    
    return context;
  }
  
  storeCommandContext(commandInfo) {
    const context = this.getConversationContext();
    
    // Add to recent commands (keep last 5)
    context.recentCommands.unshift({
      description: `${commandInfo.action} ${commandInfo.device.name} in ${commandInfo.room.name}`,
      timestamp: commandInfo.timestamp,
      device: commandInfo.device,
      room: commandInfo.room
    });
    
    if (context.recentCommands.length > 5) {
      context.recentCommands = context.recentCommands.slice(0, 5);
    }
    
    // Update last device
    context.lastDevice = {
      name: commandInfo.device.name,
      type: commandInfo.device.type,
      id: commandInfo.device.id,
      room: commandInfo.room.name,
      roomId: commandInfo.room.id
    };
    
    // Store in state
    this.updateSection('assistant', { context });
  }
  
  // Helper methods for natural language processing
  containsPronoun(message) {
    const pronouns = ['it', 'that', 'this', 'them', 'they'];
    return pronouns.some(pronoun => message.includes(pronoun));
  }
  
  handlePronounCommand(message, lastDevice) {
    const action = this.extractAction(message);
    
    if (!action) {
      return {
        reply: `What would you like me to do with the ${lastDevice.name} in the ${lastDevice.room}?`,
        command: null
      };
    }
    
    return {
      reply: `Okay, I'll ${action.replace('_', ' ')} the ${lastDevice.name} in the ${lastDevice.room}.`,
      command: {
        action: action,
        device: lastDevice.type,
        location: lastDevice.room,
        deviceId: lastDevice.id
      }
    };
  }
  
  extractAction(message) {
    if (message.includes('turn on') || message.includes('switch on')) return 'turn_on';
    if (message.includes('turn off') || message.includes('switch off')) return 'turn_off';
    if (message.includes('set') && (message.includes('temperature') || message.includes('degrees'))) return 'set_temperature';
    if (message.includes('set') && message.includes('speed')) return 'set_speed';
    if (message.includes('dim') || message.includes('brightness')) return 'set_brightness';
    return null;
  }
  
  extractDeviceType(message) {
    if (message.includes('light') || message.includes('lamp')) return 'light';
    if (message.includes('ac') || message.includes('air condition')) return 'air_conditioner';
    if (message.includes('fan')) return 'fan';
    if (message.includes('thermostat')) return 'thermostat';
    return null;
  }
  
  extractLocation(message, rooms) {
    const roomNames = rooms.map(r => r.name.toLowerCase());
    return roomNames.find(roomName => message.toLowerCase().includes(roomName));
  }
  
  extractValue(message) {
    // Extract temperature
    const tempMatch = message.match(/(\d+)\s*(?:degrees?|°c?|celsius)/i);
    if (tempMatch) return parseInt(tempMatch[1]);
    
    // Extract speed
    const speedMatch = message.match(/speed\s*(\d+)/i);
    if (speedMatch) return parseInt(speedMatch[1]);
    
    // Extract brightness
    const brightnessMatch = message.match(/(\d+)\s*%/);
    if (brightnessMatch) return parseInt(brightnessMatch[1]);
    
    return null;
  }
  
  matchesDeviceType(deviceType, requestedType) {
    if (deviceType === requestedType) return true;
    if (requestedType === 'light' && deviceType === 'light') return true;
    if (requestedType === 'fan' && deviceType === 'fan') return true;
    if (requestedType === 'air_conditioner' && (deviceType === 'air_conditioner' || deviceType === 'ac')) return true;
    return false;
  }
  
  findDeviceRoom(deviceId, rooms) {
    for (const room of rooms) {
      if (room.devices?.find(d => d.id === deviceId)) {
        return room;
      }
    }
    return null;
  }
  
  generateDeviceList(rooms) {
    let deviceList = '';
    rooms.forEach(room => {
      if (room.devices && room.devices.length > 0) {
        deviceList += `${room.name}: ${room.devices.map(d => `${d.name} (${d.type})`).join(', ')}\n`;
      }
    });
    return deviceList;
  }
  
  generateConfirmationMessage(action, device, location, value) {
    let message = `I'll ${action.replace('_', ' ')} the ${device}`;
    if (location) message += ` in the ${location}`;
    if (value) {
      if (action === 'set_temperature') message += ` to ${value}°C`;
      else if (action === 'set_speed') message += ` to speed ${value}`;
      else if (action === 'set_brightness') message += ` to ${value}%`;
    }
    return message + '.';
  }
  
  getDeviceStatus(rooms) {
    let response = "Here are all your smart home devices:\n\n";
    
    rooms.forEach(room => {
      response += `**${room.name}:**\n`;
      if (room.devices && room.devices.length > 0) {
        room.devices.forEach(device => {
          const status = device.state ? 'ON' : 'OFF';
          let details = '';
          
          if (device.type === 'light' && device.state) {
            details = ` (${device.brightness}% brightness)`;
          } else if (device.type === 'air_conditioner' || device.type === 'thermostat') {
            details = ` (${device.temperature}°C, ${device.mode} mode)`;
          } else if (device.type === 'fan' && device.state) {
            details = ` (Speed ${device.speed})`;
          }
          
          const icon = this.getDeviceIcon(device.type);
          response += `${icon} ${device.name}: ${status}${details}\n`;
        });
      } else {
        response += "No devices\n";
      }
      response += "\n";
    });
    
    return response;
  }
  
  getActiveDevicesStatus(rooms) {
    const activeDevices = [];
    
    rooms.forEach(room => {
      if (room.devices) {
        room.devices.forEach(device => {
          if (device.state) {
            activeDevices.push({ ...device, roomName: room.name });
          }
        });
      }
    });
    
    if (activeDevices.length === 0) {
      return "All your devices are currently turned off.";
    }
    
    let response = `You have ${activeDevices.length} device${activeDevices.length > 1 ? 's' : ''} currently on:\n\n`;
    
    activeDevices.forEach(device => {
      const icon = this.getDeviceIcon(device.type);
      let details = '';
      
      if (device.type === 'light') {
        details = ` at ${device.brightness}% brightness`;
      } else if (device.type === 'air_conditioner' || device.type === 'thermostat') {
        details = ` set to ${device.temperature}°C in ${device.mode} mode`;
      } else if (device.type === 'fan') {
        details = ` running at speed ${device.speed}`;
      }
      
      response += `${icon} ${device.name} in ${device.roomName}${details}\n`;
    });
    
    return response;
  }
  
  async handleLightCommand(message, rooms, userId) {
    const isOnCommand = message.includes('turn on') || message.includes('switch on') || message.includes(' on ');
    const isOffCommand = message.includes('turn off') || message.includes('switch off') || message.includes(' off ');
    const isDimCommand = message.includes('dim') || message.includes('brightness');
    
    // Extract room name
    const roomName = this.extractRoomName(message, rooms);
    const room = roomName ? rooms.find(r => r.name.toLowerCase() === roomName.toLowerCase()) : null;
    
    // Extract specific light name
    const lightName = this.extractDeviceName(message, 'light');
    
    try {
      if (room) {
        const lights = room.devices.filter(d => d.type === 'light');
        
        if (lights.length === 0) {
          return `There are no lights in the ${room.name}.`;
        }
        
        let targetLight = null;
        if (lightName) {
          targetLight = lights.find(l => l.name.toLowerCase().includes(lightName.toLowerCase()));
        }
        
        if (targetLight) {
          // Control specific light
          if (isOnCommand) {
            await this.toggleLight(userId, room.id, targetLight.id, true);
            return `I've turned on the ${targetLight.name} in the ${room.name}.`;
          } else if (isOffCommand) {
            await this.toggleLight(userId, room.id, targetLight.id, false);
            return `I've turned off the ${targetLight.name} in the ${room.name}.`;
          } else if (isDimCommand) {
            const brightness = this.extractBrightness(message);
            if (brightness !== null) {
              await this.setLightBrightness(userId, room.id, targetLight.id, brightness);
              return `I've set the ${targetLight.name} in the ${room.name} to ${brightness}% brightness.`;
            }
          }
        } else {
          // Control all lights in room
          if (isOnCommand) {
            for (const light of lights) {
              await this.toggleLight(userId, room.id, light.id, true);
            }
            return `I've turned on all lights in the ${room.name}.`;
          } else if (isOffCommand) {
            for (const light of lights) {
              await this.toggleLight(userId, room.id, light.id, false);
            }
            return `I've turned off all lights in the ${room.name}.`;
          }
        }
      } else {
        // No specific room mentioned, try to find device by name
        if (lightName) {
          for (const room of rooms) {
            const light = room.devices.find(d => 
              d.type === 'light' && d.name.toLowerCase().includes(lightName.toLowerCase())
            );
            if (light) {
              if (isOnCommand) {
                await this.toggleLight(userId, room.id, light.id, true);
                return `I've turned on the ${light.name} in the ${room.name}.`;
              } else if (isOffCommand) {
                await this.toggleLight(userId, room.id, light.id, false);
                return `I've turned off the ${light.name} in the ${room.name}.`;
              }
            }
          }
          return `I couldn't find a light named "${lightName}". Please check the name and try again.`;
        } else {
          // Control all lights
          if (isOnCommand) {
            let count = 0;
            for (const room of rooms) {
              for (const device of room.devices.filter(d => d.type === 'light')) {
                await this.toggleLight(userId, room.id, device.id, true);
                count++;
              }
            }
            return `I've turned on all ${count} lights in your home.`;
          } else if (isOffCommand) {
            let count = 0;
            for (const room of rooms) {
              for (const device of room.devices.filter(d => d.type === 'light')) {
                await this.toggleLight(userId, room.id, device.id, false);
                count++;
              }
            }
            return `I've turned off all ${count} lights in your home.`;
          }
        }
      }
      
      return "I understand you want to control the lights, but I need more specific instructions. Try saying 'turn on the living room light' or 'turn off all lights'.";
    } catch (error) {
      console.error('Error handling light command:', error);
      return "I encountered an error while trying to control the lights. Please try again.";
    }
  }
  
  async handleClimateCommand(message, rooms, userId) {
    const roomName = this.extractRoomName(message, rooms);
    const room = roomName ? rooms.find(r => r.name.toLowerCase() === roomName.toLowerCase()) : null;
    
    // Extract temperature if mentioned
    const temperature = this.extractTemperature(message);
    const speed = this.extractSpeed(message);
    
    const isOnCommand = message.includes('turn on') || message.includes('switch on') || message.includes(' on ');
    const isOffCommand = message.includes('turn off') || message.includes('switch off') || message.includes(' off ');
    
    try {
      if (room) {
        const climateDevices = room.devices.filter(d => 
          ['thermostat', 'fan', 'air_conditioner'].includes(d.type));
        
        if (climateDevices.length === 0) {
          return `There are no climate devices in the ${room.name}.`;
        }
        
        // Handle specific device types
        if (message.includes('ac') || message.includes('air condition')) {
          const ac = climateDevices.find(d => d.type === 'air_conditioner');
          if (ac) {
            if (temperature !== null) {
              await this.setClimateTemperature(userId, room.id, ac.id, temperature);
              return `I've set the ${room.name} AC to ${temperature}°C.`;
            } else if (isOnCommand) {
              await this.setClimateState(userId, room.id, ac.id, true);
              return `I've turned on the ${room.name} AC.`;
            } else if (isOffCommand) {
              await this.setClimateState(userId, room.id, ac.id, false);
              return `I've turned off the ${room.name} AC.`;
            }
          } else {
            return `There's no air conditioner in the ${room.name}.`;
          }
        } else if (message.includes('fan')) {
          const fan = climateDevices.find(d => d.type === 'fan');
          if (fan) {
            if (speed !== null) {
              await this.setFanSpeed(userId, room.id, fan.id, speed);
              return `I've set the ${room.name} fan to speed ${speed}.`;
            } else if (isOnCommand) {
              await this.setClimateState(userId, room.id, fan.id, true);
              return `I've turned on the ${room.name} fan.`;
            } else if (isOffCommand) {
              await this.setClimateState(userId, room.id, fan.id, false);
              return `I've turned off the ${room.name} fan.`;
            }
          } else {
            return `There's no fan in the ${room.name}.`;
          }
        } else if (message.includes('thermostat')) {
          const thermostat = climateDevices.find(d => d.type === 'thermostat');
          if (thermostat) {
            if (temperature !== null) {
              await this.setClimateTemperature(userId, room.id, thermostat.id, temperature);
              return `I've set the ${room.name} thermostat to ${temperature}°C.`;
            }
          } else {
            return `There's no thermostat in the ${room.name}.`;
          }
        } else if (temperature !== null) {
          // Set temperature on any available device
          const tempDevice = climateDevices.find(d => d.type === 'air_conditioner' || d.type === 'thermostat');
          if (tempDevice) {
            await this.setClimateTemperature(userId, room.id, tempDevice.id, temperature);
            return `I've set the temperature in the ${room.name} to ${temperature}°C.`;
          }
        } else {
          // General climate control
          if (isOnCommand) {
            for (const device of climateDevices) {
              await this.setClimateState(userId, room.id, device.id, true);
            }
            return `I've turned on all climate devices in the ${room.name}.`;
          } else if (isOffCommand) {
            for (const device of climateDevices) {
              await this.setClimateState(userId, room.id, device.id, false);
            }
            return `I've turned off all climate devices in the ${room.name}.`;
          }
        }
      }
      
      return "I understand you want to control climate devices, but I need more specific instructions. Try saying 'set bedroom AC to 22 degrees' or 'turn on living room fan'.";
    } catch (error) {
      console.error('Error handling climate command:', error);
      return "I encountered an error while trying to control the climate devices. Please try again.";
    }
  }
  
  async handleRoomCommand(message, rooms, userId, roomName) {
    const room = rooms.find(r => r.name.toLowerCase() === roomName.toLowerCase());
    if (!room) return `I couldn't find the ${roomName}.`;
    
    const isOnCommand = message.includes('turn on') || message.includes('switch on');
    const isOffCommand = message.includes('turn off') || message.includes('switch off');
    
    if (isOnCommand) {
      let count = 0;
      for (const device of room.devices) {
        if (device.type === 'light' || device.type === 'fan' || device.type === 'air_conditioner' || device.type === 'thermostat') {
          if (device.type === 'light') {
            await this.toggleLight(userId, room.id, device.id, true);
          } else {
            await this.setClimateState(userId, room.id, device.id, true);
          }
          count++;
        }
      }
      return `I've turned on ${count} devices in the ${room.name}.`;
    } else if (isOffCommand) {
      let count = 0;
      for (const device of room.devices) {
        if (device.type === 'light' || device.type === 'fan' || device.type === 'air_conditioner' || device.type === 'thermostat') {
          if (device.type === 'light') {
            await this.toggleLight(userId, room.id, device.id, false);
          } else {
            await this.setClimateState(userId, room.id, device.id, false);
          }
          count++;
        }
      }
      return `I've turned off ${count} devices in the ${room.name}.`;
    }
    
    // Room status
    let response = `Here's the status of devices in the ${room.name}:\n\n`;
    if (room.devices && room.devices.length > 0) {
      room.devices.forEach(device => {
        const status = device.state ? 'ON' : 'OFF';
        const icon = this.getDeviceIcon(device.type);
        response += `${icon} ${device.name}: ${status}\n`;
      });
    } else {
      response += "No devices found.";
    }
    
    return response;
  }
  
  getHelpMessage() {
    return `I'm your smart home assistant! Here's what I can help you with:\n\n` +
           `**Lighting Control:**\n` +
           `• "Turn on the living room light"\n` +
           `• "Turn off all lights"\n` +
           `• "Dim the bedroom light to 50%"\n\n` +
           `**Climate Control:**\n` +
           `• "Set bedroom AC to 22 degrees"\n` +
           `• "Turn on the living room fan"\n` +
           `• "Set fan speed to 3"\n\n` +
           `**Device Status:**\n` +
           `• "What devices do I have?"\n` +
           `• "What's currently on?"\n` +
           `• "Show me the bedroom status"\n\n` +
           `**General:**\n` +
           `• "What's the weather?"\n` +
           `• Ask me anything about your smart home!`;
  }
  
  getIntelligentResponse(message, rooms) {
    // More sophisticated response based on context
    const deviceCount = rooms.reduce((count, room) => count + (room.devices?.length || 0), 0);
    const roomCount = rooms.length;
    const context = this.getConversationContext();
    
    // Check if user is asking about conversation context
    if (message.toLowerCase().includes('what did i last') || message.toLowerCase().includes('what was the last')) {
      if (context.lastDevice) {
        return `The last device you controlled was the ${context.lastDevice.name} in the ${context.lastDevice.room}.`;
      } else {
        return "You haven't controlled any devices yet in our conversation.";
      }
    }
    
    const responses = [
      `I understand you're asking about "${message}". I have access to ${deviceCount} devices across ${roomCount} rooms. Would you like me to help control any specific devices?`,
      `I'm here to help with your smart home! I can control lights, climate devices, and provide status updates. What would you like me to do?`,
      `I didn't quite understand that command, but I'm ready to help! Try asking me to control lights, check device status, or adjust temperature settings.`,
      `I'm your intelligent home assistant. I can help you manage ${deviceCount} smart devices. What would you like me to help you with?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Helper methods for parsing commands
  extractRoomName(message, rooms) {
    const roomNames = rooms.map(r => r.name.toLowerCase());
    return roomNames.find(roomName => message.toLowerCase().includes(roomName));
  }
  
  extractDeviceName(message, deviceType) {
    // Simple extraction - could be enhanced with more sophisticated NLP
    const words = message.toLowerCase().split(' ');
    const deviceIndex = words.findIndex(word => word.includes(deviceType));
    if (deviceIndex > 0) {
      return words[deviceIndex - 1];
    }
    return null;
  }
  
  extractTemperature(message) {
    const tempMatch = message.match(/(\d+)\s*(?:degrees?|°c?|celsius)/i);
    if (tempMatch) {
      const temp = parseInt(tempMatch[1]);
      return temp >= 16 && temp <= 30 ? temp : null;
    }
    return null;
  }
  
  extractSpeed(message) {
    const speedMatch = message.match(/speed\s*(\d+)/i) || message.match(/(\d+)\s*speed/i);
    if (speedMatch) {
      const speed = parseInt(speedMatch[1]);
      return speed >= 1 && speed <= 5 ? speed : null;
    }
    return null;
  }
  
  extractBrightness(message) {
    const brightnessMatch = message.match(/(\d+)\s*%/) || message.match(/(\d+)\s*percent/i);
    if (brightnessMatch) {
      const brightness = parseInt(brightnessMatch[1]);
      return brightness >= 0 && brightness <= 100 ? brightness : null;
    }
    return null;
  }
  
  getDeviceIcon(deviceType) {
    const icons = {
      'light': '💡',
      'air_conditioner': '❄️',
      'thermostat': '🌡️',
      'fan': '🌀'
    };
    return icons[deviceType] || '🔧';
  }

  // Get current state
  getState() {
    return this.state;
  }

  // Cleanup
  destroy() {
    this.stopBackgroundRefresh();
    this.subscribers = [];
  }
}

// Create singleton instance
export const globalStore = new GlobalStore();

// Create actions object with all methods
export const globalActions = {
  addMessage: message => globalStore.addMessage(message),
  clearMessages: () => globalStore.clearMessages(),
  destroy: () => globalStore.destroy(),
  fetchQuote: () => globalStore.fetchQuote(),
  fetchNews: () => globalStore.fetchNews(),
  fetchSmartHomeData: userId => globalStore.fetchSmartHomeData(userId),
  fetchWeather: () => globalStore.fetchWeather(),
  loadSettings: () => globalStore.loadSettings(),
  refreshAll: userId => globalStore.refreshAll(userId),
  refreshWeather: () => globalStore.refreshWeather(),
  sendAssistantMessage: (message, userId) => globalStore.sendAssistantMessage(message, userId),
  setRecording: isRecording => globalStore.setRecording(isRecording),
  setTyping: isTyping => globalStore.setTyping(isTyping),
  setupRealtimeListener: userId => globalStore.setupRealtimeListener(userId),
  subscribe: callback => globalStore.subscribe(callback),
  testWeatherAPI: location => globalStore.testWeatherAPI(location),
  toggleLight: (userId, roomId, deviceId, state) => globalStore.toggleLight(userId, roomId, deviceId, state),
  updateClockFormat: format => globalStore.updateClockFormat(format),
  updateDeviceSelection: (category, deviceId, selected) => globalStore.updateDeviceSelection(category, deviceId, selected),
  updateDisplaySetting: (key, value) => globalStore.updateDisplaySetting(key, value),
  updateLocalDeviceState: (roomId, deviceId, updates) => globalStore.updateLocalDeviceState(roomId, deviceId, updates),
  updateSettings: updates => globalStore.updateSettings(updates),
  updateWeatherLocation: location => globalStore.updateWeatherLocation(location),
  updateSmartHomeData: () => globalStore.updateSmartHomeData()
};

export default globalStore;