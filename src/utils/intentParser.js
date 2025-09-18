// Intent Parser for Smart Home Voice Assistant
// This file contains all possible intents and natural language patterns the assistant can understand

export const SMART_HOME_INTENTS = {
  // Climate Control
  SET_TEMPERATURE: {
    patterns: [
      'set (the )?(.*) temperature to (.*)',
      'change (the )?(.*) temperature to (.*)',
      'make (the )?(.*) (hotter|colder|warmer|cooler) to (.*)',
      'adjust (the )?(.*) temperature to (.*)',
      '(increase|decrease) (the )?(.*) temperature to (.*)',
      'set (the )?(.*) (ac|air conditioner|air conditioning) to (.*)',
      'change (the )?(.*) (ac|air conditioner|air conditioning) to (.*)',
      'i want (the )?(.*) (hotter|colder|warmer|cooler) to (.*)',
      'can you set (the )?(.*) temperature to (.*)',
      'please set (the )?(.*) temperature to (.*)',
      'i\'d like (the )?(.*) temperature at (.*)',
      'make (the )?(.*) (.*) degrees',
      'cool (the )?(.*) to (.*)',
      'heat (the )?(.*) to (.*)',
      // Additional patterns for more natural language
      'i need (the )?(.*) (warmer|cooler)',
      '(.*) is too (hot|cold) in (the )?(.*)',
      'can you make (the )?(.*) (warmer|cooler)',
      'please adjust (the )?(.*) temperature',
      'i want (the )?(.*) at (.*) degrees',
      // Even more patterns
      'make it (.*) in (the )?(.*)',
      'i\'d like it (.*) in (the )?(.*)',
      'can you make it (.*) in (the )?(.*)',
      'please make it (.*) in (the )?(.*)',
      'i want it (.*) in (the )?(.*)',
      'set (.*) to (.*) degrees',
      'change (.*) to (.*) degrees',
      'adjust (.*) to (.*) degrees'
    ],
    action: 'set_temperature',
    parameters: ['room', 'temperature']
  },
  
  TURN_ON_AC: {
    patterns: [
      'turn on (the )?(.*) ac',
      'turn on (the )?(.*) air conditioning',
      'turn on (the )?(.*) air conditioner',
      'cool down (the )?(.*)',
      'make (the )?(.*) cooler',
      'i\'m hot in (the )?(.*)',
      'it\'s hot in (the )?(.*)',
      'activate (the )?(.*) ac',
      'start (the )?(.*) air conditioning',
      'can you turn on (the )?(.*) ac',
      'please turn on (the )?(.*) air conditioning',
      'i want the (the )?(.*) ac on',
      'switch on (the )?(.*) air conditioner',
      // Additional patterns
      'i need cooling in (the )?(.*)',
      'it\'s too hot in (the )?(.*)',
      'cool (the )?(.*) down',
      'start the ac in (the )?(.*)',
      // Even more patterns
      'cool (the )?(.*)',
      'turn on cooling in (the )?(.*)',
      'i want ac in (the )?(.*)',
      'i need ac in (the )?(.*)',
      'please cool (the )?(.*)',
      'make (the )?(.*) cold',
      'i want (the )?(.*) cold'
    ],
    action: 'turn_on_ac',
    parameters: ['room']
  },
  
  TURN_OFF_AC: {
    patterns: [
      'turn off (the )?(.*) ac',
      'turn off (the )?(.*) air conditioning',
      'turn off (the )?(.*) air conditioner',
      'stop (the )?(.*) ac',
      'i\'m cold in (the )?(.*)',
      'it\'s cold in (the )?(.*)',
      'deactivate (the )?(.*) ac',
      'shut off (the )?(.*) air conditioning',
      'can you turn off (the )?(.*) ac',
      'please turn off (the )?(.*) air conditioning',
      'i want the (the )?(.*) ac off',
      'switch off (the )?(.*) air conditioner',
      // Additional patterns
      'i don\'t need cooling in (the )?(.*)',
      'it\'s too cold in (the )?(.*)',
      'stop the ac in (the )?(.*)',
      'turn off cooling in (the )?(.*)',
      // Even more patterns
      'i don\'t want ac in (the )?(.*)',
      'stop cooling (the )?(.*)',
      'i want (the )?(.*) warm',
      'make (the )?(.*) warmer',
      'please warm up (the )?(.*)',
      'heat up (the )?(.*)'
    ],
    action: 'turn_off_ac',
    parameters: ['room']
  },
  
  // Lighting Control
  TURN_ON_LIGHTS: {
    patterns: [
      'turn on (the )?(.*) lights?',
      'turn on (the )?(.*) light',
      'lights? on in (the )?(.*)',
      'switch on (the )?(.*) lights?',
      'illuminate (the )?(.*)',
      'brighten (the )?(.*)',
      'i need light in (the )(.*)',
      'can you turn on (the )?(.*) lights?',
      'please turn on (the )?(.*) lights',
      'activate (the )?(.*) lights',
      'light up (the )?(.*)',
      'i want (the )?(.*) lights on',
      'enable (the )?(.*) lighting',
      'power on (the )?(.*) lights',
      // Additional patterns
      'i need more light in (the )?(.*)',
      'can you brighten (the )?(.*)',
      'please illuminate (the )?(.*)',
      'turn on the (lights? in )?(.*)',
      // Even more patterns
      'lights on',
      'turn on all lights',
      'i want light',
      'i need light',
      'please turn on the lights',
      'switch on all the lights in (the )?(.*)',
      'illuminate my (.*)( room)?',
      'brighten up (the )?(.*)',
      'can you light up (the )?(.*)',
      'make (the )?(.*) bright'
    ],
    action: 'turn_on_lights',
    parameters: ['room']
  },
  
  TURN_OFF_LIGHTS: {
    patterns: [
      'turn off (the )?(.*) lights?',
      'turn off (the )?(.*) light',
      'lights? off in (the )?(.*)',
      'switch off (the )?(.*) lights?',
      'darken (the )?(.*)',
      'i don\'t need light in (the )(.*)',
      'can you turn off (the )?(.*) lights?',
      'please turn off (the )?(.*) lights',
      'deactivate (the )?(.*) lights',
      'shut off (the )?(.*) lights',
      'i want (the )?(.*) lights off',
      'disable (the )?(.*) lighting',
      'power off (the )?(.*) lights',
      'put out (the )?(.*) lights',
      // Additional patterns
      'i don\'t need the lights in (the )?(.*)',
      'can you darken (the )?(.*)',
      'please turn off the (lights? in )?(.*)',
      'switch off the (lights? in )?(.*)',
      // Even more patterns
      'lights off',
      'turn off all lights',
      'i don\'t want light',
      'please turn off the lights',
      'switch off all the lights in (the )?(.*)',
      'darken my (.*)( room)?',
      'dim the lights in (the )?(.*)',
      'can you turn off the lights in (the )?(.*)',
      'make (the )?(.*) dark'
    ],
    action: 'turn_off_lights',
    parameters: ['room']
  },
  
  SET_LIGHT_BRIGHTNESS: {
    patterns: [
      '(dim|brighten) (the )?(.*) lights? to (.*)',
      'set (the )?(.*) brightness to (.*)',
      'adjust (the )?(.*) lights? to (.*) (brightness|percent)',
      'make (the )?(.*) lights? (.*)',
      'change (the )?(.*) light level to (.*)',
      'i want (the )?(.*) lights? (dimmer|brighter) to (.*)',
      'can you (dim|brighten) (the )?(.*) lights? to (.*)',
      'please set (the )?(.*) brightness to (.*)',
      'adjust (the )?(.*) lights? to (.*)%',
      'make (the )?(.*) (.*) percent brightness',
      // Additional patterns
      'set (the )?(.*) lights? to (.*) (brightness|percent)',
      'i want (the )?(.*) lights? at (.*) (brightness|percent)',
      'can you adjust (the )?(.*) lights? to (.*)',
      'please make (the )?(.*) lights? (.*)',
      // Even more patterns
      'make it (dimmer|brighter) in (the )?(.*)',
      'i want (the )?(.*) (dimmer|brighter)',
      'can you make (the )?(.*) (dimmer|brighter)',
      'please (dim|brighten) (the )?(.*)',
      'set (.*) brightness to (.*)',
      'adjust (.*) to (.*) (brightness|percent)'
    ],
    action: 'set_light_brightness',
    parameters: ['room', 'brightness']
  },
  
  // Routines
  GOOD_MORNING: {
    patterns: [
      'good morning',
      'wake up',
      'rise and shine',
      'start my day',
      'morning routine',
      'begin day',
      'day start',
      'hello morning',
      'morning time',
      'time to wake up',
      'it\'s morning',
      'new day',
      // Additional patterns
      'good morning assistant',
      'start the day',
      'begin my morning',
      'morning routine please',
      // Even more patterns
      'morning',
      'time to get up',
      'up and at them',
      'let\'s start the day',
      'begin today',
      'good morning to you',
      'hello good morning'
    ],
    action: 'good_morning',
    parameters: []
  },
  
  GOODNIGHT: {
    patterns: [
      'goodnight',
      'good night',
      'sleep',
      'bedtime',
      'turn everything off',
      'night routine',
      'end day',
      'day end',
      'lights out',
      'time for bed',
      'going to sleep',
      'bed time',
      'night night',
      'sleep well',
      // Additional patterns
      'goodnight assistant',
      'end my day',
      'night routine please',
      'time for sleep',
      // Even more patterns
      'night',
      'time to sleep',
      'bedtime now',
      'sleep time',
      'let\'s go to sleep',
      'end of day',
      'shut down for the night'
    ],
    action: 'goodnight',
    parameters: []
  },
  
  // Media Control
  PLAY_MUSIC: {
    patterns: [
      'play (.*)',
      'start playing (.*)',
      'put on (.*)',
      'i want to hear (.*)',
      'can you play (.*)',
      'please play (.*)',
      'play some (.*)',
      'i\'d like to listen to (.*)',
      'turn on (.*) music',
      'start (.*)',
      // Additional patterns
      'play music (.*)',
      'i want (.*) music',
      'can you put on (.*)',
      'please start (.*)',
      // Even more patterns
      'i want to listen to (.*)',
      'play something by (.*)',
      'can you play some (.*)',
      'please put on (.*)',
      'i\'d like to hear (.*)',
      'turn on some (.*)',
      'start some (.*) music'
    ],
    action: 'play_music',
    parameters: ['song']
  },
  
  STOP_MUSIC: {
    patterns: [
      'stop music',
      'pause music',
      'stop playing',
      'silence',
      'pause playback',
      'stop the music',
      'please stop the music',
      'turn off music',
      'music off',
      'stop this song',
      // Additional patterns
      'pause the music',
      'silence please',
      'stop playback',
      'turn off the music',
      // Even more patterns
      'stop the playback',
      'pause the playback',
      'silence the music',
      'i want silence',
      'please silence',
      'turn off the sound',
      'stop all music'
    ],
    action: 'stop_music',
    parameters: []
  },
  
  // Information Queries
  WEATHER_QUERY: {
    patterns: [
      'what.*weather',
      'how.*weather',
      'is it (hot|cold|rainy|sunny)',
      'will it (rain|snow|be sunny)',
      'what\'s the weather like',
      'tell me about the weather',
      'weather forecast',
      'is it going to rain',
      'what\'s it like outside',
      'is it nice out',
      'how\'s the weather today',
      'current weather',
      // Additional patterns
      'what\'s the forecast',
      'is it (warm|cool) today',
      'will it be (hot|cold)',
      'weather update please',
      // Even more patterns
      'what\'s the weather in (.*)',
      'how\'s it looking outside',
      'is it raining',
      'is it sunny',
      'what\'s the temperature',
      'how cold is it',
      'how hot is it'
    ],
    action: 'weather_query',
    parameters: []
  },
  
  TIME_QUERY: {
    patterns: [
      'what time.*',
      'tell me the time',
      'current time',
      'what.*clock',
      'time please',
      'what time is it',
      'do you have the time',
      'can you tell me the time',
      'i need to know the time',
      'what\'s the time right now',
      // Additional patterns
      'what\'s the current time',
      'tell me what time it is',
      'can you give me the time',
      'i need the time',
      // Even more patterns
      'what time is it right now',
      'tell me the current time',
      'can you check the time',
      'i want to know the time',
      'what\'s the time',
      'time check',
      'clock time'
    ],
    action: 'time_query',
    parameters: []
  },
  
  NEWS_QUERY: {
    patterns: [
      'what.*news',
      'tell me the news',
      'latest news',
      'what.*happening',
      'current events',
      'today\'s news',
      'news update',
      'any news today',
      'what\'s in the news',
      'show me the news',
      // Additional patterns
      'what\'s happening today',
      'tell me today\'s news',
      'i want the latest news',
      'news please',
      // Even more patterns
      'what\'s the news today',
      'tell me what\'s happening',
      'any current events',
      'what\'s going on',
      'current headlines',
      'today\'s headlines',
      'latest headlines'
    ],
    action: 'news_query',
    parameters: []
  },
  
  // Device Status
  DEVICE_STATUS: {
    patterns: [
      'what.*on',
      'what.*off',
      'device status',
      'which.*on',
      'which.*off',
      'show me device status',
      'what devices are active',
      'which devices are running',
      'check device status',
      'are any devices on',
      'status of my devices',
      'what\'s turned on',
      // Additional patterns
      'which devices are active',
      'show me what\'s on',
      'device status please',
      'check my devices',
      // Even more patterns
      'what\'s currently on',
      'which devices are currently active',
      'show me active devices',
      'check what\'s running',
      'are there any devices on',
      'what\'s the status of my devices',
      'device report'
    ],
    action: 'device_status',
    parameters: []
  },
  
  // Security System
  ARM_SECURITY: {
    patterns: [
      'arm security',
      'activate security system',
      'turn on security',
      'enable alarm',
      'set alarm',
      'secure the house',
      'lock up',
      'i\'m leaving',
      'activate alarm',
      'security on',
      // Additional patterns
      'i\'m going out',
      'secure the home',
      'activate home security',
      'turn on the alarm',
      // Even more patterns
      'i\'m leaving the house',
      'activate the security system',
      'set the alarm',
      'lock the house',
      'secure everything',
      'i\'m out of here',
      'activate protection'
    ],
    action: 'arm_security',
    parameters: []
  },
  
  DISARM_SECURITY: {
    patterns: [
      'disarm security',
      'deactivate security system',
      'turn off security',
      'disable alarm',
      'unset alarm',
      'unlock the house',
      'i\'m home',
      'deactivate alarm',
      'security off',
      // Additional patterns
      'i\'m back home',
      'deactivate home security',
      'turn off the alarm',
      'unlock the home',
      // Even more patterns
      'i\'m back',
      'deactivate the security system',
      'unset the alarm',
      'unlock everything',
      'i\'m home now',
      'deactivate protection',
      'turn off protection'
    ],
    action: 'disarm_security',
    parameters: []
  },
  
  // Curtain Control
  OPEN_CURTAINS: {
    patterns: [
      'open (the )?(.*) curtains?',
      'open (the )?(.*) blinds?',
      'pull back (the )?(.*) curtains?',
      'draw (the )?(.*) curtains?',
      'can you open (the )?(.*) curtains?',
      'please open (the )?(.*) curtains',
      'i want (the )?(.*) curtains open',
      'let in light in (the )?(.*)',
      'open up (the )?(.*)',
      // Additional patterns
      'open the (curtains? in )?(.*)',
      'pull (the )?(.*) curtains open',
      'draw (the )?(.*) curtains back',
      'let light in (the )?(.*)',
      // Even more patterns
      'open (the )?(.*) window coverings',
      'pull back (the )?(.*) blinds',
      'draw (the )?(.*) drapes',
      'let in (the )?(.*) light',
      'open (the )?(.*) shades',
      'please pull (the )?(.*) curtains open'
    ],
    action: 'open_curtains',
    parameters: ['room']
  },
  
  CLOSE_CURTAINS: {
    patterns: [
      'close (the )?(.*) curtains?',
      'close (the )?(.*) blinds?',
      'pull (the )?(.*) curtains?',
      'draw (the )?(.*) curtains closed?',
      'can you close (the )?(.*) curtains?',
      'please close (the )?(.*) curtains',
      'i want (the )?(.*) curtains closed',
      'block out light in (the )?(.*)',
      'shut (the )?(.*) curtains',
      // Additional patterns
      'close the (curtains? in )?(.*)',
      'pull (the )?(.*) curtains closed',
      'draw (the )?(.*) curtains shut',
      'block the light in (the )?(.*)',
      // Even more patterns
      'close (the )?(.*) window coverings',
      'pull (the )?(.*) blinds closed',
      'draw (the )?(.*) drapes closed',
      'block out (the )?(.*) light',
      'close (the )?(.*) shades',
      'please pull (the )?(.*) curtains closed'
    ],
    action: 'close_curtains',
    parameters: ['room']
  },
  
  // Shutter Control
  OPEN_SHUTTERS: {
    patterns: [
      'open (the )?(.*) shutters?',
      'raise (the )?(.*) shutters?',
      'lift (the )?(.*) shutters?',
      'can you open (the )?(.*) shutters?',
      'please open (the )?(.*) shutters',
      'i want (the )?(.*) shutters open',
      'open up (the )?(.*) shutters',
      // Additional patterns
      'open the (shutters? in )?(.*)',
      'raise the (shutters? in )?(.*)',
      'lift the (shutters? in )?(.*)',
      // Even more patterns
      'raise (the )?(.*) window shutters',
      'lift (the )?(.*) the shutters',
      'open (the )?(.*) the window coverings',
      'please raise (the )?(.*) shutters',
      'i want (the )?(.*) shutters raised'
    ],
    action: 'open_shutters',
    parameters: ['room']
  },
  
  CLOSE_SHUTTERS: {
    patterns: [
      'close (the )?(.*) shutters?',
      'lower (the )?(.*) shutters?',
      'drop (the )?(.*) shutters?',
      'can you close (the )?(.*) shutters?',
      'please close (the )?(.*) shutters',
      'i want (the )?(.*) shutters closed',
      'shut (the )?(.*) shutters',
      // Additional patterns
      'close the (shutters? in )?(.*)',
      'lower the (shutters? in )?(.*)',
      'drop the (shutters? in )?(.*)',
      // Even more patterns
      'lower (the )?(.*) window shutters',
      'drop (the )?(.*) the shutters',
      'close (the )?(.*) the window coverings',
      'please lower (the )?(.*) shutters',
      'i want (the )?(.*) shutters lowered'
    ],
    action: 'close_shutters',
    parameters: ['room']
  },
  
  // Fan Control
  TURN_ON_FAN: {
    patterns: [
      'turn on (the )?(.*) fan',
      'turn on (the )?(.*) fans',
      'start (the )?(.*) fan',
      'can you turn on (the )?(.*) fan',
      'please turn on (the )?(.*) fan',
      'i want (the )?(.*) fan on',
      'switch on (the )?(.*) fan',
      // Additional patterns
      'turn on the (fan in )?(.*)',
      'start the (fan in )?(.*)',
      'i need the (fan in )?(.*) on',
      // Even more patterns
      'turn on (the )?(.*) ventilator',
      'start (the )?(.*) air circulator',
      'i want (the )?(.*) air flow',
      'please start (the )?(.*) fan',
      'switch on (the )?(.*) ventilation',
      'activate (the )?(.*) fan'
    ],
    action: 'turn_on_fan',
    parameters: ['room']
  },
  
  TURN_OFF_FAN: {
    patterns: [
      'turn off (the )?(.*) fan',
      'turn off (the )?(.*) fans',
      'stop (the )?(.*) fan',
      'can you turn off (the )?(.*) fan',
      'please turn off (the )?(.*) fan',
      'i want (the )?(.*) fan off',
      'switch off (the )?(.*) fan',
      // Additional patterns
      'turn off the (fan in )?(.*)',
      'stop the (fan in )?(.*)',
      'i want the (fan in )?(.*) off',
      // Even more patterns
      'turn off (the )?(.*) ventilator',
      'stop (the )?(.*) air circulator',
      'i don\'t want (the )?(.*) air flow',
      'please stop (the )?(.*) fan',
      'switch off (the )?(.*) ventilation',
      'deactivate (the )?(.*) fan'
    ],
    action: 'turn_off_fan',
    parameters: ['room']
  },
  
  // New intents for enhanced functionality
  SET_FAN_SPEED: {
    patterns: [
      '(set|change|adjust) (the )?(.*) fan (speed|level) to (.*)',
      'make (the )?(.*) fan (.*)',
      'i want (the )?(.*) fan at (.*) (speed|level)',
      'can you (set|change|adjust) (the )?(.*) fan to (.*)',
      'please (set|change|adjust) (the )?(.*) fan (speed|level)',
      // Even more patterns
      '(increase|decrease) (the )?(.*) fan (speed|level) to (.*)',
      'make (the )?(.*) fan (faster|slower)',
      'i want (the )?(.*) fan (faster|slower)',
      'can you make (the )?(.*) fan (faster|slower)',
      'please make (the )?(.*) fan (faster|slower)',
      'set (.*) fan speed to (.*)',
      'adjust (.*) fan level to (.*)'
    ],
    action: 'set_fan_speed',
    parameters: ['room', 'speed']
  },
  
  LOCK_DOOR: {
    patterns: [
      'lock (the )?(.*) door',
      'secure (the )?(.*) door',
      'close and lock (the )?(.*) door',
      'please lock (the )?(.*) door',
      'can you lock (the )?(.*) door',
      'i want (the )?(.*) door locked',
      // Even more patterns
      'lock up (the )?(.*)',
      'secure (the )?(.*) entrance',
      'please secure (the )?(.*) door',
      'can you close and lock (the )?(.*)',
      'i want (the )?(.*) secured',
      'lock the (.*)( door)?'
    ],
    action: 'lock_door',
    parameters: ['room']
  },
  
  UNLOCK_DOOR: {
    patterns: [
      'unlock (the )?(.*) door',
      'open (the )?(.*) door',
      'please unlock (the )?(.*) door',
      'can you unlock (the )?(.*) door',
      'i want (the )?(.*) door unlocked',
      // Even more patterns
      'unlock (the )?(.*) entrance',
      'open up (the )?(.*)',
      'please open (the )?(.*) door',
      'can you open (the )?(.*)',
      'i want (the )?(.*) opened',
      'unlock the (.*)( door)?'
    ],
    action: 'unlock_door',
    parameters: ['room']
  },
  
  VOLUME_UP: {
    patterns: [
      '(turn up|increase|raise) (the )?(.*) volume',
      'make (the )?(.*) louder',
      'i want (the )?(.*) louder',
      'please (turn up|increase|raise) (the )?(.*) volume',
      'can you make (the )?(.*) louder',
      // Even more patterns
      '(turn up|increase|raise) the sound in (the )?(.*)',
      'make (the )?(.*) sound louder',
      'i want (the )?(.*) sound increased',
      'please (turn up|increase|raise) (the )?(.*) audio',
      'can you make (the )?(.*) audio louder',
      'increase (.*) volume'
    ],
    action: 'volume_up',
    parameters: ['room']
  },
  
  VOLUME_DOWN: {
    patterns: [
      '(turn down|decrease|lower) (the )?(.*) volume',
      'make (the )?(.*) quieter',
      'i want (the )?(.*) quieter',
      'please (turn down|decrease|lower) (the )?(.*) volume',
      'can you make (the )?(.*) quieter',
      // Even more patterns
      '(turn down|decrease|lower) the sound in (the )?(.*)',
      'make (the )?(.*) sound quieter',
      'i want (the )?(.*) sound decreased',
      'please (turn down|decrease|lower) (the )?(.*) audio',
      'can you make (the )?(.*) audio quieter',
      'decrease (.*) volume'
    ],
    action: 'volume_down',
    parameters: ['room']
  },
  
  MUTE: {
    patterns: [
      'mute (the )?(.*)',
      'silence (the )?(.*)',
      'turn off (the )?(.*) sound',
      'please mute (the )?(.*)',
      'can you silence (the )?(.*)',
      // Even more patterns
      'mute the sound in (the )?(.*)',
      'silence the audio in (the )?(.*)',
      'turn off (the )?(.*) audio',
      'please silence (the )?(.*)',
      'can you mute (the )?(.*) sound',
      'mute (.*)'
    ],
    action: 'mute',
    parameters: ['room']
  },
  
  UNMUTE: {
    patterns: [
      'unmute (the )?(.*)',
      'un silence (the )?(.*)',
      'turn on (the )?(.*) sound',
      'please unmute (the )?(.*)',
      'can you un silence (the )?(.*)',
      // Even more patterns
      'unmute the sound in (the )?(.*)',
      'un silence the audio in (the )?(.*)',
      'turn on (the )?(.*) audio',
      'please un silence (the )?(.*)',
      'can you unmute (the )?(.*) sound',
      'unmute (.*)'
    ],
    action: 'unmute',
    parameters: ['room']
  }
};

