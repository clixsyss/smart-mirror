import { useState, useEffect } from 'react';
import { cacheManager } from '../utils/cacheManager';
import './NewsHeadlines.css';

const NewsHeadlines = ({ refreshTrigger }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Using BBC RSS feed as a free option
  const RSS_URL = 'https://feeds.bbci.co.uk/news/rss.xml';

  const fetchNews = async () => {
    // Since we can't directly fetch RSS due to CORS, we'll use a proxy service
    // For production, you might want to set up your own backend or use NewsAPI
    const proxyUrl = 'https://api.rss2json.com/v1/api.json?rss_url=';
    const url = proxyUrl + encodeURIComponent(RSS_URL);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`News API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error('Failed to fetch news');
    }
    
    return data.items.slice(0, 10).map(item => ({
      title: item.title,
      description: item.description?.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
      pubDate: new Date(item.pubDate).toLocaleDateString(),
      link: item.link
    }));
  };

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const newsData = await cacheManager.fetchWithCache('news', fetchNews);
        setNews(newsData);
      } catch (err) {
        // Fallback to mock data if API fails
        const mockNews = [
          {
            title: "Technology advances in smart home devices",
            description: "Latest developments in IoT and smart mirror technology...",
            pubDate: new Date().toLocaleDateString()
          },
          {
            title: "Weather patterns shift across regions",
            description: "Meteorologists report changing climate conditions...",
            pubDate: new Date().toLocaleDateString()
          },
          {
            title: "Innovation in renewable energy sector",
            description: "New solar and wind energy projects announced...",
            pubDate: new Date().toLocaleDateString()
          },
          {
            title: "Digital transformation in healthcare",
            description: "Medical institutions adopt new technologies...",
            pubDate: new Date().toLocaleDateString()
          },
          {
            title: "Space exploration milestone achieved",
            description: "Recent discoveries from the latest space mission...",
            pubDate: new Date().toLocaleDateString()
          }
        ];
        
        cacheManager.set('news', mockNews);
        setNews(mockNews);
        setError('Using cached news data');
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, [refreshTrigger]);

  // Auto-scroll through news items
  useEffect(() => {
    if (news.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % news.length);
    }, 8000); // Change every 8 seconds

    return () => clearInterval(interval);
  }, [news.length]);

  if (loading) {
    return (
      <div className="news">
        <div className="news-loading">Loading news...</div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="news">
        <div className="news-error">No news available</div>
      </div>
    );
  }

  return (
    <div className="news">
      <h2 className="news-title">Latest News</h2>
      
      <div className="news-ticker">
        <div className="news-item active">
          <div className="news-headline">{news[currentIndex]?.title}</div>
          <div className="news-description">{news[currentIndex]?.description}</div>
          <div className="news-date">{news[currentIndex]?.pubDate}</div>
        </div>
      </div>
      
      <div className="news-indicators">
        {news.map((_, index) => (
          <div 
            key={index} 
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
          />
        ))}
      </div>
      
      {error && <div className="news-warning">{error}</div>}
    </div>
  );
};

export default NewsHeadlines;