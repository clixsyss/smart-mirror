import React, { useState, useEffect } from 'react';
import logoImage from '../assets/logo.png';
import './OfflineMode.css';

const OfflineMode = ({ connectionStatus }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { online, connecting } = connectionStatus;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check for connection restoration
  useEffect(() => {
    let checkInterval;
    
    // If we're online, we shouldn't even be in this component
    // But just in case, we'll check periodically
    if (online) {
      // Try to reload immediately
      window.location.reload();
    } else {
      // Set up periodic checks to see if we're back online
      checkInterval = setInterval(() => {
        // Check if we're back online by testing navigator.onLine
        if (navigator.onLine) {
          // Try to reload the page
          window.location.reload();
        }
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [online]);

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="offline-mode-simple">
      <div className="offline-content">
        {/* Logo */}
        <div className="logo-container">
          <img 
            src={logoImage} 
            alt="Smart Mirror Logo" 
            className="offline-logo"
          />
        </div>
        
        {/* Digital Clock */}
        <div className="digital-clock-container">
          <div className="digital-time">{formatTime()}</div>
          <div className="digital-date">{formatDate()}</div>
        </div>
        
        {/* Status Message */}
        <div className="status-message">
          <p>{connecting ? 'Reconnecting...' : 'Connection Lost - Offline Mode'}</p>
        </div>
      </div>
    </div>
  );
};

export default OfflineMode;