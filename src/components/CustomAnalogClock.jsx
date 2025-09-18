import React, { useState, useEffect, useCallback } from 'react';
import { useGlobalStore } from '../hooks/useGlobalStore';
import './CustomAnalogClock.css';

const CustomAnalogClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { state, actions } = useGlobalStore();
  const [isMounted, setIsMounted] = useState(true);
  
  // Get settings for showing date and digital time
  const showAnalogDate = state.settings?.showAnalogDate !== false; // Default to true
  const showAnalogDigitalTime = state.settings?.showAnalogDigitalTime !== false; // Default to true

  // Update time every second
  const updateTime = useCallback(() => {
    if (isMounted) {
      setCurrentTime(new Date());
    }
  }, [isMounted]);

  useEffect(() => {
    const interval = setInterval(updateTime, 1000);
    return () => {
      clearInterval(interval);
      setIsMounted(false);
    };
  }, [updateTime]);

  // Get time components
  const hours = currentTime.getHours() % 12;
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();

  // Calculate angles for hands (360 degrees / 60 or 12 for smooth movement)
  const secondAngle = (seconds * 6); // 360/60 = 6 degrees per second
  const minuteAngle = (minutes * 6) + (seconds * 0.1); // Smooth minute movement
  const hourAngle = (hours * 30) + (minutes * 0.5); // Smooth hour movement

  // Format time for digital display
  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Format date
  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="custom-analog-clock">
      {/* SVG Clock - Fully Customizable */}
      <svg 
        width="300" 
        height="300" 
        viewBox="0 0 300 300" 
        className="clock-svg"
      >
        {/* Clock Face Background */}
        <defs>
          {/* Gradients for realistic effects */}
          <radialGradient id="clockFaceGradient" cx="0.3" cy="0.3">
            <stop offset="0%" stopColor="rgba(60, 60, 70, 0.9)" />
            <stop offset="50%" stopColor="rgba(30, 30, 40, 0.95)" />
            <stop offset="100%" stopColor="rgba(10, 10, 15, 1)" />
          </radialGradient>
          
          <radialGradient id="bezelGradient" cx="0.3" cy="0.3">
            <stop offset="0%" stopColor="rgba(120, 120, 130, 0.9)" />
            <stop offset="70%" stopColor="rgba(60, 60, 70, 0.95)" />
            <stop offset="100%" stopColor="rgba(20, 20, 25, 1)" />
          </radialGradient>

          {/* Hand gradients */}
          <linearGradient id="hourHandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
            <stop offset="50%" stopColor="rgba(200, 200, 210, 0.8)" />
            <stop offset="100%" stopColor="rgba(150, 150, 160, 0.7)" />
          </linearGradient>

          <linearGradient id="minuteHandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.95)" />
            <stop offset="50%" stopColor="rgba(220, 220, 230, 0.85)" />
            <stop offset="100%" stopColor="rgba(170, 170, 180, 0.75)" />
          </linearGradient>

          {/* Shadows */}
          <filter id="dropShadow">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3"/>
          </filter>

          <filter id="innerShadow">
            <feOffset dx="0" dy="2"/>
            <feGaussianBlur stdDeviation="2" result="offset-blur"/>
            <feFlood floodColor="#000000" floodOpacity="0.3"/>
            <feComposite in2="offset-blur" operator="in"/>
          </filter>
        </defs>

        {/* Outer Bezel */}
        <circle
          cx="150"
          cy="150"
          r="145"
          fill="url(#bezelGradient)"
          stroke="rgba(80, 80, 90, 0.6)"
          strokeWidth="2"
          filter="url(#dropShadow)"
        />

        {/* Inner Clock Face */}
        <circle
          cx="150"
          cy="150"
          r="135"
          fill="url(#clockFaceGradient)"
          stroke="rgba(100, 100, 110, 0.4)"
          strokeWidth="1"
        />

        {/* Hour Markers */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30) - 90; // Start from 12 o'clock
          const isMainHour = i % 3 === 0; // 12, 3, 6, 9
          const outerRadius = 125;
          const innerRadius = isMainHour ? 105 : 115;
          
          const x1 = 150 + Math.cos(angle * Math.PI / 180) * outerRadius;
          const y1 = 150 + Math.sin(angle * Math.PI / 180) * outerRadius;
          const x2 = 150 + Math.cos(angle * Math.PI / 180) * innerRadius;
          const y2 = 150 + Math.sin(angle * Math.PI / 180) * innerRadius;

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isMainHour ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.6)"}
              strokeWidth={isMainHour ? "3" : "1.5"}
              strokeLinecap="round"
            />
          );
        })}

        {/* Hour Numbers */}
        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour, i) => {
          const angle = (i * 30) - 90;
          const radius = 95;
          const x = 150 + Math.cos(angle * Math.PI / 180) * radius;
          const y = 150 + Math.sin(angle * Math.PI / 180) * radius;

          return (
            <text
              key={hour}
              x={x}
              y={y + 6} // Adjust for text baseline
              textAnchor="middle"
              fill="rgba(255, 255, 255, 0.9)"
              fontSize="18"
              fontWeight="600"
              fontFamily="'Times New Roman', serif"
            >
              {hour}
            </text>
          );
        })}

        {/* Hour Hand */}
        <line
          x1="150"
          y1="150"
          x2={150 + Math.cos((hourAngle - 90) * Math.PI / 180) * 60}
          y2={150 + Math.sin((hourAngle - 90) * Math.PI / 180) * 60}
          stroke="url(#hourHandGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          filter="url(#dropShadow)"
          style={{
            transition: 'all 0.5s ease-out'
          }}
        />

        {/* Minute Hand */}
        <line
          x1="150"
          y1="150"
          x2={150 + Math.cos((minuteAngle - 90) * Math.PI / 180) * 85}
          y2={150 + Math.sin((minuteAngle - 90) * Math.PI / 180) * 85}
          stroke="url(#minuteHandGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#dropShadow)"
          style={{
            transition: 'all 0.5s ease-out'
          }}
        />

        {/* Second Hand */}
        <line
          x1="150"
          y1="150"
          x2={150 + Math.cos((secondAngle - 90) * Math.PI / 180) * 100}
          y2={150 + Math.sin((secondAngle - 90) * Math.PI / 180) * 100}
          stroke="#ff4757"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            transition: seconds === 0 ? 'none' : 'all 0.1s ease-out'
          }}
        />

        {/* Center Dot */}
        <circle
          cx="150"
          cy="150"
          r="8"
          fill="url(#bezelGradient)"
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth="2"
          filter="url(#dropShadow)"
        />

        {/* Inner Center Dot */}
        <circle
          cx="150"
          cy="150"
          r="4"
          fill="rgba(255, 255, 255, 0.9)"
        />
      </svg>

      {/* Digital Time Display - Only show if enabled in settings */}
      {(showAnalogDigitalTime || showAnalogDate) && (
        <div className="digital-display">
          {showAnalogDigitalTime && (
            <div className="digital-time">{formatTime()}</div>
          )}
          {showAnalogDate && (
            <div className="digital-date">{formatDate()}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomAnalogClock;
