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

  const getTimezone = useCallback(() => {
    // Use manually selected timezone if available
    if (state.settings?.timezone) {
      return state.settings.timezone;
    }
    
    // Otherwise auto-detect from location
    const location = state.settings?.weatherLocation || 'New York, NY';
    return actions.getTimezoneFromLocation?.(location) || Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, [state.settings?.timezone, state.settings?.weatherLocation, actions]);

  const applyDstAdjustment = useCallback((date, timezone) => {
    // Get DST setting
    const dstSetting = state.settings?.dstAdjustment || 'auto';
    
    // If auto, don't adjust (let system handle it)
    if (dstSetting === 'auto') {
      return date;
    }
    
    // Check if the timezone actually observes DST
    try {
      // Create dates in January and July to check if timezone has DST
      const jan = new Date(date.getFullYear(), 0, 1);
      const jul = new Date(date.getFullYear(), 6, 1);
      
      const janOffset = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'longOffset'
      }).formatToParts(jan).find(part => part.type === 'timeZoneName').value;
      
      const julOffset = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'longOffset'
      }).formatToParts(jul).find(part => part.type === 'timeZoneName').value;
      
      const hasDst = janOffset !== julOffset;
      
      // If timezone doesn't observe DST, don't adjust
      if (!hasDst) {
        return date;
      }
      
      // Apply manual DST adjustment
      const adjustedDate = new Date(date);
      if (dstSetting === 'summer') {
        // Add one hour for summer time
        adjustedDate.setHours(adjustedDate.getHours() + 1);
      }
      // For winter time, we don't adjust as it's the standard time
      
      return adjustedDate;
    } catch (error) {
      console.warn('Could not determine DST status for timezone:', timezone, error);
      return date;
    }
  }, [state.settings?.dstAdjustment]);

  // Get time components with fallback to current time if needed
  const safeTime = currentTime || new Date();
  // Apply DST adjustment to the time
  const adjustedTime = applyDstAdjustment(safeTime, getTimezone());
  const hours = adjustedTime.getHours() % 12;
  const minutes = adjustedTime.getMinutes();
  const seconds = adjustedTime.getSeconds();
  const milliseconds = adjustedTime.getMilliseconds();

  // Calculate angles with smooth transitions
  const secondAngle = (seconds * 6) + (milliseconds * 0.006);
  const minuteAngle = (minutes * 6) + (seconds * 0.1);
  const hourAngle = (hours * 30) + (minutes * 0.5);

  const formatDate = useCallback((date) => {
    if (!date || isNaN(date.getTime())) return '';
    
    try {
      const timezone = getTimezone();
      const adjustedDate = applyDstAdjustment(date, timezone);
      
      return adjustedDate.toLocaleDateString('en-US', {
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
  }, [getTimezone, applyDstAdjustment]);

  const formatDigitalTime = useCallback(() => {
    if (!currentTime) return '--:--';
    
    try {
      const clockFormat = state.settings?.clockFormat || '24';
      const timezone = getTimezone();
      const adjustedDate = applyDstAdjustment(currentTime, timezone);
      
      return adjustedDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: clockFormat === '12',
        timeZone: timezone
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }, [currentTime, state.settings?.clockFormat, getTimezone, applyDstAdjustment]);

  // Number labels for all 12 hours
  const hourNumbers = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

  // Get settings with defaults
  const showDate = state.settings?.showAnalogDate !== false; // Default to true
  const showDigitalTime = state.settings?.showAnalogDigitalTime !== false; // Default to true

  return (
    <div className="analog-clock-container">
      <div className="analog-clock">
        <div className="clock-face">
          {/* Hour markers with numbers */}
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
              <div className="hour-number">{hourNumbers[i]}</div>
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
      {showDigitalTime && (
        <div className="digital-time-small">{formatDigitalTime()}</div>
      )}
      {showDate && (
        <div className="date">{formatDate(currentTime)}</div>
      )}
    </div>
  );
};

export default AnalogClock;