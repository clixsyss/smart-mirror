import { useState, useCallback } from 'react';
import './ShuttersControl.css';

const ShuttersControl = ({ data, actions, userId }) => {
  const [selectedRoom, setSelectedRoom] = useState('all');
  
  const rooms = data?.rooms || [];
  const shutters = rooms.flatMap(room => 
    room.devices?.filter(device => device.type === 'shutters') || []
  );

  const handleShutterToggle = useCallback(async (shutterId, action) => {
    if (actions && actions.updateSmartHomeDevice) {
      try {
        await actions.updateSmartHomeDevice(userId, shutterId, { action });
      } catch (error) {
        console.error('Error controlling shutter:', error);
      }
    }
  }, [actions, userId]);

  const handleShutterPosition = useCallback(async (shutterId, position) => {
    if (actions && actions.updateSmartHomeDevice) {
      try {
        await actions.updateSmartHomeDevice(userId, shutterId, { position });
      } catch (error) {
        console.error('Error setting shutter position:', error);
      }
    }
  }, [actions, userId]);

  const filteredShutters = selectedRoom === 'all' 
    ? shutters 
    : shutters.filter(shutter => shutter.room === selectedRoom);

  const uniqueRooms = [...new Set(shutters.map(shutter => shutter.room))];

  // Function to toggle shutter state (open/close)
  const toggleShutter = useCallback(async (shutterId, currentPosition) => {
    // Toggle between open (100) and closed (0)
    const newPosition = currentPosition > 50 ? 0 : 100; // If more than half open, close it; otherwise open it
    await handleShutterPosition(shutterId, newPosition);
  }, [handleShutterPosition]);

  return (
    <div className="shutters-control">
      {/* Room Filter */}
      {uniqueRooms.length > 1 && (
        <div className="room-selector">
          <select 
            value={selectedRoom} 
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="room-select"
          >
            <option value="all">All Rooms</option>
            {uniqueRooms.map(room => (
              <option key={room} value={room}>{room}</option>
            ))}
          </select>
        </div>
      )}

      {/* Shutters Grid */}
      <div className="shutters-grid">
        {filteredShutters.length === 0 ? (
          <div className="no-devices">
            <p>No shutters found</p>
          </div>
        ) : (
          filteredShutters.map(shutter => (
            <div 
              key={shutter.id} 
              className={`shutter-card ${shutter.position > 50 ? 'open' : ''}`}
              onClick={(e) => {
                // Only toggle if clicking on the card itself, not on interactive elements
                if (e.target === e.currentTarget) {
                  toggleShutter(shutter.id, shutter.position || 0);
                }
              }}
            >
              <div className="shutter-header">
                <h3>{shutter.name}</h3>
                <span className="shutter-room">{shutter.room}</span>
              </div>
              
              <div className="shutter-status">
                <div className="position-indicator">
                  <span>Position: {shutter.position || 0}%</span>
                  <div className="position-bar">
                    <div 
                      className="position-fill"
                      style={{ width: `${shutter.position || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="shutter-controls">
                <button 
                  className="control-btn open-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShutterToggle(shutter.id, 'open');
                  }}
                >
                  Open
                </button>
                
                <button 
                  className="control-btn close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShutterToggle(shutter.id, 'close');
                  }}
                >
                  Close
                </button>
                
                <button 
                  className="control-btn stop-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShutterToggle(shutter.id, 'stop');
                  }}
                >
                  Stop
                </button>
              </div>

              <div className="position-slider">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={shutter.position || 0}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleShutterPosition(shutter.id, parseInt(e.target.value));
                  }}
                  className="slider"
                />
                <div className="slider-labels">
                  <span>Closed</span>
                  <span>Open</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ShuttersControl;