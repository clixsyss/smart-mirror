import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { roomsStore } from '../stores/roomsStore';
import './ClimateControl.css';

const ClimateControl = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [animatingDevices, setAnimatingDevices] = useState(new Set());
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const { user } = useAuth();

  // Load rooms and devices from Firebase
  useEffect(() => {
    const loadRooms = async () => {
      if (user) {
        setLoading(true);
        console.log('🔄 ClimateControl: Loading rooms for user:', user.uid);
        
        try {
          // Force refresh the rooms data from Firebase
          await roomsStore.fetchRooms(user.uid);
          console.log('📁 ClimateControl: Rooms loaded:', roomsStore.rooms.length);
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
        console.log('🌡️ ClimateControl: Received rooms update', updatedRooms.length);
        console.log('🌡️ Device states:', updatedRooms.map(r => ({ 
          room: r.name, 
          climate: r.devices?.filter(d => ['thermostat', 'fan', 'air_conditioner'].includes(d.type)).map(d => ({ name: d.name, state: d.state })) 
        })));
        
        setLastUpdate(Date.now());
        
        // Force component re-render with completely fresh state
        const freshRooms = JSON.parse(JSON.stringify(updatedRooms)); // Deep clone
        setRooms(freshRooms);
        
        // Force additional re-render to ensure UI updates
        setTimeout(() => {
          setRooms([...freshRooms]);
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
    console.log('🔄 Manual refresh triggered for climate states');
    
    try {
      // Force a fresh fetch from Firebase
      await roomsStore.fetchRooms(user.uid, true);
      setRooms([...roomsStore.rooms]);
      console.log('✅ Climate states refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing climate states:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user, refreshing]);

  // Initial mount message and immediate refresh
  useEffect(() => {
    console.log('🌡️ ClimateControl component mounted, instant sync functions are active');
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
        console.log('👁️ Page became visible, instant refreshing climate states');
        refreshDeviceStates();
      }
    };

    const handleFocus = () => {
      if (user) {
        console.log('🎯 Window focused, instant refreshing climate states');
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
    
    console.log('⚡ Setting up ultra-fast refresh interval for climate states (5 seconds)');
    const interval = setInterval(() => {
      console.log('⚡ Ultra-fast sync refresh for climate states');
      refreshDeviceStates();
    }, 5 * 1000); // 5 seconds for ultra-fast sync

    return () => {
      console.log('⏹️ Clearing ultra-fast refresh interval for climate states');
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
        console.log('🐭 User interaction detected, instant refreshing climate states');
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

  const updateTemperature = async (roomId, deviceId, temperature, event) => {
    if (event) {
      event.stopPropagation();
    }
    try {
      if (user) {
        console.log(`🌡️ Updating temperature for device ${deviceId} to ${temperature}°C`);
        await roomsStore.updateDevice(user.uid, roomId, deviceId, { temperature: parseInt(temperature) });
      }
    } catch (error) {
      console.error('❌ Error updating temperature:', error);
    }
  };

  const addDeviceAnimation = (deviceId) => {
    setAnimatingDevices(prev => new Set([...prev, deviceId]));
    setTimeout(() => {
      setAnimatingDevices(prev => {
        const newSet = new Set(prev);
        newSet.delete(deviceId);
        return newSet;
      });
    }, 800);
  };

  const toggleDevice = async (roomId, deviceId) => {
    addDeviceAnimation(deviceId);
    try {
      const device = roomsStore.getDeviceById(deviceId);
      if (device && user) {
        const newState = !device.state;
        console.log(`🌡️ Toggling climate device ${device.name} from ${device.state} to ${newState}`);
        
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
        console.log(`✅ Climate device ${device.name} toggled successfully`);
        
        // Force refresh to sync with Firebase state
        setTimeout(() => {
          refreshDeviceStates();
        }, 500);
      } else {
        console.error('❌ Device or user not found:', { device: !!device, user: !!user });
      }
    } catch (error) {
      console.error('❌ Error toggling device:', error);
      // Revert optimistic update on error
      refreshDeviceStates();
    }
  };

  const updateFanSpeed = async (roomId, deviceId, speed, event) => {
    if (event) {
      event.stopPropagation();
    }
    try {
      if (user) {
        console.log(`🌪️ Updating fan speed for device ${deviceId} to ${speed}`);
        await roomsStore.updateDevice(user.uid, roomId, deviceId, { speed: parseInt(speed) });
      }
    } catch (error) {
      console.error('❌ Error updating fan speed:', error);
    }
  };

  if (loading) {
    return (
      <div className="climate-control">
        <div className="climate-header">
          <h1 className="climate-title">Loading Climate Controls...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="climate-control" key={`climate-control-${lastUpdate}`}>
      <div className="climate-header">
        <h1 className="climate-title">Climate Control</h1>
        <button 
          className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
          onClick={refreshDeviceStates}
          disabled={refreshing}
          title="Refresh device states"
        >
          {refreshing ? '🔄' : '🔁'}
        </button>
        <p className="interaction-hint">Click on devices to toggle on/off</p>
      </div>

      <div className="rooms-grid">
        {rooms.map(room => {
          const climateDevices = room.devices ? room.devices.filter(device => 
            device.type === 'thermostat' || device.type === 'fan' || device.type === 'air_conditioner'
          ) : [];
          
          if (climateDevices.length === 0) return null;

          return (
            <div key={room.id} className="room-card">
              <div className="room-header">
                <h2 className="room-name">{room.name}</h2>
              </div>

              <div className="climate-devices">
                {climateDevices.map(device => (
                  <div 
                    key={device.id} 
                    className={`climate-device ${device.state ? 'active' : 'inactive'} ${animatingDevices.has(device.id) ? 'animating' : ''}`}
                    onClick={() => toggleDevice(room.id, device.id)}
                  >
                    <div className="device-header">
                      <h3 className="device-name">{device.name}</h3>
                      <button
                        className={`device-toggle ${device.state ? 'on' : 'off'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDevice(room.id, device.id);
                        }}
                      >
                        {device.state ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {device.state && (
                      <div className="device-controls">
                        {(device.type === 'thermostat' || device.type === 'air_conditioner') && (
                          <div className="temperature-control">
                            <label>Temperature: {device.temperature || 22}°C</label>
                            <input
                              type="range"
                              min="16"
                              max="30"
                              value={device.temperature || 22}
                              onChange={(e) => updateTemperature(room.id, device.id, e.target.value, e)}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="temperature-slider"
                            />
                          </div>
                        )}

                        {(device.type === 'fan' || device.type === 'air_conditioner') && (
                          <div className="speed-control">
                            <label>Speed: {device.speed || 1}</label>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              value={device.speed || 1}
                              onChange={(e) => updateFanSpeed(room.id, device.id, e.target.value, e)}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="speed-slider"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClimateControl;