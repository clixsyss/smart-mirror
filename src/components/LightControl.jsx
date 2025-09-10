import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { roomsStore } from '../stores/roomsStore';
import './LightControl.css';

const LightControl = () => {
  const [rooms, setRooms] = useState([]);
  const [animatingLights, setAnimatingLights] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const { user } = useAuth();

  // Load rooms and devices from Firebase
  useEffect(() => {
    const loadRooms = async () => {
      if (user) {
        setLoading(true);
        console.log('🔄 LightControl: Loading rooms for user:', user.uid);
        
        try {
          // Force refresh the rooms data from Firebase
          await roomsStore.fetchRooms(user.uid);
          console.log('📁 LightControl: Rooms loaded:', roomsStore.rooms.length);
          setRooms([...roomsStore.rooms]);
        } catch (error) {
          console.error('❌ Error loading rooms:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    // Load rooms on mount
    loadRooms();

    // Subscribe to real-time updates
    let unsubscribe;
    if (user) {
      unsubscribe = roomsStore.subscribe((updatedRooms) => {
        console.log('💡 LightControl: Received rooms update', updatedRooms.length);
        console.log('💡 Device states:', updatedRooms.map(r => ({ 
          room: r.name, 
          lights: r.devices?.filter(d => d.type === 'light').map(d => ({ name: d.name, state: d.state })) 
        })));
        
        setSyncing(true);
        setLastUpdate(Date.now());
        
        // Force component re-render with completely fresh state
        const freshRooms = JSON.parse(JSON.stringify(updatedRooms)); // Deep clone
        setRooms(freshRooms);
        
        // Force additional re-render to ensure UI updates
        setTimeout(() => {
          setRooms([...freshRooms]);
          setSyncing(false);
        }, 100);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Manual refresh function
  const refreshDeviceStates = React.useCallback(async () => {
    if (!user || refreshing) return;
    
    setRefreshing(true);
    console.log('🔄 Manual refresh triggered for light states');
    
    try {
      // Force a fresh fetch from Firebase
      await roomsStore.fetchRooms(user.uid, true);
      setRooms([...roomsStore.rooms]);
      console.log('✅ Light states refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing light states:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user, refreshing]);

  // Initial mount message and immediate refresh
  useEffect(() => {
    console.log('🏠 LightControl component mounted, instant sync functions are active');
    // Immediate refresh on mount for instant sync
    if (user) {
      console.log('⚡ Performing immediate refresh on component mount');
      refreshDeviceStates();
    }
  }, [user, refreshDeviceStates]);

  // Auto-refresh when page becomes visible or focused
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('👁️ Page became visible, instant refreshing light states');
        refreshDeviceStates();
      }
    };

    const handleFocus = () => {
      if (user) {
        console.log('🎯 Window focused, instant refreshing light states');
        refreshDeviceStates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshDeviceStates, user]);

  // Periodic auto-refresh every 5 seconds for instant sync
  useEffect(() => {
    if (!user) return;
    
    console.log('⚡ Setting up ultra-fast refresh interval for light states (5 seconds)');
    const interval = setInterval(() => {
      console.log('⚡ Ultra-fast sync refresh for light states');
      refreshDeviceStates();
    }, 5 * 1000); // 5 seconds for ultra-fast sync

    return () => {
      console.log('⏹️ Clearing ultra-fast refresh interval for light states');
      clearInterval(interval);
    };
  }, [refreshDeviceStates, user]);

  // Refresh on user interaction for instant sync
  useEffect(() => {
    if (!user) return;
    
    let lastRefresh = Date.now();
    const handleUserInteraction = () => {
      const now = Date.now();
      // Throttle to avoid too many refreshes (max once every 3 seconds)
      if (now - lastRefresh > 3000) {
        console.log('🐭 User interaction detected, instant refreshing light states');
        refreshDeviceStates();
        lastRefresh = now;
      }
    };

    document.addEventListener('mousedown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      document.removeEventListener('mousedown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [refreshDeviceStates, user]);

  // Debug: Log state every 10 seconds to see if data is changing
  useEffect(() => {
    if (!user) return;
    
    const debugInterval = setInterval(() => {
      console.log('🔍 DEBUG: Current React state vs Store state');
      console.log('🔍 React rooms:', rooms.length);
      console.log('🔍 Store rooms:', roomsStore.rooms.length);
      
      rooms.forEach(room => {
        const lights = room.devices?.filter(d => d.type === 'light') || [];
        console.log(`🔍 React - ${room.name}: ${lights.map(l => l.name + ':' + (l.state ? 'ON' : 'OFF')).join(', ')}`);
      });
      
      roomsStore.rooms.forEach(room => {
        const lights = room.devices?.filter(d => d.type === 'light') || [];
        console.log(`🔍 Store - ${room.name}: ${lights.map(l => l.name + ':' + (l.state ? 'ON' : 'OFF')).join(', ')}`);
      });
    }, 10000); // Every 10 seconds

    return () => clearInterval(debugInterval);
  }, [rooms, user]);

  const addLightAnimation = (lightId) => {
    setAnimatingLights(prev => new Set([...prev, lightId]));
    setTimeout(() => {
      setAnimatingLights(prev => {
        const newSet = new Set(prev);
        newSet.delete(lightId);
        return newSet;
      });
    }, 800);
  };

  const toggleLight = async (roomId, deviceId, event) => {
    // Prevent double-clicking and ensure we're clicking the light item itself
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    addLightAnimation(deviceId);
    try {
      const device = roomsStore.getDeviceById(deviceId);
      if (device && user) {
        const newState = !device.state;
        console.log(`🔄 Toggling light ${device.name} from ${device.state} to ${newState}`);
        
        // Optimistic UI update - immediately show the new state
        const updatedRooms = rooms.map(room => {
          if (room.id === roomId) {
            return {
              ...room,
              devices: room.devices.map(d => 
                d.id === deviceId ? { ...d, state: newState } : { ...d }
              )
            };
          }
          return { ...room };
        });
        setRooms(updatedRooms);
        
        // Update Firebase
        await roomsStore.updateDevice(user.uid, roomId, deviceId, { state: newState });
        console.log(`✅ Light ${device.name} toggled successfully`);
        
        // Force refresh to sync with Firebase state
        setTimeout(() => {
          refreshDeviceStates();
        }, 500);
      } else {
        console.error('❌ Device or user not found:', { device: !!device, user: !!user });
      }
    } catch (error) {
      console.error('❌ Error toggling light:', error);
      // Revert optimistic update on error
      refreshDeviceStates();
    }
  };

  const updateBrightness = async (roomId, deviceId, brightness) => {
    try {
      if (user) {
        await roomsStore.updateDevice(user.uid, roomId, deviceId, { brightness: parseInt(brightness) });
      }
    } catch (error) {
      console.error('Error updating brightness:', error);
    }
  };

  const updateColor = async (roomId, deviceId, color) => {
    try {
      if (user) {
        await roomsStore.updateDevice(user.uid, roomId, deviceId, { color });
      }
    } catch (error) {
      console.error('Error updating color:', error);
    }
  };

  const toggleAllLightsInRoom = async (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || !user) return;
    
    const lightDevices = room.devices.filter(device => device.type === 'light');
    const allOn = lightDevices.every(device => device.state);
    
    // Add animation to all lights in the room
    lightDevices.forEach(device => addLightAnimation(device.id));
    
    // Update all lights in Firebase
    for (const device of lightDevices) {
      try {
        await roomsStore.updateDevice(user.uid, roomId, device.id, { state: !allOn });
      } catch (error) {
        console.error('Error toggling device:', device.id, error);
      }
    }
  };

  const getLightStats = () => {
    const totalLights = rooms.reduce((acc, room) => 
      acc + room.devices.filter(device => device.type === 'light').length, 0
    );
    const lightsOn = rooms.reduce((acc, room) => 
      acc + room.devices.filter(device => device.type === 'light' && device.state).length, 0
    );
    return { total: totalLights, on: lightsOn };
  };

  const stats = getLightStats();

  if (loading) {
    return (
      <div className="light-control">
        <div className="light-header">
          <h1 className="light-title">Loading Lights...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="light-control" key={`light-control-${lastUpdate}`}>
      <div className="light-header">
        <h1 className="light-title">Light Control</h1>
        <div className="light-stats">
          <span className="stat-item">
            <span className="stat-value">{stats.on}</span>
            <span className="stat-label">of {stats.total} lights on</span>
          </span>
          <button 
            className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
            onClick={refreshDeviceStates}
            disabled={refreshing}
            title="Refresh device states"
          >
            {refreshing ? '🔄' : '🔁'}
          </button>
          {syncing && (
            <div className="sync-indicator" title="Syncing with server...">
              ⚡
            </div>
          )}
          <button 
            className="test-button"
            onClick={() => {
              console.log('🗺 Test: Current rooms state:', rooms);
              console.log('🗺 Test: RoomsStore state:', roomsStore.rooms);
              setLastUpdate(Date.now());
            }}
            title="Test state refresh"
          >
            🗺
          </button>
        </div>
        <p className="interaction-hint">Click on lights to toggle on/off</p>
      </div>

      <div className="rooms-grid">
        {rooms.length === 0 ? (
          <div className="no-rooms">
            <p>No rooms found. Please add some rooms with light devices in your Firebase database.</p>
          </div>
        ) : (
          rooms.map(room => {
            const lightDevices = room.devices ? room.devices.filter(device => device.type === 'light') : [];
            
            if (lightDevices.length === 0) {
              return (
                <div key={room.id} className="room-card">
                  <div className="room-header">
                    <h2 className="room-name">{room.name}</h2>
                  </div>
                  <p className="no-devices">No light devices in this room</p>
                </div>
              );
            }

            return (
            <div key={room.id} className="room-card">
              <div className="room-header">
                <h2 className="room-name">{room.name}</h2>
                <button
                  className={`room-toggle ${lightDevices.some(device => device.state) ? 'active' : ''}`}
                  onClick={() => toggleAllLightsInRoom(room.id)}
                >
                  {lightDevices.every(device => device.state) ? 'All Off' : 'All On'}
                </button>
              </div>

              <div className="lights-list">
                {lightDevices.map(device => (
                  <div 
                    key={device.id} 
                    className={`light-item ${device.state ? 'on' : 'off'} ${animatingLights.has(device.id) ? 'animating' : ''}`}
                    onClick={(e) => toggleLight(room.id, device.id, e)}
                  >
                    <div className="light-info">
                      <div className="light-bulb"></div>
                      <div className="light-name">{device.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
};

export default LightControl;