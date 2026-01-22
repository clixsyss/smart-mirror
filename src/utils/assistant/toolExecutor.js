import { validateToolParameters } from './toolRegistry';

/**
 * Tool Executor - Safely executes tool calls
 * Maps tool names to actual device actions
 */
export class ToolExecutor {
  constructor(actions, environment, userId) {
    this.actions = actions;
    this.environment = environment;
    this.userId = userId;
  }

  /**
   * Execute a tool call
   */
  async execute(toolName, parameters) {
    // Validate parameters
    const validation = validateToolParameters(toolName, parameters);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        message: `Invalid parameters: ${validation.error}`
      };
    }

    try {
      // Resolve room ID
      const roomId = parameters.roomId || this.environment.activeRoom || null;

      // Execute the tool
      switch (toolName) {
        case 'toggleLight':
          return await this.toggleLight(parameters, roomId);
        
        case 'setBrightness':
          return await this.setBrightness(parameters, roomId);
        
        case 'setTemperature':
          return await this.setTemperature(parameters, roomId);
        
        case 'setClimateState':
          return await this.setClimateState(parameters, roomId);
        
        case 'openCurtains':
          return await this.openCurtains(parameters, roomId);
        
        case 'closeCurtains':
          return await this.closeCurtains(parameters, roomId);
        
        case 'lockDoor':
          return await this.lockDoor(parameters, roomId);
        
        case 'unlockDoor':
          return await this.unlockDoor(parameters, roomId);
        
        default:
          return {
            success: false,
            error: `Unknown tool: ${toolName}`,
            message: `I don't know how to ${toolName}`
          };
      }
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      return {
        success: false,
        error: error.message,
        message: `Failed to ${toolName}: ${error.message}`
      };
    }
  }

  async toggleLight(parameters, roomId) {
    const { deviceId, state } = parameters;
    
    if (deviceId) {
      // Toggle specific device
      const device = this.environment.getDeviceById(deviceId);
      if (!device) {
        return { success: false, message: `Light device ${deviceId} not found` };
      }
      
      const targetRoomId = roomId || device.roomId;
      const targetState = state !== undefined ? state : !device.state;
      
      await this.actions.toggleLight(this.userId, targetRoomId, deviceId, targetState);
      this.environment.addAction({ type: 'toggleLight', deviceId, state: targetState });
      
      return {
        success: true,
        message: `Turned ${targetState ? 'on' : 'off'} ${device.name || 'the light'}`
      };
    } else {
      // Toggle all lights in room
      const lights = roomId 
        ? this.environment.getDevicesByRoom(roomId).filter(d => d.type === 'light')
        : this.environment.devicesByType.lights;
      
      if (lights.length === 0) {
        return { success: false, message: 'No lights found' };
      }
      
      const targetState = state !== undefined ? state : !lights[0].state;
      for (const light of lights) {
        const lightRoomId = roomId || light.roomId;
        await this.actions.toggleLight(this.userId, lightRoomId, light.id, targetState);
      }
      
      this.environment.addAction({ type: 'toggleLight', roomId, state: targetState, count: lights.length });
      
      return {
        success: true,
        message: `Turned ${targetState ? 'on' : 'off'} ${lights.length} light${lights.length > 1 ? 's' : ''}`
      };
    }
  }

  async setBrightness(parameters, roomId) {
    const { deviceId, value } = parameters;
    
    if (!deviceId) {
      return { success: false, message: 'Device ID required for brightness control' };
    }
    
    const device = this.environment.getDeviceById(deviceId);
    if (!device) {
      return { success: false, message: `Light device ${deviceId} not found` };
    }
    
    const targetRoomId = roomId || device.roomId;
    await this.actions.setLightBrightness(this.userId, targetRoomId, deviceId, value);
    this.environment.addAction({ type: 'setBrightness', deviceId, value });
    
    return {
      success: true,
      message: `Set ${device.name || 'light'} brightness to ${value}%`
    };
  }

  async setTemperature(parameters, roomId) {
    const { deviceId, value } = parameters;
    
    if (!deviceId) {
      // Find first climate device in room
      const climateDevices = roomId
        ? this.environment.getDevicesByRoom(roomId).filter(d => 
            d.type === 'air_conditioner' || d.type === 'thermostat'
          )
        : this.environment.devicesByType.climate;
      
      if (climateDevices.length === 0) {
        return { success: false, message: 'No climate devices found' };
      }
      
      // Set temperature on all climate devices
      for (const device of climateDevices) {
        const deviceRoomId = roomId || device.roomId;
        await this.actions.setClimateTemperature(this.userId, deviceRoomId, device.id, value);
      }
      
      this.environment.addAction({ type: 'setTemperature', value, count: climateDevices.length });
      
      return {
        success: true,
        message: `Set temperature to ${value}°C on ${climateDevices.length} device${climateDevices.length > 1 ? 's' : ''}`
      };
    } else {
      const device = this.environment.getDeviceById(deviceId);
      if (!device) {
        return { success: false, message: `Climate device ${deviceId} not found` };
      }
      
      const targetRoomId = roomId || device.roomId;
      await this.actions.setClimateTemperature(this.userId, targetRoomId, deviceId, value);
      this.environment.addAction({ type: 'setTemperature', deviceId, value });
      
      return {
        success: true,
        message: `Set ${device.name || 'climate device'} to ${value}°C`
      };
    }
  }

  async setClimateState(parameters, roomId) {
    const { deviceId, state } = parameters;
    
    if (!deviceId) {
      return { success: false, message: 'Device ID required' };
    }
    
    const device = this.environment.getDeviceById(deviceId);
    if (!device) {
      return { success: false, message: `Climate device ${deviceId} not found` };
    }
    
    const targetRoomId = roomId || device.roomId;
    await this.actions.setClimateState(this.userId, targetRoomId, deviceId, state);
    this.environment.addAction({ type: 'setClimateState', deviceId, state });
    
    return {
      success: true,
      message: `Turned ${device.name || 'climate device'} ${state ? 'on' : 'off'}`
    };
  }

  async openCurtains(parameters, roomId) {
    // Placeholder - implement when curtain actions are available
    return { success: false, message: 'Curtain control coming soon' };
  }

  async closeCurtains(parameters, roomId) {
    // Placeholder - implement when curtain actions are available
    return { success: false, message: 'Curtain control coming soon' };
  }

  async lockDoor(parameters, roomId) {
    // Placeholder - implement when door lock actions are available
    return { success: false, message: 'Door lock control coming soon' };
  }

  async unlockDoor(parameters, roomId) {
    // Placeholder - implement when door lock actions are available
    return { success: false, message: 'Door lock control coming soon' };
  }
}
