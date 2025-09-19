import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  updateDoc
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { realtimeDebugger } from '../utils/realtimeDebugger'

class RoomsStore {
  constructor() {
    this.rooms = []
    this.loading = false
    this.error = null
    this.listeners = []
    this.uiListeners = [] // For UI components to subscribe to changes
    this.notifyTimeout = null
    this.periodicNotifyInterval = null
  }

  async fetchRooms(userId, forceRefresh = false) {
    this.loading = true
    this.error = null
    
    try {
      console.log('Fetching rooms for user:', userId, forceRefresh ? '(forced refresh)' : '')

      // Check if user is approved
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (!userDoc.exists()) {
        throw new Error('User profile not found')
      }

      const userData = userDoc.data()
      if (!userData.approved && userData.role !== 'admin') {
        throw new Error('User account is not approved')
      }

      // Clean up existing listeners if force refresh
      if (forceRefresh) {
        this.cleanup()
      }

      // Fetch rooms using hierarchical structure
      const roomsQuery = query(collection(db, 'users', userId, 'rooms'))
      const querySnapshot = await getDocs(roomsQuery)

      const fetchedRooms = []
      for (const roomDoc of querySnapshot.docs) {
        const roomData = {
          ...roomDoc.data(),
          id: roomDoc.id, // Put ID after spread to ensure it's not overwritten
          devices: []
        }

        // Fetch devices for this room
        const devicesQuery = query(
          collection(db, 'users', userId, 'rooms', roomDoc.id, 'devices')
        )
        const devicesSnapshot = await getDocs(devicesQuery)

        roomData.devices = devicesSnapshot.docs.map((deviceDoc) => ({
          id: deviceDoc.id,
          roomId: roomDoc.id,
          ...deviceDoc.data()
        }))

        fetchedRooms.push(roomData)
      }

      this.rooms = fetchedRooms
      
      // Only setup realtime listener if not already set up
      if (this.listeners.length === 0) {
        this.setupRealtimeListener(userId)
      }
      
      this.notifyListeners()

    } catch (error) {
      console.error('Error fetching rooms:', error)
      this.error = error.message
    } finally {
      this.loading = false
    }
  }

  setupRealtimeListener(userId) {
    // Clean up existing listeners
    this.cleanup()
    
    console.log('🔊 Setting up aggressive real-time listeners for instant sync')
    
    // Set up real-time listener for rooms
    const roomsRef = collection(db, 'users', userId, 'rooms')
    const roomsUnsubscribe = onSnapshot(roomsRef, async (roomsSnapshot) => {
      console.log('🔊 Real-time rooms update received - instant sync active')
      
      const updatedRooms = []
      for (const roomDoc of roomsSnapshot.docs) {
        const roomData = {
          ...roomDoc.data(),
          id: roomDoc.id, // Put ID after spread to ensure it's not overwritten
          devices: []
        }

        // Get devices for this room with real-time listener
        const devicesRef = collection(db, 'users', userId, 'rooms', roomDoc.id, 'devices')
        
        // Immediate fetch for current state
        const devicesQuery = query(devicesRef)
        const devicesSnapshot = await getDocs(devicesQuery)
        roomData.devices = devicesSnapshot.docs.map((deviceDoc) => ({
          id: deviceDoc.id,
          roomId: roomDoc.id,
          ...deviceDoc.data()
        }))

        // Set up real-time listener for devices in this room
        const devicesUnsubscribe = onSnapshot(devicesRef, (devicesSnapshot) => {
          console.log(`⚡ INSTANT DEVICE UPDATE for room ${roomDoc.id} - ${devicesSnapshot.docs.length} devices`);
          
          // Update devices for this specific room
          const updatedDevices = devicesSnapshot.docs.map((deviceDoc) => {
            const deviceData = {
              id: deviceDoc.id,
              roomId: roomDoc.id,
              ...deviceDoc.data()
            };
            console.log(`📱 Device ${deviceData.name}: ${deviceData.state ? 'ON' : 'OFF'}`);
            return deviceData;
          });
          
          // Find and update the room in the current rooms array
          const roomIndex = this.rooms.findIndex(r => r.id === roomDoc.id);
          if (roomIndex !== -1) {
            console.log(`🔄 Updating ${updatedDevices.length} devices in room ${this.rooms[roomIndex].name}`);
            
            // Update only the specific room's devices instead of recreating all rooms
            this.rooms[roomIndex].devices = updatedDevices;
            
            // Don't notify immediately for device updates - let the debounce handle it
            // this.notifyListeners();
          } else {
            console.error(`❌ Room ${roomDoc.id} not found in local rooms array`);
          }
        }, (error) => {
          console.error(`❌ Firebase listener error for room ${roomDoc.id}:`, error);
        });

        this.listeners.push(devicesUnsubscribe)
        updatedRooms.push(roomData)
      }

      this.rooms = updatedRooms
      this.notifyListeners()
      this.startPeriodicNotifications()
    }, (error) => {
      console.error('❌ Firebase listener error for rooms:', error)
    })

    this.listeners.push(roomsUnsubscribe)
  }

