import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { useGlobalStore } from '../hooks/useGlobalStore';
import { useAuth } from './AuthContext';

/**
 * EnvironmentContext provides room and device awareness throughout the app
 * Single source of truth for:
 * - Active room selection
 * - Device states aggregated by room
 * - Recent user actions
 * - Room/device filtering utilities
 */
const EnvironmentContext = createContext(null);

export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironment must be used within EnvironmentProvider');
  }
  return context;
};

export const EnvironmentProvider = ({ children, activeRoomId = null, onRoomChange = null }) => {
  const { state } = useGlobalStore();
  const { user } = useAuth();
  const [activeRoom, setActiveRoom] = useState(activeRoomId);
  const [recentActions, setRecentActions] = useState([]);

  // Get rooms and devices from global store
  const rooms = state?.smartHome?.rooms || [];
  const allDevices = state?.smartHome?.devices || [];

  // Get active room data
  const activeRoomData = useMemo(() => {
    if (!activeRoom) return null;
    return rooms.find(room => room.id === activeRoom) || null;
  }, [rooms, activeRoom]);

  // Get devices for active room
  const activeRoomDevices = useMemo(() => {
    if (!activeRoomData) return [];
    return activeRoomData.devices || [];
  }, [activeRoomData]);

  // Group devices by type for easy access
  const devicesByType = useMemo(() => {
    const grouped = {
      lights: [],
      climate: [],
      fans: [],
      curtains: [],
      shutters: [],
      security: [],
      media: []
    };

    const devicesToGroup = activeRoom ? activeRoomDevices : allDevices;

    devicesToGroup.forEach(device => {
      const type = device.type?.toLowerCase() || '';
      if (type.includes('light')) {
        grouped.lights.push(device);
      } else if (type.includes('air_conditioner') || type.includes('thermostat') || type.includes('climate')) {
        grouped.climate.push(device);
      } else if (type.includes('fan')) {
        grouped.fans.push(device);
      } else if (type.includes('curtain')) {
        grouped.curtains.push(device);
      } else if (type.includes('shutter')) {
        grouped.shutters.push(device);
      } else if (type.includes('door') || type.includes('lock') || type.includes('security')) {
        grouped.security.push(device);
      } else if (type.includes('speaker') || type.includes('media') || type.includes('tv')) {
        grouped.media.push(device);
      }
    });

    return grouped;
  }, [activeRoom, activeRoomDevices, allDevices]);

  // Get device by ID (searches active room first, then all devices)
  const getDeviceById = useCallback((deviceId) => {
    if (activeRoomDevices.length > 0) {
      const device = activeRoomDevices.find(d => d.id === deviceId);
      if (device) return device;
    }
    return allDevices.find(d => d.id === deviceId) || null;
  }, [activeRoomDevices, allDevices]);

  // Get devices by room ID
  const getDevicesByRoom = useCallback((roomId) => {
    const room = rooms.find(r => r.id === roomId);
    return room?.devices || [];
  }, [rooms]);

  // Track recent actions
  const addAction = useCallback((action) => {
    setRecentActions(prev => [
      { ...action, timestamp: Date.now() },
      ...prev.slice(0, 9) // Keep last 10 actions
    ]);
  }, []);

  // Room change handler
  const changeRoom = useCallback((roomId) => {
    setActiveRoom(roomId);
    if (onRoomChange) {
      onRoomChange(roomId);
    }
  }, [onRoomChange]);

  // Get room summary (device counts, states)
  const getRoomSummary = useCallback((roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return null;

    const devices = room.devices || [];
    const lights = devices.filter(d => d.type === 'light');
    const climate = devices.filter(d => 
      d.type === 'air_conditioner' || d.type === 'thermostat'
    );

    return {
      id: room.id,
      name: room.name,
      totalDevices: devices.length,
      lightsOn: lights.filter(d => d.state).length,
      totalLights: lights.length,
      climateOn: climate.filter(d => d.state).length,
      totalClimate: climate.length,
      hasActiveDevices: devices.some(d => d.state)
    };
  }, [rooms]);

  // Build environment context for assistant
  const buildContextForAssistant = useCallback(() => {
    const currentRoom = activeRoomData;
    const timeOfDay = new Date().getHours();
    const timeContext = timeOfDay < 12 ? 'morning' : 
                       timeOfDay < 18 ? 'afternoon' : 'evening';

    return {
      currentRoom: currentRoom ? {
        id: currentRoom.id,
        name: currentRoom.name,
        devices: activeRoomDevices.map(d => ({
          id: d.id,
          name: d.name,
          type: d.type,
          state: d.state,
          ...(d.brightness !== undefined && { brightness: d.brightness }),
          ...(d.temperature !== undefined && { temperature: d.temperature }),
          ...(d.mode !== undefined && { mode: d.mode })
        }))
      } : null,
      allRooms: rooms.map(r => ({
        id: r.id,
        name: r.name,
        deviceCount: (r.devices || []).length
      })),
      recentActions: recentActions.slice(0, 5), // Last 5 actions
      timeOfDay: timeContext,
      availableDevices: devicesByType
    };
  }, [activeRoomData, activeRoomDevices, rooms, recentActions, devicesByType]);

  const value = useMemo(() => ({
    // Room data
    rooms,
    activeRoom,
    activeRoomData,
    activeRoomDevices,
    changeRoom,

    // Device data
    allDevices,
    devicesByType,
    getDeviceById,
    getDevicesByRoom,

    // Room utilities
    getRoomSummary,

    // Actions tracking
    recentActions,
    addAction,

    // Assistant context
    buildContextForAssistant,

    // User
    userId: user?.uid
  }), [
    rooms,
    activeRoom,
    activeRoomData,
    activeRoomDevices,
    changeRoom,
    allDevices,
    devicesByType,
    getDeviceById,
    getDevicesByRoom,
    getRoomSummary,
    recentActions,
    addAction,
    buildContextForAssistant,
    user?.uid
  ]);

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
};
