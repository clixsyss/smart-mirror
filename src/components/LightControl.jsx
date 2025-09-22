import React, { useState, useCallback } from 'react';
import './LightControl.css';

const LightControl = ({ data, actions, userId }) => {
  const [animatingLights, setAnimatingLights] = useState(new Set());
  
  const { rooms = [] } = data || {};

  const toggleRoomLights = useCallback(async (roomId) => {
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
    // Using "some" instead of "every" to handle mixed states better
    const anyLightsOn = lightDevices.some(device => device.state);
    const newState = !anyLightsOn; // Toggle based on whether any light is on

    try {
      // Update all light devices in the room
      for (const device of lightDevices) {
        await actions.toggleLight(userId, roomId, device.id, newState);
      }
    } catch (error) {
      console.error('Error toggling room lights:', error);
    }
  }, [rooms, actions, userId]);

  const toggleDevice = useCallback(async (roomId, deviceId, currentState) => {
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
      // Remove animation class after a short delay
      setTimeout(() => {
        setAnimatingLights(prev => {
          const newSet = new Set(prev);
          newSet.delete(deviceId);
          return newSet;
        });
      }, 300);
    }
  }, [actions, userId]);

  const updateBrightness = useCallback(async (roomId, deviceId, brightness) => {
    if (!deviceId) {
      console.error('Device ID is null or undefined');
      return;
    }
    
    try {
      await actions.setLightBrightness(userId, roomId, deviceId, brightness);
    } catch (error) {
      console.error('Error updating brightness:', error);
    }
  }, [actions, userId]);

  // Always render the UI without loading or error states
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
          // Using "some" instead of "every" to handle mixed states better
          const anyLightsOn = lightDevices.length > 0 && lightDevices.some(device => device.state);

          return (
            <div 
              key={room.id || `room-${roomIndex}`} 
              className={`room-card ${anyLightsOn ? 'lights-on' : ''}`}
              onClick={(e) => {
                // Simplified click handling - always toggle when clicking the card
                // Check if we're not clicking on an interactive element
                if (!e.target.closest('.device-toggle') && 
                    !e.target.closest('.brightness-slider') && 
                    !e.target.closest('.brightness-value')) {
                  toggleRoomLights(room.id);
                }
              }}
            >
              <div className="room-header">
                <h3 className="room-name">{room.name}</h3>
                <button
                  className={`room-toggle ${anyLightsOn ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRoomLights(room.id);
                  }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDevice(room.id, device.id, device.state);
                        }}
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
                            onChange={(e) => {
                              e.stopPropagation();
                              updateBrightness(room.id, device.id, parseInt(e.target.value));
                            }}
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