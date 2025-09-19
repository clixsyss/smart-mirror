import { useState, useEffect } from 'react';
import { useGlobalStore } from '../hooks/useGlobalStore';
import AnalogClock from './AnalogClock';
import CustomAnalogClock from './CustomAnalogClock';
import CanvasAnalogClock from './CanvasAnalogClock';
import AnimatedAnalogClock from './AnimatedAnalogClock';
import CleanAnalogClock from './CleanAnalogClock';
import './TimeDate.css';

const TimeDate = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { state, actions } = useGlobalStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTimezone = () => {
    // Use manually selected timezone if available
    if (state.settings?.timezone) {
      return state.settings.timezone;
    }
    
    // Otherwise auto-detect from location
    const location = state.settings?.weatherLocation || 'New York, NY';
    return actions.getTimezoneFromLocation(location);
  };

  const applyDstAdjustment = (date, timezone) => {
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
  };

  const formatTime = (date) => {
    const clockFormat = state.settings?.clockFormat || '24';
    const timezone = getTimezone();
    
    // Apply DST adjustment if needed
    const adjustedDate = applyDstAdjustment(date, timezone);
    
    try {
      return adjustedDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: clockFormat === '12',
        timeZone: timezone
      });
    } catch (error) {
      console.error('Error formatting time with timezone:', timezone, error);
      // Fallback to system timezone
      return adjustedDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: clockFormat === '12'
      });
    }
  };

  const formatDate = (date) => {
    const timezone = getTimezone();
    
    // Apply DST adjustment if needed
    const adjustedDate = applyDstAdjustment(date, timezone);
    
    try {
      return adjustedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timezone
      });
    } catch (error) {
      console.error('Error formatting date with timezone:', timezone, error);
      // Fallback to system timezone
      return adjustedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Check clock type and style
  const clockType = state.settings?.clockType || 'digital';
  const clockStyle = state.settings?.clockStyle || 'clean'; // 'default', 'svg', 'canvas', 'animated', 'clean'

  if (clockType === 'analog') {
    // Choose which analog clock to render based on style setting
    switch (clockStyle) {
      case 'svg':
        return <CustomAnalogClock />;
      case 'canvas':
        return <CanvasAnalogClock />;
      case 'animated':
        return <AnimatedAnalogClock />;
      case 'clean':
        return <CleanAnalogClock />;
      case 'default':
      default:
        return <AnalogClock />;
    }
  }

  return (
    <div className="time-date">
      <div className="time">{formatTime(currentTime)}</div>
      <div className="date">{formatDate(currentTime)}</div>
    </div>
  );
};

export default TimeDate;