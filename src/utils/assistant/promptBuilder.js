import { getToolDefinitions } from './toolRegistry';

/**
 * Builds context-aware prompts for the assistant
 * Injects environment context (room, devices, recent actions)
 */
export class PromptBuilder {
  constructor(environment, userProfile) {
    this.environment = environment;
    this.userProfile = userProfile;
  }

  /**
   * Build system prompt with current environment context
   */
  buildSystemPrompt() {
    const context = this.environment.buildContextForAssistant();
    const tools = getToolDefinitions();
    const userName = this.userProfile?.preferredName || this.userProfile?.name || 'User';
    const timeOfDay = context.timeOfDay;

    return `You are an advanced smart home assistant for a smart mirror. You help users control their home through natural conversation.

USER CONTEXT:
- Name: ${userName}
- Current time: ${timeOfDay}
${context.currentRoom ? `- Current room: ${context.currentRoom.name}` : '- Current room: Not specified'}

${context.currentRoom ? `CURRENT ROOM DEVICES (${context.currentRoom.name}):
${this.formatDevices(context.currentRoom.devices)}` : ''}

AVAILABLE ROOMS:
${context.allRooms.map(r => `- ${r.name} (${r.deviceCount} devices)`).join('\n')}

${context.recentActions.length > 0 ? `RECENT ACTIONS:
${context.recentActions.map(a => `- ${a.type} at ${new Date(a.timestamp).toLocaleTimeString()}`).join('\n')}` : ''}

CAPABILITIES:
You can control smart home devices using function calls. Available tools:
${tools.map(t => `- ${t.function.name}: ${t.function.description}`).join('\n')}

GUIDELINES:
1. Be conversational, friendly, and concise (keep responses under 50 words when possible)
2. Use the user's name naturally: ${userName}
3. Reference the current room when relevant: ${context.currentRoom?.name || 'all rooms'}
4. When controlling devices, use function calls - don't just describe actions
5. If asked about device states, check the current room context above
6. For security actions (locks), ask for confirmation first
7. If a device isn't found, suggest checking other rooms

RESPONSE STYLE:
- Use natural language
- Reference room names when relevant
- Confirm actions after executing them
- Be helpful for questions outside smart home control too`;

  }

  /**
   * Format device list for prompt
   */
  formatDevices(devices) {
    if (!devices || devices.length === 0) return 'No devices in this room';
    
    return devices.map(device => {
      const state = device.state ? 'ON' : 'OFF';
      const details = [];
      if (device.brightness !== undefined) details.push(`${device.brightness}% brightness`);
      if (device.temperature !== undefined) details.push(`${device.temperature}°C`);
      if (device.mode) details.push(`mode: ${device.mode}`);
      
      return `  - ${device.name} (${device.type}): ${state}${details.length > 0 ? ` - ${details.join(', ')}` : ''}`;
    }).join('\n');
  }

  /**
   * Build user message with context hints
   */
  enhanceUserMessage(message) {
    // Add context hints if user mentions room or device
    const context = this.environment.buildContextForAssistant();
    const currentRoom = context.currentRoom;
    
    if (currentRoom && !message.toLowerCase().includes(currentRoom.name.toLowerCase())) {
      // Optionally prepend context hint
      // For now, just return the message as-is
      // The system prompt already has the context
    }
    
    return message;
  }

  /**
   * Get available tools for function calling
   */
  getTools() {
    return getToolDefinitions();
  }
}
