import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGlobalStore } from '../hooks/useGlobalStore';
import './CleanAnalogClock.css';

const CleanAnalogClock = () => {
  const { state } = useGlobalStore();
  const [time, setTime] = useState(new Date());
  
  // Get settings for showing date and digital time
  const showAnalogDate = state.settings?.showAnalogDate !== false; // Default to true
  const showAnalogDigitalTime = state.settings?.showAnalogDigitalTime !== false; // Default to true

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // Calculate angles
  const secondAngle = seconds * 6; // 360/60 = 6 degrees per second
  const minuteAngle = minutes * 6 + seconds * 0.1; // Smooth minute movement
  const hourAngle = hours * 30 + minutes * 0.5; // Smooth hour movement

  const formatTime = () => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = () => {
    return time.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="clean-analog-clock">
      <motion.div
        className="clean-clock-container"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Perfect Circle Clock Face */}
        <div className="clean-clock-face">
          {/* Hour Markers */}
          {[...Array(12)].map((_, i) => {
            const angle = i * 30;
            const isMainHour = i % 3 === 0;
            
            return (
              <div
                key={i}
                className={`clean-hour-marker ${isMainHour ? 'main' : ''}`}
                style={{
                  transform: `rotate(${angle}deg)`,
                }}
              />
            );
          })}


          {/* Clock Hands */}
          
          {/* Hour Hand */}
          <motion.div
            className="clean-clock-hand clean-hour-hand"
            animate={{ rotate: hourAngle }}
            transition={{ type: "spring", stiffness: 100, damping: 30 }}
          />

          {/* Minute Hand */}
          <motion.div
            className="clean-clock-hand clean-minute-hand"
            animate={{ rotate: minuteAngle }}
            transition={{ type: "spring", stiffness: 120, damping: 25 }}
          />

          {/* Second Hand */}
          <motion.div
            className="clean-clock-hand clean-second-hand"
            animate={{ rotate: secondAngle }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />

          {/* Center Dot */}
          <div className="clean-center-dot" />
        </div>

        {/* Digital Display - Only show if enabled in settings */}
        {(showAnalogDigitalTime || showAnalogDate) && (
          <motion.div
            className="clean-digital-display"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            {showAnalogDigitalTime && (
              <div className="clean-digital-time">{formatTime()}</div>
            )}
            {showAnalogDate && (
              <div className="clean-digital-date">{formatDate()}</div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default CleanAnalogClock;
