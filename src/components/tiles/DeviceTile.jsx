import { memo, useMemo, useRef, useCallback } from 'react';
import Tile from './Tile';
import { getDeviceAccent, getDeviceTypeKey } from './deviceTileTheme';

const LightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z"/>
    <path d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
  </svg>
);

const ClimateIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
  </svg>
);

const FanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2"/>
    <path d="M12 2a6 6 0 0 1 6 6c0 1.66-1.34 3-3 3H9"/>
    <path d="M22 12a6 6 0 0 1-6 6c-1.66 0-3-1.34-3-3V9"/>
    <path d="M12 22a6 6 0 0 1-6-6c0-1.66 1.34-3 3-3h6"/>
  </svg>
);

const DefaultIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="4" />
  </svg>
);

const DeviceTile = memo(({ device, roomId, roomName, actions, userId }) => {
  const lastToggleTime = useRef(0);
  const DEBOUNCE_MS = 400;

  const typeKey = useMemo(() => getDeviceTypeKey(device), [device]);
  const accent = useMemo(() => getDeviceAccent(device), [device]);
  const isOn = Boolean(device?.state);

  const icon = useMemo(() => {
    if (typeKey === 'light') return <LightIcon />;
    if (typeKey === 'climate') return <ClimateIcon />;
    if (typeKey === 'fan') return <FanIcon />;
    return <DefaultIcon />;
  }, [typeKey]);

  const statusPill = isOn ? 'ON' : 'OFF';

  const temperature = useMemo(() => {
    if (typeKey !== 'climate') return null;
    const temp = device?.temperature ?? device?.setpoint ?? device?.targetTemp;
    return typeof temp === 'number' ? temp : null;
  }, [device, typeKey]);

  const speed = useMemo(() => {
    if (typeKey !== 'fan') return null;
    const value = device?.speed ?? device?.fanSpeed;
    return typeof value === 'number' ? value : null;
  }, [device, typeKey]);

  const tempMin = device?.minTemp ?? 16;
  const tempMax = device?.maxTemp ?? 30;
  const speedMin = device?.minSpeed ?? 1;
  const speedMax = device?.maxSpeed ?? 5;

  const valueText = useMemo(() => {
    if (typeKey === 'climate' && temperature !== null) return `${Math.round(temperature)}°C`;
    if (typeKey === 'fan' && speed !== null) return `Speed ${speed}`;
    return null;
  }, [typeKey, temperature, speed]);

  const toggleDevice = useCallback(async () => {
    if (!userId || !device?.id) return;

    const now = Date.now();
    if (now - lastToggleTime.current < DEBOUNCE_MS) {
      return;
    }
    lastToggleTime.current = now;

    const nextState = !isOn;
    try {
      if (typeKey === 'light') {
        await actions.toggleLight(userId, roomId, device.id, nextState);
      } else if (typeKey === 'climate' || typeKey === 'fan') {
        await actions.setClimateState(userId, roomId, device.id, nextState);
      } else if (actions.toggleLight) {
        // TODO: add specific actions for other device types when available
        await actions.toggleLight(userId, roomId, device.id, nextState);
      }
    } catch (error) {
      console.error('Error toggling device:', error);
    }
  }, [actions, device, isOn, roomId, typeKey, userId]);

  const handleTempAdjust = useCallback(async (delta, e) => {
    e?.stopPropagation();
    if (!userId || !device?.id) return;

    const current = temperature ?? 22;
    const next = Math.min(tempMax, Math.max(tempMin, current + delta));
    if (next === current) return;

    try {
      await actions.setClimateTemperature(userId, roomId, device.id, next);
    } catch (error) {
      console.error('Error setting temperature:', error);
    }
  }, [actions, device, roomId, temperature, tempMin, tempMax, userId]);

  const handleSpeedAdjust = useCallback(async (delta, e) => {
    e?.stopPropagation();
    if (!userId || !device?.id) return;

    const current = speed ?? 1;
    const next = Math.min(speedMax, Math.max(speedMin, current + delta));
    if (next === current) return;

    try {
      await actions.setFanSpeed(userId, roomId, device.id, next);
    } catch (error) {
      console.error('Error setting fan speed:', error);
    }
  }, [actions, device, roomId, speed, speedMin, speedMax, userId]);

  const controls = useMemo(() => {
    if (typeKey === 'climate') {
      const atMin = (temperature ?? 22) <= tempMin;
      const atMax = (temperature ?? 22) >= tempMax;
      return (
        <div className="tile-device-steps" onClick={(e) => e.stopPropagation()}>
          <button
            className="tile-step-btn"
            onClick={(e) => handleTempAdjust(-1, e)}
            disabled={atMin}
            aria-label="Decrease temperature"
          >
            −
          </button>
          <button
            className="tile-step-btn"
            onClick={(e) => handleTempAdjust(1, e)}
            disabled={atMax}
            aria-label="Increase temperature"
          >
            +
          </button>
        </div>
      );
    }

    if (typeKey === 'fan') {
      const atMin = (speed ?? 1) <= speedMin;
      const atMax = (speed ?? 1) >= speedMax;
      return (
        <div className="tile-device-steps" onClick={(e) => e.stopPropagation()}>
          <button
            className="tile-step-btn"
            onClick={(e) => handleSpeedAdjust(-1, e)}
            disabled={atMin}
            aria-label="Decrease fan speed"
          >
            −
          </button>
          <button
            className="tile-step-btn"
            onClick={(e) => handleSpeedAdjust(1, e)}
            disabled={atMax}
            aria-label="Increase fan speed"
          >
            +
          </button>
        </div>
      );
    }

    return null;
  }, [typeKey, temperature, tempMin, tempMax, handleTempAdjust, speed, speedMin, speedMax, handleSpeedAdjust]);

  return (
    <Tile
      variant="device"
      title={device?.name || typeKey}
      subtitle={roomName || device?.room || 'Room'}
      icon={icon}
      status={statusPill}
      active={isOn}
      accent={accent}
      valueText={valueText}
      controls={controls}
      onClick={toggleDevice}
      className={`tile-${typeKey}`}
      size="small"
    />
  );
});

DeviceTile.displayName = 'DeviceTile';

export default DeviceTile;