// Enhanced room names including person-named rooms
export const ROOM_NAMES = [
  'living room', 'bedroom', 'kitchen', 'bathroom', 'office', 
  'garage', 'basement', 'attic', 'dining room', 'hallway',
  'entrance', 'foyer', 'master bedroom', 'guest room', 'kids room',
  'nursery', 'playroom', 'media room', 'home theater', 'library',
  'study', 'pantry', 'laundry room', 'mudroom', 'sunroom',
  'patio', 'deck', 'porch', 'balcony', 'backyard', 'front yard',
  'garden', 'pool area', 'workshop', 'storage room',
  // Person-named rooms
  'john\'s room', 'jane\'s room', 'mike\'s room', 'sarah\'s room',
  'alex\'s room', 'emma\'s room', 'david\'s room', 'lisa\'s room',
  'chris\'s room', 'anna\'s room', 'robert\'s room', 'maria\'s room',
  'james\'s room', 'jennifer\'s room', 'michael\'s room', 'elizabeth\'s room',
  'william\'s room', 'sophia\'s room', 'thomas\'s room', 'olivia\'s room',
  // Additional person-named rooms
  'tom\'s room', 'lucy\'s room', 'peter\'s room', 'claire\'s room',
  'steve\'s room', 'amy\'s room', 'kevin\'s room', 'laura\'s room',
  'brian\'s room', 'sara\'s room', 'nathan\'s room', 'karen\'s room',
  'ryan\'s room', 'melissa\'s room', 'jason\'s room', 'rachel\'s room',
  'adam\'s room', 'nicole\'s room', 'eric\'s room', 'vanessa\'s room',
  'patrick\'s room', 'diana\'s room', 'greg\'s room', 'monica\'s room',
  'philip\'s room', 'carol\'s room', 'derek\'s room', 'janet\'s room',
  'marcus\'s room', 'theresa\'s room', 'vincent\'s room', 'helen\'s room'
];

