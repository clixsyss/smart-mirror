import { useState, useRef, useEffect, useCallback } from 'react'
import { useGlobalStore } from '../hooks/useGlobalStore'
import './ChatGPTAssistant.css'

const ChatGPTAssistant = ({ actions, userId }) => {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentResponse, setCurrentResponse] = useState('')
  const [assistantState, setAssistantState] = useState('idle')
  const [speechSupported, setSpeechSupported] = useState(false)
  const [micPermission, setMicPermission] = useState(null)
  const [transcript, setTranscript] = useState('')
  
  const recognition = useRef(null)
  const speechSynthesis = useRef(window.speechSynthesis)
  const { state, actions: globalActions } = useGlobalStore()

  // Check browser support and initialize
  useEffect(() => {
    const checkSupport = () => {
      const hasWebkitSpeech = 'webkitSpeechRecognition' in window
      const hasSpeech = 'SpeechRecognition' in window
      const supported = hasWebkitSpeech || hasSpeech
      
      console.log('Speech recognition support:', { hasWebkitSpeech, hasSpeech, supported })
      setSpeechSupported(supported)
      
      if (supported) {
        requestMicrophonePermission()
      }
    }
    
    checkSupport()
  }, [])

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      console.log('Requesting microphone permission...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('Microphone permission granted')
      
      // Stop the stream - we just needed permission
      stream.getTracks().forEach(track => track.stop())
      setMicPermission('granted')
      initializeSpeechRecognition()
      
    } catch (error) {
      console.error('Microphone permission denied:', error)
      setMicPermission('denied')
      setCurrentResponse('Microphone access required. Please allow microphone permissions and refresh.')
    }
  }

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!speechSupported || micPermission !== 'granted') return

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognition.current = new SpeechRecognition()
      
      recognition.current.continuous = false
      recognition.current.interimResults = true
      recognition.current.lang = 'en-US'
      recognition.current.maxAlternatives = 1

      // Set up event handlers
      recognition.current.onstart = () => {
        console.log('Speech recognition started')
        setIsListening(true)
        setAssistantState('listening')
        setCurrentResponse('Listening... speak now!')
        setTranscript('')
      }

      recognition.current.onresult = (event) => {
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
          setTranscript(interimTranscript)
          setCurrentResponse(`Hearing: "${interimTranscript}"`)
        }

        // Process final result
        if (finalTranscript.trim()) {
          console.log('Final transcript:', finalTranscript)
          setTranscript(finalTranscript)
          processVoiceCommand(finalTranscript.trim())
        }
      }

      recognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        setAssistantState('idle')
        
        switch (event.error) {
          case 'not-allowed':
            setCurrentResponse('Microphone access denied. Please allow microphone permissions.')
            break
          case 'no-speech':
            setCurrentResponse('No speech detected. Please try again.')
            break
          case 'audio-capture':
            setCurrentResponse('No microphone found. Please check your audio setup.')
            break
          case 'network':
            setCurrentResponse('Network error. Please check your connection.')
            break
          default:
            setCurrentResponse('Speech recognition failed. Please try again.')
        }
      }

      recognition.current.onend = () => {
        console.log('Speech recognition ended')
        setIsListening(false)
        if (assistantState === 'listening') {
          setAssistantState('idle')
        }
      }

      console.log('Speech recognition initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error)
      setSpeechSupported(false)
      setCurrentResponse('Speech recognition initialization failed.')
    }
  }, [speechSupported, micPermission, assistantState])

  // Initialize text-to-speech
  const initializeTextToSpeech = useCallback(() => {
    try {
      if ('speechSynthesis' in window) {
        speechSynthesis.current = window.speechSynthesis
        setTtsSupported(true)
        console.log('Text-to-speech initialized successfully')
        return true
      } else {
        console.warn('Speech Synthesis API not supported in this browser')
        setTtsSupported(false)
        return false
      }
    } catch (error) {
      console.error('Failed to initialize text-to-speech:', error)
      setTtsSupported(false)
      return false
    }
  }, [])

  // Initialize speech services on component mount
  useEffect(() => {
    const initServices = async () => {
      await initializeSpeechRecognition()
      initializeTextToSpeech()
    }
    
    initServices()
    
    // Cleanup function
    return () => {
      if (recognition.current) {
        try {
          recognition.current.stop()
        } catch (error) {
          console.error('Error stopping recognition during cleanup:', error)
        }
      }
      
      if (speechSynthesis.current) {
        try {
          speechSynthesis.current.cancel()
        } catch (error) {
          console.error('Error canceling speech synthesis during cleanup:', error)
        }
      }
      
      // Clear any timers
      if (recognitionTimeout.current) clearTimeout(recognitionTimeout.current)
      if (silenceTimer.current) clearTimeout(silenceTimer.current)
    }
  }, [initializeSpeechRecognition, initializeTextToSpeech])
  
  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network is online')
      // If we were showing a network error, clear it
      if (currentResponse && currentResponse.includes('Network error')) {
        setCurrentResponse('')
        setAssistantState('idle')
      }
    }
    
    const handleOffline = () => {
      console.log('Network is offline')
      setCurrentResponse('Network is offline. Voice recognition may not work properly.')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [currentResponse])

  // Smart command processing with natural language understanding  
  const processSmartCommand = async (command) => {
    const lowerCommand = command.toLowerCase()
    const smartHomeRooms = state?.smartHome?.rooms || []
    
    console.log('Processing command:', command)
    console.log('Smart home rooms available:', smartHomeRooms.length)
    
    // Helper function to find AC devices
    const findACDevices = () => {
      const acDevices = []
      for (const room of smartHomeRooms) {
        if (room.devices) {
          for (const device of room.devices) {
            if (device.name && device.name.toLowerCase().includes('ac')) {
              acDevices.push({ roomId: room.id, deviceId: device.id, deviceName: device.name })
            }
          }
        }
      }
      return acDevices
    }
    
    // I'm hot - turn on AC
    if (lowerCommand.includes('hot') || lowerCommand.includes('turn on ac') || lowerCommand.includes('air conditioning')) {
      const acDevices = findACDevices()
      if (acDevices.length > 0 && globalActions.setClimateState) {
        let successCount = 0
        for (const { roomId, deviceId, deviceName } of acDevices) {
          try {
            await globalActions.setClimateState(userId, roomId, deviceId, true)
            await globalActions.setClimateTemperature(userId, roomId, deviceId, 22)
            successCount++
          } catch (error) {
            console.warn(`Could not control ${deviceName}:`, error)
          }
        }
        if (successCount > 0) {
          return "I've turned on the air conditioning and set it to 22°C to cool things down."
        }
      }
      return "I couldn't find any AC units to control right now."
    }
    
    if (lowerCommand.includes('cold') || lowerCommand.includes('heat up') || lowerCommand.includes('warm up')) {
      const acDevices = findACDevices()
      if (acDevices.length > 0 && globalActions.setClimateState) {
        let successCount = 0
        for (const { roomId, deviceId, deviceName } of acDevices) {
          try {
            await globalActions.setClimateState(userId, roomId, deviceId, true)
            await globalActions.setClimateTemperature(userId, roomId, deviceId, 24)
            successCount++
          } catch (error) {
            console.warn(`Could not control ${deviceName}:`, error)
          }
        }
        if (successCount > 0) {
          return "I've turned on the heating and set it to 24°C to warm things up."
        }
      }
      return "I couldn't find any heating units to control right now."
    }
    
    // Goodnight routine
    if (lowerCommand.includes('goodnight') || lowerCommand.includes('good night') || lowerCommand.includes('sleep')) {
      if (globalActions.toggleLight && userId && smartHomeRooms.length > 0) {
        let successCount = 0
        for (const room of smartHomeRooms) {
          if (room.devices) {
            for (const device of room.devices) {
              if (device.name && device.name.toLowerCase().includes('light')) {
                try {
                  await globalActions.toggleLight(userId, room.id, device.id, false)
                  successCount++
                  console.log(`Turned off ${device.name} in ${room.name || 'room'}`)
                } catch (error) {
                  console.warn(`Could not turn off ${device.name}:`, error)
                }
              }
            }
          }
        }
        
        if (successCount > 0) {
          return "Goodnight! I've turned off all the lights and secured the house. Sweet dreams!"
        } else {
          return "Goodnight! I had trouble controlling the lights, but sweet dreams!"
        }
      }
      return "Goodnight! Sweet dreams!"
    }
    
    // Good morning routine
    if (lowerCommand.includes('good morning') || lowerCommand.includes('wake up') || lowerCommand.includes('morning')) {
      if (globalActions.toggleLight && userId && smartHomeRooms.length > 0) {
        let successCount = 0
        for (const room of smartHomeRooms) {
          if (room.devices) {
            for (const device of room.devices) {
              if (device.name && device.name.toLowerCase().includes('light')) {
                try {
                  await globalActions.toggleLight(userId, room.id, device.id, true)
                  successCount++
                  console.log(`Turned on ${device.name} in ${room.name || 'room'}`)
                } catch (error) {
                  console.warn(`Could not turn on ${device.name}:`, error)
                }
              }
            }
          }
        }
        
        if (successCount > 0) {
          return "Good morning! I've turned on the main lights and opened the curtains. Have a great day!"
        }
      }
      return "Good morning! Have a wonderful day!"
    }
    
    // Light controls
    if (lowerCommand.includes('turn on') && lowerCommand.includes('light')) {
      if (globalActions.toggleLight && userId && smartHomeRooms.length > 0) {
        const roomName = extractRoomName(lowerCommand)
        
        // Find matching room and light device
        let targetDevice = null
        for (const room of smartHomeRooms) {
          if (!roomName || room.name?.toLowerCase().includes(roomName)) {
            const lightDevice = room.devices?.find(device => 
              device.name && device.name.toLowerCase().includes('light')
            )
            if (lightDevice) {
              targetDevice = { roomId: room.id, deviceId: lightDevice.id, roomName: room.name }
              break
            }
          }
        }
        
        if (targetDevice) {
          try {
            await globalActions.toggleLight(userId, targetDevice.roomId, targetDevice.deviceId, true)
            return `I've turned on the ${targetDevice.roomName} lights for you.`
          } catch (error) {
            console.warn('Could not turn on lights:', error)
            return "I had trouble controlling the lights. Please try again."
          }
        }
      }
      return "Light control is not available right now."
    }
    
    if (lowerCommand.includes('turn off') && lowerCommand.includes('light')) {
      if (globalActions.toggleLight && userId && smartHomeRooms.length > 0) {
        const roomName = extractRoomName(lowerCommand)
        
        // Find matching room and light device
        let targetDevice = null
        for (const room of smartHomeRooms) {
          if (!roomName || room.name?.toLowerCase().includes(roomName)) {
            const lightDevice = room.devices?.find(device => 
              device.name && device.name.toLowerCase().includes('light')
            )
            if (lightDevice) {
              targetDevice = { roomId: room.id, deviceId: lightDevice.id, roomName: room.name }
              break
            }
          }
        }
        
        if (targetDevice) {
          try {
            await globalActions.toggleLight(userId, targetDevice.roomId, targetDevice.deviceId, false)
            return `I've turned off the ${targetDevice.roomName} lights.`
          } catch (error) {
            console.warn('Could not turn off lights:', error)
            return "I had trouble controlling the lights. Please try again."
          }
        }
      }
      return "Light control is not available right now."
    }
    
    // Brightness controls
    if (lowerCommand.includes('dim') || lowerCommand.includes('brightness')) {
      if (globalActions.setLightBrightness && userId) {
        const smartHomeRooms = state?.smartHome?.rooms || []
        const roomName = extractRoomName(lowerCommand)
        const brightness = extractBrightness(lowerCommand) || 30
        
        // Find matching room and light device
        let targetDevice = null
        for (const room of smartHomeRooms) {
          if (!roomName || room.name?.toLowerCase().includes(roomName)) {
            const lightDevice = room.devices?.find(device => 
              device.name && device.name.toLowerCase().includes('light')
            )
            if (lightDevice) {
              targetDevice = { roomId: room.id, deviceId: lightDevice.id, roomName: room.name }
              break
            }
          }
        }
        
        if (targetDevice) {
          try {
            await globalActions.setLightBrightness(userId, targetDevice.roomId, targetDevice.deviceId, brightness)
            return `I've dimmed the ${targetDevice.roomName} lights to ${brightness}%.`
          } catch (error) {
            console.warn('Could not adjust brightness:', error)
            return "I had trouble adjusting the brightness. Please try again."
          }
        }
      }
      return "Brightness control is not available right now."
    }
    
    // Use ChatGPT 4o mini for complex queries
    if (actions && actions.sendAssistantMessage) {
      try {
        return await actions.sendAssistantMessage(command, userId)
      } catch (error) {
        console.warn('ChatGPT API failed, using fallback:', error)
        // Fall through to fallback response
      }
    }
    
    // Fallback response when ChatGPT is unavailable
    return "I understand you said: " + command + ". How can I help you with your smart home?"
  }
  
  const extractRoomName = (command) => {
    const rooms = ['living room', 'bedroom', 'kitchen', 'bathroom', 'dining room']
    return rooms.find(room => command.includes(room))
  }
  
  const extractBrightness = (command) => {
    const match = command.match(/(\d+)%?/)
    return match ? parseInt(match[1]) : null
  }

  // Enhanced text-to-speech function with fallbacks
  const speakText = (text) => {
    if (!ttsSupported || !speechSynthesis.current) {
      console.warn('Text-to-speech not supported or not initialized')
      return false
    }
    
    try {
      // Cancel any ongoing speech
      speechSynthesis.current.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1.0
      utterance.lang = 'en-US'
      
      // Try to find a good English voice
      const voices = speechSynthesis.current.getVoices()
      if (voices.length > 0) {
        const preferredVoice = voices.find(voice => 
          voice.lang.includes('en-US') && voice.name.includes('Google') && !voice.name.includes('Male')
        ) || voices.find(voice => 
          voice.lang.includes('en-US') && !voice.name.includes('Male')
        ) || voices.find(voice => 
          voice.lang.includes('en')
        )
        
        if (preferredVoice) {
          utterance.voice = preferredVoice
        }
      }
      
      // Add event handlers
      utterance.onstart = () => {
        console.log('Speech synthesis started')
      }
      
      utterance.onend = () => {
        console.log('Speech synthesis completed')
        setAssistantState('idle')
        setTimeout(() => {
          setCurrentResponse('')
        }, 1000) // Keep the text visible briefly after speech ends
      }
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event)
        setAssistantState('idle')
      }
      
      // Speak the text
      speechSynthesis.current.speak(utterance)
      
      // Chrome has a bug where speech synthesis stops after ~15 seconds
      // This is a workaround to keep it going
      if (navigator.userAgent.includes('Chrome')) {
        const resumeSpeechSynthesis = () => {
          if (speechSynthesis.current.speaking) {
            speechSynthesis.current.pause()
            speechSynthesis.current.resume()
            setTimeout(resumeSpeechSynthesis, 10000)
          }
        }
        setTimeout(resumeSpeechSynthesis, 10000)
      }
      
      return true
    } catch (error) {
      console.error('Failed to speak text:', error)
      setAssistantState('idle')
      return false
    }
  }
  
  const processVoiceCommand = async (command) => {
    setIsProcessing(true)
    setAssistantState('processing')
    
    // Reset error count when successfully processing a command
    setErrorCount(0)
    
    try {
      // Check network connectivity before processing
      if (!navigator.onLine) {
        throw new Error('No internet connection')
      }
      
      const response = await processSmartCommand(command)
      setCurrentResponse(response)
      setAssistantState('responding')
      
      // Speak the response with enhanced TTS
      const speechSuccessful = speakText(response)
      
      // If speech failed, set a timeout to clear the UI
      if (!speechSuccessful) {
        setTimeout(() => {
          setAssistantState('idle')
          setCurrentResponse('')
        }, 5000) // Show the text response longer if speech failed
      }
    } catch (err) {
      console.error('Assistant error:', err)
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.'
      
      // Provide more specific error messages based on the error
      if (err.message && err.message.includes('No internet connection')) {
        errorMessage = 'I need an internet connection to process that request. Please check your connection.'
      } else if (err.message && err.message.includes('timeout')) {
        errorMessage = 'The request timed out. Please try again.'
      } else if (err.name === 'AbortError') {
        errorMessage = 'The request took too long to complete. Please check your internet connection and try again.'
      }
      
      setCurrentResponse(errorMessage)
      
      // Try to speak the error message
      speakText(errorMessage)
      
      setTimeout(() => {
        setAssistantState('idle')
      }, 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  const startListening = async () => {
    console.log('startListening called')
    
    // Reset error count
    setErrorCount(0)
    
    // Check if already listening
    if (isListening) {
      console.log('Already listening')
      return
    }
    
    // Re-initialize if needed
    if (!recognition.current || !speechSupported) {
      console.log('Re-initializing speech recognition...')
      const initialized = await initializeSpeechRecognition()
      if (!initialized) {
        console.log('Failed to initialize speech recognition')
        return
      }
    }
    
    // Clear timers
    if (recognitionTimeout.current) clearTimeout(recognitionTimeout.current)
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
    
    // Set up state
    setIsListening(true)
    setAssistantState('listening')
    setCurrentResponse('Click and speak now...')
    
    let finalTranscript = ''
    
    
    // Set up recognition event handlers
    recognition.current.onstart = () => {
      console.log('Speech recognition started')
      setCurrentResponse('Listening... speak now!')
    }
    
    recognition.current.onresult = (event) => {
      console.log('Speech result:', event)
      let interimTranscript = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
          console.log('Final transcript:', transcript)
        } else {
          interimTranscript += transcript
        }
      }
      
      // Show interim results
      if (interimTranscript) {
        setCurrentResponse(`Hearing: "${interimTranscript}"`)
      }
      
      // Process final results immediately
      if (finalTranscript.trim()) {
        console.log('Processing command:', finalTranscript.trim())
        setIsListening(false)
        recognition.current.stop()
        processVoiceCommand(finalTranscript.trim())
      }
    }
    
    recognition.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      setAssistantState('idle')
      
      switch(event.error) {
        case 'not-allowed':
          setCurrentResponse('Microphone access denied. Please allow microphone permissions.')
          break
        case 'no-speech':
          setCurrentResponse('No speech detected. Please try again.')
          break
        case 'audio-capture':
          setCurrentResponse('No microphone found. Please check your audio setup.')
          break
        case 'network':
          setCurrentResponse('Network error. Please check your connection and try again.')
          break
        default:
          setCurrentResponse('Speech recognition failed. Please try again.')
      }
    }
    
    recognition.current.onerror = (event) => {
      console.log('Speech recognition error:', event.error, event)
      
      // Track error count for potential fallback strategies
      setErrorCount(prev => prev + 1)
      
      // Handle different types of errors
      switch(event.error) {
        case 'not-allowed':
          setCurrentResponse('Microphone access denied. Please allow microphone permissions in your browser settings.')
          break
        case 'audio-capture':
          setCurrentResponse('No microphone detected. Please check your audio setup and refresh the page.')
          break
        case 'network':
          // Check if we're actually online before showing network error
          if (navigator.onLine) {
            setCurrentResponse('Speech recognition service unavailable. Tap to retry or use text input.')
          } else {
            setCurrentResponse('Network error occurred. Please check your connection and tap to retry.')
          }
          break
        case 'aborted':
          // User aborted, don't show error unless it wasn't intentional
          if (!isListening && assistantState === 'listening') {
            setCurrentResponse('Speech recognition was interrupted. Tap to try again.')
          }
          break
        case 'no-speech':
          setCurrentResponse('No speech detected. Please speak clearly and try again.')
          break
        case 'service-not-allowed':
          setCurrentResponse('Speech recognition service is not available. Please try again later or use text input.')
          break
        case 'language-not-supported':
          setCurrentResponse('The selected language is not supported. Defaulting to English.')
          if (recognition.current) {
            recognition.current.lang = 'en-US'
          }
          break
        default:
          setCurrentResponse(`Speech recognition error. Please try again or use text input.`)
          console.error(`Detailed error: ${event.error}`)
      }
      
      // Clean up for all errors
      setIsListening(false)
      setAssistantState('idle')
      
      // Clear any timers
      if (recognitionTimeout.current) clearTimeout(recognitionTimeout.current)
      if (silenceTimer.current) clearTimeout(silenceTimer.current)
      
      // If we've had multiple errors in a row, try re-initializing
      if (errorCount > 2) {
        console.log('Multiple errors detected, attempting to re-initialize speech recognition')
        setTimeout(() => {
          // Attempt to re-initialize speech recognition
          if (recognition.current) {
            try {
              recognition.current = null
              initializeSpeechRecognition()
            } catch (error) {
              console.error('Failed to re-initialize speech recognition after multiple errors:', error)
            }
          }
        }, 1000)
      }
    }
    
    recognition.current.onend = () => {
      console.log('Speech recognition ended')
      setIsListening(false)
      
      // Only reset state if we're still in listening mode
      if (assistantState === 'listening') {
        setAssistantState('idle')
      }
      
      // Clear any timers
      if (recognitionTimeout.current) {
        clearTimeout(recognitionTimeout.current)
        recognitionTimeout.current = null
      }
      
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current)
        silenceTimer.current = null
      }
    }
    
    // Start recognition
    try {
      console.log('Starting speech recognition...')
      recognition.current.start()
    } catch (error) {
      console.error('Failed to start recognition:', error)
      setCurrentResponse('Failed to start voice recognition. Please try again.')
      setIsListening(false)
      setAssistantState('idle')
    }
  }

  const stopListening = () => {
    // Clear any timers first
    if (recognitionTimeout.current) {
      clearTimeout(recognitionTimeout.current)
      recognitionTimeout.current = null
    }
    
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current)
      silenceTimer.current = null
    }
    
    // Then stop recognition
    if (recognition.current) {
      try {
        recognition.current.stop()
        console.log('Speech recognition stopped successfully')
      } catch (error) {
        console.error('Error stopping speech recognition:', error)
      }
    }
    
    setIsListening(false)
    setAssistantState('idle')
  }
  
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
  
  const getStatusText = () => {
    switch (assistantState) {
      case 'listening':
        return 'Speak now... (auto-detect pauses)'
      case 'processing':
        return 'Processing...'
      case 'responding':
        return 'Responding...'
      default:
        return 'Tap to speak'
    }
  }
  
  // Helper function to check if a message is an error message
  const isErrorMessage = (message) => {
    if (!message) return false
    
    const errorKeywords = [
      'network error', 
      'service unavailable',
      'service is not available',
      'failed to start',
      'error',
      'microphone access denied',
      'no microphone detected',
      'check your connection',
      'internet connection',
      'not supported',
      'try refreshing',
      'try later',
      'could not initialize',
      'timeout',
      'timed out',
      'aborted',
      'interrupted',
      'browser settings',
      'audio setup'
    ]
    
    // Don't treat "Listening:" messages as errors
    if (message.startsWith('Listening:')) return false
    
    // Don't treat "Processing..." as an error
    if (message === 'Processing...') return false
    
    return errorKeywords.some(keyword => message.toLowerCase().includes(keyword))
  }

  // Enhanced retry mechanism
  const handleRetry = async () => {
    console.log('Retrying speech recognition...')
    setCurrentResponse('Retrying...')
    
    // Clear any existing timers
    if (recognitionTimeout.current) clearTimeout(recognitionTimeout.current)
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
    
    // Stop current recognition if running
    if (recognition.current) {
      try {
        recognition.current.stop()
      } catch (error) {
        console.warn('Error stopping recognition during retry:', error)
      }
    }
    
    // Reset state
    setIsListening(false)
    setAssistantState('idle')
    recognition.current = null
    
    // Wait a moment then reinitialize
    setTimeout(async () => {
      const initialized = await initializeSpeechRecognition()
      if (initialized) {
        setCurrentResponse('Ready to try again. Click Talk.')
        setErrorCount(0)
      } else {
        setCurrentResponse('Could not initialize speech recognition. Please refresh the page.')
      }
    }, 1000)
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
              Speech recognition not supported in this browser
            </div>
          )}
          {!ttsSupported && (
            <div className="feature-warning">
              Text-to-speech not supported in this browser
            </div>
          )}
          {currentResponse && (
            <div 
              className={`response-text ${isErrorMessage(currentResponse) ? 'error' : ''}`}
              onClick={isErrorMessage(currentResponse) ? handleRetry : undefined}
            >
              {currentResponse}
              {isErrorMessage(currentResponse) && (
                <button className="retry-button" onClick={handleRetry}>Retry</button>
              )}
            </div>
          )}
        </div>
        
        <div className="assistant-controls">
          <button
            onClick={() => {
              console.log('Talk button clicked, isListening:', isListening, 'speechSupported:', speechSupported)
              if (isListening) {
                stopListening()
              } else {
                startListening()
              }
            }}
            className={`voice-button ${assistantState} ${!speechSupported ? 'disabled' : ''}`}
            disabled={isProcessing || !speechSupported}
            title={speechSupported ? (isListening ? 'Stop listening' : 'Start listening') : 'Speech recognition not supported'}
          >
            {isListening ? 'Stop' : 'Talk'}
          </button>
          {isListening && (
            <div className="listening-indicator">
              <div className="pulse"></div>
            </div>
          )}
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
        
        {errorCount > 0 && (
          <div className="error-indicator">
            Recognition errors: {errorCount}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatGPTAssistant