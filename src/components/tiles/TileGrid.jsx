import { memo, useMemo } from 'react';
import { useEnvironment } from '../../hooks/useEnvironment';
import LightsTile from './LightsTile';
import ClimateTile from './ClimateTile';
import './tiles.css';

// Placeholder tiles for other device types (can be expanded)
const FanTile = memo(({ roomId, onClick }) => (
  <div className="tile tile-medium" onClick={onClick}>
    <div className="tile-header">
      <div className="tile-icon">🌀</div>
      <div className="tile-title-group">
        <h3 className="tile-title">Fans</h3>
        <p className="tile-subtitle">Coming soon</p>
      </div>
    </div>
  </div>
));

FanTile.displayName = 'FanTile';

const CurtainsTile = memo(({ roomId, onClick }) => (
  <div className="tile tile-medium" onClick={onClick}>
    <div className="tile-header">
      <div className="tile-icon">🪟</div>
      <div className="tile-title-group">
        <h3 className="tile-title">Curtains</h3>
        <p className="tile-subtitle">Coming soon</p>
      </div>
    </div>
  </div>
));

CurtainsTile.displayName = 'CurtainsTile';

const TileGrid = memo(({ 
  roomId = null, 
  onTileClick = null,
  showRoomSelector = true 
}) => {
  const { rooms, activeRoom, changeRoom } = useEnvironment();

  const handleRoomChange = (newRoomId) => {
    changeRoom(newRoomId);
  };

  const handleTileClick = (tileType) => {
    if (onTileClick) {
      onTileClick(tileType);
    }
  };

  return (
    <div className="tile-dashboard">
      {/* Room Selector */}
      {showRoomSelector && rooms.length > 1 && (
        <div className="room-selector">
          <button
            className={`room-button ${!activeRoom ? 'active' : ''}`}
            onClick={() => handleRoomChange(null)}
          >
            All Rooms
          </button>
          {rooms.map(room => (
            <button
              key={room.id}
              className={`room-button ${activeRoom === room.id ? 'active' : ''}`}
              onClick={() => handleRoomChange(room.id)}
            >
              {room.name}
            </button>
          ))}
        </div>
      )}

      {/* Tile Grid */}
      <div className="tile-grid">
        <LightsTile roomId={roomId || activeRoom} onClick={() => handleTileClick('lights')} />
        <ClimateTile roomId={roomId || activeRoom} onClick={() => handleTileClick('climate')} />
        <FanTile roomId={roomId || activeRoom} onClick={() => handleTileClick('fans')} />
        <CurtainsTile roomId={roomId || activeRoom} onClick={() => handleTileClick('curtains')} />
      </div>
    </div>
  );
});

TileGrid.displayName = 'TileGrid';

export default TileGrid;
