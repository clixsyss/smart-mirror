// ChatGPT-based AI Assistant Service
// Uses OpenAI's function calling for intelligent device control and conversation

import OpenAI from 'openai'
import { OPENAI_CONFIG } from '../config/openai'

class ChatGPTAssistantService {
  constructor() {
    this.openai = null
    this.conversationHistory = []
    this.isWaitingForResponse = false
    this.lastContext = null
    
    this.initializeOpenAI()
  }

  normalizeName(value = '') {
    return value.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
  }

  getLevenshteinDistance(a, b) {
    if (a === b) return 0
    if (!a) return b.length
    if (!b) return a.length

    const matrix = Array.from({ length: a.length + 1 }, () => [])
    for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i
    for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j

    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        )
      }
    }

    return matrix[a.length][b.length]
  }

  resolveRoomName(roomInput, rooms = []) {
    if (!roomInput || rooms.length === 0) return null

    const normalizedInput = this.normalizeName(roomInput)
    if (!normalizedInput) return null

    let bestMatch = null
    let bestScore = 0

    rooms.forEach(room => {
      const normalizedRoom = this.normalizeName(room.name)
      if (!normalizedRoom) return

      if (normalizedInput.includes(normalizedRoom) || normalizedRoom.includes(normalizedInput)) {
        bestMatch = room.name
        bestScore = 1
        return
      }

      const distance = this.getLevenshteinDistance(normalizedInput, normalizedRoom)
      const maxLen = Math.max(normalizedInput.length, normalizedRoom.length)
      const score = maxLen > 0 ? 1 - distance / maxLen : 0

      if (score > bestScore) {
        bestScore = score
        bestMatch = room.name
      }
    })

    return bestScore >= 0.6 ? bestMatch : null
  }

  getDeviceState(device) {
    if (typeof device?.state === 'boolean') return device.state
    if (typeof device?.isOn === 'boolean') return device.isOn
    if (typeof device?.properties?.state === 'boolean') return device.properties.state
    if (typeof device?.properties?.on === 'boolean') return device.properties.on
    return undefined
  }

  /**
   * Initialize OpenAI client
   */
  initializeOpenAI() {
    console.log('🔧 Initializing OpenAI for ChatGPT Assistant')
    
    if (!OPENAI_CONFIG.apiKey || OPENAI_CONFIG.apiKey === 'your-openai-api-key-here') {
      console.warn('⚠️ OpenAI API key not configured, ChatGPT features will be disabled')
      this.openai = null
      return
    }

    try {
      this.openai = new OpenAI({
        apiKey: OPENAI_CONFIG.apiKey,
        dangerouslyAllowBrowser: true
      })
      console.log('✅ OpenAI ChatGPT Assistant initialized')
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI:', error)
      this.openai = null
    }
  }

  /**
   * Main assistant function - processes user queries with ChatGPT
   */
  async askAssistant(query, context = {}) {
    try {
      // Check if OpenAI is available
      if (!this.openai) {
        console.log('⚠️ OpenAI not configured, using fallback processing')
        return this.fallbackProcessing(query)
      }

      console.log('🤖 Processing query with ChatGPT:', query)
      
      // Add user message to conversation history
      this.conversationHistory.push({ role: 'user', content: query })
      
      // Build device context from available rooms and devices
      const deviceContext = this.generateDeviceContext(context)
      
      // Create system prompt with conversational instructions
      const systemPrompt = this.createConversationalSystemPrompt(deviceContext, context)
      
      // Prepare messages with conversation history (keep last 10 exchanges)
      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory.slice(-10)
      ]
      
      // Call ChatGPT with function calling
      const response = await this.openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages: messages,
        functions: this.getDeviceControlFunctions(),
        function_call: 'auto',
        temperature: OPENAI_CONFIG.temperature
      })

      const message = response.choices[0].message

      // Handle function calls
      if (message.function_call) {
        console.log('🔧 Function call detected:', message.function_call)
        const result = await this.executeFunctionCall(message.function_call, context)
        
        // Add assistant response to conversation history
        this.conversationHistory.push({ role: 'assistant', content: result })
        this.isWaitingForResponse = true
        
        return result
      }

      // Get regular response
      const responseText = message.content || 'I apologize, but I couldn\'t process your request.'
      
      // Add assistant response to conversation history
      this.conversationHistory.push({ role: 'assistant', content: responseText })
      this.isWaitingForResponse = true
      
      // Add follow-up question if appropriate
      const followUpQuestion = this.generateFollowUpQuestion(query, responseText)
      if (followUpQuestion) {
        this.conversationHistory.push({ role: 'assistant', content: followUpQuestion })
        return `${responseText}\n\n${followUpQuestion}`
      }

      return responseText
    } catch (error) {
      console.error('❌ ChatGPT Assistant error:', error)
      console.log('🔄 Falling back to local processing')
      return this.fallbackProcessing(query)
    }
  }

  /**
   * Generate device context from available rooms and devices
   */
  generateDeviceContext(context) {
    const rooms = context.rooms || []
    const devices = []

    // Extract all devices from rooms
    rooms.forEach(room => {
      if (room.devices && Array.isArray(room.devices)) {
        room.devices.forEach(device => {
          devices.push({
            id: device.id,
            name: device.name,
            type: device.type,
            room: room.name,
            state: device.state || false,
            properties: device.properties || {}
          })
        })
      }
      
      // Also check for lights array
      if (room.lights && Array.isArray(room.lights)) {
        room.lights.forEach(light => {
          devices.push({
            id: light.deviceId || light.id,
            name: light.name,
            type: 'light',
            room: room.name,
            state: light.state || false,
            properties: light.properties || {}
          })
        })
      }
    })

    // Generate device context string
    let contextStr = `\n## AVAILABLE DEVICES\n\n`
    
    rooms.forEach(room => {
      const roomDevices = devices.filter(d => d.room === room.name)
      if (roomDevices.length > 0) {
        contextStr += `### ${room.name}\n`
        roomDevices.forEach(device => {
          contextStr += `- ${device.name} (${device.type}): ${device.state ? 'ON' : 'OFF'}\n`
        })
        contextStr += '\n'
      }
    })

    return contextStr
  }

  /**
   * Create conversational system prompt
   */
  createConversationalSystemPrompt(deviceContext, context) {
    return `You are Clixsy, a friendly and intelligent AI assistant for a smart mirror system.

## YOUR PERSONALITY
- Friendly, helpful, and conversational
- Use your name "Clixsy" naturally in conversation
- Ask follow-up questions to keep the conversation flowing
- Remember previous conversation context
- Be proactive in suggesting helpful actions
- Use natural, conversational language

## YOUR CAPABILITIES
- Control smart home devices (lights, AC, fans, etc.)
- Adjust device settings (brightness, temperature, speed)
- Provide weather information
- Tell current time
- Answer questions and have conversations
- Suggest helpful automations

${deviceContext}

## CURRENT CONTEXT
- Current time: ${new Date().toLocaleString()}
- Total rooms: ${(context.rooms || []).length}

## CONVERSATION RULES
1. Always acknowledge what the user said
2. Ask clarifying questions when needed
3. Suggest helpful follow-up actions
4. Be encouraging and positive
5. Remember context from previous messages
6. ALWAYS end your response with a question to keep the conversation going

When controlling devices, always:
1. Confirm what you're about to do
2. Execute the action using function calls
3. Ask if they need anything else
4. Suggest related actions they might want

Be conversational and engaging!`
  }

  /**
   * Get device control functions for ChatGPT
   */
  getDeviceControlFunctions() {
    return [
      {
        name: 'control_devices',
        description: 'Control smart home devices (lights, AC, fans, etc.)',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['turn_on', 'turn_off', 'toggle', 'set_brightness', 'set_temperature', 'set_speed'],
              description: 'Action to perform on the device'
            },
            device_criteria: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Device name or partial name' },
                type: { type: 'string', description: 'Device type (light, ac, fan, etc.)' },
                room: { type: 'string', description: 'Room name' }
              },
              description: 'Criteria to find target devices'
            },
            property: {
              type: 'string',
              description: 'Property to control (brightness, temperature, speed, etc.)'
            },
            value: {
              type: 'number',
              description: 'Value to set for the property'
            }
          },
          required: ['action']
        }
      },
      {
        name: 'get_device_status',
        description: 'Get status of devices',
        parameters: {
          type: 'object',
          properties: {
            device_criteria: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
                room: { type: 'string' }
              }
            }
          }
        }
      }
    ]
  }

  /**
   * Execute function calls from ChatGPT
   */
  async executeFunctionCall(functionCall, context) {
    const { name, arguments: args } = functionCall
    const parsedArgs = JSON.parse(args)

    console.log('🔧 Executing function:', name, parsedArgs)

    switch (name) {
      case 'control_devices':
        return await this.controlDevices(parsedArgs, context)
      case 'get_device_status':
        return await this.getDeviceStatus(parsedArgs, context)
      default:
        return 'I don\'t know how to execute that function.'
    }
  }

  /**
   * Control devices based on ChatGPT function call
   */
  async controlDevices(args, context) {
    try {
      const { action, device_criteria, property, value } = args
      
      // Find target devices
      const targetDevices = this.findTargetDevices(device_criteria, context)
      
      if (targetDevices.length === 0) {
        return `I couldn't find any devices matching: ${JSON.stringify(device_criteria)}`
      }

      // Execute control action for each device
      const results = []
      for (const device of targetDevices) {
        const result = await this.controlSingleDevice(device, action, property, value, context)
        results.push(result)
      }

      // Generate natural response
      const alreadyStates = results.filter(result => result.includes('already on') || result.includes('already off'))

      if (targetDevices.length === 1) {
        return `✅ ${results[0]}`
      }

      if (alreadyStates.length === results.length) {
        return '✅ All matching devices are already in the requested state.'
      }

      if (alreadyStates.length > 0) {
        return `✅ Some devices were already in the requested state:\n${results.join('\n')}`
      }

      return `✅ Controlled ${targetDevices.length} devices:\n${results.join('\n')}`
    } catch (error) {
      console.error('Error controlling devices:', error)
      return `I encountered an error while controlling the devices: ${error.message}`
    }
  }

  /**
   * Find target devices based on criteria
   */
  findTargetDevices(criteria, context) {
    const rooms = context.rooms || []
    let devices = []

    // Collect all devices
    rooms.forEach(room => {
      if (room.devices) {
        room.devices.forEach(device => {
          devices.push({ ...device, roomName: room.name, roomId: room.id })
        })
      }
      if (room.lights) {
        room.lights.forEach(light => {
          devices.push({ 
            id: light.deviceId || light.id,
            name: light.name,
            type: 'light',
            roomName: room.name,
            roomId: room.id,
            ...light
          })
        })
      }
    })

    // Filter by criteria
    if (criteria) {
      if (criteria.room) {
        const resolvedRoom = this.resolveRoomName(criteria.room, rooms) || criteria.room
        const normalizedRoom = this.normalizeName(resolvedRoom)
        devices = devices.filter(d => 
          this.normalizeName(d.roomName || '').includes(normalizedRoom)
        )
      }
      if (criteria.type) {
        devices = devices.filter(d => 
          d.type?.toLowerCase().includes(criteria.type.toLowerCase())
        )
      }
      if (criteria.name) {
        devices = devices.filter(d => 
          d.name?.toLowerCase().includes(criteria.name.toLowerCase())
        )
      }
    }

    return devices
  }

  /**
   * Control a single device
   */
  async controlSingleDevice(device, action, property, value, context) {
    const currentState = this.getDeviceState(device)

    if (action === 'turn_on' && currentState === true) {
      return `${device.name} in ${device.roomName} is already on`
    }

    if (action === 'turn_off' && currentState === false) {
      return `${device.name} in ${device.roomName} is already off`
    }

    // Call the control callback if provided
    if (context.onDeviceControl) {
      await context.onDeviceControl({
        roomId: device.roomId,
        deviceId: device.id,
        action,
        property,
        value
      })
    }

    // Generate response message
    let message = `${device.name} in ${device.roomName}`
    
    switch (action) {
      case 'turn_on':
        message += ' turned on'
        break
      case 'turn_off':
        message += ' turned off'
        break
      case 'toggle':
        message += ' toggled'
        break
      case 'set_brightness':
        message += ` brightness set to ${value}%`
        break
      case 'set_temperature':
        message += ` temperature set to ${value}°`
        break
      case 'set_speed':
        message += ` speed set to ${value}`
        break
      default:
        message += ` ${property} set to ${value}`
    }

    return message
  }

  /**
   * Get device status
   */
  async getDeviceStatus(args, context) {
    const targetDevices = this.findTargetDevices(args.device_criteria, context)
    
    if (targetDevices.length === 0) {
      return 'No devices found matching your criteria.'
    }

    let status = 'Here\'s the status:\n'
    targetDevices.forEach(device => {
      status += `- ${device.name} in ${device.roomName}: ${device.state ? 'ON' : 'OFF'}\n`
    })

    return status
  }

  /**
   * Generate follow-up questions
   */
  generateFollowUpQuestion(userQuery, assistantResponse) {
    const lowerQuery = userQuery.toLowerCase()
    const lowerResponse = assistantResponse.toLowerCase()
    
    // Don't ask follow-up if already asking a question
    if (lowerResponse.includes('?') || lowerResponse.includes('would you like')) {
      return null
    }
    
    // Device control follow-ups
    if (lowerQuery.includes('turn on') || lowerQuery.includes('turn off')) {
      const followUps = [
        "Is there anything else you'd like me to help you with?",
        "What else can I do for you?",
        "Would you like to control any other devices?",
        "Can I help you with anything else?"
      ]
      return followUps[Math.floor(Math.random() * followUps.length)]
    }
    
    // General follow-ups
    const generalFollowUps = [
      "What else can I help you with?",
      "What can I do for you next?",
      "Is there anything else you'd like assistance with?",
      "How else can I be of service?"
    ]
    return generalFollowUps[Math.floor(Math.random() * generalFollowUps.length)]
  }

  /**
   * Fallback processing when ChatGPT is not available
   */
  fallbackProcessing(query) {
    const lowerQuery = query.toLowerCase()
    
    // Greetings
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey')) {
      return 'Hello! I\'m Clixsy, your smart mirror assistant. To enable full AI features, please configure your OpenAI API key in the settings.'
    }
    
    // Goodbyes
    if (lowerQuery.includes('goodbye') || lowerQuery.includes('bye')) {
      return 'Goodbye! Have a great day!'
    }
    
    // Default response
    return 'I\'m here to help! Please configure your OpenAI API key to enable advanced conversational features.'
  }

  /**
   * Clear conversation history
   */
  clearConversation() {
    this.conversationHistory = []
    this.isWaitingForResponse = false
    this.lastContext = null
  }

  /**
   * Check if assistant is waiting for a response
   */
  isWaiting() {
    return this.isWaitingForResponse
  }

  /**
   * Set waiting state
   */
  setWaiting(waiting) {
    this.isWaitingForResponse = waiting
  }
}

// Export singleton instance
export const chatGPTAssistantService = new ChatGPTAssistantService()
export default chatGPTAssistantService