// Device types for pattern matching
export const DEVICE_TYPES = [
  'light', 'lights', 'lamp', 'lamps', 'bulb', 'bulbs',
  'ac', 'air conditioner', 'air conditioning', 'heater', 'fan', 'fans',
  'tv', 'television', 'sound system', 'speaker', 'speakers',
  'curtain', 'curtains', 'blind', 'blinds', 'shutter', 'shutters',
  'security system', 'alarm', 'camera', 'cameras',
  // Additional device types
  'thermostat', 'ventilator', 'window', 'door', 'lock',
  'volume control', 'audio system', 'music system'
];

// Common temperature expressions
export const TEMPERATURE_EXPRESSIONS = {
  'really hot': 28,
  'hot': 26,
  'warm': 24,
  'comfortable': 22,
  'cool': 20,
  'cold': 18,
  'really cold': 16,
  'freezing': 15,
  'chilly': 19,
  'pleasant': 23,
  // Additional temperature expressions
  'scorching': 30,
  'sweltering': 29,
  'toasty': 27,
  'mild': 21,
  'refreshing': 17,
  'icy': 14,
  'frigid': 12
};

// Common brightness expressions
export const BRIGHTNESS_EXPRESSIONS = {
  'really bright': 100,
  'bright': 80,
  'normal': 60,
  'dim': 40,
  'dark': 20,
  'really dark': 10,
  'full': 100,
  'medium': 50,
  'low': 30,
  // Additional brightness expressions
  'very bright': 90,
  'well lit': 70,
  'moderate': 55,
  'somewhat dim': 35,
  'very dark': 15,
  'barely lit': 25,
  'completely dark': 0
};

