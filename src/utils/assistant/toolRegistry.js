/**
 * Tool Registry - Defines available tools for the assistant
 * Maps OpenAI function calling to actual device actions
 */

export const TOOLS = [
  {
    name: 'toggleLight',
    description: 'Turn a light on or off. Use deviceId to target a specific light, or omit to toggle all lights in the current room.',
    parameters: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'string',
          description: 'ID of the light device to toggle. If not provided, toggles all lights in the current room.'
        },
        roomId: {
          type: 'string',
          description: 'ID of the room. If not provided, uses the current active room.'
        },
        state: {
          type: 'boolean',
          description: 'Desired state: true for on, false for off. If not provided, toggles current state.'
        }
      }
    }
  },
  {
    name: 'setBrightness',
    description: 'Set the brightness level of a light (0-100%).',
    parameters: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'string',
          description: 'ID of the light device'
        },
        value: {
          type: 'number',
          description: 'Brightness level from 0 to 100',
          minimum: 0,
          maximum: 100
        },
        roomId: {
          type: 'string',
          description: 'ID of the room. If not provided, uses the current active room.'
        }
      },
      required: ['value']
    }
  },
  {
    name: 'setTemperature',
    description: 'Set the temperature of a climate device (air conditioner or thermostat).',
    parameters: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'string',
          description: 'ID of the climate device'
        },
        value: {
          type: 'number',
          description: 'Temperature in Celsius (typically 16-30)',
          minimum: 16,
          maximum: 30
        },
        roomId: {
          type: 'string',
          description: 'ID of the room. If not provided, uses the current active room.'
        }
      },
      required: ['value']
    }
  },
  {
    name: 'setClimateState',
    description: 'Turn a climate device (AC or thermostat) on or off.',
    parameters: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'string',
          description: 'ID of the climate device'
        },
        state: {
          type: 'boolean',
          description: 'true to turn on, false to turn off',
          required: true
        },
        roomId: {
          type: 'string',
          description: 'ID of the room. If not provided, uses the current active room.'
        }
      },
      required: ['state']
    }
  },
  {
    name: 'openCurtains',
    description: 'Open curtains or blinds.',
    parameters: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'string',
          description: 'ID of the curtain device'
        },
        roomId: {
          type: 'string',
          description: 'ID of the room. If not provided, uses the current active room.'
        }
      }
    }
  },
  {
    name: 'closeCurtains',
    description: 'Close curtains or blinds.',
    parameters: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'string',
          description: 'ID of the curtain device'
        },
        roomId: {
          type: 'string',
          description: 'ID of the room. If not provided, uses the current active room.'
        }
      }
    }
  },
  {
    name: 'lockDoor',
    description: 'Lock a door. Use with caution - requires confirmation for security.',
    parameters: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'string',
          description: 'ID of the door lock device',
          required: true
        },
        roomId: {
          type: 'string',
          description: 'ID of the room. If not provided, uses the current active room.'
        }
      },
      required: ['deviceId']
    }
  },
  {
    name: 'unlockDoor',
    description: 'Unlock a door. Use with caution - requires confirmation for security.',
    parameters: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'string',
          description: 'ID of the door lock device',
          required: true
        },
        roomId: {
          type: 'string',
          description: 'ID of the room. If not provided, uses the current active room.'
        }
      },
      required: ['deviceId']
    }
  }
];

/**
 * Get tool definitions in OpenAI function calling format
 */
export const getToolDefinitions = () => {
  return TOOLS.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
};

/**
 * Validate tool parameters
 */
export const validateToolParameters = (toolName, parameters) => {
  const tool = TOOLS.find(t => t.name === toolName);
  if (!tool) {
    return { valid: false, error: `Unknown tool: ${toolName}` };
  }

  const required = tool.parameters.required || [];
  for (const param of required) {
    if (parameters[param] === undefined || parameters[param] === null) {
      return { valid: false, error: `Missing required parameter: ${param}` };
    }
  }

  // Validate value ranges
  if (toolName === 'setBrightness' && parameters.value !== undefined) {
    if (parameters.value < 0 || parameters.value > 100) {
      return { valid: false, error: 'Brightness must be between 0 and 100' };
    }
  }

  if (toolName === 'setTemperature' && parameters.value !== undefined) {
    if (parameters.value < 16 || parameters.value > 30) {
      return { valid: false, error: 'Temperature must be between 16 and 30°C' };
    }
  }

  return { valid: true };
};
