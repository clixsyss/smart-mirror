// Voice Settings Configuration for Smart Home Assistant

// Available voices grouped by type
export const VOICE_OPTIONS = {
  // Female voices
  female: [
    {
      id: 'female-google-us',
      name: 'Google US English Female',
      lang: 'en-US',
      gender: 'female',
      provider: 'Google',
      description: 'Natural sounding American English female voice'
    },
    {
      id: 'female-microsoft-us',
      name: 'Microsoft US English Female',
      lang: 'en-US',
      gender: 'female',
      provider: 'Microsoft',
      description: 'Clear American English female voice'
    },
    {
      id: 'female-siri',
      name: 'Siri (iOS)',
      lang: 'en-US',
      gender: 'female',
      provider: 'Apple',
      description: 'Familiar Siri voice'
    },
    {
      id: 'female-uk',
      name: 'British English Female',
      lang: 'en-GB',
      gender: 'female',
      provider: 'Google',
      description: 'Proper British English female voice'
    },
    {
      id: 'female-australian',
      name: 'Australian English Female',
      lang: 'en-AU',
      gender: 'female',
      provider: 'Google',
      description: 'Australian English female voice'
    },
    {
      id: 'female-indian',
      name: 'Indian English Female',
      lang: 'en-IN',
      gender: 'female',
      provider: 'Google',
      description: 'Indian English female voice'
    },
    {
      id: 'female-canadian',
      name: 'Canadian English Female',
      lang: 'en-CA',
      gender: 'female',
      provider: 'Google',
      description: 'Canadian English female voice'
    }
  ],
  
  // Male voices
  male: [
    {
      id: 'male-google-us',
      name: 'Google US English Male',
      lang: 'en-US',
      gender: 'male',
      provider: 'Google',
      description: 'Natural sounding American English male voice'
    },
    {
      id: 'male-microsoft-us',
      name: 'Microsoft US English Male',
      lang: 'en-US',
      gender: 'male',
      provider: 'Microsoft',
      description: 'Clear American English male voice'
    },
    {
      id: 'male-siri',
      name: 'Siri Male (iOS)',
      lang: 'en-US',
      gender: 'male',
      provider: 'Apple',
      description: 'Siri male voice'
    },
    {
      id: 'male-uk',
      name: 'British English Male',
      lang: 'en-GB',
      gender: 'male',
      provider: 'Google',
      description: 'Proper British English male voice'
    },
    {
      id: 'male-australian',
      name: 'Australian English Male',
      lang: 'en-AU',
      gender: 'male',
      provider: 'Google',
      description: 'Australian English male voice'
    },
    {
      id: 'male-indian',
      name: 'Indian English Male',
      lang: 'en-IN',
      gender: 'male',
      provider: 'Google',
      description: 'Indian English male voice'
    },
    {
      id: 'male-canadian',
      name: 'Canadian English Male',
      lang: 'en-CA',
      gender: 'male',
      provider: 'Google',
      description: 'Canadian English male voice'
    }
  ],
  
  // Premium OpenAI voices
  openai: [
    {
      id: 'premium-alloy',
      name: 'Alloy - Balanced & Clear',
      lang: 'en-US',
      gender: 'neutral',
      provider: 'OpenAI',
      description: 'Neutral and clear, great for UIs'
    },
    {
      id: 'premium-echo',
      name: 'Echo - Warm & Human',
      lang: 'en-US',
      gender: 'male',
      provider: 'OpenAI',
      description: 'Warm and human-like, great for narration'
    },
    {
      id: 'premium-fable',
      name: 'Fable - Expressive & Deep',
      lang: 'en-US',
      gender: 'male',
      provider: 'OpenAI',
      description: 'Deep and expressive, great for storytelling'
    },
    {
      id: 'premium-onyx',
      name: 'Onyx - Deep & Smooth',
      lang: 'en-US',
      gender: 'male',
      provider: 'OpenAI',
      description: 'Smooth and deep, great for media'
    },
    {
      id: 'premium-nova',
      name: 'Nova - Warm & Clear',
      lang: 'en-US',
      gender: 'female',
      provider: 'OpenAI',
      description: 'Warm and clear, great for customer support'
    },
    {
      id: 'premium-shimmer',
      name: 'Shimmer - Clear & Soft',
      lang: 'en-US',
      gender: 'female',
      provider: 'OpenAI',
      description: 'Clear and soft, great for marketing'
    }
  ],

  // Neutral/robotic voices
  neutral: [
    {
      id: 'neutral-google',
      name: 'Google Neutral',
      lang: 'en-US',
      gender: 'neutral',
      provider: 'Google',
      description: 'Standard neutral voice'
    },
    {
      id: 'neutral-compact',
      name: 'Compact Voice',
      lang: 'en-US',
      gender: 'neutral',
      provider: 'System',
      description: 'Lightweight voice for low-end devices'
    },
    {
      id: 'neutral-robot',
      name: 'Robot Voice',
      lang: 'en-US',
      gender: 'neutral',
      provider: 'System',
      description: 'Robotic sounding voice'
    },
    {
      id: 'neutral-echo',
      name: 'Echo Voice',
      lang: 'en-US',
      gender: 'neutral',
      provider: 'System',
      description: 'Voice with echo effect'
    }
  ]
};

