import { memo } from 'react';
import StreamingMessage from './StreamingMessage';
import './chat.css';

/**
 * ChatMessage - Individual message in the chat
 */
const ChatMessage = memo(({ 
  role, 
  content, 
  isStreaming = false,
  timestamp,
  onStreamComplete = null
}) => {
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';

  return (
    <div className={`chat-message chat-message-${role}`}>
      <div className="chat-message-content">
        {isStreaming && isAssistant ? (
          <StreamingMessage 
            text={content} 
            isStreaming={isStreaming}
            onComplete={onStreamComplete}
          />
        ) : (
          <div className="chat-message-text">
            {content}
          </div>
        )}
      </div>
      {timestamp && (
        <div className="chat-message-time">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
