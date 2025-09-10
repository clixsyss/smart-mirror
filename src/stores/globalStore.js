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
        throw new Error('OpenWeather API key not configured');
      }

      const weatherData = await cacheManager.fetchWithCache('weather', async () => {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${apiKey}&units=metric`
        );
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
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
      console.error('Weather fetch error:', error);
      // Use fallback data
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
      
      this.updateSection('smartHome', {
        rooms,
        devices,
        loading: false,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Smart home fetch error:', error);
      // Provide fallback empty data instead of error
      this.updateSection('smartHome', {
        rooms: [],
        devices: [],
        loading: false,
        lastUpdated: Date.now()
      });
    }
  }

  // Initialize all data
  async initialize(userId) {
    if (this.state.app.isInitialized) return;
    
    console.log('🚀 Initializing global store...');
    
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
      this.startBackgroundRefresh();
      console.log('✅ Global store initialized');
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
    console.log('🔄 Manual refresh triggered');
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
