import { useState, useEffect } from 'react';

const NewsHeadlines = ({ data }) => {
  const { headlines, loading, error } = data || {};
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate news every 15 seconds
  useEffect(() => {
    if (!headlines || headlines.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        (prevIndex + 1) % headlines.length
      );
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [headlines]);

  if (loading) {
    return (
      <div className="news-content">
        <div className="news-item">
          <span className="news-text">Loading news...</span>
        </div>
      </div>
    );
  }

  if (error || !headlines || headlines.length === 0) {
    return (
      <div className="news-content">
        <div className="news-item">
          <span className="news-text">No news available</span>
        </div>
      </div>
    );
  }

  // Get current news item
  const currentNews = headlines[currentIndex];

  return (
    <div className="news-content">
      <div className="news-item rotating-news">
        <span className="news-text" key={currentIndex}>
          {currentNews?.title || 'No news available'}
        </span>
      </div>
      {headlines.length > 1 && (
        <div className="news-indicator">
          {currentIndex + 1} of {headlines.length}
        </div>
      )}
    </div>
  );
};

export default NewsHeadlines;