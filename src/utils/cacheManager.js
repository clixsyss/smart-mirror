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
      // Only log warnings for non-expected errors (not SSL/certificate issues)
      const isExpectedError = error.message?.includes('CERT') || 
                              error.message?.includes('certificate') || 
                              error.message?.includes('Failed to fetch') ||
                              error.message?.includes('ERR_CERT');
      
      if (!isExpectedError) {
        console.warn(`Failed to fetch fresh data for ${key}, using cache:`, error);
      }
      
      // Fallback to cached data
      const cachedData = this.get(key);
      if (cachedData && !this.isExpired(key, maxAge)) {
        return cachedData;
      }
      // If no cached data or expired, return null instead of throwing error
      // This allows the calling function to handle the absence of data gracefully
      return null;
    }
  },

  // Clear specific cache entry
  clear: (key) => {
    try {
      localStorage.removeItem(key);
      console.log(`🗑️ Cleared cache for key: ${key}`);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  },

  // Clear all cache entries
  clearAll: () => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('🗑️ Cleared all cache entries');
    } catch (error) {
      console.warn('Failed to clear all cache:', error);
    }
  }
};