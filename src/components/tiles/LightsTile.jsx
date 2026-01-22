import { memo, useMemo } from 'react';
import { useEnvironment } from '../../contexts/EnvironmentContext';
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

  // Calculate status
  const status = useMemo(() => {
    if (lights.length === 0) return 'No lights';
    const onCount = lights.filter(l => l.state).length;
    const avgBrightness = lights
      .filter(l => l.state && l.brightness !== undefined)
      .reduce((sum, l) => sum + (l.brightness || 0), 0) / onCount || 0;

    if (onCount === 0) return 'All off';
    if (onCount === lights.length) {
      return avgBrightness > 0 ? `${Math.round(avgBrightness)}% brightness` : 'All on';
    }
    return `${onCount} of ${lights.length} on`;
  }, [lights]);

  const allOn = lights.length > 0 && lights.every(l => l.state);
  const anyOn = lights.some(l => l.state);

  // Toggle all lights
  const handleToggle = async (e) => {
    e?.stopPropagation();
    if (!userId || lights.length === 0) return;

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
  };

  // Adjust brightness
  const handleBrightnessChange = async (e, light) => {
    e?.stopPropagation();
    if (!userId || !light.id) return;

    const brightness = parseInt(e.target.value);
    const roomIdForLight = roomId || light.roomId || activeRoomData?.id;
    if (roomIdForLight) {
      try {
        await actions.setLightBrightness(userId, roomIdForLight, light.id, brightness);
      } catch (error) {
        console.error('Error setting brightness:', error);
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

  const secondaryActions = lights.slice(0, 2).map(light => (
    <div key={light.id} className="light-control-item">
      <span style={{ fontSize: '12px', opacity: 0.8 }}>{light.name}</span>
      {light.brightness !== undefined && (
        <input
          type="range"
          min="0"
          max="100"
          value={light.brightness || 0}
          onChange={(e) => handleBrightnessChange(e, light)}
          className="tile-slider"
          style={{ width: '100%', marginTop: '4px' }}
        />
      )}
    </div>
  ));

  return (
    <Tile
      title="Lights"
      subtitle={roomName}
      icon={<LightIcon />}
      iconColor={anyOn ? '#FFD700' : '#ffffff'}
      status={status}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions.length > 0 ? [secondaryActions] : []}
      onClick={onClick}
      loading={lights.length === 0 && state?.smartHome?.loading}
    />
  );
});

LightsTile.displayName = 'LightsTile';

export default LightsTile;