/**
 * Parse user input and extract intent
 * @param {string} input - User voice command
 * @returns {object} Parsed intent with action and parameters
 */
export function parseIntent(input) {
  const lowerInput = input.toLowerCase().trim();
  
  // Try to match each intent pattern
  for (const [intentName, intent] of Object.entries(SMART_HOME_INTENTS)) {
    for (const pattern of intent.patterns) {
      // Convert pattern to regex
      const regexPattern = pattern
        .replace(/\(.*?\)/g, '') // Remove optional groups
        .replace(/\*/g, '(.*)') // Convert * to capture group
        .replace(/\?/g, '\\?') // Escape question marks
        .replace(/\./g, '\\.') // Escape periods
        .trim();
      
      const regex = new RegExp(regexPattern, 'i');
      const match = lowerInput.match(regex);
      
      if (match) {
        // Extract parameters
        const params = {};
        if (intent.parameters.includes('room')) {
          // Try to find room name in the input
          const room = findRoomInText(lowerInput);
          if (room) params.room = room;
        }
        
        if (intent.parameters.includes('temperature')) {
          // Extract temperature value
          const temp = extractTemperature(lowerInput);
          if (temp) params.temperature = temp;
        }
        
        if (intent.parameters.includes('brightness')) {
          // Extract brightness value
          const brightness = extractBrightness(lowerInput);
          if (brightness) params.brightness = brightness;
        }
        
        if (intent.parameters.includes('song')) {
          // Extract song name (everything after "play")
          const playIndex = lowerInput.indexOf('play');
          if (playIndex !== -1) {
            params.song = input.substring(playIndex + 5).trim();
          }
        }
        
        return {
          intent: intentName,
          action: intent.action,
          parameters: params,
          confidence: match.length > 1 ? 0.95 : 0.85 // Higher confidence if we captured groups
        };
      }
    }
  }
  
  // If no specific intent matched, return unknown intent
  return {
    intent: 'UNKNOWN',
    action: 'unknown',
    parameters: {},
    confidence: 0.1
  };
}

