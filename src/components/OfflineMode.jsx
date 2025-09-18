import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './OfflineMode.css';

const OfflineMode = ({ connectionStatus }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { connecting, attempts, lastConnected } = connectionStatus;

  // Update time every second using system time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const getConnectionMessage = () => {
    if (connecting) {
      return `Attempting to reconnect... (Attempt ${attempts})`;
    }
    
    if (attempts > 0) {
      const nextRetry = Math.min(2 * Math.pow(2, attempts - 1), 60);
      return `Connection failed. Retrying in ${nextRetry} seconds...`;
    }
    
    return 'Checking internet connection...';
  };

  const getStatusIcon = () => {
    if (connecting) {
      return (
        <motion.div
          className="status-icon connecting"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          🔄
        </motion.div>
      );
    }
    
    return (
      <motion.div
        className="status-icon offline"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        📡
      </motion.div>
    );
  };

  return (
    <div className="offline-mode">
      {/* Animated Background */}
      <div className="offline-background">
        <div className="offline-particles">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="particle"
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
              style={{
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        className="offline-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        {/* Logo Section */}
        <motion.div
          className="offline-logo-section"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="offline-logo">
            <motion.div
              className="logo-icon"
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(255, 255, 255, 0.3)",
                  "0 0 40px rgba(255, 255, 255, 0.6)",
                  "0 0 20px rgba(255, 255, 255, 0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🏠
            </motion.div>
            <h1 className="offline-title">Smart Mirror</h1>
            <p className="offline-subtitle">Kiosk Mode</p>
          </div>
        </motion.div>

        {/* Clock Section */}
        <motion.div
          className="offline-clock-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <motion.div
            className="offline-time"
            key={currentTime.getSeconds()} // Re-trigger animation every second
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1 }}
          >
            {formatTime()}
          </motion.div>
          <div className="offline-date">{formatDate()}</div>
        </motion.div>

        {/* Connection Status */}
        <motion.div
          className="offline-status-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="status-container">
            {getStatusIcon()}
            <div className="status-messages">
              <h3 className="status-title">Internet Connection Required</h3>
              <AnimatePresence mode="wait">
                <motion.p
                  key={getConnectionMessage()}
                  className="status-message"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {getConnectionMessage()}
                </motion.p>
              </AnimatePresence>
              
              <div className="connection-details">
                <p className="detail-text">
                  Please check your network connection and ensure your device is connected to the internet.
                </p>
                {lastConnected && (
                  <p className="last-connected">
                    Last connected: {lastConnected.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Connection Progress */}
        <motion.div
          className="connection-progress"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              animate={{
                width: connecting ? ['0%', '100%'] : '0%',
              }}
              transition={{
                duration: connecting ? 3 : 0,
                repeat: connecting ? Infinity : 0,
              }}
            />
          </div>
          <div className="progress-dots">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="progress-dot"
                animate={{
                  opacity: connecting ? [0.3, 1, 0.3] : 0.3,
                }}
                transition={{
                  duration: 1.5,
                  repeat: connecting ? Infinity : 0,
                  delay: i * 0.5,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Troubleshooting Tips */}
        <motion.div
          className="offline-tips"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <details className="tips-accordion">
            <summary>Troubleshooting Tips</summary>
            <div className="tips-content">
              <ul>
                <li>Check if your WiFi is connected</li>
                <li>Restart your router if needed</li>
                <li>Verify internet service with your provider</li>
                <li>The system will automatically reconnect when internet is restored</li>
              </ul>
            </div>
          </details>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OfflineMode;
