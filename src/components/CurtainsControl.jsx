import { useState } from 'react';
import './CurtainsControl.css';

const CurtainsControl = ({ data, actions, userId }) => {
  const [selectedRoom, setSelectedRoom] = useState('all');
  
  const rooms = data?.rooms || [];
  const curtains = rooms.flatMap(room => 
    room.devices?.filter(device => device.type === 'curtains') || []
  );

  const handleCurtainToggle = async (curtainId, action) => {
    if (actions && actions.updateSmartHomeDevice) {
      try {
        await actions.updateSmartHomeDevice(userId, curtainId, { action });
      } catch (error) {
        console.error('Error controlling curtain:', error);
      }
    }
  };

  const handleCurtainPosition = async (curtainId, position) => {
    if (actions && actions.updateSmartHomeDevice) {
      try {
        await actions.updateSmartHomeDevice(userId, curtainId, { position });
      } catch (error) {
        console.error('Error setting curtain position:', error);
      }
    }
  };

  const filteredCurtains = selectedRoom === 'all' 
    ? curtains 
    : curtains.filter(curtain => curtain.room === selectedRoom);

  const uniqueRooms = [...new Set(curtains.map(curtain => curtain.room))];

  return (
    <div className="curtains-control">
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

      {/* Curtains Grid */}
      <div className="curtains-grid">
        {filteredCurtains.length === 0 ? (
          <div className="no-devices">
            <p>No curtains found</p>
          </div>
        ) : (
          filteredCurtains.map(curtain => (
            <div key={curtain.id} className="curtain-card">
              <div className="curtain-header">
                <h3>{curtain.name}</h3>
                <span className="curtain-room">{curtain.room}</span>
              </div>
              
              <div className="curtain-status">
                <div className="position-indicator">
                  <span>Position: {curtain.position || 0}%</span>
                  <div className="position-bar">
                    <div 
                      className="position-fill"
                      style={{ width: `${curtain.position || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="curtain-controls">
                <button 
                  className="control-btn open-btn"
                  onClick={() => handleCurtainToggle(curtain.id, 'open')}
                >
                  Open
                </button>
                
                <button 
                  className="control-btn close-btn"
                  onClick={() => handleCurtainToggle(curtain.id, 'close')}
                >
                  Close
                </button>
                
                <button 
                  className="control-btn stop-btn"
                  onClick={() => handleCurtainToggle(curtain.id, 'stop')}
                >
                  Stop
                </button>
              </div>

              <div className="position-slider">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={curtain.position || 0}
                  onChange={(e) => handleCurtainPosition(curtain.id, parseInt(e.target.value))}
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

export default CurtainsControl;
