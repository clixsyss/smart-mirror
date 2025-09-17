import { useState } from 'react';
import './ShuttersControl.css';

const ShuttersControl = ({ data, actions, userId }) => {
  const [selectedRoom, setSelectedRoom] = useState('all');
  
  const rooms = data?.rooms || [];
  const shutters = rooms.flatMap(room => 
    room.devices?.filter(device => device.type === 'shutters') || []
  );

  const handleShutterToggle = async (shutterId, action) => {
    if (actions && actions.updateSmartHomeDevice) {
      try {
        await actions.updateSmartHomeDevice(userId, shutterId, { action });
      } catch (error) {
        console.error('Error controlling shutter:', error);
      }
    }
  };

  const handleShutterPosition = async (shutterId, position) => {
    if (actions && actions.updateSmartHomeDevice) {
      try {
        await actions.updateSmartHomeDevice(userId, shutterId, { position });
      } catch (error) {
        console.error('Error setting shutter position:', error);
      }
    }
  };

  const filteredShutters = selectedRoom === 'all' 
    ? shutters 
    : shutters.filter(shutter => shutter.room === selectedRoom);

  const uniqueRooms = [...new Set(shutters.map(shutter => shutter.room))];

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
            <div key={shutter.id} className="shutter-card">
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
                  onClick={() => handleShutterToggle(shutter.id, 'open')}
                >
                  Open
                </button>
                
                <button 
                  className="control-btn close-btn"
                  onClick={() => handleShutterToggle(shutter.id, 'close')}
                >
                  Close
                </button>
                
                <button 
                  className="control-btn stop-btn"
                  onClick={() => handleShutterToggle(shutter.id, 'stop')}
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
                  onChange={(e) => handleShutterPosition(shutter.id, parseInt(e.target.value))}
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
