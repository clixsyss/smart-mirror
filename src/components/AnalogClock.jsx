import React, { useState, useEffect, useCallback } from 'react';
import { useGlobalStore } from '../hooks/useGlobalStore';
import './AnalogClock.css';

const AnalogClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { state, actions } = useGlobalStore();
  const [isMounted, setIsMounted] = useState(true);

  // Memoize the time update function
  const updateTime = useCallback(() => {
    if (isMounted) {
      setCurrentTime(new Date());
    }
  }, [isMounted]);

  useEffect(() => {
    // Set up animation frame for smoother updates
    let animationFrameId;
    let lastUpdateTime = 0;
    const updateInterval = 50; // Update every 50ms for smooth animation

    const animate = (timestamp) => {
      if (!lastUpdateTime || timestamp - lastUpdateTime >= updateInterval) {
        updateTime();
        lastUpdateTime = timestamp;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      setIsMounted(false);
    };
  }, [updateTime]);

  // Get time components with fallback to current time if needed
  const safeTime = currentTime || new Date();
  const hours = safeTime.getHours() % 12;
  const minutes = safeTime.getMinutes();
  const seconds = safeTime.getSeconds();
  const milliseconds = safeTime.getMilliseconds();

  // Calculate angles with smooth transitions
  const secondAngle = (seconds * 6) + (milliseconds * 0.006);
  const minuteAngle = (minutes * 6) + (seconds * 0.1);
  const hourAngle = (hours * 30) + (minutes * 0.5);

  const formatDate = useCallback((date) => {
    if (!date || isNaN(date.getTime())) return '';
    
    try {
      const location = state.settings?.weatherLocation || 'New York, NY';
      const timezone = actions.getTimezoneFromLocation?.(location) || Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timezone
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return date?.toLocaleDateString() || '';
    }
  }, [state.settings?.weatherLocation, actions]);

  const formatDigitalTime = useCallback(() => {
    if (!currentTime) return '--:--';
    
    try {
      const clockFormat = state.settings?.clockFormat || '24';
      const location = state.settings?.weatherLocation || 'New York, NY';
      const timezone = actions.getTimezoneFromLocation?.(location) || Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      return currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: clockFormat === '12',
        timeZone: timezone
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }, [currentTime, state.settings?.clockFormat, state.settings?.weatherLocation, actions]);

  return (
    <div className="analog-clock-container">
      <div className="analog-clock">
        <div className="clock-face">
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="hour-marker"
              style={{
                '--rotation': i * 30,
                transform: `rotate(${i * 30}deg) translateY(-100px)`
              }}
            >
              <div className="marker-line"></div>
            </div>
          ))}
          
          {/* Clock hands */}
          <div
            className="clock-hand hour-hand"
            style={{
              transform: `rotate(${hourAngle}deg)`
            }}
          ></div>
          
          <div
            className="clock-hand minute-hand"
            style={{
              transform: `rotate(${minuteAngle}deg)`
            }}
          ></div>
          
          <div
            className="clock-hand second-hand"
            style={{
              transform: `rotate(${secondAngle}deg)`
            }}
          ></div>
          
          {/* Center dot */}
          <div className="clock-center"></div>
        </div>
      </div>
      
      {/* Digital time display below analog clock */}
      <div className="digital-time-small">{formatDigitalTime()}</div>
      <div className="date">{formatDate(currentTime)}</div>
    </div>
  );
};

export default AnalogClock;
