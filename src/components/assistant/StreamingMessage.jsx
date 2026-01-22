import { useState, useEffect, useRef } from 'react';

/**
 * StreamingMessage - Displays text that streams in token by token
 */
const StreamingMessage = ({ text, isStreaming = false, onComplete = null }) => {
  const [displayedText, setDisplayedText] = useState('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(text);
      if (onComplete && text) {
        onComplete();
      }
      return;
    }

    // Stream text character by character
    let currentIndex = 0;
    const streamSpeed = 20; // ms per character

    const stream = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
        timeoutRef.current = setTimeout(stream, streamSpeed);
      } else {
        if (onComplete) {
          onComplete();
        }
      }
    };

    stream();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, isStreaming, onComplete]);

  return (
    <div className="streaming-message">
      <span>{displayedText}</span>
      {isStreaming && displayedText.length < text.length && (
        <span className="streaming-cursor">▊</span>
      )}
    </div>
  );
};

export default StreamingMessage;
