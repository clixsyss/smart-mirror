import { useState, useEffect, useCallback } from 'react';

const useConnectivity = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastConnected, setLastConnected] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Test actual internet connectivity (not just network)
  const testInternetConnection = useCallback(async () => {
    try {
      // Try multiple endpoints for better reliability
      const endpoints = [
        'https://www.google.com/favicon.ico',
        'https://httpbin.org/status/200',
        'https://jsonplaceholder.typicode.com/posts/1',
        // Add your API endpoint here if you have one
        '/api/health' // Local health check if available
      ];

      // Try each endpoint with a timeout
      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await fetch(endpoint, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          
          // If we get here, we have internet
          return true;
        } catch (error) {
          // Try next endpoint
          continue;
        }
      }
      
      return false;
    } catch (error) {
      console.warn('Internet connectivity test failed:', error);
      return false;
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

  // Auto-retry connection with exponential backoff
  useEffect(() => {
    if (!isOnline) {
      // Calculate retry delay with exponential backoff (max 60 seconds)
      const baseDelay = 2000; // 2 seconds
      const maxDelay = 60000; // 60 seconds
      const delay = Math.min(baseDelay * Math.pow(2, connectionAttempts), maxDelay);
      
      console.log(`🔄 Will retry connection in ${delay / 1000}s (attempt ${connectionAttempts + 1})`);
      
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

  // Periodic connectivity check when online (every 30 seconds)
  useEffect(() => {
    if (isOnline) {
      const interval = setInterval(() => {
        checkConnectivity();
      }, 30000); // Check every 30 seconds when online

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
