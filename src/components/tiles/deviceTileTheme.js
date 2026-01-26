export const getDeviceTypeKey = (device) => {
  const type = (device?.type || '').toLowerCase();
  const name = (device?.name || '').toLowerCase();

  if (type.includes('light') || name.includes('light')) return 'light';
  if (
    type.includes('air_conditioner') ||
    type.includes('thermostat') ||
    type.includes('climate') ||
    name.includes('ac') ||
    name.includes('air')
  ) {
    return 'climate';
  }
  if (type.includes('fan') || name.includes('fan')) return 'fan';
  if (type.includes('curtain')) return 'curtain';
  if (type.includes('shutter')) return 'shutter';

  return 'other';
};

export const deviceTileTheme = {
  light: {
    accent: '#F5C542',
    accentBg: 'rgba(245, 197, 66, 0.18)',
    accentGlow: 'rgba(245, 197, 66, 0.35)'
  },
  climate: {
    accent: '#53D6FF',
    accentBg: 'rgba(83, 214, 255, 0.18)',
    accentGlow: 'rgba(83, 214, 255, 0.35)'
  },
  fan: {
    accent: '#55D68A',
    accentBg: 'rgba(85, 214, 138, 0.18)',
    accentGlow: 'rgba(85, 214, 138, 0.35)'
  },
  other: {
    accent: '#FFFFFF',
    accentBg: 'rgba(255, 255, 255, 0.08)',
    accentGlow: 'rgba(255, 255, 255, 0.2)'
  }
};

export const getDeviceAccent = (device) => {
  const key = getDeviceTypeKey(device);
  return deviceTileTheme[key] || deviceTileTheme.other;
};
