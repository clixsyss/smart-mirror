import { useState, useEffect } from 'react';
import { useGlobalStore } from '../hooks/useGlobalStore';
import AnalogClock from './AnalogClock';
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

  const formatTime = (date) => {
    const clockFormat = state.settings?.clockFormat || '24';
    const location = state.settings?.weatherLocation || 'New York, NY';
    const timezone = actions.getTimezoneFromLocation(location);
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: clockFormat === '12',
      timeZone: timezone
    });
  };

  const formatDate = (date) => {
    const location = state.settings?.weatherLocation || 'New York, NY';
    const timezone = actions.getTimezoneFromLocation(location);
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone
    });
  };

  // Check if analog clock is enabled
  const clockType = state.settings?.clockType || 'digital';

  if (clockType === 'analog') {
    return <AnalogClock />;
  }

  return (
    <div className="time-date">
      <div className="time">{formatTime(currentTime)}</div>
      <div className="date">{formatDate(currentTime)}</div>
    </div>
  );
};

export default TimeDate;