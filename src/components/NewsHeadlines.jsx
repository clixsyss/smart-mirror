import './NewsHeadlines.css';

const NewsHeadlines = ({ data }) => {
  const { headlines, loading, error } = data || {};

  if (loading) {
    return (
      <div className="news">
        <div className="news-loading">Loading news...</div>
      </div>
    );
  }

  if (error || !headlines || headlines.length === 0) {
    return (
      <div className="news">
        <div className="news-error">No news available</div>
      </div>
    );
  }

  return (
    <div className="news">
      <div className="news-ticker">
        <div className="news-ticker-content">
          {headlines.map((item, index) => (
            <div key={index} className="news-headline">
              {item.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsHeadlines;