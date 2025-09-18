import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGlobalStore } from '../hooks/useGlobalStore';
import './PremiumAnalogClock.css';

const PremiumAnalogClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { state } = useGlobalStore();

  // Update time frequently for smooth second hand movement
  const updateTime = useCallback(() => {
    setCurrentTime(new Date());
  }, []);

  useEffect(() => {
    // Update every 50ms for ultra-smooth second hand
    const interval = setInterval(updateTime, 50);
    return () => clearInterval(interval);
  }, [updateTime]);

  // Get time components with milliseconds for smooth movement
  const now = currentTime;
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const milliseconds = now.getMilliseconds();

  // Calculate precise angles for smooth movement
  const secondAngle = (seconds * 6) + (milliseconds * 0.006);
  const minuteAngle = (minutes * 6) + (seconds * 0.1);
  const hourAngle = (hours * 30) + (minutes * 0.5);

  // Format time for digital display
  const formatTime = () => {
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = () => {
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="premium-analog-clock">
      <motion.div
        className="premium-watch-container"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {/* Watch Case */}
        <motion.div 
          className="premium-watch-case"
          whileHover={{ 
            scale: 1.02,
            rotateX: 5,
            rotateY: 5 
          }}
          transition={{ duration: 0.4 }}
        >
          {/* Digital Crown */}
          <motion.div 
            className="premium-digital-crown"
            whileHover={{ scale: 1.2, rotateZ: 30 }}
            whileTap={{ scale: 0.9 }}
            animate={{
              boxShadow: [
                "0 0 8px rgba(0, 255, 136, 0.4)",
                "0 0 16px rgba(0, 255, 136, 0.7)",
                "0 0 8px rgba(0, 255, 136, 0.4)"
              ]
            }}
            transition={{
              boxShadow: { duration: 2, repeat: Infinity }
            }}
          />

          {/* Watch Buttons */}
          <motion.div 
            className="premium-watch-button top" 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.9 }} 
          />
          <motion.div 
            className="premium-watch-button bottom" 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.9 }} 
          />

          {/* Watch Screen */}
          <motion.div className="premium-watch-screen">
            {/* Screen Reflection */}
            <motion.div 
              className="premium-screen-reflection"
              animate={{
                x: ["-100%", "100%", "-100%"]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Hour Markers */}
            {[...Array(12)].map((_, i) => {
              const angle = i * 30;
              const isMainHour = i % 3 === 0;
              
              return (
                <motion.div
                  key={i}
                  className={`premium-hour-marker ${isMainHour ? 'main' : ''}`}
                  style={{
                    transform: `rotate(${angle}deg) translateY(-90px)`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <motion.div 
                    className="premium-marker-line"
                    whileHover={{ 
                      scale: 1.3, 
                      boxShadow: "0 0 12px rgba(0, 255, 136, 0.8)" 
                    }}
                  />
                </motion.div>
              );
            })}

            {/* Hour Numbers */}
            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, i) => {
              const angle = i * 30;
              const radian = (angle - 90) * (Math.PI / 180);
              const x = Math.cos(radian) * 70;
              const y = Math.sin(radian) * 70;

              return (
                <motion.div
                  key={num}
                  className="premium-hour-number"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + (i * 0.05), duration: 0.4 }}
                  whileHover={{ 
                    scale: 1.4, 
                    color: "#00ff88",
                    textShadow: "0 0 20px rgba(0, 255, 136, 1)"
                  }}
                >
                  {num}
                </motion.div>
              );
            })}

            {/* Premium Watch Hands */}
            
            {/* Hour Hand */}
            <motion.div
              className="premium-clock-hand premium-hour-hand"
              animate={{ rotate: hourAngle }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 30
              }}
            >
              <motion.div 
                className="premium-hand-body hour"
                animate={{
                  boxShadow: [
                    "0 0 10px rgba(255, 255, 255, 0.4)",
                    "0 0 20px rgba(255, 255, 255, 0.7)",
                    "0 0 10px rgba(255, 255, 255, 0.4)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>

            {/* Minute Hand */}
            <motion.div
              className="premium-clock-hand premium-minute-hand"
              animate={{ rotate: minuteAngle }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 25
              }}
            >
              <motion.div 
                className="premium-hand-body minute"
                animate={{
                  boxShadow: [
                    "0 0 12px rgba(255, 255, 255, 0.5)",
                    "0 0 24px rgba(255, 255, 255, 0.8)",
                    "0 0 12px rgba(255, 255, 255, 0.5)"
                  ]
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </motion.div>

            {/* Second Hand */}
            <motion.div
              className="premium-clock-hand premium-second-hand"
              animate={{ rotate: secondAngle }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.1
              }}
            >
              <motion.div 
                className="premium-second-hand-body"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(0, 255, 136, 0.7)",
                    "0 0 40px rgba(0, 255, 136, 1)",
                    "0 0 20px rgba(0, 255, 136, 0.7)"
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div 
                className="premium-second-counterweight"
                animate={{
                  boxShadow: [
                    "0 0 15px rgba(0, 255, 136, 0.6)",
                    "0 0 30px rgba(0, 255, 136, 0.9)",
                    "0 0 15px rgba(0, 255, 136, 0.6)"
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>

            {/* Center Hub */}
            <motion.div
              className="premium-center-hub"
              whileHover={{ 
                scale: 1.2,
                boxShadow: "0 0 40px rgba(0, 255, 136, 1)"
              }}
              animate={{
                boxShadow: [
                  "0 0 25px rgba(255, 255, 255, 0.5)",
                  "0 0 50px rgba(0, 255, 136, 0.8)",
                  "0 0 25px rgba(255, 255, 255, 0.5)"
                ]
              }}
              transition={{
                boxShadow: { duration: 2, repeat: Infinity }
              }}
            >
              <motion.div 
                className="premium-center-ring"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="premium-center-core"
                animate={{ rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Digital Display */}
        <motion.div
          className="premium-digital-display"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <motion.div 
            className="premium-digital-time"
            animate={{
              textShadow: [
                "0 0 8px rgba(255, 255, 255, 0.4)",
                "0 0 20px rgba(0, 255, 136, 0.8)",
                "0 0 8px rgba(255, 255, 255, 0.4)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {formatTime()}
          </motion.div>
          
          <motion.div 
            className="premium-digital-date"
            animate={{
              color: [
                "rgba(255, 255, 255, 0.8)",
                "rgba(0, 255, 136, 0.9)",
                "rgba(255, 255, 255, 0.8)"
              ]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            {formatDate()}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PremiumAnalogClock;
