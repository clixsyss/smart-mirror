import { useState, useRef, useEffect } from 'react'
import './ChatGPTAssistant.css'

const ChatGPTAssistant = ({ data, actions }) => {
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const speechSynthesis = useRef(window.speechSynthesis)
  
  const { messages = [], isTyping = false, isRecording = false } = data || {};

  // Initialize with welcome message if no messages
  useEffect(() => {
    if (messages.length === 0) {
      actions.addMessage({
        type: 'assistant',
        content: 'Hello! I\'m your intelligent home assistant. I can help you control your smart home devices. Try asking me to "turn on the living room light" or "what devices do I have?"',
        timestamp: new Date()
      });
    }
  }, [messages.length, actions]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = {
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    actions.addMessage(userMessage)
    setInputValue('')
    setIsLoading(true)
    setError('')

    try {
      const response = await actions.sendAssistantMessage(inputValue.trim())
      
      const assistantMessage = {
        type: 'assistant',
        content: response,
        timestamp: new Date()
      }

      actions.addMessage(assistantMessage)
      
      // Speak the response
      if (speechSynthesis.current) {
        const utterance = new SpeechSynthesisUtterance(response)
        utterance.rate = 0.9
        utterance.pitch = 1
        speechSynthesis.current.speak(utterance)
      }
    } catch (err) {
      console.error('Assistant error:', err)
      setError('Sorry, I encountered an error. Please try again.')
      
      const errorMessage = {
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      actions.addMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setError('Voice recognition not supported in this browser')
      return
    }

    const recognition = new window.webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    actions.setRecording(true)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInputValue(transcript)
      actions.setRecording(false)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setError('Voice recognition failed')
      actions.setRecording(false)
    }

    recognition.onend = () => {
      actions.setRecording(false)
    }

    recognition.start()
  }

  const clearChat = () => {
    actions.clearMessages()
  }

  return (
    <div className="chatgpt-assistant">
      <div className="chat-container">
        <div className="messages-container">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <div className="message-content">
                {message.content}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  Assistant is typing
                  <div className="typing-dots">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me to control your smart home..."
              className="message-input"
              rows="1"
              disabled={isLoading}
            />
            
            <button
              onClick={startVoiceRecording}
              className={`voice-button ${isRecording ? 'recording' : ''}`}
              disabled={isLoading || isRecording}
              title="Voice input"
            >
              🎤
            </button>
            
            <button
              onClick={sendMessage}
              className="send-button"
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
          
          {error && (
            <div className="error-message">{error}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatGPTAssistant