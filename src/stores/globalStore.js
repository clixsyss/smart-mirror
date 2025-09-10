import { roomsStore } from './roomsStore';
import { cacheManager } from '../utils/cacheManager';

class GlobalStore {
  constructor() {
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
        error: null
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
      // Check if API key is available
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      if (!apiKey || apiKey === 'your_openweather_api_key_here') {
        console.error('❌ OpenWeather API key not configured');
        const location = this.state.settings?.weatherLocation || 'New York, NY';
        this.updateSection('weather', {
          current: {
            temperature: '--',
            description: 'API key needed',
            icon: '01d',
            location: location
          },
          loading: false,
          error: 'Please configure OpenWeather API key in .env file'
        });
        return;
      }

      // Get location from settings
      const location = this.state.settings?.weatherLocation || 'New York, NY';
      console.log('🌤️ Fetching weather for location:', location);

      const weatherData = await cacheManager.fetchWithCache(`weather-${location}`, async () => {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Weather API error:', response.status, errorText);
          throw new Error(`Weather API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        return {
          temperature: Math.round(data.main.temp),
          description: data.weather[0].description,
          location: data.name,
          icon: data.weather[0].icon
        };
      });
      
      this.updateSection('weather', {
        current: weatherData,
        loading: false,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('❌ Weather fetch error:', error);
      
      // Use fallback data with the actual location
      const location = this.state.settings?.weatherLocation || 'New York, NY';
      this.updateSection('weather', {
        current: {
          temperature: 22,
          description: 'partly cloudy',
          location: location,
          icon: '02d'
        },
        loading: false,
        error: error.message,
        lastUpdated: Date.now()
      });
    }
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
      
      this.updateSection('quote', {
        content: quoteData.content,
        author: quoteData.author,
        loading: false,
        lastUpdated: Date.now()
      });
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
      if (!userId) {
        throw new Error('User ID not provided');
      }

      await roomsStore.fetchRooms(userId);
      const rooms = [...roomsStore.rooms];
      const devices = rooms.flatMap(room => room.devices || []);
      
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
            { id: 'light-2', name: 'Lamp', type: 'light', state: false, brightness: 0 }
          ]
        },
        {
          id: 'bedroom',
          name: 'Bedroom',
          devices: [
            { id: 'light-3', name: 'Bedside Light', type: 'light', state: true, brightness: 60 },
            { id: 'thermostat-1', name: 'Thermostat', type: 'thermostat', state: true, temperature: 22, mode: 'heat' }
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
  setupRealtimeListener(userId) {
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
        lastUpdated: null
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
      if (this.state.smartHome.rooms.length > 0) {
        this.fetchSmartHomeData(this.state.smartHome.rooms[0].userId || 'default');
      }
    }, 30 * 1000));
  }

  // Stop background refresh
  stopBackgroundRefresh() {
    this.refreshIntervals.forEach((interval, key) => {
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
    this.updateSection('assistant', { messages: [] });
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
  }

  // Test weather API directly (for debugging)
  async testWeatherAPI(location = 'New York, NY') {
    try {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      if (!apiKey || apiKey === 'your_openweather_api_key_here') {
        console.error('❌ OpenWeather API key not configured');
        return { error: 'API key not configured' };
      }

      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🧪 API error response:', errorText);
        return { error: `API error: ${response.status} - ${errorText}` };
      }
      
      const data = await response.json();
      
      return {
        success: true,
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        location: data.name,
        icon: data.weather[0].icon
      };
    } catch (error) {
      console.error('🧪 Test API error:', error);
      return { error: error.message };
    }
  }

  updateClockFormat(format) {
    this.updateSettings({ clockFormat: format });
  }

  // Get timezone from location (simplified mapping)
  getTimezoneFromLocation(location) {
    const locationLower = location.toLowerCase();
    
    // Simple timezone mapping for common locations
    const timezoneMap = {
      'new york': 'America/New_York',
      'london': 'Europe/London',
      'paris': 'Europe/Paris',
      'tokyo': 'Asia/Tokyo',
      'sydney': 'Australia/Sydney',
      'los angeles': 'America/Los_Angeles',
      'chicago': 'America/Chicago',
      'denver': 'America/Denver',
      'toronto': 'America/Toronto',
      'vancouver': 'America/Vancouver',
      'mexico city': 'America/Mexico_City',
      'sao paulo': 'America/Sao_Paulo',
      'madrid': 'Europe/Madrid',
      'berlin': 'Europe/Berlin',
      'rome': 'Europe/Rome',
      'moscow': 'Europe/Moscow',
      'beijing': 'Asia/Shanghai',
      'hong kong': 'Asia/Hong_Kong',
      'singapore': 'Asia/Singapore',
      'dubai': 'Asia/Dubai',
      'mumbai': 'Asia/Kolkata',
      'delhi': 'Asia/Kolkata',
      'cairo': 'Africa/Cairo',
      'johannesburg': 'Africa/Johannesburg',
      'lagos': 'Africa/Lagos',
      'nairobi': 'Africa/Nairobi'
    };
    
    // Try to find a match
    for (const [key, timezone] of Object.entries(timezoneMap)) {
      if (locationLower.includes(key)) {
        return timezone;
      }
    }
    
    // Default to UTC if no match found
    return 'UTC';
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

  // AI Assistant methods
  async sendAssistantMessage(message) {
    try {
      // This would typically call a ChatGPT API
      // For now, return a mock response
      const response = `I received your message: "${message}". I'm a smart home assistant and can help you control your devices.`;
      return response;
    } catch (error) {
      console.error('Error sending assistant message:', error);
      throw error;
    }
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
export default globalStore;
