const NewsHeadlines = ({ data }) => {
  const { headlines, loading, error } = data || {};

  if (loading) {
    return (
      <div className="news-content">
        <div className="news-item">
          <div className="news-bullet"></div>
          <span className="news-text">Loading news...</span>
        </div>
      </div>
    );
  }

  if (error || !headlines || headlines.length === 0) {
    return (
      <div className="news-content">
        <div className="news-item">
          <div className="news-bullet"></div>
          <span className="news-text">No news available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="news-content">
      {headlines.slice(0, 3).map((item, index) => (
        <div key={index} className="news-item">
          <div className="news-bullet"></div>
          <span className="news-text">{item.title}</span>
        </div>
      ))}
    </div>
  );
};

export default NewsHeadlines;