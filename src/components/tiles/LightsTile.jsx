import { memo, useMemo, useRef, useCallback } from 'react';
import { useEnvironment } from '../../hooks/useEnvironment';
import { useGlobalStore } from '../../hooks/useGlobalStore';
import Tile from './Tile';

const LightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z"/>
    <path d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
  </svg>
);

const LightsTile = memo(({ roomId = null, onClick }) => {
  const { devicesByType, activeRoomData, getDevicesByRoom } = useEnvironment();
  const { actions, state } = useGlobalStore();
  const userId = state?.app?.currentUserId;
  const lastToggleTime = useRef(0);
  const DEBOUNCE_MS = 400;

  // Get lights for the specified room or active room
  const lights = useMemo(() => {
    if (roomId) {
      return getDevicesByRoom(roomId).filter(d => 
        d.type === 'light' || d.name?.toLowerCase().includes('light')
      );
    }
    return devicesByType.lights;
  }, [roomId, getDevicesByRoom, devicesByType]);

  const roomName = useMemo(() => {
    if (roomId) {
      const room = state?.smartHome?.rooms?.find(r => r.id === roomId);
      return room?.name || 'Lights';
    }
    return activeRoomData?.name || 'All Lights';
  }, [roomId, activeRoomData, state]);

  // Calculate status - simplified
  const status = useMemo(() => {
    if (lights.length === 0) return 'No lights';
    const onCount = lights.filter(l => l.state).length;
    if (onCount === 0) return 'OFF';
    if (onCount === lights.length) return 'ON';
    return `${onCount}/${lights.length} ON`;
  }, [lights]);

  const anyOn = lights.some(l => l.state);

  // Toggle all lights - debounced
  const handleTileClick = useCallback(async (e) => {
    e?.stopPropagation();
    
    // Debounce to prevent accidental double toggles
    const now = Date.now();
    if (now - lastToggleTime.current < DEBOUNCE_MS) {
      return;
    }
    lastToggleTime.current = now;

    if (!userId || lights.length === 0) {
      // If no lights, call onClick if provided (for navigation)
      if (onClick) onClick();
      return;
    }

    const newState = !anyOn;
    try {
      for (const light of lights) {
        const roomIdForLight = roomId || light.roomId || activeRoomData?.id;
        if (roomIdForLight && light.id) {
          await actions.toggleLight(userId, roomIdForLight, light.id, newState);
        }
      }
    } catch (error) {
      console.error('Error toggling lights:', error);
    }
  }, [userId, lights, anyOn, roomId, activeRoomData, actions, onClick]);

  return (
    <Tile
      title="Lights"
      subtitle={roomName}
      icon={<LightIcon />}
      iconColor={anyOn ? '#FFD700' : '#ffffff'}
      status={status}
      onClick={handleTileClick}
      loading={lights.length === 0 && state?.smartHome?.loading}
      className={anyOn ? 'tile-on' : 'tile-off'}
    />
  );
});

LightsTile.displayName = 'LightsTile';

export default LightsTile;
