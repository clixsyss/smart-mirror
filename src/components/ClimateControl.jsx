import React, { useState, useCallback } from 'react';
import './ClimateControl.css';

const ClimateControl = ({ data, actions, userId }) => {
  const [animatingDevices, setAnimatingDevices] = useState(new Set());
  
  const { rooms = [] } = data || {};

  // More flexible function to check if a device is a climate device
  const isClimateDevice = useCallback((device) => {
    const deviceType = (device.type || '').toLowerCase();
    // More comprehensive list of air conditioning device type identifiers
    return [
      'thermostat', 
      'air_conditioner', 
      'ac', 
      'aircon', 
      'air conditioner', 
      'air-conditioning',
      'climate'
    ].includes(deviceType) || 
    // Also check if the device name includes AC-related terms
    (device.name || '').toLowerCase().includes('ac') ||
    (device.name || '').toLowerCase().includes('air conditioner') ||
    (device.name || '').toLowerCase().includes('air conditioning');
  }, []);

  // More flexible function to check if a device has temperature control
  const hasTemperatureControl = useCallback((device) => {
    const deviceType = (device.type || '').toLowerCase();
    return [
      'thermostat', 
      'air_conditioner', 
      'ac', 
      'aircon', 
      'air conditioner', 
      'air-conditioning',
      'climate'
    ].includes(deviceType) ||
    // Also check if the device name includes AC-related terms
    (device.name || '').toLowerCase().includes('ac') ||
    (device.name || '').toLowerCase().includes('air conditioner') ||
    (device.name || '').toLowerCase().includes('air conditioning');
  }, []);

  const toggleRoomClimate = useCallback(async (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    // Only include thermostats and air conditioners (not fans)
    const climateDevices = room.devices?.filter(isClimateDevice) || [];
    
    if (climateDevices.length === 0) return;

    // Determine if we should turn all climate devices on or off
    // Using "some" instead of "every" to handle mixed states better
    const anyDevicesOn = climateDevices.some(device => device.state);
    const newState = !anyDevicesOn; // Toggle based on whether any device is on

    try {
      // Update all climate devices in the room
      for (const device of climateDevices) {
        await actions.setClimateState(userId, roomId, device.id, newState);
      }
    } catch (error) {
      console.error('Error toggling room climate:', error);
    }
  }, [rooms, isClimateDevice, actions, userId]);

  const toggleDevice = useCallback(async (roomId, deviceId, currentState) => {
    const newState = !currentState;
    setAnimatingDevices(prev => new Set([...prev, deviceId]));
    
    try {
      await actions.setClimateState(userId, roomId, deviceId, newState);
    } catch (error) {
      console.error('Error toggling device:', error);
    } finally {
      setTimeout(() => {
        setAnimatingDevices(prev => {
          const newSet = new Set(prev);
          newSet.delete(deviceId);
          return newSet;
        });
      }, 300); // Reduced timeout for smoother experience
    }
  }, [actions, userId]);

  const updateTemperature = useCallback(async (roomId, deviceId, temperature) => {
    try {
      await actions.setClimateTemperature(userId, roomId, deviceId, temperature);
    } catch (error) {
      console.error('Error updating temperature:', error);
    }
  }, [actions, userId]);

  const updateMode = useCallback(async (roomId, deviceId, mode) => {
    try {
      await actions.setClimateMode(userId, roomId, deviceId, mode);
    } catch (error) {
      console.error('Error updating mode:', error);
    }
  }, [actions, userId]);

  // Always render the UI without loading or error states
  if (rooms.length === 0) {
    return (
      <div className="climate-control">
        <div className="loading">No rooms found</div>
      </div>
    );
  }

  return (
    <div className="climate-control">
      <div className="rooms-grid">
        {rooms.map((room, roomIndex) => {
          // Only include thermostats and air conditioners (not fans)
          const climateDevices = room.devices?.filter(isClimateDevice) || [];
          // Using "some" instead of "every" to handle mixed states better
          const anyDevicesOn = climateDevices.length > 0 && climateDevices.some(device => device.state);

          return (
            <div 
              key={room.id || `room-${roomIndex}`} 
              className={`room-card ${anyDevicesOn ? 'climate-on' : ''}`}
              onClick={(e) => {
                // Only toggle if clicking on the card itself, not on interactive elements
                if (e.target === e.currentTarget) {
                  toggleRoomClimate(room.id);
                }
              }}
            >
              <div className="room-header">
                <h3 className="room-name">{room.name}</h3>
                <button
                  className={`room-toggle ${anyDevicesOn ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRoomClimate(room.id);
                  }}
                >
                </button>
              </div>
              
              <div className="devices-list">
                {climateDevices.map((device, deviceIndex) => (
                  <div key={device.id || `device-${deviceIndex}`} className="device-item">
                    <div className="device-info">
                      <h4 className="device-name">{device.name}</h4>
                      <span className="device-type">{device.type}</span>
                    </div>
                    
                    <div className="device-controls">
                      <button
                        className={`device-toggle ${device.state ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDevice(room.id, device.id, device.state);
                        }}
                        disabled={animatingDevices.has(device.id)}
                      >
                      </button>
                      
                      {hasTemperatureControl(device) && device.temperature !== undefined && (
                        <>
                          <span className="temperature-display">{device.temperature}°C</span>
                          <input
                            type="range"
                            min="16"
                            max="30"
                            value={device.temperature || 22}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateTemperature(room.id, device.id, parseInt(e.target.value));
                            }}
                            className="temperature-slider"
                            disabled={!device.state}
                          />
                        </>
                      )}
                      
                      {device.modes && device.modes.length > 0 && (
                        <div className="mode-selector">
                          {device.modes.map(mode => (
                            <button
                              key={mode}
                              className={`mode-btn ${device.mode === mode ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateMode(room.id, device.id, mode);
                              }}
                              disabled={!device.state}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClimateControl;