import { useState, useRef, useEffect, useCallback } from 'react'
import { useGlobalStore } from '../hooks/useGlobalStore'
import { parseIntent, generateResponse } from '../utils/intentParser'
import { chatGPTAssistantService } from '../services/ChatGPTAssistantService'
import { getAvailableVoices, applyVoiceSettings, DEFAULT_VOICE_SETTINGS, OPENAI_TTS, resolveOpenAIVoiceName } from '../utils/voiceSettings'
import './ChatGPTAssistant.css'

const ChatGPTAssistant = ({ userId, userProfile, onOpenSettings }) => {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentResponse, setCurrentResponse] = useState('')
  const [assistantState, setAssistantState] = useState('idle')
  const [speechSupported, setSpeechSupported] = useState(false)
  const [micPermission, setMicPermission] = useState(null)
  const [voiceSettings, setVoiceSettings] = useState(DEFAULT_VOICE_SETTINGS)
  const [availableVoices, setAvailableVoices] = useState([])
  // Voice settings are managed in the main Settings modal
  const [conversationHistory, setConversationHistory] = useState([])
  
  const recognition = useRef(null)
  const speechSynthesis = useRef(window.speechSynthesis)
  const { state, actions: globalActions } = useGlobalStore()
  const isSpeaking = useRef(false)
  const abortController = useRef(null)

  // Enhanced function to find light devices with room filtering
  const findLightDevices = (roomName = null) => {
    const smartHomeRooms = state?.smartHome?.rooms || [];
    const devices = [];
    smartHomeRooms.forEach(room => {
      // If roomName is specified, only include devices from that room
      if (roomName && room.name.toLowerCase() !== roomName.toLowerCase()) {
        return;
      }
      
      // Check both room.lights and room.devices for light devices
      if (room.lights && Array.isArray(room.lights)) {
        room.lights.forEach(light => {
          if (light.deviceId || light.id) {
            devices.push({ roomId: room.id, deviceId: light.deviceId || light.id, name: light.name, roomName: room.name, state: light.state });
          }
        });
      }
      // Also check room.devices array for lights
      if (room.devices && Array.isArray(room.devices)) {
        room.devices.forEach(device => {
          // Check if this is a light device
          if (device.type === 'light' || (device.name && device.name.toLowerCase().includes('light'))) {
            if (device.id) {
              devices.push({ roomId: room.id, deviceId: device.id, name: device.name, roomName: room.name, state: device.state });
            }
          }
        });
      }
    });
    return devices;
  };

  const normalizeRoomName = (name = '') => name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

  const getLevenshteinDistance = (a, b) => {
    if (a === b) return 0;
    if (!a) return b.length;
    if (!b) return a.length;

    const matrix = Array.from({ length: a.length + 1 }, () => []);
    for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[a.length][b.length];
  };

  const findClosestRoomName = (inputText) => {
    const smartHomeRooms = state?.smartHome?.rooms || [];
    const normalizedInput = normalizeRoomName(inputText);
    if (!normalizedInput || smartHomeRooms.length === 0) return null;

    let bestMatch = null;
    let bestScore = 0;

    smartHomeRooms.forEach(room => {
      const normalizedRoom = normalizeRoomName(room.name);
      if (!normalizedRoom) return;

      if (normalizedInput.includes(normalizedRoom) || normalizedRoom.includes(normalizedInput)) {
        bestMatch = room.name;
        bestScore = 1;
        return;
      }

      const distance = getLevenshteinDistance(normalizedInput, normalizedRoom);
      const maxLen = Math.max(normalizedInput.length, normalizedRoom.length);
      const score = maxLen > 0 ? 1 - distance / maxLen : 0;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = room.name;
      }
    });

    if (bestScore >= 0.6) {
      return bestMatch;
    }

    return null;
  };
  
  // Enhanced function to find AC devices
  const findACDevices = (roomName = null) => {
    const smartHomeRooms = state?.smartHome?.rooms || [];
    const devices = [];
    smartHomeRooms.forEach(room => {
      // If roomName is specified, only include devices from that room
      if (roomName && room.name.toLowerCase() !== roomName.toLowerCase()) {
        return;
      }
      
      if (room.devices && Array.isArray(room.devices)) {
        room.devices.forEach(device => {
          // Check if this is an AC/climate device
          if (device.type && (
            device.type.includes('ac') || 
            device.type.includes('air') ||
            device.type.includes('climate') ||
            device.type.includes('thermostat')
          )) {
            if (device.id) {
              devices.push({ roomId: room.id, deviceId: device.id, name: device.name, roomName: room.name });
            }
          }
        });
      }
    });
    return devices;
  };
  
  // Enhanced function to find fan devices
  const findFanDevices = (roomName = null) => {
    const smartHomeRooms = state?.smartHome?.rooms || [];
    const devices = [];
    smartHomeRooms.forEach(room => {
      // If roomName is specified, only include devices from that room
      if (roomName && room.name.toLowerCase() !== roomName.toLowerCase()) {
        return;
      }
      
      if (room.devices && Array.isArray(room.devices)) {
        room.devices.forEach(device => {
          // Check if this is a fan device
          if (device.type && (
            device.type.includes('fan') || device.type.includes('ventilator')
          )) {
            if (device.id) {
              devices.push({ roomId: room.id, deviceId: device.id, name: device.name, roomName: room.name });
            }
          }
        });
      }
    });
    return devices;
  };
  
  // Enhanced function to find curtain devices
  const findCurtainDevices = (roomName = null) => {
    const smartHomeRooms = state?.smartHome?.rooms || [];
    const devices = [];
    smartHomeRooms.forEach(room => {
      // If roomName is specified, only include devices from that room
      if (roomName && room.name.toLowerCase() !== roomName.toLowerCase()) {
        return;
      }
      
      if (room.devices && Array.isArray(room.devices)) {
        room.devices.forEach(device => {
          // Check if this is a curtain device
          if (device.type && (
            device.type.includes('curtain') || 
            device.type.includes('curtains') ||
            device.type.includes('blind') ||
            device.type.includes('blinds') ||
            device.type.includes('drapes') ||
            device.type.includes('shades')
          )) {
            if (device.id) {
              devices.push({ roomId: room.id, deviceId: device.id, name: device.name, roomName: room.name });
            }
          }
        });
      }
    });
    return devices;
  };
  
  // Enhanced function to find shutter devices
  const findShutterDevices = (roomName = null) => {
    const smartHomeRooms = state?.smartHome?.rooms || [];
    const devices = [];
    smartHomeRooms.forEach(room => {
      // If roomName is specified, only include devices from that room
      if (roomName && room.name.toLowerCase() !== roomName.toLowerCase()) {
        return;
      }
      
      if (room.devices && Array.isArray(room.devices)) {
        room.devices.forEach(device => {
          // Check if this is a shutter device
          if (device.type && (
            device.type.includes('shutter') || 
            device.type.includes('shutters') ||
            device.type.includes('window shutter')
          )) {
            if (device.id) {
              devices.push({ roomId: room.id, deviceId: device.id, name: device.name, roomName: room.name });
            }
          }
        });
      }
    });
    return devices;
  };
  
  // Enhanced function to find door devices
  const findDoorDevices = (roomName = null) => {
    const smartHomeRooms = state?.smartHome?.rooms || [];
    const devices = [];
    smartHomeRooms.forEach(room => {
      // If roomName is specified, only include devices from that room
      if (roomName && room.name.toLowerCase() !== roomName.toLowerCase()) {
        return;
      }
      
      if (room.devices && Array.isArray(room.devices)) {
        room.devices.forEach(device => {
          // Check if this is a door device
          if (device.type && (
            device.type.includes('door') || 
            device.type.includes('lock') ||
            device.type.includes('gate')
          )) {
            if (device.id) {
              devices.push({ roomId: room.id, deviceId: device.id, name: device.name, roomName: room.name });
            }
          }
        });
      }
    });
    return devices;
  };
  
  // Enhanced function to find security system devices
  const findSecurityDevices = (roomName = null) => {
    const smartHomeRooms = state?.smartHome?.rooms || [];
    const devices = [];
    smartHomeRooms.forEach(room => {
      // If roomName is specified, only include devices from that room
      if (roomName && room.name.toLowerCase() !== roomName.toLowerCase()) {
        return;
      }
      
      if (room.devices && Array.isArray(room.devices)) {
        room.devices.forEach(device => {
          // Check if this is a security device
          if (device.type && (
            device.type.includes('security') || 
            device.type.includes('alarm') || 
            device.type.includes('camera') ||
            device.type.includes('surveillance')
          )) {
            if (device.id) {
              devices.push({ roomId: room.id, deviceId: device.id, name: device.name, roomName: room.name });
            }
          }
        });
      }
    });
    return devices;
  };
  
  // Enhanced function to find speaker devices
  const findSpeakerDevices = (roomName = null) => {
    const smartHomeRooms = state?.smartHome?.rooms || [];
    const devices = [];
    smartHomeRooms.forEach(room => {
      // If roomName is specified, only include devices from that room
      if (roomName && room.name.toLowerCase() !== roomName.toLowerCase()) {
        return;
      }
      
      if (room.devices && Array.isArray(room.devices)) {
        room.devices.forEach(device => {
          // Check if this is a speaker device
          if (device.type && (
            device.type.includes('speaker') || 
            device.type.includes('audio') || 
            device.type.includes('sound') ||
            device.type.includes('music system')
          )) {
            if (device.id) {
              devices.push({ roomId: room.id, deviceId: device.id, name: device.name, roomName: room.name });
            }
          }
        });
      }
    });
    return devices;
  };

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

  // Enhanced browser support check with more detailed diagnostics
  const checkBrowserSupport = () => {
    const userAgent = navigator.userAgent;
    const vendor = navigator.vendor;
    
    console.log('User Agent:', userAgent);
    console.log('Vendor:', vendor);
    
    const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(vendor);
    const isEdge = /Edg/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isOpera = /OPR/.test(userAgent) || /Opera/.test(userAgent);
    
    console.log('Browser detection:', { isChrome, isEdge, isFirefox, isSafari, isOpera });
    
    // Speech recognition support with detailed checking
    const HAS_WEBKIT_SPEECH = 'webkitSpeechRecognition' in window;
    const HAS_SPEECH = 'SpeechRecognition' in window;
    const speechSupported = HAS_WEBKIT_SPEECH || HAS_SPEECH;
    
    // Check for secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext;
    console.log('Secure context:', isSecureContext);
    
    // Check for media devices API
    const hasMediaDevices = 'mediaDevices' in navigator;
    console.log('Media devices API:', hasMediaDevices);
    
    console.log('Speech API support:', { HAS_WEBKIT_SPEECH, HAS_SPEECH, speechSupported });
    
    return { 
      isChrome, 
      isEdge, 
      isFirefox, 
      isSafari, 
      isOpera,
      speechSupported,
      HAS_WEBKIT_SPEECH,
      HAS_SPEECH,
      isSecureContext,
      hasMediaDevices
    };
  }

  // Check browser support and initialize
  useEffect(() => {
    const checkSupport = () => {
      const { 
        isChrome, 
        isEdge, 
        isFirefox, 
        isSafari, 
        isOpera,
        speechSupported,
        HAS_WEBKIT_SPEECH,
        HAS_SPEECH,
        isSecureContext,
        hasMediaDevices
      } = checkBrowserSupport();
      
      const isCompatibleBrowser = isChrome || isEdge;
      
      console.log('Compatibility check:', { 
        isCompatibleBrowser, 
        speechSupported, 
        online: navigator.onLine,
        isSecureContext,
        hasMediaDevices,
        userAgent: navigator.userAgent
      });
      
      // Set speech support based on multiple factors
      const fullySupported = speechSupported && isSecureContext && hasMediaDevices && (isChrome || isEdge);
      setSpeechSupported(fullySupported);
      
      // Enhanced messaging with more specific details
      if (fullySupported) {
        if (navigator.onLine) {
          setCurrentResponse('Initializing voice assistant...');
          requestMicrophonePermission();
        } else {
          setCurrentResponse('Voice recognition requires internet connection. Quick command buttons work offline.');
        }
      } else {
        // More detailed error messages with specific reasons
        let errorMessage = '';
        
        if (!isSecureContext) {
          errorMessage = 'Voice recognition requires secure context (HTTPS or localhost). ';
        }
        
        if (!hasMediaDevices) {
          errorMessage += 'Microphone access not available. ';
        }
        
        if (!speechSupported) {
          if (!isCompatibleBrowser) {
            if (isFirefox) {
              errorMessage += 'Limited speech recognition support in Firefox. ';
            } else if (isSafari) {
              errorMessage += 'Limited speech recognition support in Safari. ';
            } else if (isOpera) {
              errorMessage += 'Limited speech recognition support in Opera. ';
            } else {
              errorMessage += 'Speech recognition requires Chrome or Edge browser. ';
            }
          } else {
            errorMessage += 'Speech recognition API not available. ';
          }
        }
        
        if (!errorMessage) {
          errorMessage = 'Voice recognition not fully supported. ';
        }
        
        errorMessage += 'Quick command buttons work in all browsers.';
        setCurrentResponse(errorMessage);
      }
    };

    // Initialize smart home data
    const initializeSmartHome = async () => {
      console.log('Initializing smart home data...');
      const currentUserId = userId || 'default';
      console.log('Using userId:', currentUserId);
      
      try {
        await globalActions.fetchSmartHomeData(currentUserId);
        console.log('Smart home data initialized');
      } catch (error) {
        console.warn('Failed to fetch smart home data, using fallback:', error);
      }
    };
    
    // Check network status changes
    const handleOnline = () => {
      console.log('Network back online - re-enabling voice recognition');
      const { speechSupported } = checkBrowserSupport();
      if (speechSupported && window.isSecureContext) {
        setSpeechSupported(true);
        setCurrentResponse('Voice recognition restored. Click Talk to start.');
        requestMicrophonePermission();
      }
    };
    
    const handleOffline = () => {
      console.log('Network offline - disabling voice recognition');
      setSpeechSupported(false);
      setCurrentResponse('Voice recognition requires internet connection. Quick command buttons work offline.');
      stopListening();
    };
    
    // Load voice settings from localStorage
    const savedVoiceSettings = localStorage.getItem('voiceSettings');
    if (savedVoiceSettings) {
      try {
        setVoiceSettings(JSON.parse(savedVoiceSettings));
      } catch (error) {
        console.warn('Failed to load voice settings:', error);
      }
    }
    
    // Listen for voice settings changes in localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'voiceSettings') {
        try {
          const newSettings = JSON.parse(e.newValue);
          setVoiceSettings(newSettings);
        } catch (error) {
          console.warn('Failed to parse voice settings from storage event:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    checkSupport();
    initializeSmartHome();
    
    // Load available voices and refresh when the browser reports updates
    getAvailableVoices().then(voices => {
      setAvailableVoices(voices);
    });
    const handleVoicesChanged = () => {
      const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : []
      setAvailableVoices(voices || [])
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
    }
    
    // Listen for network changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageChange);
      if (window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
      }
      // Cancel any ongoing speech
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel();
      }
      // Stop recognition if active
      stopListening();
      // Cancel any ongoing API requests
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [userId]);

  // Update voice settings when they change
  useEffect(() => {
    // When voice settings change, we don't need to do anything special
    // The speak function will use the latest settings
    console.log('Voice settings updated:', voiceSettings);
  }, [voiceSettings]);

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!speechSupported || micPermission !== 'granted') {
      console.log('Speech recognition not initialized - speechSupported:', speechSupported, 'micPermission:', micPermission);
      if (!speechSupported) {
        setCurrentResponse('Speech recognition not supported in this environment. Please use Chrome or Edge on HTTPS or localhost.');
      } else if (micPermission !== 'granted') {
        setCurrentResponse('Microphone permission required. Please allow microphone access.');
      }
      return null;
    }

    try {
      // More robust SpeechRecognition initialization with detailed diagnostics
      let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      console.log('Attempting to initialize SpeechRecognition:', SpeechRecognition);
      
      if (!SpeechRecognition) {
        console.error('SpeechRecognition API not available');
        setCurrentResponse('Speech recognition API not available in this browser. Please use Chrome or Edge.');
        setSpeechSupported(false);
        return null;
      }
      
      const newRecognition = new SpeechRecognition();
      
      // Validate the recognition object
      if (!newRecognition) {
        console.error('Failed to create SpeechRecognition instance');
        setCurrentResponse('Failed to initialize speech recognition. Please refresh the page.');
        return null;
      }
      
      // Log recognition object properties for debugging
      console.log('SpeechRecognition instance created:', newRecognition);
      console.log('Recognition properties:', {
        continuous: newRecognition.continuous,
        interimResults: newRecognition.interimResults,
        lang: newRecognition.lang,
        maxAlternatives: newRecognition.maxAlternatives
      });
      
      newRecognition.continuous = false;
      newRecognition.interimResults = true;
      newRecognition.lang = voiceSettings.lang || 'en-US';
      newRecognition.maxAlternatives = 1;

      newRecognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setAssistantState('listening');
        setCurrentResponse('Listening...');
      }

      newRecognition.onresult = (event) => {
        console.log('Speech recognition result:', event);
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        console.log('Transcript:', transcript);
        setCurrentResponse(`Listening: ${transcript}`);
        
        // Process final results
        if (event.results[0].isFinal) {
          console.log('Final transcript:', transcript);
          processVoiceCommand(transcript);
        }
      }

      newRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error, event);
        console.log('Error event details:', event);
        setIsListening(false);
        setAssistantState('idle');
        
        switch (event.error) {
          case 'not-allowed':
            setCurrentResponse('Microphone access denied. Please allow microphone permissions in browser settings.');
            setMicPermission('denied');
            break;
          case 'no-speech':
            setCurrentResponse('No speech detected. Try speaking more clearly or use quick command buttons.');
            break;
          case 'audio-capture':
            setCurrentResponse('No microphone found. Please check your audio setup.');
            break;
          case 'network':
            // Network error - provide fallback options and retry
            setCurrentResponse('Speech service temporarily unavailable. Use quick command buttons.');
            console.log('Network error detected - speech recognition service unavailable');
            break;
          case 'service-not-allowed':
            setCurrentResponse('Speech recognition service blocked. Use quick command buttons.');
            break;
          case 'aborted':
            // Don't show error for user-initiated stops
            if (assistantState === 'listening') {
              setCurrentResponse('Voice recognition stopped. Click Talk to try again.');
            }
            break;
          case 'bad-grammar':
            setCurrentResponse('Speech recognition grammar error. Please try again.');
            break;
          case 'language-not-supported':
            setCurrentResponse('Selected language not supported. Please try a different language.');
            break;
          default:
            setCurrentResponse(`Voice recognition error (${event.error}). Use quick command buttons or try again.`);
            console.error('Unhandled speech recognition error:', event.error, event.message);
        }
      }

      newRecognition.onend = () => {
        console.log('Speech recognition ended')
        setIsListening(false)
        if (assistantState === 'listening') {
          setAssistantState('idle')
          setCurrentResponse('Ready for next command')
        }
      }

      console.log('Speech recognition initialized successfully')
      return newRecognition
      
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error)
      console.error('Error stack:', error.stack)
      setSpeechSupported(false)
      setCurrentResponse(`Speech recognition initialization failed: ${error.message}. Please use Chrome or Edge browser.`)
      return null
    }
  }, [speechSupported, micPermission, assistantState, voiceSettings])

  // Enhanced ChatGPT API integration for natural language understanding
  const callChatGPT = async (message) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    const openAIDisabled = import.meta.env.VITE_DISABLE_OPENAI === 'true'
    
    if (openAIDisabled || !apiKey) {
      // OpenAI is disabled or not configured - use local command processing only
      return null // Return null to trigger local command processing
    }

    // Create a new AbortController for this request
    abortController.current = new AbortController()
    
    try {
      console.log('Calling ChatGPT with message:', message)
      
      // Build concise context (only essential info for speed)
      const rooms = state?.smartHome?.rooms?.map(room => room.name).join(', ') || 'None'
      const userName = userProfile?.preferredName || userProfile?.name || 'User'
      const weather = state?.weather?.current ? `${state.weather.current.description}, ${state.weather.current.temperature}°C` : ''

      // Simplified, concise system prompt for faster processing
      const systemPrompt = `Smart home assistant. User: ${userName}. Rooms: ${rooms}. ${weather ? `Weather: ${weather}.` : ''} Control devices (lights, climate, fans, shutters, curtains). Keep responses under 30 words. Be friendly and concise.`

      // Reduce conversation history to 2 entries for faster processing
      const updatedHistory = [
        ...conversationHistory.slice(-2), // Keep only last 2 entries
        { role: 'user', content: message }
      ]
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...updatedHistory.map(entry => ({ role: entry.role, content: entry.content }))
      ]

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Faster and cheaper than gpt-4o-mini
          messages: messages,
          max_tokens: 100, // Reduced from 200 for faster responses
          temperature: 0.5 // Lower temperature for faster, more deterministic responses
        }),
        signal: abortController.current.signal
      }).catch(fetchError => {
        // Handle CORS and network errors gracefully
        if (fetchError.message?.includes('CORS') || fetchError.message?.includes('Failed to fetch')) {
          throw new Error('CORS_BLOCKED');
        }
        throw fetchError;
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const aiResponse = data.choices?.[0]?.message?.content || "I heard you, but I'm not sure how to help with that."
      
      console.log('ChatGPT response:', aiResponse)
      
      // Update conversation history
      setConversationHistory(prev => [
        ...prev.slice(-4), // Keep only last 4 entries
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      ])
      
      // Check if the AI response suggests a smart home action
      const lowerResponse = aiResponse.toLowerCase()
      
      // Extract device control actions from the response
      if (lowerResponse.includes('turn on') && lowerResponse.includes('light')) {
        // Extract room name if mentioned
        const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
        const roomName = roomMatch ? roomMatch[1].trim() : null
        await executeSmartAction('lights_on', { room: roomName }, aiResponse)
      } else if (lowerResponse.includes('turn off') && lowerResponse.includes('light')) {
        // Extract room name if mentioned
        const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
        const roomName = roomMatch ? roomMatch[1].trim() : null
        await executeSmartAction('lights_off', { room: roomName }, aiResponse)
      } else if (lowerResponse.includes('temperature') || lowerResponse.includes('cool') || lowerResponse.includes('warm')) {
        // Extract temperature if mentioned
        const tempMatch = aiResponse.match(/(\d+)°?[CF]?/i)
        if (tempMatch) {
          const temp = parseInt(tempMatch[1])
          // Extract room name if mentioned
          const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
          const roomName = roomMatch ? roomMatch[1].trim() : null
          await executeSmartAction('set_temperature', { temperature: temp, room: roomName })
        }
      } else if (lowerResponse.includes('good morning')) {
        await executeSmartAction('good_morning')
      } else if (lowerResponse.includes('goodnight') || lowerResponse.includes('good night')) {
        await executeSmartAction('goodnight')
      } else if (lowerResponse.includes('open') && (lowerResponse.includes('curtain') || lowerResponse.includes('curtains'))) {
        // Extract room name if mentioned
        const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
        const roomName = roomMatch ? roomMatch[1].trim() : null
        await executeSmartAction('open_curtains', { room: roomName })
      } else if (lowerResponse.includes('close') && (lowerResponse.includes('curtain') || lowerResponse.includes('curtains'))) {
        // Extract room name if mentioned
        const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
        const roomName = roomMatch ? roomMatch[1].trim() : null
        await executeSmartAction('close_curtains', { room: roomName })
      } else if (lowerResponse.includes('open') && (lowerResponse.includes('shutter') || lowerResponse.includes('shutters'))) {
        // Extract room name if mentioned
        const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
        const roomName = roomMatch ? roomMatch[1].trim() : null
        await executeSmartAction('open_shutters', { room: roomName })
      } else if (lowerResponse.includes('close') && (lowerResponse.includes('shutter') || lowerResponse.includes('shutters'))) {
        // Extract room name if mentioned
        const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
        const roomName = roomMatch ? roomMatch[1].trim() : null
        await executeSmartAction('close_shutters', { room: roomName })
      } else if (lowerResponse.includes('turn on') && (lowerResponse.includes('fan') || lowerResponse.includes('fans'))) {
        // Extract room name if mentioned
        const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
        const roomName = roomMatch ? roomMatch[1].trim() : null
        await executeSmartAction('fan_on', { room: roomName })
      } else if (lowerResponse.includes('turn off') && (lowerResponse.includes('fan') || lowerResponse.includes('fans'))) {
        // Extract room name if mentioned
        const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
        const roomName = roomMatch ? roomMatch[1].trim() : null
        await executeSmartAction('fan_off', { room: roomName })
      } else if (lowerResponse.includes('lock') && lowerResponse.includes('door')) {
        // Extract room name if mentioned
        const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
        const roomName = roomMatch ? roomMatch[1].trim() : null
        await executeSmartAction('lock_door', { room: roomName })
      } else if (lowerResponse.includes('unlock') && lowerResponse.includes('door')) {
        // Extract room name if mentioned
        const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
        const roomName = roomMatch ? roomMatch[1].trim() : null
        await executeSmartAction('unlock_door', { room: roomName })
      } else if (lowerResponse.includes('volume up') || (lowerResponse.includes('turn up') && lowerResponse.includes('volume'))) {
        // Extract room name if mentioned
        const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
        const roomName = roomMatch ? roomMatch[1].trim() : null
        await executeSmartAction('volume_up', { room: roomName })
      } else if (lowerResponse.includes('volume down') || (lowerResponse.includes('turn down') && lowerResponse.includes('volume'))) {
        // Extract room name if mentioned
        const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
        const roomName = roomMatch ? roomMatch[1].trim() : null
        await executeSmartAction('volume_down', { room: roomName })
      } else if (lowerResponse.includes('mute')) {
        // Extract room name if mentioned
        const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
        const roomName = roomMatch ? roomMatch[1].trim() : null
        await executeSmartAction('mute', { room: roomName })
      } else if (lowerResponse.includes('unmute') || lowerResponse.includes('un silence')) {
        // Extract room name if mentioned
        const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
        const roomName = roomMatch ? roomMatch[1].trim() : null
        await executeSmartAction('unmute', { room: roomName })
      } else if (lowerResponse.includes('fan speed') || (lowerResponse.includes('set') && lowerResponse.includes('fan') && lowerResponse.includes('%'))) {
        // Extract speed percentage if mentioned
        const speedMatch = aiResponse.match(/(\d+)%/)
        if (speedMatch) {
          const speed = parseInt(speedMatch[1])
          // Extract room name if mentioned
          const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
          const roomName = roomMatch ? roomMatch[1].trim() : null
          await executeSmartAction('set_fan_speed', { speed: speed, room: roomName })
        }
      } else if (lowerResponse.includes('brightness') || (lowerResponse.includes('dim') && lowerResponse.includes('light')) || (lowerResponse.includes('brighten') && lowerResponse.includes('light'))) {
        // Extract brightness percentage if mentioned
        const brightnessMatch = aiResponse.match(/(\d+)%/)
        if (brightnessMatch) {
          const brightness = parseInt(brightnessMatch[1])
          // Extract room name if mentioned
          const roomMatch = aiResponse.match(/(?:in|in the) ([a-z\s']+)(?:[.,!?]|$)/i)
          const roomName = roomMatch ? roomMatch[1].trim() : null
          await executeSmartAction('set_light_brightness', { brightness: brightness, room: roomName })
        }
      } else if (lowerResponse.includes('arm') && (lowerResponse.includes('security') || lowerResponse.includes('alarm'))) {
        await executeSmartAction('arm_security')
      } else if (lowerResponse.includes('disarm') && (lowerResponse.includes('security') || lowerResponse.includes('alarm'))) {
        await executeSmartAction('disarm_security')
      }

      return aiResponse
      
    } catch (error) {
      if (error.name === 'AbortError') {
        return null // Return null to trigger local command fallback
      }
      // Silently handle CORS errors - they're expected when calling from browser
      if (error.message === 'CORS_BLOCKED' || error.message?.includes('CORS')) {
        return null // Return null to trigger local command fallback
      }
      // Only log unexpected errors
      if (!error.message?.includes('CORS') && !error.message?.includes('Failed to fetch')) {
        console.error('Error calling ChatGPT:', error)
      }
      return null // Return null to trigger local command fallback
    }
  }

  // Execute smart home actions triggered by AI responses
  const executeSmartAction = async (action, parameters = {}) => {
    // All the find* functions have been moved to the component scope to avoid duplication
    // and make them accessible to other functions like processSmartCommand
    
    try {
      switch (action) {
        case 'lights_on': {
          const resolvedRoom = parameters.room ? findClosestRoomName(parameters.room) : null
          const lightDevices = findLightDevices(resolvedRoom)
          if (lightDevices.length > 0) {
            const alreadyOn = lightDevices.filter(device => device.state === true)
            const toTurnOn = lightDevices.filter(device => device.state !== true)

            if (toTurnOn.length === 0) {
              return resolvedRoom
                ? `The lights are already on in the ${resolvedRoom}.`
                : 'The lights are already on.'
            }

            for (const { roomId, deviceId } of toTurnOn) {
              await globalActions.toggleLight(userId, roomId, deviceId, true)
            }

            if (alreadyOn.length > 0) {
              return resolvedRoom
                ? `Some lights were already on in the ${resolvedRoom}. I turned on the rest.`
                : 'Some lights were already on. I turned on the rest.'
            }

            return `I've turned on ${toTurnOn.length} lights${resolvedRoom ? ` in the ${resolvedRoom}` : ''} for you.`
          }
          return "I couldn't find any lights to turn on."
        }
        
        case 'lights_off': {
          const resolvedRoom = parameters.room ? findClosestRoomName(parameters.room) : null
          const lightDevices = findLightDevices(resolvedRoom)
          if (lightDevices.length > 0) {
            const alreadyOff = lightDevices.filter(device => device.state === false)
            const toTurnOff = lightDevices.filter(device => device.state !== false)

            if (toTurnOff.length === 0) {
              return resolvedRoom
                ? `The lights are already off in the ${resolvedRoom}.`
                : 'The lights are already off.'
            }

            for (const { roomId, deviceId } of toTurnOff) {
              await globalActions.toggleLight(userId, roomId, deviceId, false)
            }

            if (alreadyOff.length > 0) {
              return resolvedRoom
                ? `Some lights were already off in the ${resolvedRoom}. I turned off the rest.`
                : 'Some lights were already off. I turned off the rest.'
            }

            return `I've turned off ${toTurnOff.length} lights${resolvedRoom ? ` in the ${resolvedRoom}` : ''} for you.`
          }
          return "I couldn't find any lights to turn off."
        }
        
        case 'set_temperature': {
          if (parameters.temperature && typeof parameters.temperature === 'number') {
            const acDevices = findACDevices(parameters.room)
            if (acDevices.length > 0) {
              for (const { roomId, deviceId } of acDevices) {
                await globalActions.setClimateTemperature(userId, roomId, deviceId, parameters.temperature)
              }
              return `I've set the temperature to ${parameters.temperature}°C${parameters.room ? ` in the ${parameters.room}` : ''}.`
            }
            return "I couldn't find any climate devices to adjust."
          }
          return "I need a specific temperature to set."
        }
        
        case 'good_morning': {
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
        
        case 'goodnight': {
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
        
        case 'open_curtains': {
          const curtainDevices = findCurtainDevices(parameters.room)
          if (curtainDevices.length > 0) {
            for (const { roomId, deviceId } of curtainDevices) {
              await globalActions.setCurtainPosition(userId, roomId, deviceId, 100)
            }
            return `I've opened the curtains${parameters.room ? ` in the ${parameters.room}` : ''} for you.`
          }
          return "I couldn't find any curtains to open."
        }
        
        case 'close_curtains': {
          const curtainDevices = findCurtainDevices(parameters.room)
          if (curtainDevices.length > 0) {
            for (const { roomId, deviceId } of curtainDevices) {
              await globalActions.setCurtainPosition(userId, roomId, deviceId, 0)
            }
            return `I've closed the curtains${parameters.room ? ` in the ${parameters.room}` : ''} for you.`
          }
          return "I couldn't find any curtains to close."
        }
        
        case 'open_shutters': {
          const shutterDevices = findShutterDevices(parameters.room)
          if (shutterDevices.length > 0) {
            for (const { roomId, deviceId } of shutterDevices) {
              await globalActions.setShutterPosition(userId, roomId, deviceId, 100)
            }
            return `I've opened the shutters${parameters.room ? ` in the ${parameters.room}` : ''} for you.`
          }
          return "I couldn't find any shutters to open."
        }
        
        case 'close_shutters': {
          const shutterDevices = findShutterDevices(parameters.room)
          if (shutterDevices.length > 0) {
            for (const { roomId, deviceId } of shutterDevices) {
              await globalActions.setShutterPosition(userId, roomId, deviceId, 0)
            }
            return `I've closed the shutters${parameters.room ? ` in the ${parameters.room}` : ''} for you.`
          }
          return "I couldn't find any shutters to close."
        }
        
        case 'fan_on': {
          const fanDevices = findFanDevices(parameters.room)
          if (fanDevices.length > 0) {
            for (const { roomId, deviceId } of fanDevices) {
              await globalActions.setFanState(userId, roomId, deviceId, true)
            }
            return `I've turned on the fan${parameters.room ? ` in the ${parameters.room}` : ''} for you.`
          }
          return "I couldn't find any fans to turn on."
        }
        
        case 'fan_off': {
          const fanDevices = findFanDevices(parameters.room)
          if (fanDevices.length > 0) {
            for (const { roomId, deviceId } of fanDevices) {
              await globalActions.setFanState(userId, roomId, deviceId, false)
            }
            return `I've turned off the fan${parameters.room ? ` in the ${parameters.room}` : ''} for you.`
          }
          return "I couldn't find any fans to turn off."
        }
        
        case 'lock_door': {
          const doorDevices = findDoorDevices(parameters.room)
          if (doorDevices.length > 0) {
            for (const { roomId, deviceId } of doorDevices) {
              await globalActions.setDoorLockState(userId, roomId, deviceId, true)
            }
            return `I've locked the door${parameters.room ? ` in the ${parameters.room}` : ''} for you.`
          }
          return "I couldn't find any doors to lock."
        }
        
        case 'unlock_door': {
          const doorDevices = findDoorDevices(parameters.room)
          if (doorDevices.length > 0) {
            for (const { roomId, deviceId } of doorDevices) {
              await globalActions.setDoorLockState(userId, roomId, deviceId, false)
            }
            return `I've unlocked the door${parameters.room ? ` in the ${parameters.room}` : ''} for you.`
          }
          return "I couldn't find any doors to unlock."
        }
        
        case 'volume_up': {
          const speakerDevices = findSpeakerDevices(parameters.room)
          if (speakerDevices.length > 0) {
            for (const { roomId, deviceId } of speakerDevices) {
              // This would require a specific action in your globalActions
              // For now, we'll just acknowledge the request
              console.log(`Volume up requested for device ${deviceId} in room ${roomId}`)
            }
            return `I've increased the volume${parameters.room ? ` in the ${parameters.room}` : ''} for you.`
          }
          return "I couldn't find any speakers to adjust."
        }
        
        case 'volume_down': {
          const speakerDevices = findSpeakerDevices(parameters.room)
          if (speakerDevices.length > 0) {
            for (const { roomId, deviceId } of speakerDevices) {
              // This would require a specific action in your globalActions
              // For now, we'll just acknowledge the request
              console.log(`Volume down requested for device ${deviceId} in room ${roomId}`)
            }
            return `I've decreased the volume${parameters.room ? ` in the ${parameters.room}` : ''} for you.`
          }
          return "I couldn't find any speakers to adjust."
        }
        
        case 'mute': {
          const speakerDevices = findSpeakerDevices(parameters.room)
          if (speakerDevices.length > 0) {
            for (const { roomId, deviceId } of speakerDevices) {
              // This would require a specific action in your globalActions
              // For now, we'll just acknowledge the request
              console.log(`Mute requested for device ${deviceId} in room ${roomId}`)
            }
            return `I've muted the sound${parameters.room ? ` in the ${parameters.room}` : ''} for you.`
          }
          return "I couldn't find any speakers to mute."
        }
        
        case 'unmute': {
          const speakerDevices = findSpeakerDevices(parameters.room)
          if (speakerDevices.length > 0) {
            for (const { roomId, deviceId } of speakerDevices) {
              // This would require a specific action in your globalActions
              // For now, we'll just acknowledge the request
              console.log(`Unmute requested for device ${deviceId} in room ${roomId}`)
            }
            return `I've unmuted the sound${parameters.room ? ` in the ${parameters.room}` : ''} for you.`
          }
          return "I couldn't find any speakers to unmute."
        }
        
        case 'set_fan_speed': {
          if (parameters.speed && typeof parameters.speed === 'number') {
            const fanDevices = findFanDevices(parameters.room)
            if (fanDevices.length > 0) {
              // This would require a specific action in your globalActions
              // For now, we'll just acknowledge the request
              for (const { roomId, deviceId } of fanDevices) {
                console.log(`Set fan speed to ${parameters.speed}% for device ${deviceId} in room ${roomId}`)
              }
              return `I've set the fan speed to ${parameters.speed}%${parameters.room ? ` in the ${parameters.room}` : ''} for you.`
            }
            return "I couldn't find any fans to adjust."
          }
          return "I need a specific speed percentage to set."
        }
        
        case 'set_light_brightness': {
          if (parameters.brightness && typeof parameters.brightness === 'number') {
            const lightDevices = findLightDevices(parameters.room)
            if (lightDevices.length > 0) {
              // This would require a specific action in your globalActions
              // For now, we'll just acknowledge the request
              for (const { roomId, deviceId } of lightDevices) {
                console.log(`Set light brightness to ${parameters.brightness}% for device ${deviceId} in room ${roomId}`)
              }
              return `I've set the light brightness to ${parameters.brightness}%${parameters.room ? ` in the ${parameters.room}` : ''} for you.`
            }
            return "I couldn't find any lights to adjust."
          }
          return "I need a specific brightness percentage to set."
        }
        
        case 'arm_security': {
          const securityDevices = findSecurityDevices()
          if (securityDevices.length > 0) {
            // This would require a specific action in your globalActions
            // For now, we'll just acknowledge the request
            for (const { roomId, deviceId } of securityDevices) {
              console.log(`Arm security system for device ${deviceId} in room ${roomId}`)
            }
            return `I've armed the security system for you.`
          }
          return "I couldn't find any security devices to arm."
        }
        
        case 'disarm_security': {
          const securityDevices = findSecurityDevices()
          if (securityDevices.length > 0) {
            // This would require a specific action in your globalActions
            // For now, we'll just acknowledge the request
            for (const { roomId, deviceId } of securityDevices) {
              console.log(`Disarm security system for device ${deviceId} in room ${roomId}`)
            }
            return `I've disarmed the security system for you.`
          }
          return "I couldn't find any security devices to disarm."
        }
        
        default:
          return null
      }
    } catch (error) {
      console.error('Error executing smart action:', error)
      return `Sorry, I had trouble controlling your smart home devices: ${error.message}`
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
    
    // Try to use ChatGPT Assistant Service for advanced AI processing
    try {
      // Build context for the AI
      const context = {
        rooms: smartHomeRooms,
        userId: userId,
        onDeviceControl: async ({ roomId, deviceId, action, property, value }) => {
          console.log('AI Device Control:', { roomId, deviceId, action, property, value })

          const findDeviceById = () => {
            for (const room of smartHomeRooms) {
              if (Array.isArray(room.devices)) {
                const device = room.devices.find(d => d.id === deviceId)
                if (device) {
                  return { device, roomId: room.id }
                }
              }
              if (Array.isArray(room.lights)) {
                const light = room.lights.find(l => (l.deviceId || l.id) === deviceId)
                if (light) {
                  return { device: { ...light, type: 'light' }, roomId: room.id }
                }
              }
            }
            return { device: null, roomId: null }
          }

          const { device, roomId: resolvedRoomId } = findDeviceById()
          const targetRoomId = roomId || resolvedRoomId
          const deviceType = (property || device?.type || '').toLowerCase()

          if (!targetRoomId) {
            console.warn('AI Device Control: missing roomId for device', { deviceId, action, property })
            return
          }
          
          // Map AI actions to actual device control actions
          switch (action) {
            case 'turn_on':
              if (deviceType.includes('light')) {
                await globalActions.toggleLight(userId, targetRoomId, deviceId, true)
              } else if (deviceType.includes('fan') || deviceType.includes('air') || deviceType.includes('climate') || deviceType.includes('thermostat')) {
                await globalActions.setClimateState(userId, targetRoomId, deviceId, true)
              }
              break
            case 'turn_off':
              if (deviceType.includes('light')) {
                await globalActions.toggleLight(userId, targetRoomId, deviceId, false)
              } else if (deviceType.includes('fan') || deviceType.includes('air') || deviceType.includes('climate') || deviceType.includes('thermostat')) {
                await globalActions.setClimateState(userId, targetRoomId, deviceId, false)
              }
              break
            case 'set_brightness':
              await globalActions.setLightBrightness(userId, targetRoomId, deviceId, value)
              break
            case 'set_temperature':
              await globalActions.setClimateTemperature(userId, targetRoomId, deviceId, value)
              break
            case 'open':
              if (globalActions.openCurtains) {
                await globalActions.openCurtains(userId, targetRoomId, deviceId)
              }
              break
            case 'close':
              if (globalActions.closeCurtains) {
                await globalActions.closeCurtains(userId, targetRoomId, deviceId)
              }
              break
            default:
              console.log('Unknown action:', action)
          }
        }
      }
      
      // Ask the AI assistant
      const aiResponse = await chatGPTAssistantService.askAssistant(command, context)
      
      if (aiResponse && aiResponse !== command) {
        console.log('AI Response:', aiResponse)
        return aiResponse
      }
    } catch (error) {
      console.error('AI Assistant error:', error)
      // Fall through to legacy processing
    }
    
    // Use intent parser for more sophisticated command understanding
    const intent = parseIntent(lowerCommand)
    console.log('Parsed intent:', intent)
    
    // If we have a high-confidence intent, handle it directly
    if (intent.confidence > 0.8) {
      const response = generateResponse(intent)
      return response
    }
    
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
      
      // Try to extract room name from command using regex
      const roomMatch = lowerCommand.match(/(?:living room|bedroom|kitchen|bathroom|office|garage|john's room|jane's room|mike's room|sarah's room|alex's room|emma's room|david's room|lisa's room|chris's room|anna's room|robert's room|maria's room|james's room|jennifer's room|michael's room|elizabeth's room|william's room|sophia's room|thomas's room|olivia's room|tom's room|lucy's room|peter's room|claire's room|steve's room|amy's room|kevin's room|laura's room|brian's room|sara's room|nathan's room|karen's room|ryan's room|melissa's room|jason's room|rachel's room|adam's room|nicole's room|eric's room|vanessa's room|patrick's room|diana's room|greg's room|monica's room|philip's room|carol's room|derek's room|janet's room|marcus's room|theresa's room|vincent's room|helen's room)/)
      if (roomMatch) {
        roomName = roomMatch[0].replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter
      }

      if (!roomName) {
        roomName = findClosestRoomName(lowerCommand)
      }
      
      const lightDevices = findLightDevices(roomName)
      if (lightDevices.length > 0) {
        const alreadyOn = lightDevices.filter(device => device.state === true)
        const toTurnOn = lightDevices.filter(device => device.state !== true)

        if (toTurnOn.length === 0) {
          return roomName
            ? `The lights are already on in the ${roomName}`
            : 'The lights are already on'
        }

        for (const { roomId, deviceId } of toTurnOn) {
          await globalActions.toggleLight(userId, roomId, deviceId, true)
        }

        if (alreadyOn.length > 0) {
          return roomName
            ? `Some lights were already on in the ${roomName}. I turned on the rest.`
            : 'Some lights were already on. I turned on the rest.'
        }

        return roomName
          ? `Turned on lights in the ${roomName}`
          : `Turned on ${toTurnOn.length} lights`
      } else {
        return 'No light devices found in your smart home setup'
      }
    }
    
    if (lowerCommand.includes('lights off') || lowerCommand.includes('turn off lights') || lowerCommand.includes('turn off the lights')) {
      // Extract room information from command with improved parsing
      let roomName = null
      
      // Try to extract room name from command using regex
      const roomMatch = lowerCommand.match(/(?:living room|bedroom|kitchen|bathroom|office|garage|john's room|jane's room|mike's room|sarah's room|alex's room|emma's room|david's room|lisa's room|chris's room|anna's room|robert's room|maria's room|james's room|jennifer's room|michael's room|elizabeth's room|william's room|sophia's room|thomas's room|olivia's room|tom's room|lucy's room|peter's room|claire's room|steve's room|amy's room|kevin's room|laura's room|brian's room|sara's room|nathan's room|karen's room|ryan's room|melissa's room|jason's room|rachel's room|adam's room|nicole's room|eric's room|vanessa's room|patrick's room|diana's room|greg's room|monica's room|philip's room|carol's room|derek's room|janet's room|marcus's room|theresa's room|vincent's room|helen's room)/)
      if (roomMatch) {
        roomName = roomMatch[0].replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter
      }

      if (!roomName) {
        roomName = findClosestRoomName(lowerCommand)
      }
      
      const lightDevices = findLightDevices(roomName)
      if (lightDevices.length > 0) {
        const alreadyOff = lightDevices.filter(device => device.state === false)
        const toTurnOff = lightDevices.filter(device => device.state !== false)

        if (toTurnOff.length === 0) {
          return roomName
            ? `The lights are already off in the ${roomName}`
            : 'The lights are already off'
        }

        for (const { roomId, deviceId } of toTurnOff) {
          await globalActions.toggleLight(userId, roomId, deviceId, false)
        }

        if (alreadyOff.length > 0) {
          return roomName
            ? `Some lights were already off in the ${roomName}. I turned off the rest.`
            : 'Some lights were already off. I turned off the rest.'
        }

        return roomName
          ? `Turned off lights in the ${roomName}`
          : `Turned off ${toTurnOff.length} lights`
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
  }

  // Process voice command with ChatGPT integration
  const processVoiceCommand = async (command) => {
    console.log('Processing voice command:', command)
    
    // Cancel any ongoing speech or processing
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel()
    }
    isSpeaking.current = false
    
    setIsProcessing(true)
    setAssistantState('processing')
    setCurrentResponse('Processing...')
    
    try {
      // First try local smart home commands for immediate response
      const smartResponse = await processSmartCommand(command)
      if (smartResponse) {
        setCurrentResponse(smartResponse)
        setAssistantState('responding')
        speak(smartResponse)
        return
      }
      
      // If no local command matched, try ChatGPT for advanced understanding
      const aiResponse = await callChatGPT(command)
      
      if (aiResponse) {
        setCurrentResponse(aiResponse)
        setAssistantState('responding')
        speak(aiResponse)
      } else {
        // OpenAI is disabled or CORS blocked - provide helpful message
        const fallbackMessage = "I can help with basic commands like 'turn on lights', 'good morning', or 'set temperature to 22 degrees'. For advanced AI features, please configure a server-side proxy."
        setCurrentResponse(fallbackMessage)
        setAssistantState('responding')
        speak(fallbackMessage)
      }
      
    } catch (error) {
      console.error('Error processing voice command:', error)
      
      // Fallback to local processing if ChatGPT fails
      const fallbackResponse = await processSmartCommand(command)
      if (fallbackResponse) {
        setCurrentResponse(fallbackResponse)
        setAssistantState('responding')
        speak(fallbackResponse)
        return
      }
      
      const errorMessage = `I'm having trouble understanding that right now. Error: ${error.message}`
      setCurrentResponse(errorMessage)
      setAssistantState('responding')
      speak(errorMessage)
      
    } finally {
      setIsProcessing(false)
      // Reset state after speaking completes
      setTimeout(() => {
        if (!isSpeaking.current) {
          setAssistantState('idle')
          setCurrentResponse('Ready for next command')
        }
      }, 3000)
    }
  }

  // Text-to-speech function
  const speak = async (text) => {
    try {
      // Prefer OpenAI TTS exclusively
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      console.log('🔊 TTS Debug - API Key present:', !!apiKey)
      console.log('🔊 TTS Debug - Text to speak:', text)
      console.log('🔊 TTS Debug - Voice settings:', voiceSettings)
      
      if (!apiKey) {
        console.warn('OpenAI API key missing; cannot use OpenAI TTS')
        setCurrentResponse('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env.local file.')
        return
      }
      isSpeaking.current = true
      const voiceName = resolveOpenAIVoiceName(voiceSettings.voiceId)
      const rate = Math.max(0.5, Math.min(2.0, voiceSettings.rate || 1.0))
      const pitch = Math.max(0.5, Math.min(1.5, voiceSettings.pitch || 1.0))
      
      console.log('🔊 TTS Debug - Voice name:', voiceName, 'Rate:', rate, 'Pitch:', pitch)

      console.log('🔊 TTS Debug - Making OpenAI API request...')
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: OPENAI_TTS.model,
          voice: voiceName,
          input: text,
          format: OPENAI_TTS.format,
          speed: rate,
          // pitch is not universally supported; included as hint via prosody if model honors it
        })
      }).catch(fetchError => {
        // Handle CORS and network errors gracefully
        if (fetchError.message?.includes('CORS') || fetchError.message?.includes('Failed to fetch')) {
          throw new Error('CORS_BLOCKED');
        }
        throw fetchError;
      })
      
      console.log('🔊 TTS Debug - API Response status:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('🔊 TTS Debug - API Error:', errorText)
        throw new Error(`OpenAI TTS error: ${response.status} - ${errorText}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      console.log('🔊 TTS Debug - Audio data received, size:', arrayBuffer.byteLength)
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.volume = Math.max(0, Math.min(1, voiceSettings.volume ?? 0.8))
      
      console.log('🔊 TTS Debug - Audio volume set to:', audio.volume)
      console.log('🔊 TTS Debug - Attempting to play audio...')
      
      // Add event listeners for debugging
      audio.addEventListener('loadstart', () => console.log('🔊 TTS Debug - Audio load started'))
      audio.addEventListener('canplay', () => console.log('🔊 TTS Debug - Audio can play'))
      audio.addEventListener('play', () => console.log('🔊 TTS Debug - Audio started playing'))
      audio.addEventListener('error', (e) => console.error('🔊 TTS Debug - Audio error:', e))
      
      await audio.play()
      audio.onended = () => {
        URL.revokeObjectURL(url)
        isSpeaking.current = false
        setTimeout(() => {
          if (!isListening && !isProcessing) {
            setAssistantState('idle')
            setCurrentResponse('Ready for next command')
          }
        }, 500)
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        isSpeaking.current = false
        setTimeout(() => {
          if (!isListening && !isProcessing) {
            setAssistantState('idle')
            setCurrentResponse('Ready for next command')
          }
        }, 500)
      }
    } catch (err) {
      // Silently handle CORS errors - they're expected when calling from browser
      if (err.message !== 'CORS_BLOCKED' && !err.message?.includes('CORS') && !err.message?.includes('Failed to fetch')) {
        console.error('TTS playback failed:', err)
      }
      isSpeaking.current = false
      setTimeout(() => {
        if (!isListening && !isProcessing) {
          setAssistantState('idle')
          setCurrentResponse('Ready for next command')
        }
      }, 500)
    }
  }

  // Start listening function with enhanced diagnostics
  const startListening = async () => {
    console.log('Start listening requested - current state:', { 
      speechSupported, 
      micPermission, 
      isListening,
      online: navigator.onLine,
      secureContext: window.isSecureContext,
      userAgent: navigator.userAgent
    })
    
    // Enhanced diagnostics
    if (!window.isSecureContext) {
      setCurrentResponse('Voice recognition requires secure context (HTTPS or localhost). Please ensure you\'re using HTTPS or accessing from localhost.')
      console.error('Not in secure context - required for speech recognition')
      return
    }
    
    if (!speechSupported) {
      setCurrentResponse('Speech recognition not supported. Please use Chrome or Edge browser on HTTPS or localhost.')
      console.error('Speech recognition not supported')
      return
    }
    
    if (micPermission !== 'granted') {
      setCurrentResponse('Microphone access required. Please allow microphone permissions in browser settings.')
      console.error('Microphone permission not granted')
      return
    }
    
    if (!navigator.onLine) {
      setCurrentResponse('Voice recognition requires internet connection. Use quick command buttons below.')
      console.error('No internet connection')
      return
    }

    console.log('Starting to listen...')
    setCurrentResponse('Initializing voice recognition...')
    
    // Cancel any ongoing speech before starting recognition
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel()
      isSpeaking.current = false
    }
    
    const newRecognition = initializeSpeechRecognition()
    
    if (newRecognition) {
      recognition.current = newRecognition
      try {
        console.log('Attempting to start speech recognition...')
        console.log('Recognition object:', newRecognition)
        
        // Check if recognition is already listening
        if (isListening) {
          console.log('Already listening, stopping first...')
          newRecognition.stop()
        }
        
        newRecognition.start()
        console.log('Speech recognition start command sent')
        
        // Set a timeout to catch initialization issues
        setTimeout(() => {
          if (!isListening && assistantState !== 'listening' && currentResponse === 'Initializing voice recognition...') {
            console.log('Voice recognition initialization timeout - resetting state')
            setCurrentResponse('Voice recognition taking too long to start. Please try again.')
            setIsListening(false)
            setAssistantState('idle')
          }
        }, 5000)
        
      } catch (error) {
        console.error('Failed to start recognition:', error)
        console.error('Error name:', error.name)
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
        
        setCurrentResponse(`Failed to start voice recognition: ${error.message}. Use quick command buttons or check browser compatibility.`)
        setIsListening(false)
        setAssistantState('idle')
      }
    } else {
      setCurrentResponse('Voice recognition initialization failed. Use quick command buttons.')
      console.error('Recognition object not created')
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
    
    // Cancel any ongoing speech
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel()
      isSpeaking.current = false
    }
    
    setIsListening(false)
    setAssistantState('idle')
    setCurrentResponse('Ready for next command')
  }
  
  // Update voice settings
  const updateVoiceSettings = (newSettings) => {
    const updatedSettings = { ...voiceSettings, ...newSettings }
    setVoiceSettings(updatedSettings)
    localStorage.setItem('voiceSettings', JSON.stringify(updatedSettings))
    // No need to refresh - changes take effect immediately
  }

  // Voice test is available in main Settings modal
  
  // Get assistant icon based on state
  const getAssistantIcon = () => {
    switch (assistantState) {
      case 'listening':
        return '●'
      case 'processing':
        return '○'
      case 'responding':
        return '■'
      default:
        return '◆'
    }
  }
  
  // Get status text based on state with enhanced diagnostics
  const getStatusText = () => {
    switch (assistantState) {
      case 'listening':
        return 'Listening...'
      case 'processing':
        return 'Processing...'
      case 'responding':
        return 'Responding...'
      default:
        if (!speechSupported) {
          return 'Browser/Context Issue'
        } else if (micPermission === 'denied') {
          return 'Microphone Denied'
        } else if (micPermission === 'granted') {
          return 'Tap to speak'
        } else {
          return 'Initializing...'
        }
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
              Voice recognition requires Chrome/Edge with HTTPS or localhost. Quick commands work in all browsers.
            </div>
          )}
          {micPermission === 'denied' && (
            <div className="feature-warning">
              Microphone access denied. Allow in browser settings and refresh.
            </div>
          )}
          {currentResponse && (
            <div className="response-text">
              {currentResponse}
            </div>
          )}
        </div>
        
        {/* Voice settings moved to main Settings modal */}
        
        <div className="assistant-controls">
          <button
            onClick={() => {
              console.log('Talk button clicked, current state:', { 
                isListening, 
                speechSupported, 
                micPermission,
                online: navigator.onLine,
                secureContext: window.isSecureContext,
                assistantState
              })
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
          
          {/* Settings button removed; open Settings from main UI */}
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
          <button 
            onClick={() => speak('Hello! This is a test of the voice assistant. Can you hear me?')} 
            className="quick-cmd"
            style={{backgroundColor: '#ff6b6b', color: 'white'}}
          >
            🔊 Test Voice
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