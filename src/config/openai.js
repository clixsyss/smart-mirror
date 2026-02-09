// OpenAI Configuration for Smart Mirror AI Assistant
// This file manages the OpenAI API configuration

export const OPENAI_CONFIG = {
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  model: 'gpt-4',
  lightweightModel: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 500,
  
  // TTS Configuration
  tts: {
    model: 'tts-1',
    voice: 'alloy', // alloy, echo, fable, onyx, nova, shimmer
    speed: 1.0
  },
  
  // STT Configuration
  stt: {
    model: 'whisper-1'
  }
}

// Check if OpenAI is properly configured
export const isOpenAIConfigured = () => {
  return !!(OPENAI_CONFIG.apiKey && OPENAI_CONFIG.apiKey !== 'your-openai-api-key-here')
}

// Available OpenAI TTS voices with descriptions
export const OPENAI_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced' },
  { id: 'echo', name: 'Echo', description: 'Warm and engaging' },
  { id: 'fable', name: 'Fable', description: 'Expressive and dynamic' },
  { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
  { id: 'nova', name: 'Nova', description: 'Friendly and energetic' },
  { id: 'shimmer', name: 'Shimmer', description: 'Soft and gentle' }
]
