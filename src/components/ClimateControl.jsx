import React, { useState } from 'react';
import './ClimateControl.css';

const ClimateControl = ({ data, actions, userId }) => {
  const [animatingDevices, setAnimatingDevices] = useState(new Set());
  
  const { rooms = [], loading, error } = data || {};

  const toggleRoomClimate = async (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const climateDevices = room.devices?.filter(d => 
      ['thermostat', 'fan', 'air_conditioner'].includes(d.type)
    ) || [];
    
    if (climateDevices.length === 0) return;

    // Determine if we should turn all climate devices on or off
    const allDevicesOn = climateDevices.every(device => device.state);
    const newState = !allDevicesOn;

    try {
      // Update all climate devices in the room
      for (const device of climateDevices) {
        await actions.setClimateState(userId, roomId, device.id, newState);
      }
    } catch (error) {
      console.error('Error toggling room climate:', error);
    }
  };

  const toggleDevice = async (roomId, deviceId, currentState) => {
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
      }, 500);
    }
  };

  const updateTemperature = async (roomId, deviceId, temperature) => {
    try {
      await actions.setClimateTemperature(userId, roomId, deviceId, temperature);
    } catch (error) {
      console.error('Error updating temperature:', error);
    }
  };

  const updateMode = async (roomId, deviceId, mode) => {
    try {
      await actions.setClimateMode(userId, roomId, deviceId, mode);
    } catch (error) {
      console.error('Error updating mode:', error);
    }
  };

  if (loading) {
    return (
      <div className="climate-control">
        <div className="loading">Loading climate controls...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="climate-control">
        <div className="error">Error loading climate controls: {error}</div>
      </div>
    );
  }

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
          const climateDevices = room.devices?.filter(d => 
            ['thermostat', 'fan', 'air_conditioner'].includes(d.type)
          ) || [];
          
          const allDevicesOn = climateDevices.length > 0 && climateDevices.every(device => device.state);
          const someDevicesOn = climateDevices.some(device => device.state);

          return (
            <div key={room.id || `room-${roomIndex}`} className="room-card">
              <div className="room-header">
                <h3 className="room-name">{room.name}</h3>
                <button
                  className={`room-toggle ${allDevicesOn ? 'active' : ''}`}
                  onClick={() => toggleRoomClimate(room.id)}
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
                        onClick={() => toggleDevice(room.id, device.id, device.state)}
                        disabled={animatingDevices.has(device.id)}
                      >
                      </button>
                      
                      {device.temperature !== undefined && (
                        <>
                          <span className="temperature-display">{device.temperature}°C</span>
                          <input
                            type="range"
                            min="16"
                            max="30"
                            value={device.temperature || 22}
                            onChange={(e) => updateTemperature(room.id, device.id, parseInt(e.target.value))}
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
                              onClick={() => updateMode(room.id, device.id, mode)}
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