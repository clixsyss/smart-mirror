import { useState, useEffect, useCallback } from 'react';

const useConnectivity = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastConnected, setLastConnected] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Test actual internet connectivity (not just network)
  const testInternetConnection = useCallback(async () => {
    try {
      // For deployed apps (like Netlify), rely more on navigator.onLine
      // and simple connectivity tests to avoid CORS issues
      if (!navigator.onLine) {
        return false;
      }

      // Simple connectivity test with reliable endpoints
      const endpoints = [
        'https://www.google.com/favicon.ico',
        'https://httpbin.org/get',
        'https://jsonplaceholder.typicode.com/posts/1'
      ];

      // Try just one endpoint with shorter timeout for better UX
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      try {
        const response = await fetch(endpoints[0], {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        // For no-cors requests, if we don't get an error, assume we have internet
        return true;
      } catch (error) {
        clearTimeout(timeoutId);
        
        // If first endpoint fails, try a simple CORS-enabled endpoint
        try {
          const fallbackController = new AbortController();
          const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 2000);
          
          const fallbackResponse = await fetch(endpoints[2], {
            method: 'GET',
            signal: fallbackController.signal
          });
          
          clearTimeout(fallbackTimeoutId);
          return fallbackResponse.ok;
        } catch (fallbackError) {
          return false;
        }
      }
    } catch (error) {
      console.warn('Internet connectivity test failed:', error);
      // Fallback to navigator.onLine for deployed environments
      return navigator.onLine;
    }
  }, []);

  // Check connectivity status
  const checkConnectivity = useCallback(async () => {
    setIsConnecting(true);
    setConnectionAttempts(prev => prev + 1);
    
    const hasInternet = await testInternetConnection();
    
    if (hasInternet !== isOnline) {
      setIsOnline(hasInternet);
      if (hasInternet) {
        setLastConnected(new Date());
        setConnectionAttempts(0);
        console.log('✅ Internet connection restored');
      } else {
        console.log('❌ Internet connection lost');
      }
    }
    
    setIsConnecting(false);
    return hasInternet;
  }, [isOnline, testInternetConnection]);

  // Auto-retry connection with exponential backoff (less aggressive for deployed apps)
  useEffect(() => {
    if (!isOnline && connectionAttempts < 5) { // Limit retry attempts
      // Calculate retry delay with exponential backoff (max 30 seconds for deployed environments)
      const baseDelay = 5000; // 5 seconds (longer initial delay)
      const maxDelay = 30000; // 30 seconds (shorter max delay)
      const delay = Math.min(baseDelay * Math.pow(1.5, connectionAttempts), maxDelay);
      
      console.log(`🔄 Will retry connection in ${delay / 1000}s (attempt ${connectionAttempts + 1}/5)`);
      
      const retryTimeout = setTimeout(() => {
        checkConnectivity();
      }, delay);

      return () => clearTimeout(retryTimeout);
    }
  }, [isOnline, connectionAttempts, checkConnectivity]);

  // Listen for browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('📶 Browser detected online');
      checkConnectivity();
    };

    const handleOffline = () => {
      console.log('📵 Browser detected offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connectivity check
    checkConnectivity();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnectivity]);

  // Periodic connectivity check when online (less frequent for deployed apps)
  useEffect(() => {
    if (isOnline) {
      const interval = setInterval(() => {
        checkConnectivity();
      }, 60000); // Check every 60 seconds when online (less aggressive)

      return () => clearInterval(interval);
    }
  }, [isOnline, checkConnectivity]);

  return {
    isOnline,
    isConnecting,
    lastConnected,
    connectionAttempts,
    checkConnectivity,
    // Utility functions
    getConnectionStatus: () => ({
      online: isOnline,
      connecting: isConnecting,
      attempts: connectionAttempts,
      lastConnected: lastConnected
    })
  };
};

export default useConnectivity;
