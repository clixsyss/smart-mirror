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
    if (online) {
      // Automatically reload the page when connection is restored
      window.location.reload();
    }
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