import React, { useState } from 'react';
import './FanControl.css';

const FanControl = ({ data, actions, userId }) => {
  const [animatingDevices, setAnimatingDevices] = useState(new Set());
  
  const { rooms = [], loading, error } = data || {};

  // Debug: Log the rooms and devices data
  React.useEffect(() => {
    if (rooms.length > 0) {
      console.log('FanControl - Rooms data:', rooms);
      
      // Collect all unique device types
      const allDeviceTypes = new Set();
      rooms.forEach(room => {
        console.log(`Room: ${room.name}`, room.devices);
        if (room.devices) {
          // Log all device types to see what we're working with
          room.devices.forEach(device => {
            console.log(`Device: ${device.name}, Type: ${device.type}, State: ${device.state}`);
            allDeviceTypes.add(device.type);
          });
          
          // More flexible filtering for fan devices (exclude climate devices)
          const fanDevices = room.devices.filter(d => {
            const deviceType = (d.type || '').toLowerCase();
            // Include fan devices but exclude climate devices
            const isFan = ['fan', 'ceiling fan', 'exhaust fan'].includes(deviceType);
            const isClimate = ['thermostat', 'air_conditioner', 'ac', 'aircon', 'air conditioner', 'air-conditioning'].includes(deviceType);
            return isFan && !isClimate;
          }) || [];
          console.log(`Fan devices in ${room.name}:`, fanDevices);
        }
      });
      
      console.log('All device types in the system:', Array.from(allDeviceTypes));
    }
  }, [rooms]);

  // More flexible function to check if a device is a fan (and not a climate device)
  const isFanDevice = (device) => {
    const deviceType = (device.type || '').toLowerCase();
    // Include fan devices but exclude climate devices
    const isFan = ['fan', 'ceiling fan', 'exhaust fan'].includes(deviceType);
    const isClimate = ['thermostat', 'air_conditioner', 'ac', 'aircon', 'air conditioner', 'air-conditioning'].includes(deviceType);
    return isFan && !isClimate;
  };

  const toggleRoomFans = async (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const fanDevices = room.devices?.filter(isFanDevice) || [];
    
    if (fanDevices.length === 0) return;

    // Determine if we should turn all fan devices on or off
    const allDevicesOn = fanDevices.every(device => device.state);
    const newState = !allDevicesOn;

    try {
      // Update all fan devices in the room
      for (const device of fanDevices) {
        await actions.setClimateState(userId, roomId, device.id, newState);
      }
    } catch (error) {
      console.error('Error toggling room fans:', error);
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

  const updateSpeed = async (roomId, deviceId, speed) => {
    try {
      await actions.setFanSpeed(userId, roomId, deviceId, speed);
    } catch (error) {
      console.error('Error updating fan speed:', error);
    }
  };

  if (loading) {
    return (
      <div className="fan-control">
        <div className="loading">Loading fan controls...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fan-control">
        <div className="error">Error loading fan controls: {error}</div>
      </div>
    );
  }

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
          
          // Debug: Log the filtered devices
          console.log(`Rendering room ${room.name} with ${fanDevices.length} fan devices`);

          const allDevicesOn = fanDevices.length > 0 && fanDevices.every(device => device.state);

          return (
            <div key={room.id || `room-${roomIndex}`} className="room-card">
              <div className="room-header">
                <h3 className="room-name">{room.name}</h3>
                <button
                  className={`room-toggle ${allDevicesOn ? 'active' : ''}`}
                  onClick={() => toggleRoomFans(room.id)}
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
                        onClick={() => toggleDevice(room.id, device.id, device.state)}
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
                            onChange={(e) => updateSpeed(room.id, device.id, parseInt(e.target.value))}
                            className="speed-slider"
                            disabled={!device.state}
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Debug: Show message if no fan devices found */}
                {fanDevices.length === 0 && room.devices && room.devices.length > 0 && (
                  <div className="no-devices-message">
                    No fan devices found in this room. 
                    Total devices: {room.devices.length}
                    <br />
                    Device types in this room: {room.devices.map(d => d.type).join(', ')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FanControl;