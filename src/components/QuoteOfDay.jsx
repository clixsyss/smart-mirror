import './QuoteOfDay.css';

const QuoteOfDay = ({ data }) => {
  const { content, author, loading, error } = data || {};

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
        <div className="quote-error">Quote unavailable</div>
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