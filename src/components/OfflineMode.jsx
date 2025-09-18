import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoImage from '../assets/logo.png';
import './OfflineMode.css';

const OfflineMode = ({ connectionStatus }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { connecting, attempts, lastConnected } = connectionStatus;

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

  const formatLastConnected = () => {
    if (!lastConnected) return 'Never';
    
    const now = Date.now();
    const diff = now - lastConnected;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const getConnectionMessage = () => {
    if (connecting) {
      return `Reconnecting... (Attempt ${attempts}/5)`;
    }
    return 'Connection Lost';
  };

  const getStatusColor = () => {
    if (connecting) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  };

  return (
    <div className="offline-mode">
      <div className="offline-background">
        {/* Animated Background Elements */}
        <div className="offline-particles">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="particle"
              animate={{
                y: [0, -100, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <motion.div
          className="offline-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header with Logo */}
          <div className="offline-header">
            <motion.div
              className="offline-logo"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <img 
                src={logoImage} 
                alt="Smart Mirror Logo" 
                className="offline-logo-image"
              />
            </motion.div>
            <h1 className="offline-title">Smart Mirror</h1>
          </div>
        </motion.div>

        {/* Clock Section */}
        <motion.div
          className="offline-clock-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <div className="offline-time">{formatTime()}</div>
          <div className="offline-date">{formatDate()}</div>
        </motion.div>

        {/* Connection Status */}
        <motion.div
          className="offline-status"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div className="status-indicator">
            <motion.div
              className="status-dot"
              animate={{
                scale: connecting ? [1, 1.5, 1] : 1,
                backgroundColor: getStatusColor(),
              }}
              transition={{
                scale: { duration: 1, repeat: connecting ? Infinity : 0 },
                backgroundColor: { duration: 0.3 }
              }}
            />
            <span className="status-text" style={{ color: getStatusColor() }}>
              {getConnectionMessage()}
            </span>
          </div>
          
          <div className="connection-details">
            <div className="detail-item">
              <span className="detail-label">Last Connected:</span>
              <span className="detail-value">{formatLastConnected()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className="detail-value">
                {connecting ? 'Attempting to reconnect...' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          className="offline-tips"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <h3>While Offline:</h3>
          <ul>
            <li>Clock and date continue to work</li>
            <li>Cached data may still be available</li>
            <li>Automatic reconnection in progress</li>
            <li>Check your internet connection</li>
          </ul>
        </motion.div>

        {/* Retry Button */}
        <motion.div
          className="offline-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <motion.button
            className="retry-btn"
            onClick={() => window.location.reload()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={connecting}
          >
            {connecting ? (
              <>
                <motion.div
                  className="spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Connecting...
              </>
            ) : (
              'Retry Connection'
            )}
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="offline-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          <p>Smart Mirror will automatically reconnect when internet is available</p>
        </motion.div>
      </div>
    </div>
  );
};

export default OfflineMode;