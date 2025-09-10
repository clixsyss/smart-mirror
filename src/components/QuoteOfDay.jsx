import { useState, useEffect } from 'react';
import { cacheManager } from '../utils/cacheManager';
import './QuoteOfDay.css';

const QuoteOfDay = ({ refreshTrigger }) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuote = async () => {
    const response = await fetch('https://api.quotable.io/random?minLength=50&maxLength=150');
    if (!response.ok) {
      throw new Error(`Quote API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      content: data.content,
      author: data.author,
      tags: data.tags
    };
  };

  useEffect(() => {
    const loadQuote = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const quoteData = await cacheManager.fetchWithCache('quote', fetchQuote);
        setQuote(quoteData);
      } catch (err) {
        // Fallback to inspirational quotes if API fails
        const fallbackQuotes = [
          {
            content: "The best time to plant a tree was 20 years ago. The second best time is now.",
            author: "Chinese Proverb",
            tags: ["wisdom"]
          },
          {
            content: "Innovation distinguishes between a leader and a follower.",
            author: "Steve Jobs",
            tags: ["innovation", "leadership"]
          },
          {
            content: "The future belongs to those who believe in the beauty of their dreams.",
            author: "Eleanor Roosevelt",
            tags: ["dreams", "future"]
          },
          {
            content: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            author: "Winston Churchill",
            tags: ["success", "courage"]
          },
          {
            content: "The only way to do great work is to love what you do.",
            author: "Steve Jobs",
            tags: ["work", "passion"]
          }
        ];
        
        const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        cacheManager.set('quote', randomQuote);
        setQuote(randomQuote);
        setError('Using offline quote');
      } finally {
        setLoading(false);
      }
    };

    loadQuote();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="quote">
        <div className="quote-loading">Loading quote...</div>
      </div>
    );
  }

  return (
    <div className="quote">
      <h2 className="quote-title">Quote of the Day</h2>
      
      <div className="quote-content">
        <div className="quote-text">
          <span className="quote-mark">"</span>
          {quote?.content}
          <span className="quote-mark">"</span>
        </div>
        
        <div className="quote-author">— {quote?.author}</div>
        
        {quote?.tags && quote.tags.length > 0 && (
          <div className="quote-tags">
            {quote.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="quote-tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>
      
      {error && <div className="quote-warning">{error}</div>}
    </div>
  );
};

export default QuoteOfDay;