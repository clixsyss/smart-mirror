import { useState, useRef, useEffect, useCallback } from 'react'
import { useGlobalStore } from '../hooks/useGlobalStore'
import './ChatGPTAssistant.css'

const ChatGPTAssistant = ({ userId, userProfile }) => {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, _setIsProcessing] = useState(false)
  const [currentResponse, setCurrentResponse] = useState('')
  const [assistantState, setAssistantState] = useState('idle')
  const [speechSupported, setSpeechSupported] = useState(false)
  const [micPermission, setMicPermission] = useState(null)
  // const [transcript, setTranscript] = useState('')
  
  const recognition = useRef(null)
  const speechSynthesis = useRef(window.speechSynthesis)
  const { state, actions: globalActions } = useGlobalStore()

  // Check browser support and initialize
  useEffect(() => {
    const checkSupport = () => {
      const hasWebkitSpeech = 'webkitSpeechRecognition' in window
      const hasSpeech = 'SpeechRecognition' in window
      const supported = hasWebkitSpeech || hasSpeech
      
      console.log('Speech recognition support:', { hasWebkitSpeech, hasSpeech, supported, online: navigator.onLine })
      setSpeechSupported(supported)
      
      if (supported) {
        if (navigator.onLine) {
          requestMicrophonePermission()
        } else {
          setCurrentResponse('Voice recognition requires internet connection. Quick command buttons work offline.')
          setSpeechSupported(false)
        }
      } else {
        setCurrentResponse('Speech recognition not supported in this browser. Please use Chrome or Edge.')
      }
    }

    // Initialize smart home data
    const initializeSmartHome = async () => {
      console.log('Initializing smart home data...')
      const currentUserId = userId || 'default'
      console.log('Using userId:', currentUserId)
      
      try {
        await globalActions.fetchSmartHomeData(currentUserId)
        console.log('Smart home data initialized')
      } catch (error) {
        console.warn('Failed to fetch smart home data, using fallback:', error)
      }
    }
    
    // Check network status changes
    const handleOnline = () => {
      console.log('Network back online - re-enabling voice recognition')
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        setSpeechSupported(true)
        requestMicrophonePermission()
      }
    }
    
    const handleOffline = () => {
      console.log('Network offline - disabling voice recognition')
      setSpeechSupported(false)
      setCurrentResponse('Voice recognition requires internet connection. Quick command buttons work offline.')
      if (recognition.current) {
        try {
          recognition.current.stop()
        } catch (error) {
          console.warn('Error stopping recognition on offline:', error)
        }
      }
    }
    
    checkSupport()
    initializeSmartHome()
    
    // Listen for network changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [userId])

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async () => {
    try {
      console.log('Requesting microphone permission...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('Microphone permission granted')
      
      // Stop the stream - we just needed permission
      stream.getTracks().forEach(track => track.stop())
      setMicPermission('granted')
      setCurrentResponse('Voice assistant ready! Click Talk to start.')
      
    } catch (error) {
      console.error('Microphone permission denied:', error)
      setMicPermission('denied')
      setCurrentResponse('Microphone access required. Please allow microphone permissions and refresh.')
    }
  }, [])

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!speechSupported || micPermission !== 'granted') return null

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const newRecognition = new SpeechRecognition()
      
      newRecognition.continuous = false
      newRecognition.interimResults = true
      newRecognition.lang = 'en-US'
      newRecognition.maxAlternatives = 1

      // Set up event handlers
      newRecognition.onstart = () => {
        console.log('Speech recognition started successfully')
        setIsListening(true)
        setAssistantState('listening')
        setCurrentResponse('Listening... speak now!')
        // setTranscript('')
      }

      newRecognition.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        // Show live transcription
        if (interimTranscript) {
          // setTranscript(interimTranscript)
          setCurrentResponse(`Hearing: "${interimTranscript}"`)
        }

        // Process final result
        if (finalTranscript.trim()) {
          console.log('Final transcript:', finalTranscript)
          // setTranscript(finalTranscript)
          processVoiceCommand(finalTranscript.trim())
        }
      }

      newRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error, event)
        setIsListening(false)
        setAssistantState('idle')
        
        switch (event.error) {
          case 'not-allowed':
            setCurrentResponse('Microphone access denied. Please allow microphone permissions and refresh the page.')
            break
          case 'no-speech':
            setCurrentResponse('No speech detected. Try speaking more clearly or use the quick command buttons below.')
            break
          case 'audio-capture':
            setCurrentResponse('No microphone found. Please check your audio setup and refresh the page.')
            break
          case 'network':
            // Network error - provide fallback options and retry
            setCurrentResponse('Speech service temporarily unavailable. Use quick command buttons below.')
            console.log('Network error detected - speech recognition service unavailable')
            
            // Automatically disable speech recognition temporarily
            setSpeechSupported(false)
            
            // Try to re-enable after 5 seconds
            setTimeout(() => {
              if (navigator.onLine) {
                console.log('Attempting to re-enable speech recognition after network error')
                setSpeechSupported(true)
                setCurrentResponse('Voice recognition restored. Click Talk to try again.')
              }
            }, 5000)
            break
          case 'service-not-allowed':
            setCurrentResponse('Speech recognition service blocked. Use quick command buttons below.')
            break
          case 'aborted':
            // Don't show error for user-initiated stops
            if (assistantState === 'listening') {
              setCurrentResponse('Voice recognition stopped. Click Talk to try again.')
            }
            break
          default:
            setCurrentResponse(`Voice recognition error (${event.error}). Use quick command buttons below or try again.`)
            console.error('Unhandled speech recognition error:', event.error)
        }
      }

      newRecognition.onend = () => {
        console.log('Speech recognition ended')
        setIsListening(false)
        if (assistantState === 'listening') {
          setAssistantState('idle')
        }
      }

      console.log('Speech recognition initialized successfully')
      return newRecognition
      
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error)
      setSpeechSupported(false)
      setCurrentResponse('Speech recognition initialization failed.')
      return null
    }
  }, [speechSupported, micPermission, assistantState])

  // ChatGPT API integration for natural language understanding
  const callChatGPT = async (message) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    
    if (!apiKey) {
      console.warn('OpenAI API key not configured')
      return "I'd love to help, but I need an OpenAI API key to understand complex requests. For now, I can help with basic smart home commands like 'turn on lights' or 'good morning'."
    }

    try {
      console.log('Calling ChatGPT with message:', message)
      
      // Build context about the smart home and current state
      const smartHomeContext = state?.smartHome ? `
Smart Home Status:
- Rooms: ${state.smartHome.rooms?.map(room => room.name).join(', ') || 'None configured'}
- Available devices: lights, climate control
- Current time: ${new Date().toLocaleString()}
` : 'No smart home devices configured.'

      const weatherContext = state?.weather ? `
Weather: ${state.weather.current?.description || 'Unknown'}, ${state.weather.current?.temperature || 'Unknown'}°C
` : ''

      // Create personalized context based on user profile
      let userContext = ''
      if (userProfile) {
        userContext = `
User Profile Information:
- Name: ${userProfile.name || 'User'}
- Preferred Name: ${userProfile.preferredName || userProfile.name || 'User'}
- Role: ${userProfile.role || 'user'}
`
        // Add personalized greeting based on user preferences
        if (userProfile.preferences?.greeting) {
          userContext += `- Preferred Greeting: ${userProfile.preferences.greeting}\n`
        }
        
        // Add any special notes about the user
        if (userProfile.notes) {
          userContext += `- Notes: ${userProfile.notes}\n`
        }
      } else {
        userContext = 'User Profile: Basic user account\n'
      }

      const systemPrompt = `You are a smart home assistant for a smart mirror. Be helpful, concise, and friendly. 

${userContext}
${smartHomeContext}
${weatherContext}

You can control smart home devices by suggesting actions. For device control, respond with natural language that includes clear device commands like:
- "I'll turn on the lights" (for light control)
- "Setting temperature to 24°C" (for climate control)  
- "Running good morning routine" (for routines)

Personalization Guidelines:
- Use the user's preferred name when available
- Adapt your tone based on user preferences
- Reference any special notes about the user
- Make responses feel tailored to this specific user

Keep responses under 50 words and be conversational. If asked about things outside smart home control, provide brief helpful responses.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const aiResponse = data.choices?.[0]?.message?.content || "I heard you, but I'm not sure how to help with that."
      
      console.log('ChatGPT response:', aiResponse)
      
      // Check if the AI response suggests a smart home action
      const lowerResponse = aiResponse.toLowerCase()
      if (lowerResponse.includes('turn on') && lowerResponse.includes('light')) {
        // Execute the light control with context
        await executeSmartAction('lights_on', null, aiResponse)
      } else if (lowerResponse.includes('turn off') && lowerResponse.includes('light')) {
        // Execute the light control with context
        await executeSmartAction('lights_off', null, aiResponse)
      } else if (lowerResponse.includes('temperature') || lowerResponse.includes('cool') || lowerResponse.includes('warm')) {
        // Extract temperature if mentioned
        const tempMatch = aiResponse.match(/(\d+)°?[CF]?/i)
        if (tempMatch) {
          const temp = parseInt(tempMatch[1])
          await executeSmartAction('set_temperature', temp)
        }
      } else if (lowerResponse.includes('good morning')) {
        await executeSmartAction('good_morning')
      } else if (lowerResponse.includes('goodnight') || lowerResponse.includes('good night')) {
        await executeSmartAction('goodnight')
      }
      
      return aiResponse
      
    } catch (error) {
      console.error('ChatGPT API error:', error)
      
      // Fallback to basic pattern matching for common requests
      const lowerMessage = message.toLowerCase()
      if (lowerMessage.includes('weather')) {
        return state?.weather ? 
          `The weather is ${state.weather.current?.description || 'unknown'} with a temperature of ${state.weather.current?.temperature || 'unknown'}°C.` :
          "I don't have current weather information available."
      } else if (lowerMessage.includes('time')) {
        return `The current time is ${new Date().toLocaleString()}.`
      } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        // Personalized greeting based on user profile
        const userName = userProfile?.preferredName || userProfile?.name || 'User'
        return `Hello ${userName}! I'm your smart home assistant. I can help control your lights, temperature, and more.`
      } else {
        return "I'm having trouble connecting to my AI service right now, but I can still help with basic smart home commands like 'turn on lights' or 'good morning'."
      }
    }
  }

  // Execute smart home actions triggered by AI responses
  const executeSmartAction = async (action, parameter = null, context = null) => {
    const smartHomeRooms = state?.smartHome?.rooms || []
    
    // Enhanced function to find light devices with room filtering
    const findLightDevices = (roomName = null, lightName = null) => {
      const devices = []
      smartHomeRooms.forEach(room => {
        // If roomName is specified, only include devices from that room
        if (roomName && room.name.toLowerCase() !== roomName.toLowerCase()) {
          return
        }
        
        // Check both room.lights and room.devices for light devices
        if (room.lights && Array.isArray(room.lights)) {
          room.lights.forEach(light => {
            // If lightName is specified, only include lights that match
            if (lightName && !light.name.toLowerCase().includes(lightName.toLowerCase())) {
              return
            }
            
            if (light.deviceId || light.id) {
              devices.push({ roomId: room.id, deviceId: light.deviceId || light.id, name: light.name, roomName: room.name })
            }
          })
        }
        // Also check room.devices array for lights
        if (room.devices && Array.isArray(room.devices)) {
          room.devices.forEach(device => {
            // If lightName is specified, only include lights that match
            if (lightName && !device.name.toLowerCase().includes(lightName.toLowerCase())) {
              return
            }
            
            if (device.type === 'light' && (device.deviceId || device.id)) {
              devices.push({ roomId: room.id, deviceId: device.deviceId || device.id, name: device.name, roomName: room.name })
            }
          })
        }
      })
      return devices
    }
    
    const findACDevices = (roomName = null) => {
      const devices = []
      smartHomeRooms.forEach(room => {
        // If roomName is specified, only include devices from that room
        if (roomName && room.name.toLowerCase() !== roomName.toLowerCase()) {
          return
        }
        
        // Check room.climate first
        if (room.climate && room.climate.deviceId) {
          devices.push({ roomId: room.id, deviceId: room.climate.deviceId, roomName: room.name })
        }
        // Also check room.devices for AC/thermostat devices
        if (room.devices && Array.isArray(room.devices)) {
          room.devices.forEach(device => {
            if ((device.type === 'air_conditioner' || device.type === 'thermostat') && (device.deviceId || device.id)) {
              devices.push({ roomId: room.id, deviceId: device.deviceId || device.id, roomName: room.name })
            }
          })
        }
      })
      return devices
    }

    try {
      switch (action) {
        case 'lights_on': {
          // Extract room and light information from context if available
          let roomName = null
          let lightName = null
          
          if (context) {
            // More sophisticated parsing of room and light names from context
            // Try to extract room name from context
            const roomMatch = context.match(/(?:living room|bedroom|kitchen|bathroom|office|garage)/i)
            if (roomMatch) {
              roomName = roomMatch[0].replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter
            }
            
            // Try to extract light name from context
            const lightMatch = context.match(/(?:main light|main|lamp|ceiling light|ceiling|desk lamp|desk)/i)
            if (lightMatch) {
              lightName = lightMatch[0].toLowerCase()
              // Normalize light names
              if (lightName.includes('main')) lightName = 'main'
              else if (lightName.includes('lamp')) lightName = 'lamp'
              else if (lightName.includes('ceiling')) lightName = 'ceiling'
            }
          }
          
          const lightDevicesOn = findLightDevices(roomName, lightName)
          for (const { roomId, deviceId } of lightDevicesOn) {
            await globalActions.toggleLight(userId, roomId, deviceId, true)
          }
          
          if (lightDevicesOn.length > 0) {
            if (roomName && lightName) {
              return `Turned on ${lightName} light in the ${roomName}`
            } else if (roomName) {
              return `Turned on lights in the ${roomName}`
            } else if (lightName) {
              return `Turned on ${lightName} lights`
            } else {
              return `Turned on ${lightDevicesOn.length} lights`
            }
          }
          break
        }
          
        case 'lights_off': {
          // Extract room and light information from context if available
          let roomName = null
          let lightName = null
          
          if (context) {
            // More sophisticated parsing of room and light names from context
            // Try to extract room name from context
            const roomMatch = context.match(/(?:living room|bedroom|kitchen|bathroom|office|garage)/i)
            if (roomMatch) {
              roomName = roomMatch[0].replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter
            }
            
            // Try to extract light name from context
            const lightMatch = context.match(/(?:main light|main|lamp|ceiling light|ceiling|desk lamp|desk)/i)
            if (lightMatch) {
              lightName = lightMatch[0].toLowerCase()
              // Normalize light names
              if (lightName.includes('main')) lightName = 'main'
              else if (lightName.includes('lamp')) lightName = 'lamp'
              else if (lightName.includes('ceiling')) lightName = 'ceiling'
            }
          }
          
          const lightDevicesOff = findLightDevices(roomName, lightName)
          for (const { roomId, deviceId } of lightDevicesOff) {
            await globalActions.toggleLight(userId, roomId, deviceId, false)
          }
          
          if (lightDevicesOff.length > 0) {
            if (roomName && lightName) {
              return `Turned off ${lightName} light in the ${roomName}`
            } else if (roomName) {
              return `Turned off lights in the ${roomName}`
            } else if (lightName) {
              return `Turned off ${lightName} lights`
            } else {
              return `Turned off ${lightDevicesOff.length} lights`
            }
          }
          break
        }
          
        case 'set_temperature': {
          const acDevices = findACDevices()
          const temp = parameter || 24
          for (const { roomId, deviceId } of acDevices) {
            await globalActions.setClimateState(userId, roomId, deviceId, true)
            await globalActions.setClimateTemperature(userId, roomId, deviceId, temp)
          }
          break
        }
          
        case 'good_morning': {
          const lightDevicesGM = findLightDevices()
          const acDevicesGM = findACDevices()
          
          for (const { roomId, deviceId } of lightDevicesGM) {
            await globalActions.toggleLight(userId, roomId, deviceId, true)
          }
          for (const { roomId, deviceId } of acDevicesGM) {
            await globalActions.setClimateState(userId, roomId, deviceId, true)
            await globalActions.setClimateTemperature(userId, roomId, deviceId, 24)
          }
          break
        }
          
        case 'goodnight': {
          const lightDevicesGN = findLightDevices()
          const acDevicesGN = findACDevices()
          
          for (const { roomId, deviceId } of lightDevicesGN) {
            await globalActions.toggleLight(userId, roomId, deviceId, false)
          }
          for (const { roomId, deviceId } of acDevicesGN) {
            await globalActions.setClimateState(userId, roomId, deviceId, true)
            await globalActions.setClimateTemperature(userId, roomId, deviceId, 21)
          }
          break
        }
      }
    } catch (error) {
      console.error('Error executing smart action:', error)
    }
  }

  // Smart command processing with natural language understanding  
  const processSmartCommand = async (command) => {
    const lowerCommand = command.toLowerCase()
    const smartHomeRooms = state?.smartHome?.rooms || []
    
    console.log('Processing smart command:', command)
    console.log('Smart home state:', state?.smartHome)
    console.log('Available rooms:', smartHomeRooms)
    console.log('Total rooms found:', smartHomeRooms.length)
    
    // Helper function to find AC devices
    const findACDevices = () => {
      const devices = []
      smartHomeRooms.forEach(room => {
        if (room.climate && room.climate.deviceId) {
          devices.push({ roomId: room.id, deviceId: room.climate.deviceId })
        }
      })
      return devices
    }
    
    // Enhanced helper function to find light devices with room filtering
    const findLightDevices = (roomName = null, lightName = null) => {
      const devices = []
      smartHomeRooms.forEach(room => {
        // If roomName is specified, only include devices from that room
        if (roomName && room.name.toLowerCase() !== roomName.toLowerCase()) {
          return
        }
        
        console.log('Checking room for lights:', room.name, room)
        // Check both room.lights and room.devices for light devices
        if (room.lights && Array.isArray(room.lights)) {
          room.lights.forEach(light => {
            // If lightName is specified, only include lights that match
            if (lightName && !light.name.toLowerCase().includes(lightName.toLowerCase())) {
              return
            }
            
            if (light.deviceId || light.id) {
              devices.push({ roomId: room.id, deviceId: light.deviceId || light.id, name: light.name, roomName: room.name })
            }
          })
        }
        // Also check room.devices array for lights
        if (room.devices && Array.isArray(room.devices)) {
          room.devices.forEach(device => {
            // If lightName is specified, only include lights that match
            if (lightName && !device.name.toLowerCase().includes(lightName.toLowerCase())) {
              return
            }
            
            if (device.type === 'light' && (device.deviceId || device.id)) {
              devices.push({ roomId: room.id, deviceId: device.deviceId || device.id, name: device.name, roomName: room.name })
            }
          })
        }
      })
      console.log('Found light devices:', devices)
      return devices
    }

    try {
      // Climate control commands
      if (lowerCommand.includes('hot') || lowerCommand.includes('warm') || lowerCommand.includes('cool down')) {
        const acDevices = findACDevices()
        if (acDevices.length > 0) {
          for (const { roomId, deviceId } of acDevices) {
            await globalActions.setClimateState(userId, roomId, deviceId, true)
            await globalActions.setClimateTemperature(userId, roomId, deviceId, 22)
          }
          return `Cooling down the house to 22°C`
        } else {
          return 'No AC devices found in your smart home setup'
        }
      }
      
      if (lowerCommand.includes('cold') || lowerCommand.includes('heat up') || lowerCommand.includes('warm up')) {
        const acDevices = findACDevices()
        if (acDevices.length > 0) {
          for (const { roomId, deviceId } of acDevices) {
            await globalActions.setClimateState(userId, roomId, deviceId, true)
            await globalActions.setClimateTemperature(userId, roomId, deviceId, 26)
          }
          return `Warming up the house to 26°C`
        } else {
          return 'No AC devices found in your smart home setup'
        }
      }
      
      // Light control commands with room-specific logic
      if (lowerCommand.includes('lights on') || lowerCommand.includes('turn on lights') || lowerCommand.includes('turn on the lights')) {
        // Extract room information from command with improved parsing
        let roomName = null
        let lightName = null
        
        // Try to extract room name from command using regex
        const roomMatch = lowerCommand.match(/(?:living room|bedroom|kitchen|bathroom|office|garage)/)
        if (roomMatch) {
          roomName = roomMatch[0].replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter
        }
        
        // Try to extract light name from command using regex
        const lightMatch = lowerCommand.match(/(?:main light|main|lamp|ceiling light|ceiling|desk lamp|desk)/)
        if (lightMatch) {
          lightName = lightMatch[0].toLowerCase()
          // Normalize light names
          if (lightName.includes('main')) lightName = 'main'
          else if (lightName.includes('lamp')) lightName = 'lamp'
          else if (lightName.includes('ceiling')) lightName = 'ceiling'
        }
        
        const lightDevices = findLightDevices(roomName, lightName)
        if (lightDevices.length > 0) {
          for (const { roomId, deviceId } of lightDevices) {
            await globalActions.toggleLight(userId, roomId, deviceId, true)
          }
          
          if (roomName && lightName) {
            return `Turned on ${lightName} light in the ${roomName}`
          } else if (roomName) {
            return `Turned on lights in the ${roomName}`
          } else if (lightName) {
            return `Turned on ${lightName} lights`
          } else {
            return `Turned on ${lightDevices.length} lights`
          }
        } else {
          return 'No light devices found in your smart home setup'
        }
      }
      
      if (lowerCommand.includes('lights off') || lowerCommand.includes('turn off lights') || lowerCommand.includes('turn off the lights')) {
        // Extract room information from command with improved parsing
        let roomName = null
        let lightName = null
        
        // Try to extract room name from command using regex
        const roomMatch = lowerCommand.match(/(?:living room|bedroom|kitchen|bathroom|office|garage)/)
        if (roomMatch) {
          roomName = roomMatch[0].replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter
        }
        
        // Try to extract light name from command using regex
        const lightMatch = lowerCommand.match(/(?:main light|main|lamp|ceiling light|ceiling|desk lamp|desk)/)
        if (lightMatch) {
          lightName = lightMatch[0].toLowerCase()
          // Normalize light names
          if (lightName.includes('main')) lightName = 'main'
          else if (lightName.includes('lamp')) lightName = 'lamp'
          else if (lightName.includes('ceiling')) lightName = 'ceiling'
        }
        
        const lightDevices = findLightDevices(roomName, lightName)
        if (lightDevices.length > 0) {
          for (const { roomId, deviceId } of lightDevices) {
            await globalActions.toggleLight(userId, roomId, deviceId, false)
          }
          
          if (roomName && lightName) {
            return `Turned off ${lightName} light in the ${roomName}`
          } else if (roomName) {
            return `Turned off lights in the ${roomName}`
          } else if (lightName) {
            return `Turned off ${lightName} lights`
          } else {
            return `Turned off ${lightDevices.length} lights`
          }
        } else {
          return 'No light devices found in your smart home setup'
        }
      }
      
      // Routine commands
      if (lowerCommand.includes('good morning')) {
        const lightDevices = findLightDevices()
        const acDevices = findACDevices()
        
        // Turn on lights
        for (const { roomId, deviceId } of lightDevices) {
          await globalActions.toggleLight(userId, roomId, deviceId, true)
        }
        
        // Set comfortable temperature
        for (const { roomId, deviceId } of acDevices) {
          await globalActions.setClimateState(userId, roomId, deviceId, true)
          await globalActions.setClimateTemperature(userId, roomId, deviceId, 24)
        }
        
        return `Good morning! I've turned on the lights and set the temperature to 24°C`
      }
      
      if (lowerCommand.includes('goodnight') || lowerCommand.includes('good night')) {
        const lightDevices = findLightDevices()
        const acDevices = findACDevices()
        
        // Turn off lights
        for (const { roomId, deviceId } of lightDevices) {
          await globalActions.toggleLight(userId, roomId, deviceId, false)
        }
        
        // Set sleep temperature
        for (const { roomId, deviceId } of acDevices) {
          await globalActions.setClimateState(userId, roomId, deviceId, true)
          await globalActions.setClimateTemperature(userId, roomId, deviceId, 21)
        }
        
        return `Goodnight! I've turned off the lights and set the temperature to 21°C for better sleep`
      }
      
      // If no smart home command matched, return null to try ChatGPT
      return null
      
    } catch (error) {
      console.error('Error processing smart command:', error)
      return `Sorry, I had trouble controlling your smart home devices: ${error.message}`
    }
  }

  // Process voice command with ChatGPT integration
  const processVoiceCommand = async (command) => {
    console.log('Processing voice command:', command)
    setAssistantState('processing')
    setCurrentResponse('Processing...')
    
    try {
      // First try local smart home commands
      const smartResponse = await processSmartCommand(command)
      if (smartResponse) {
        setCurrentResponse(smartResponse)
        setAssistantState('responding')
        speak(smartResponse)
        
        // Reset after speaking
        setTimeout(() => {
          setAssistantState('idle')
          setCurrentResponse('Ready for next command')
        }, 3000)
        return
      }
      
      // If no local command matched, try ChatGPT
      const aiResponse = await callChatGPT(command)
      
      setCurrentResponse(aiResponse)
      setAssistantState('responding')
      speak(aiResponse)
      
      // Reset after speaking
      setTimeout(() => {
        setAssistantState('idle')
        setCurrentResponse('Ready for next command')
      }, 3000)
      
    } catch (error) {
      console.error('Error processing voice command:', error)
      
      // Fallback to local processing if ChatGPT fails
      const fallbackResponse = await processSmartCommand(command)
      if (fallbackResponse) {
        setCurrentResponse(fallbackResponse)
        setAssistantState('responding')
        speak(fallbackResponse)
      } else {
        setCurrentResponse('Sorry, I had trouble processing that command. Please try again.')
        setAssistantState('idle')
      }
      
      // Reset after error
      setTimeout(() => {
        setAssistantState('idle')
        setCurrentResponse('Ready for next command')
      }, 3000)
    }
  }

  // Text-to-speech function
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.current.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      
      // Get available voices and prefer female voice
      const voices = speechSynthesis.current.getVoices()
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('hazel')
      )
      
      if (femaleVoice) {
        utterance.voice = femaleVoice
      }
      
      speechSynthesis.current.speak(utterance)
      console.log('Speaking:', text)
    }
  }

  // Start listening function
  const startListening = async () => {
    if (!speechSupported || micPermission !== 'granted') {
      setCurrentResponse('Speech recognition not available. Please check browser support and microphone permissions.')
      return
    }

    // Check network connectivity before starting
    if (!navigator.onLine) {
      setCurrentResponse('Voice recognition requires internet connection. Use quick command buttons below.')
      return
    }

    console.log('Starting to listen...')
    setCurrentResponse('Initializing voice recognition...')
    
    const newRecognition = initializeSpeechRecognition()
    
    if (newRecognition) {
      recognition.current = newRecognition
      try {
        recognition.current.start()
        
        // Set a timeout to catch network issues early
        setTimeout(() => {
          if (isListening && assistantState === 'listening' && currentResponse === 'Initializing voice recognition...') {
            console.log('Voice recognition seems to be working - timeout cleared')
          }
        }, 2000)
        
      } catch (error) {
        console.error('Failed to start recognition:', error)
        setCurrentResponse('Failed to start voice recognition. Use quick command buttons below or check your internet connection.')
        setIsListening(false)
        setAssistantState('idle')
      }
    } else {
      setCurrentResponse('Voice recognition initialization failed. Use quick command buttons below.')
    }
  }

  // Stop listening function
  const stopListening = () => {
    if (recognition.current) {
      try {
        recognition.current.stop()
        console.log('Speech recognition stopped')
      } catch (error) {
        console.error('Error stopping speech recognition:', error)
      }
    }
    
    setIsListening(false)
    setAssistantState('idle')
  }
  
  // Get assistant icon based on state
  const getAssistantIcon = () => {
    switch (assistantState) {
      case 'listening':
        return '🎤'
      case 'processing':
        return '🤔'
      case 'responding':
        return '💬'
      default:
        return '🤖'
    }
  }
  
  // Get status text based on state
  const getStatusText = () => {
    switch (assistantState) {
      case 'listening':
        return 'Listening...'
      case 'processing':
        return 'Processing...'
      case 'responding':
        return 'Responding...'
      default:
        return speechSupported && micPermission === 'granted' ? 'Tap to speak' : 'Not available'
    }
  }

  return (
    <div className="smart-assistant">
      <div className="assistant-container">
        <div className="assistant-avatar">
          <div className={`avatar-icon ${assistantState}`}>
            {getAssistantIcon()}
          </div>
          <div className={`pulse-ring ${isListening ? 'active' : ''}`}></div>
        </div>
        
        <div className="assistant-status">
          <div className="status-text">{getStatusText()}</div>
          {!speechSupported && (
            <div className="feature-warning">
              Speech recognition not supported in this browser. Please use Chrome or Edge.
            </div>
          )}
          {micPermission === 'denied' && (
            <div className="feature-warning">
              Microphone access denied. Please allow permissions and refresh.
            </div>
          )}
          {currentResponse && (
            <div className="response-text">
              {currentResponse}
            </div>
          )}
        </div>
        
        <div className="assistant-controls">
          <button
            onClick={() => {
              console.log('Talk button clicked, isListening:', isListening, 'speechSupported:', speechSupported, 'micPermission:', micPermission)
              if (isListening) {
                stopListening()
              } else {
                startListening()
              }
            }}
            className={`voice-button ${assistantState} ${!speechSupported || micPermission !== 'granted' ? 'disabled' : ''}`}
            disabled={isProcessing || !speechSupported || micPermission !== 'granted'}
            title={speechSupported && micPermission === 'granted' ? (isListening ? 'Stop listening' : 'Start listening') : 'Speech recognition not available'}
          >
            {isListening ? 'Stop' : 'Talk'}
          </button>
        </div>
        
        <div className="quick-commands">
          <button onClick={() => processVoiceCommand('Good morning')} className="quick-cmd">
            Good Morning
          </button>
          <button onClick={() => processVoiceCommand('I\'m hot')} className="quick-cmd">
            I'm Hot
          </button>
          <button onClick={() => processVoiceCommand('I\'m cold')} className="quick-cmd">
            I'm Cold
          </button>
          <button onClick={() => processVoiceCommand('Turn on lights')} className="quick-cmd">
            Lights On
          </button>
          <button onClick={() => processVoiceCommand('Turn off lights')} className="quick-cmd">
            Lights Off
          </button>
          <button onClick={() => processVoiceCommand('Goodnight')} className="quick-cmd">
            Goodnight
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatGPTAssistant
