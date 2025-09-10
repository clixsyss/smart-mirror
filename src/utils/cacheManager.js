// Cache Manager for Smart Mirror
// Handles localStorage caching with fallback functionality

export const cacheManager = {
  // Cache data with timestamp
  set: (key, data) => {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  },

  // Get cached data
  get: (key) => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.data;
      }
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
    }
    return null;
  },

  // Check if cache is expired (older than maxAge in milliseconds)
  isExpired: (key, maxAge = 15 * 60 * 1000) => { // 15 minutes default
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        return Date.now() - parsed.timestamp > maxAge;
      }
    } catch (error) {
      console.warn('Failed to check cache expiry:', error);
    }
    return true;
  },

  // Get fresh data or fallback to cache
  async fetchWithCache(key, fetchFunction, maxAge = 15 * 60 * 1000) {
    try {
      // Try to fetch fresh data
      const freshData = await fetchFunction();
      this.set(key, freshData);
      return freshData;
    } catch (error) {
      console.warn(`Failed to fetch fresh data for ${key}, using cache:`, error);
      // Fallback to cached data
      const cachedData = this.get(key);
      if (cachedData) {
        return cachedData;
      }
      throw new Error(`No cached data available for ${key}`);
    }
  }
};