// Default voice settings
export const DEFAULT_VOICE_SETTINGS = {
  voiceId: 'female-google-us',
  rate: 1.0,      // 0.1 - 10.0 (1.0 is normal)
  pitch: 1.0,     // 0.0 - 2.0 (1.0 is normal)
  volume: 0.8,    // 0.0 - 1.0 (1.0 is loudest)
  lang: 'en-US'
};

// Speech synthesis configuration
export const SPEECH_CONFIG = {
  // Rate settings
  minRate: 0.5,
  maxRate: 2.0,
  defaultRate: 1.0,
  
  // Pitch settings
  minPitch: 0.5,
  maxPitch: 1.5,
  defaultPitch: 1.0,
  
  // Volume settings
  minVolume: 0.0,
  maxVolume: 1.0,
  defaultVolume: 0.8
};

/**
 * Get available voices from the browser
 * @returns {Promise<Array>} Array of available voices
 */
export async function getAvailableVoices() {
  return new Promise((resolve) => {
    // Check if voices are already loaded
    if (speechSynthesis.getVoices().length > 0) {
      resolve(speechSynthesis.getVoices());
      return;
    }
    
    // Wait for voices to load
    speechSynthesis.onvoiceschanged = () => {
      resolve(speechSynthesis.getVoices());
    };
    
    // Timeout fallback
    setTimeout(() => {
      resolve(speechSynthesis.getVoices());
    }, 3000);
  });
}

/**
 * Find voice by ID or fallback to preferred voice
 * @param {Array} voices - Available voices
 * @param {string} voiceId - Desired voice ID
 * @param {string} fallbackGender - Fallback gender preference
 * @returns {SpeechSynthesisVoice} Selected voice
 */
export function findVoice(voices, voiceId, fallbackGender = 'female') {
  // Try to find exact match
  let voice = voices.find(v => v.voiceURI === voiceId);
  
  if (voice) {
    return voice;
  }
  
  // Try to find by name match
  const voiceConfig = Object.values(VOICE_OPTIONS)
    .flat()
    .find(v => v.id === voiceId);
  
  if (voiceConfig) {
    // Look for voice with similar name
    voice = voices.find(v => 
      v.name.toLowerCase().includes(voiceConfig.name.toLowerCase().split(' ')[0]) ||
      v.lang === voiceConfig.lang
    );
  }
  
  // Fallback to gender preference
  if (!voice) {
    voice = voices.find(v => 
      v.name.toLowerCase().includes(fallbackGender) ||
      (!v.name.toLowerCase().includes('male') && fallbackGender === 'female')
    );
  }
  
  // Final fallback to first available voice
  return voice || voices[0];
}

/**
 * Apply voice settings to utterance
 * @param {SpeechSynthesisUtterance} utterance - The utterance to configure
 * @param {Object} settings - Voice settings
 * @param {Array} availableVoices - Available voices
 */
export function applyVoiceSettings(utterance, settings, availableVoices) {
  if (!utterance || !settings) return;
  
  // Apply voice
  if (availableVoices && availableVoices.length > 0) {
    const voice = findVoice(availableVoices, settings.voiceId, 'female');
    if (voice) {
      utterance.voice = voice;
    }
  }
  
  // Apply other settings
  utterance.rate = Math.max(SPEECH_CONFIG.minRate, 
    Math.min(SPEECH_CONFIG.maxRate, settings.rate || SPEECH_CONFIG.defaultRate));
    
  utterance.pitch = Math.max(SPEECH_CONFIG.minPitch, 
    Math.min(SPEECH_CONFIG.maxPitch, settings.pitch || SPEECH_CONFIG.defaultPitch));
    
  utterance.volume = Math.max(SPEECH_CONFIG.minVolume, 
    Math.min(SPEECH_CONFIG.maxVolume, settings.volume || SPEECH_CONFIG.defaultVolume));
    
  utterance.lang = settings.lang || 'en-US';
}

export default {
  VOICE_OPTIONS,
  DEFAULT_VOICE_SETTINGS,
  SPEECH_CONFIG,
  getAvailableVoices,
  findVoice,
  applyVoiceSettings
};