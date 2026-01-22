import { memo, useMemo } from 'react';
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

  // Calculate status
  const status = useMemo(() => {
    if (climateDevices.length === 0) return 'No climate devices';
    const activeDevices = climateDevices.filter(d => d.state);
    if (activeDevices.length === 0) return 'Off';
    
    const avgTemp = activeDevices
      .filter(d => d.temperature !== undefined)
      .reduce((sum, d) => sum + (d.temperature || 0), 0) / activeDevices.length || 0;
    
    if (avgTemp > 0) {
      return `${Math.round(avgTemp)}°C • ${activeDevices.length} active`;
    }
    return `${activeDevices.length} active`;
  }, [climateDevices]);

  const anyOn = climateDevices.some(d => d.state);

  // Toggle climate
  const handleToggle = async (e) => {
    e?.stopPropagation();
    if (!userId || climateDevices.length === 0) return;

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
  };

  // Adjust temperature
  const handleTemperatureChange = async (e, device) => {
    e?.stopPropagation();
    if (!userId || !device.id) return;

    const temperature = parseInt(e.target.value);
    const roomIdForDevice = roomId || device.roomId || activeRoomData?.id;
    if (roomIdForDevice) {
      try {
        await actions.setClimateTemperature(userId, roomIdForDevice, device.id, temperature);
      } catch (error) {
        console.error('Error setting temperature:', error);
      }
    }
  };

  const primaryAction = (
    <div className="tile-toggle-container" onClick={handleToggle}>
      <div className={`tile-toggle ${anyOn ? 'active' : ''}`} />
      <span style={{ marginLeft: '12px', fontSize: '14px' }}>
        {anyOn ? 'On' : 'Off'}
      </span>
    </div>
  );

  const secondaryActions = climateDevices.slice(0, 1).map(device => (
    <div key={device.id} className="climate-control-item">
      <span style={{ fontSize: '12px', opacity: 0.8 }}>{device.name}</span>
      {device.temperature !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <input
            type="range"
            min="16"
            max="30"
            value={device.temperature || 22}
            onChange={(e) => handleTemperatureChange(e, device)}
            className="tile-slider"
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '14px', fontWeight: '500', minWidth: '32px' }}>
            {device.temperature || 22}°C
          </span>
        </div>
      )}
    </div>
  ));

  return (
    <Tile
      title="Climate"
      subtitle={roomName}
      icon={<ClimateIcon />}
      iconColor={anyOn ? '#4FC3F7' : '#ffffff'}
      status={status}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions.length > 0 ? [secondaryActions] : []}
      onClick={onClick}
      loading={climateDevices.length === 0 && state?.smartHome?.loading}
    />
  );
});

ClimateTile.displayName = 'ClimateTile';

export default ClimateTile;
