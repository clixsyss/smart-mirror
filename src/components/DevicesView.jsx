import { memo, useMemo } from 'react';
import { useEnvironment } from '../hooks/useEnvironment';
import { useGlobalStore } from '../hooks/useGlobalStore';
import { useAuth } from '../contexts/AuthContext';
import DeviceTile from './tiles/DeviceTile';
import './DevicesView.css';

const DevicesView = memo(({ roomId, onBack, onBackToRooms }) => {
  const { rooms, getDevicesByRoom } = useEnvironment();
  const { actions } = useGlobalStore();
  const { user } = useAuth();
  const userId = user?.uid;

  const room = useMemo(() => {
    return rooms.find(r => r.id === roomId);
  }, [rooms, roomId]);

  const devices = useMemo(() => {
    if (!room) return [];
    return getDevicesByRoom(roomId);
  }, [room, roomId, getDevicesByRoom]);

  const sortedDevices = useMemo(() => {
    return [...devices].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [devices]);

  if (!room) {
    return (
      <div className="devices-view-overlay" onClick={onBackToRooms}>
        <div className="devices-view" onClick={(e) => e.stopPropagation()}>
          <div className="devices-view-header">
            <button className="devices-back-btn" onClick={onBackToRooms}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h2>Room not found</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="devices-view-overlay" onClick={onBackToRooms}>
      <div className="devices-view" onClick={(e) => e.stopPropagation()}>
        <div className="devices-view-header">
          <button className="devices-back-btn" onClick={onBackToRooms}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2>{room.name}</h2>
          <p className="devices-view-subtitle">{devices.length} device{devices.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="devices-grid">
          {sortedDevices.length === 0 ? (
            <div className="devices-empty">
              <p>No devices in this room</p>
            </div>
          ) : (
            sortedDevices.map((device, index) => (
              <DeviceTile
                key={device.id || `${device.name || 'device'}-${index}`}
                device={device}
                roomId={roomId}
                roomName={room?.name}
                actions={actions}
                userId={userId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
});

DevicesView.displayName = 'DevicesView';

export default DevicesView;