/**
 * Find room name in text
 * @param {string} text - Input text
 * @returns {string|null} Room name or null
 */
function findRoomInText(text) {
  for (const room of ROOM_NAMES) {
    if (text.includes(room)) {
      return room;
    }
  }
  return null;
}

/**
 * Extract temperature from text
 * @param {string} text - Input text
 * @returns {number|null} Temperature value or null
 */
function extractTemperature(text) {
  // Check for named temperatures first
  for (const [expression, value] of Object.entries(TEMPERATURE_EXPRESSIONS)) {
    if (text.includes(expression)) {
      return value;
    }
  }
  
  // Look for numeric temperature values
  const tempMatch = text.match(/(\d{1,3})\s*(degrees?|°)?\s*(c|f)?/i);
  if (tempMatch) {
    return parseInt(tempMatch[1]);
  }
  
  return null;
}

/**
 * Extract brightness from text
 * @param {string} text - Input text
 * @returns {number|null} Brightness value or null
 */
function extractBrightness(text) {
  // Check for named brightness levels first
  for (const [expression, value] of Object.entries(BRIGHTNESS_EXPRESSIONS)) {
    if (text.includes(expression)) {
      return value;
    }
  }
  
  // Look for numeric brightness values
  const brightnessMatch = text.match(/(\d{1,3})\s*%?/i);
  if (brightnessMatch) {
    let value = parseInt(brightnessMatch[1]);
    // Ensure value is between 0-100
    if (value > 100) value = 100;
    if (value < 0) value = 0;
    return value;
  }
  
  return null;
}

