import React, { useState } from 'react';
import './LightControl.css';

const LightControl = ({ data, actions, userId }) => {
  const [animatingLights, setAnimatingLights] = useState(new Set());
  
  const { rooms = [], loading, error } = data || {};
  
  // Debug: Check what rooms we're getting
  console.log('🔍 LightControl rooms data:', rooms.map(r => ({ id: r.id, name: r.name })));

  const toggleRoomLights = async (roomId) => {
    console.log('🔍 toggleRoomLights called with roomId:', roomId);
    console.log('🔍 Available rooms:', rooms.map(r => ({ id: r.id, name: r.name })));
    
    if (!roomId) {
      console.error('❌ Room ID is null or undefined');
      return;
    }
    
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      console.error('Room not found with ID:', roomId);
      return;
    }

    const lightDevices = room.devices?.filter(d => d.type === 'light') || [];
    if (lightDevices.length === 0) return;

    // Determine if we should turn all lights on or off
    const allLightsOn = lightDevices.every(device => device.state);
    const newState = !allLightsOn;

    try {
      // Update all light devices in the room
      for (const device of lightDevices) {
        await actions.toggleLight(userId, roomId, device.id, newState);
      }
    } catch (error) {
      console.error('Error toggling room lights:', error);
    }
  };

  const toggleDevice = async (roomId, deviceId, currentState) => {
    if (!roomId) {
      console.error('Room ID is null or undefined');
      return;
    }
    if (!deviceId) {
      console.error('Device ID is null or undefined');
      return;
    }
    
    const newState = !currentState;
    setAnimatingLights(prev => new Set([...prev, deviceId]));
    
    try {
      await actions.toggleLight(userId, roomId, deviceId, newState);
    } catch (error) {
      console.error('Error toggling device:', error);
    } finally {
      setTimeout(() => {
        setAnimatingLights(prev => {
          const newSet = new Set(prev);
          newSet.delete(deviceId);
          return newSet;
        });
      }, 500);
    }
  };

  const updateBrightness = async (roomId, deviceId, brightness) => {
    if (!deviceId) {
      console.error('Device ID is null or undefined');
      return;
    }
    
    try {
      await actions.setLightBrightness(userId, roomId, deviceId, brightness);
    } catch (error) {
      console.error('Error updating brightness:', error);
    }
  };

  if (loading) {
    return (
      <div className="light-control">
        <div className="loading">Loading lights...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="light-control">
        <div className="error">Error loading lights: {error}</div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="light-control">
        <div className="loading">No rooms found</div>
      </div>
    );
  }

  return (
    <div className="light-control">
      <div className="rooms-grid">
        {rooms.map((room, roomIndex) => {
          const lightDevices = room.devices?.filter(d => d.type === 'light') || [];
          const allLightsOn = lightDevices.length > 0 && lightDevices.every(device => device.state);
          const someLightsOn = lightDevices.some(device => device.state);

          return (
            <div key={room.id || `room-${roomIndex}`} className="room-card">
              <div className="room-header">
                <h3 className="room-name">{room.name}</h3>
                <button
                  className={`room-toggle ${allLightsOn ? 'active' : ''}`}
                  onClick={() => toggleRoomLights(room.id)}
                >
                </button>
              </div>
              
              <div className="devices-list">
                {lightDevices.map((device, index) => (
                  <div key={device.id || `device-${index}`} className="device-item">
                    <div className="device-info">
                      <h4 className="device-name">{device.name}</h4>
                      <span className="device-type">{device.type}</span>
                    </div>
                    
                    <div className="device-controls">
                      <button
                        className={`device-toggle ${device.state ? 'active' : ''}`}
                        onClick={() => toggleDevice(room.id, device.id, device.state)}
                        disabled={animatingLights.has(device.id)}
                      >
                      </button>
                      
                      {device.brightness !== undefined && (
                        <>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={device.brightness || 0}
                            onChange={(e) => updateBrightness(room.id, device.id, parseInt(e.target.value))}
                            className="brightness-slider"
                            disabled={!device.state}
                          />
                          <span className="brightness-value">{device.brightness || 0}%</span>
                        </>
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

export default LightControl;