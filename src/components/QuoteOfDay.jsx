import './QuoteOfDay.css';

const QuoteOfDay = ({ data, settings }) => {
  const { content, author, loading, error } = data || {};
  
  // Check if custom message should be displayed
  const useCustomMessage = settings?.useCustomMessage === true; // Explicit check
  const customMessage = settings?.customMessage || '';
  const hasValidCustomMessage = customMessage && customMessage.trim().length > 0;

  // If custom message is enabled and has valid content, show it
  if (useCustomMessage && hasValidCustomMessage) {
    return (
      <div className="quote">
        <div className="quote-text custom-message">
          {customMessage.trim()}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="quote">
        <div className="quote-loading">Loading quote...</div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="quote">
        <div className="quote-text">
          "The best time to plant a tree was 20 years ago. The second best time is now."
        </div>
        <div className="quote-author">— Chinese Proverb</div>
      </div>
    );
  }

  return (
    <div className="quote">
      <div className="quote-text">
        {content}
      </div>
      
      <div className="quote-author">— {author}</div>
    </div>
  );
};

export default QuoteOfDay;