/**
 * Generate response based on intent
 * @param {object} intent - Parsed intent
 * @returns {string} Natural language response
 */
export function generateResponse(intent) {
  const responses = {
    SET_TEMPERATURE: [
      "I'll set the temperature for you.",
      "Adjusting the temperature now.",
      "Changing the temperature to your preference.",
      "Setting the climate control to your desired temperature.",
      "I'm adjusting the temperature for you.",
      "Temperature updated successfully."
    ],
    TURN_ON_AC: [
      "Turning on the air conditioning.",
      "Cooling down the room for you.",
      "Activating the air conditioner.",
      "I'll make the room cooler for you.",
      "Air conditioning is now on.",
      "Cooling system activated."
    ],
    TURN_OFF_AC: [
      "Turning off the air conditioning.",
      "Deactivating the air conditioner.",
      "Switching off the AC.",
      "I'll stop the cooling for you.",
      "Air conditioning is now off.",
      "Cooling system deactivated."
    ],
    TURN_ON_LIGHTS: [
      "Turning on the lights.",
      "Illuminating the room for you.",
      "Activating the lights.",
      "Brightening up the space for you.",
      "Lights are now on.",
      "I've turned on the lighting."
    ],
    TURN_OFF_LIGHTS: [
      "Turning off the lights.",
      "Darkening the room for you.",
      "Deactivating the lights.",
      "Dimming the lights for you.",
      "Lights are now off.",
      "I've turned off the lighting."
    ],
    SET_LIGHT_BRIGHTNESS: [
      "Adjusting the light brightness.",
      "Setting the lights to your preference.",
      "Changing the brightness level.",
      "Modifying the light intensity for you.",
      "Brightness adjusted successfully.",
      "Light level updated."
    ],
    GOOD_MORNING: [
      "Good morning! I'm turning on the lights and adjusting the temperature for you.",
      "Rise and shine! Getting your day started.",
      "Morning! I'm preparing your space for the day ahead.",
      "Good morning! I'm setting up your morning routine.",
      "Hello! It's time to wake up. I'm preparing your environment.",
      "Good morning! I'm making everything ready for your day."
    ],
    GOODNIGHT: [
      "Goodnight! I'm turning off the lights and setting the temperature for sleep.",
      "Sleep well! I'm preparing your space for rest.",
      "Sweet dreams! I'm making everything cozy for the night.",
      "Goodnight! I'm securing your home for the night.",
      "Rest well! I'm turning everything off for you.",
      "Night night! I'm setting the perfect environment for sleep."
    ],
    PLAY_MUSIC: [
      "Playing music for you.",
      "Starting your music now.",
      "I'll put on some tunes.",
      "Music playback started.",
      "I'm playing your requested music.",
      "Enjoy your music!"
    ],
    STOP_MUSIC: [
      "Stopping the music.",
      "Pausing playback.",
      "Silencing the speakers.",
      "Music playback stopped.",
      "I've stopped the music for you.",
      "Music paused."
    ],
    WEATHER_QUERY: [
      "Let me check the weather for you.",
      "I'll get the current weather information.",
      "Checking the weather conditions now.",
      "Retrieving weather data for you.",
      "I'm looking up the current weather.",
      "Getting weather information."
    ],
    TIME_QUERY: [
      "The current time is...",
      "It's currently...",
      "The time is...",
      "Checking the current time for you.",
      "I'll tell you the time.",
      "Current time: ..."
    ],
    NEWS_QUERY: [
      "Here are the latest news headlines.",
      "I'll share the latest news with you.",
      "Getting today's news for you.",
      "Retrieving current news updates.",
      "I'm fetching the latest news.",
      "Here's what's happening today."
    ],
    DEVICE_STATUS: [
      "Here's the status of your devices.",
      "Let me check what's on and off.",
      "I'll show you the current device status.",
      "Retrieving device status information.",
      "Checking device statuses for you.",
      "Here's what's currently active."
    ],
    ARM_SECURITY: [
      "Arming the security system.",
      "Activating security for your home.",
      "Security system is now armed.",
      "Home security is now active.",
      "I'm securing your home.",
      "Security activated."
    ],
    DISARM_SECURITY: [
      "Disarming the security system.",
      "Deactivating security for your home.",
      "Security system is now disarmed.",
      "Home security is now inactive.",
      "I'm disarming your security system.",
      "Security deactivated."
    ],
    OPEN_CURTAINS: [
      "Opening the curtains for you.",
      "I'm drawing back the curtains.",
      "Letting in the light for you.",
      "Curtains are now open.",
      "I've opened the curtains.",
      "Light is coming in."
    ],
    CLOSE_CURTAINS: [
      "Closing the curtains for you.",
      "I'm drawing the curtains closed.",
      "Blocking out the light for you.",
      "Curtains are now closed.",
      "I've closed the curtains.",
      "Privacy secured."
    ],
    OPEN_SHUTTERS: [
      "Opening the shutters for you.",
      "I'm raising the shutters.",
      "Letting in fresh air and light.",
      "Shutters are now open.",
      "I've opened the shutters.",
      "Enjoy the outdoors!"
    ],
    CLOSE_SHUTTERS: [
      "Closing the shutters for you.",
      "I'm lowering the shutters.",
      "Securing your space for privacy.",
      "Shutters are now closed.",
      "I've closed the shutters.",
      "Your space is now private."
    ],
    TURN_ON_FAN: [
      "Turning on the fan for you.",
      "I'm starting the fan.",
      "Creating a breeze for you.",
      "Fan is now on.",
      "I've turned on the fan.",
      "Cool air coming your way."
    ],
    TURN_OFF_FAN: [
      "Turning off the fan for you.",
      "I'm stopping the fan.",
      "Fan is now off.",
      "I've turned off the fan.",
      "The breeze has stopped.",
      "Fan deactivated."
    ],
    // New responses for enhanced functionality
    SET_FAN_SPEED: [
      "Adjusting the fan speed for you.",
      "Setting the fan to your preferred speed.",
      "Changing the fan speed now.",
      "Fan speed updated successfully.",
      "I'm adjusting the airflow for you.",
      "Fan level changed."
    ],
    LOCK_DOOR: [
      "Locking the door for you.",
      "Securing the door.",
      "Door is now locked.",
      "I've locked the door.",
      "Security enhanced.",
      "Door secured."
    ],
    UNLOCK_DOOR: [
      "Unlocking the door for you.",
      "Opening the door.",
      "Door is now unlocked.",
      "I've unlocked the door.",
      "Access granted.",
      "Door unlocked."
    ],
    VOLUME_UP: [
      "Turning up the volume.",
      "Increasing the sound level.",
      "Making it louder for you.",
      "Volume increased.",
      "Sound level raised.",
      "Louder now."
    ],
    VOLUME_DOWN: [
      "Turning down the volume.",
      "Decreasing the sound level.",
      "Making it quieter for you.",
      "Volume decreased.",
      "Sound level lowered.",
      "Quieter now."
    ],
    MUTE: [
      "Muting the sound.",
      "Silencing the audio.",
      "Sound is now muted.",
      "I've muted the audio.",
      "Audio muted.",
      "Silence activated."
    ],
    UNMUTE: [
      "Unmuting the sound.",
      "Restoring the audio.",
      "Sound is now on.",
      "I've unmuted the audio.",
      "Audio restored.",
      "Sound activated."
    ],
    UNKNOWN: [
      "I'm not sure how to help with that. Could you rephrase?",
      "I didn't understand that command. Try something else?",
      "I'm still learning. Can you try a different command?",
      "I'm not familiar with that request. Can you try again?",
      "I'm not sure what you mean. Could you be more specific?",
      "Hmm, I don't know how to do that. Can you ask differently?"
    ]
  };
  
  const intentResponses = responses[intent.intent] || responses.UNKNOWN;
  const randomIndex = Math.floor(Math.random() * intentResponses.length);
  return intentResponses[randomIndex];
}

export default {
  SMART_HOME_INTENTS,
  parseIntent,
  generateResponse
};