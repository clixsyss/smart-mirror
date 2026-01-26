import { memo, useMemo, useRef, useCallback } from 'react';
import { useEnvironment } from '../../hooks/useEnvironment';
import { useGlobalStore } from '../../hooks/useGlobalStore';
import Tile from './Tile';

const ClimateIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
  </svg>
);

const ClimateTile = memo(({ roomId = null, onClick }) => {
  const { devicesByType, activeRoomData, getDevicesByRoom } = useEnvironment();
  const { actions, state } = useGlobalStore();
  const userId = state?.app?.currentUserId;
  const lastToggleTime = useRef(0);
  const DEBOUNCE_MS = 400;

  // Get climate devices for the specified room or active room
  const climateDevices = useMemo(() => {
    if (roomId) {
      return getDevicesByRoom(roomId).filter(d => 
        d.type === 'air_conditioner' || 
        d.type === 'thermostat' ||
        d.name?.toLowerCase().includes('ac') ||
        d.name?.toLowerCase().includes('thermostat')
      );
    }
    return devicesByType.climate;
  }, [roomId, getDevicesByRoom, devicesByType]);

  const roomName = useMemo(() => {
    if (roomId) {
      const room = state?.smartHome?.rooms?.find(r => r.id === roomId);
      return room?.name || 'Climate';
    }
    return activeRoomData?.name || 'All Rooms';
  }, [roomId, activeRoomData, state]);

  // Calculate status - simplified
  const status = useMemo(() => {
    if (climateDevices.length === 0) return 'No devices';
    const activeDevices = climateDevices.filter(d => d.state);
    if (activeDevices.length === 0) return 'OFF';
    
    const avgTemp = activeDevices
      .filter(d => d.temperature !== undefined)
      .reduce((sum, d) => sum + (d.temperature || 0), 0) / activeDevices.length || 0;
    
    if (avgTemp > 0) {
      return `${Math.round(avgTemp)}°C • ON`;
    }
    return 'ON';
  }, [climateDevices]);

  const anyOn = climateDevices.some(d => d.state);

  // Toggle climate - debounced
  const handleTileClick = useCallback(async (e) => {
    e?.stopPropagation();
    
    // Debounce to prevent accidental double toggles
    const now = Date.now();
    if (now - lastToggleTime.current < DEBOUNCE_MS) {
      return;
    }
    lastToggleTime.current = now;

    if (!userId || climateDevices.length === 0) {
      // If no devices, call onClick if provided (for navigation)
      if (onClick) onClick();
      return;
    }

    const newState = !anyOn;
    try {
      for (const device of climateDevices) {
        const roomIdForDevice = roomId || device.roomId || activeRoomData?.id;
        if (roomIdForDevice && device.id) {
          await actions.setClimateState(userId, roomIdForDevice, device.id, newState);
        }
      }
    } catch (error) {
      console.error('Error toggling climate:', error);
    }
  }, [userId, climateDevices, anyOn, roomId, activeRoomData, actions, onClick]);

  return (
    <Tile
      title="Climate"
      subtitle={roomName}
      icon={<ClimateIcon />}
      iconColor={anyOn ? '#4FC3F7' : '#ffffff'}
      status={status}
      onClick={handleTileClick}
      loading={climateDevices.length === 0 && state?.smartHome?.loading}
      className={anyOn ? 'tile-on' : 'tile-off'}
    />
  );
});

ClimateTile.displayName = 'ClimateTile';

export default ClimateTile;
