import React, { useState, useCallback } from 'react';
import './FanControl.css';

const FanControl = ({ data, actions, userId }) => {
  const [animatingDevices, setAnimatingDevices] = useState(new Set());
  
  const { rooms = [] } = data || {};

  // More flexible function to check if a device is a fan (and not a climate device)
  const isFanDevice = useCallback((device) => {
    const deviceType = (device.type || '').toLowerCase();
    // Include fan devices but exclude climate devices
    const isFan = ['fan', 'ceiling fan', 'exhaust fan'].includes(deviceType);
    const isClimate = ['thermostat', 'air_conditioner', 'ac', 'aircon', 'air conditioner', 'air-conditioning'].includes(deviceType);
    return isFan && !isClimate;
  }, []);

  const toggleRoomFans = useCallback(async (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const fanDevices = room.devices?.filter(isFanDevice) || [];
    
    if (fanDevices.length === 0) return;

    // Determine if we should turn all fan devices on or off
    // Using "some" instead of "every" to handle mixed states better
    const anyDevicesOn = fanDevices.some(device => device.state);
    const newState = !anyDevicesOn; // Toggle based on whether any fan is on

    try {
      // Update all fan devices in the room
      for (const device of fanDevices) {
        await actions.setClimateState(userId, roomId, device.id, newState);
      }
    } catch (error) {
      console.error('Error toggling room fans:', error);
    }
  }, [rooms, isFanDevice, actions, userId]);

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

  const updateSpeed = useCallback(async (roomId, deviceId, speed) => {
    try {
      await actions.setFanSpeed(userId, roomId, deviceId, speed);
    } catch (error) {
      console.error('Error updating fan speed:', error);
    }
  }, [actions, userId]);

  // Always render the UI without loading or error states
  if (rooms.length === 0) {
    return (
      <div className="fan-control">
        <div className="loading">No rooms found</div>
      </div>
    );
  }

  return (
    <div className="fan-control">
      <div className="rooms-grid">
        {rooms.map((room, roomIndex) => {
          const fanDevices = room.devices?.filter(isFanDevice) || [];
          // Using "some" instead of "every" to handle mixed states better
          const anyDevicesOn = fanDevices.length > 0 && fanDevices.some(device => device.state);

          return (
            <div 
              key={room.id || `room-${roomIndex}`} 
              className={`room-card ${anyDevicesOn ? 'fan-on' : ''}`}
              onClick={(e) => {
                // Only toggle if clicking on the card itself, not on interactive elements
                if (e.target === e.currentTarget) {
                  toggleRoomFans(room.id);
                }
              }}
            >
              <div className="room-header">
                <h3 className="room-name">{room.name}</h3>
                <button
                  className={`room-toggle ${anyDevicesOn ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRoomFans(room.id);
                  }}
                >
                </button>
              </div>
              
              <div className="devices-list">
                {fanDevices.map((device, deviceIndex) => (
                  <div key={device.id || `device-${deviceIndex}`} className="device-item">
                    <div className="device-info">
                      <h4 className="device-name">{device.name}</h4>
                      <span className="device-type">Fan</span>
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
                      
                      {device.speed !== undefined && (
                        <>
                          <span className="speed-display">Speed {device.speed}</span>
                          <input
                            type="range"
                            min="1"
                            max={device.maxSpeed || 5}
                            value={device.speed || 1}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateSpeed(room.id, device.id, parseInt(e.target.value));
                            }}
                            className="speed-slider"
                            disabled={!device.state}
                          />
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

export default FanControl;