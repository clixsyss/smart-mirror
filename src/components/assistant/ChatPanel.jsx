import { useState, useRef, useEffect, useCallback } from 'react';
import ChatMessage from './ChatMessage';
import './chat.css';

/**
 * ChatPanel - Main chat interface for the assistant
 */
const ChatPanel = ({ 
  messages = [], 
  onSendMessage, 
  isStreaming = false,
  quickActions = [],
  onQuickAction = null
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    
    onSendMessage(input.trim());
    setInput('');
    inputRef.current?.focus();
  }, [input, isStreaming, onSendMessage]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleQuickAction = useCallback((action) => {
    if (onQuickAction) {
      onQuickAction(action);
    } else {
      onSendMessage(action);
    }
  }, [onQuickAction, onSendMessage]);

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.5)',
            padding: '40px 20px',
            fontSize: '14px'
          }}>
            Start a conversation with your smart home assistant...
          </div>
        )}
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id || index}
            role={message.role}
            content={message.content}
            isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
            timestamp={message.timestamp}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {quickActions.length > 0 && (
        <div className="quick-actions">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="quick-action-button"
              onClick={() => handleQuickAction(action)}
              disabled={isStreaming}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-container">
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isStreaming}
        />
        <button
          className="chat-send-button"
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
