import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { roomsStore } from '../stores/roomsStore'
import './ChatGPTAssistant.css'

const ChatGPTAssistant = () => {
  console.log('🤖 ChatGPT Assistant component rendering')
  
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: 'Hello! I\'m your intelligent home assistant. I can help you control your smart home devices. Try asking me to "turn on the living room light" or "what devices do I have?"',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rooms, setRooms] = useState([])
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const speechSynthesis = useRef(window.speechSynthesis)

  // Load rooms and devices
  useEffect(() => {
    if (user) {
      console.log('🏠 ChatGPT Assistant: Loading rooms for user:', user.uid)
      
      const loadRooms = async () => {
        try {
          await roomsStore.fetchRooms(user.uid, true)
          const loadedRooms = [...roomsStore.rooms]
          setRooms(loadedRooms)
          console.log('🏠 ChatGPT Assistant: Loaded rooms:', loadedRooms.length)
        } catch (err) {
          console.error('Error loading rooms for ChatGPT assistant:', err)
          setError('Failed to load rooms')
        }
      }
      
      loadRooms()
      
      const unsubscribe = roomsStore.subscribe((updatedRooms) => {
        console.log('🏠 ChatGPT Assistant: Received rooms update')
        setRooms([...updatedRooms])
      })
      
      return () => {
        if (unsubscribe) {
          unsubscribe()
        }
      }
    }
  }, [user])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Speak response using text-to-speech
  const speakResponse = (text) => {
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel() // Cancel any ongoing speech
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 0.8
      
      speechSynthesis.current.speak(utterance)
    }
  }
  const callChatGPT = async (prompt) => {
    const OPENAI_API_KEY = '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'
    
    // Prepare device context for ChatGPT
    const deviceContext = rooms.flatMap(room => 
      room.devices?.map(device => ({
        name: device.name,
        type: device.type,
        room: room.name,
        state: device.state ? 'on' : 'off',
        id: device.id,
        roomId: room.id
      })) || []
    )

    const systemPrompt = `You are an intelligent smart home assistant. You can control devices and provide helpful information.

Available devices:
${deviceContext.map(d => `- ${d.name} (${d.type}) in ${d.room} - currently ${d.state}`).join('\n')}

IMPORTANT INSTRUCTIONS:
1. When controlling devices, respond with ONLY a JSON object in this exact format:
   {"action": "control_device", "device_name": "exact device name", "room_name": "exact room name", "new_state": "on" or "off", "response": "friendly confirmation message"}

2. For device control:
   - Match device names flexibly (e.g., "fan" should match "FAN" or "Living Room Fan")
   - Match room names flexibly (e.g., "living room" should match "Living")
   - Use the EXACT device and room names from the available devices list
   - Only use "on" or "off" for new_state

3. For non-device-control questions (like "what devices do I have?", general questions, etc.), respond normally WITHOUT JSON.

4. If you cannot identify a specific device, respond normally and ask for clarification.

Examples:
User: "Turn off the fan" → {"action": "control_device", "device_name": "FAN", "room_name": "Living", "new_state": "off", "response": "I've turned off the fan for you!"}
User: "What devices do I have?" → "You have the following devices: [list devices normally]"
User: "Turn on bedroom light" → {"action": "control_device", "device_name": "Bedroom Light", "room_name": "Bedroom", "new_state": "on", "response": "I've turned on the bedroom light!"}`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error('ChatGPT API error:', error)
      throw error
    }
  }

  // Execute device control with improved matching
  const executeDeviceControl = async (deviceName, roomName, newState) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log(`🔍 Searching for device: "${deviceName}" in room: "${roomName}"`)
    
    // Find the room with flexible matching
    let room = rooms.find(r => 
      r.name.toLowerCase() === roomName.toLowerCase() ||
      r.name.toLowerCase().includes(roomName.toLowerCase()) ||
      roomName.toLowerCase().includes(r.name.toLowerCase())
    )
    
    if (!room) {
      console.log('🚪 Available rooms:', rooms.map(r => r.name))
      throw new Error(`Room "${roomName}" not found. Available rooms: ${rooms.map(r => r.name).join(', ')}`)
    }

    console.log(`✅ Found room: ${room.name}`)

    // Find the device with flexible matching
    let device = room.devices?.find(d => 
      d.name.toLowerCase() === deviceName.toLowerCase() ||
      d.name.toLowerCase().includes(deviceName.toLowerCase()) ||
      deviceName.toLowerCase().includes(d.name.toLowerCase()) ||
      d.type.toLowerCase() === deviceName.toLowerCase() ||
      d.type.toLowerCase().includes(deviceName.toLowerCase()) ||
      deviceName.toLowerCase().includes(d.type.toLowerCase())
    )
    
    if (!device) {
      const availableDevices = room.devices?.map(d => `${d.name} (${d.type})`) || []
      console.log('📱 Available devices in room:', availableDevices)
      throw new Error(`Device "${deviceName}" not found in ${room.name}. Available devices: ${availableDevices.join(', ')}`)
    }

    console.log(`✅ Found device: ${device.name} (${device.type})`)

    const targetState = newState === 'on'
    console.log(`🔧 Executing device control: ${device.name} in ${room.name} - ${newState} (${targetState})`)

    try {
      await roomsStore.updateDevice(user.uid, device.roomId, device.id, {
        ...device,
        state: targetState
      })
      console.log('✅ Device updated successfully')
    } catch (error) {
      console.error('❌ Device update failed:', error)
      throw new Error('Failed to update device state')
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage = {
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setError('')

    try {
      console.log('🤖 Sending to ChatGPT:', inputValue)
      const response = await callChatGPT(inputValue)
      console.log('🤖 ChatGPT response:', response)

      // Check if response contains device control command
      let assistantMessage = response
      let deviceControlExecuted = false

      try {
        // Try to parse as JSON for device control
        if (response.includes('"action"') && response.includes('control_device')) {
          console.log('🎯 Detected device control command in response')
          
          // Extract JSON from response
          const jsonStart = response.indexOf('{')
          const jsonEnd = response.lastIndexOf('}') + 1
          
          if (jsonStart !== -1 && jsonEnd > jsonStart) {
            const jsonStr = response.substring(jsonStart, jsonEnd)
            console.log('📝 Extracted JSON:', jsonStr)
            
            const controlCommand = JSON.parse(jsonStr)
            
            if (controlCommand.action === 'control_device') {
              console.log('🔧 Executing device control:', controlCommand)
              
              await executeDeviceControl(
                controlCommand.device_name,
                controlCommand.room_name,
                controlCommand.new_state
              )
              
              // Use only the friendly response message
              assistantMessage = controlCommand.response
              deviceControlExecuted = true
              
              console.log('✅ Device control executed successfully')
            }
          }
        }
      } catch (parseError) {
        console.log('📝 Not a device control command, treating as normal response')
        console.log('Parse error:', parseError.message)
      }

      const assistantResponse = {
        type: 'assistant',
        content: assistantMessage,
        timestamp: new Date(),
        deviceControlExecuted
      }

      setMessages(prev => [...prev, assistantResponse])
      
      // Add voice output
      speakResponse(assistantMessage)

    } catch (error) {
      console.error('Error processing request:', error)
      setError(error.message)
      
      const errorResponse = {
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date(),
        isError: true
      }
      
      setMessages(prev => [...prev, errorResponse])
    }

    setIsLoading(false)
  }

  const clearConversation = () => {
    setMessages([
      {
        type: 'assistant',
        content: 'Hello! I\'m your intelligent home assistant. How can I help you control your smart home today?',
        timestamp: new Date()
      }
    ])
    setError('')
  }

  return (
    <div className="chatgpt-assistant">
      <div className="assistant-header">
        <h3>🤖 AI Assistant</h3>
        <div className="header-controls">
          <span className={`status-indicator ${isLoading ? 'processing' : 'ready'}`}>
            {isLoading ? '🤖 Thinking...' : '✓ Ready'}
          </span>
          <button 
            className="clear-btn"
            onClick={clearConversation}
            title="Clear conversation"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {/* Status Section */}
      <div className="status-section">
        {error && (
          <div className="error-banner">
            ❌ {error}
            <button onClick={() => setError('')} className="dismiss-btn">×</button>
          </div>
        )}
        
        <div className="device-stats">
          🏠 {rooms.length} rooms, {rooms.reduce((acc, room) => acc + (room.devices?.length || 0), 0)} devices available
        </div>
      </div>
      
      <div className="messages-container">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.type} ${message.deviceControlExecuted ? 'device-control' : ''} ${message.isError ? 'error' : ''}`}
          >
            <div className="message-content">
              {message.deviceControlExecuted && <span className="device-control-icon">⚙️ </span>}
              {message.content}
            </div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="input-form" onSubmit={handleSubmit}>
        <div className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me to control devices or anything else..."
            disabled={isLoading}
            className="message-input"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="send-btn"
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChatGPTAssistant