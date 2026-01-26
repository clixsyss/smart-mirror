import { memo, useMemo } from 'react';
import { useEnvironment } from '../hooks/useEnvironment';
import './RoomsView.css';

const RoomCard = memo(({ room, onSelect }) => {
  const summary = room.summary;
  const totalDevices = summary?.totalDevices ?? (room.devices?.length || 0);
  const activeDevices = summary?.hasActiveDevices;
  const lightsOn = summary?.lightsOn ?? 0;
  const totalLights = summary?.totalLights ?? 0;

  return (
    <div className="room-card" onClick={() => onSelect(room.id)}>
      <div className="room-card-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9h18M7 21V9M17 21V9" />
          <path d="M5 9l7-5 7 5" />
        </svg>
      </div>
      <div className="room-card-content">
        <h3 className="room-card-title">{room.name}</h3>
        <p className="room-card-stats">
          {totalDevices} devices · {lightsOn}/{totalLights} lights on
          {activeDevices ? ' · Active' : ''}
        </p>
      </div>
      <div className="room-card-arrow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </div>
  );
});

RoomCard.displayName = 'RoomCard';

const RoomsView = memo(({ onSelectRoom, onBack }) => {
  const { rooms, getRoomSummary } = useEnvironment();

  // Memoize rooms list to prevent unnecessary re-renders
  const roomsList = useMemo(() => {
    return rooms.map(room => ({
      ...room,
      summary: getRoomSummary(room.id)
    }));
  }, [rooms, getRoomSummary]);

  return (
    <div className="rooms-view-overlay" onClick={onBack}>
      <div className="rooms-view" onClick={(e) => e.stopPropagation()}>
        <div className="rooms-view-header">
          <button className="rooms-back-btn" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2>Select a Room</h2>
        </div>
        
        <div className="rooms-grid">
          {roomsList.length === 0 ? (
            <div className="rooms-empty">
              <p>No rooms available</p>
            </div>
          ) : (
            roomsList.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onSelect={onSelectRoom}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
});

RoomsView.displayName = 'RoomsView';

export default RoomsView;