  async updateDevice(userId, roomId, deviceId, updates) {
    try {
      // Validate all required parameters
      if (!userId) {
        throw new Error('User ID is required')
      }
      if (!roomId) {
        throw new Error('Room ID is required')
      }
      if (!deviceId) {
        throw new Error('Device ID is required')
      }
      if (!updates || typeof updates !== 'object') {
        throw new Error('Updates object is required')
      }
      
      console.log('🔧 RoomsStore.updateDevice called with:', { userId, roomId, deviceId, updates })
      
      realtimeDebugger.log('RoomsStore', `Updating device ${deviceId} in room ${roomId}`, updates)
      
      // Verify we have the device locally first
      let room = this.rooms.find(r => r.id === roomId)
      if (!room) {
        console.warn('⚠️ Room not found locally, attempting to fetch:', roomId)
        // Try to fetch the room if not found locally
        try {
          await this.fetchRooms(userId, true) // Force refresh
          room = this.rooms.find(r => r.id === roomId)
          if (!room) {
            console.error('❌ Room still not found after refresh:', roomId)
            throw new Error(`Room ${roomId} not found`)
          }
        } catch (error) {
          console.error('❌ Failed to fetch rooms:', error)
          throw new Error(`Room ${roomId} not found`)
        }
      }
      
      const device = room.devices.find(d => d.id === deviceId)
      if (!device) {
        console.error('❌ Device not found:', deviceId, 'in room:', roomId)
        throw new Error(`Device ${deviceId} not found in room ${roomId}`)
      }
      
      console.log('📱 Device before update:', { name: device.name, state: device.state, ...device })
      
      const deviceRef = doc(db, 'users', userId, 'rooms', roomId, 'devices', deviceId)
      console.log('📄 Firebase document path:', `users/${userId}/rooms/${roomId}/devices/${deviceId}`)
      
      await updateDoc(deviceRef, updates)
      console.log('✅ Firebase update successful')
      
      // Immediately update local state for responsive UI
      console.log('🏠 Found room:', room.name)
      console.log('📱 Device before local update:', { name: device.name, state: device.state })
      Object.assign(device, updates)
      console.log('📱 Device after local update:', { name: device.name, state: device.state })
      
      // Create new array reference to trigger React updates
      this.rooms = [...this.rooms]
      this.notifyListeners()
      realtimeDebugger.log('RoomsStore', `Local state updated for device ${deviceId}`)
      
    } catch (error) {
      console.error('💥 Error updating device:', error)
      realtimeDebugger.log('RoomsStore', `Error updating device ${deviceId}`, error.message)
      throw error
    }
  }

  getRoomById(roomId) {
    return this.rooms.find(room => room.id === roomId)
  }

  getDeviceById(deviceId) {
    for (const room of this.rooms) {
      const device = room.devices.find(d => d.id === deviceId)
      if (device) return device
    }
    return null
  }

  // Add methods for UI subscription
  subscribe(callback) {
    this.uiListeners.push(callback)
    return () => {
      this.uiListeners = this.uiListeners.filter(listener => listener !== callback)
    }
  }
  
  notifyListeners() {
    // Debounce notifications to prevent excessive re-renders
    if (this.notifyTimeout) {
      clearTimeout(this.notifyTimeout);
    }
    
    this.notifyTimeout = setTimeout(() => {
      // Force state update by creating completely new objects
      const freshRooms = this.rooms.map(room => ({
        id: room.id, // Ensure ID is preserved
        ...room,
        devices: room.devices.map(device => ({ ...device }))
      }));
      
      this.uiListeners.forEach((callback, index) => {
        try {
          callback(freshRooms);
        } catch (error) {
          console.error(`❌ Error in listener ${index + 1}:`, error);
        }
      });
    }, 100); // 100ms debounce to reduce lag
  }

  startPeriodicNotifications() {
    // Clear existing interval
    if (this.periodicNotifyInterval) {
      clearInterval(this.periodicNotifyInterval);
    }
    
    // Notify UI every 500ms to reduce lag
    this.periodicNotifyInterval = setInterval(() => {
      if (this.uiListeners.length > 0) {
        this.notifyListeners();
      }
    }, 500);
  }

  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe())
    this.listeners = []
    this.uiListeners = []
    
    // Clear any pending notifications
    if (this.notifyTimeout) {
      clearTimeout(this.notifyTimeout);
      this.notifyTimeout = null;
    }
    
    // Clear periodic notifications
    if (this.periodicNotifyInterval) {
      clearInterval(this.periodicNotifyInterval);
      this.periodicNotifyInterval = null;
    }
  }
}

export const roomsStore = new RoomsStore()