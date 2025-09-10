import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Smart Mirror Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="smart-mirror">
          <div className="mirror-content">
            <div className="time-display">
              <div className="time-date">
                <div className="time">{new Date().toLocaleTimeString()}</div>
                <div className="date">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
            <div className="weather-display">
              <div className="weather">
                <div className="current-weather">
                  <div className="current-temp">22°C</div>
                  <div className="current-description">partly cloudy</div>
                  <div className="current-location">London</div>
                </div>
              </div>
            </div>
            <div className="quote-display">
              <div className="quote">
                <div className="quote-text">Technology is nothing. What's important is that you have a faith in people, that they're basically good and smart.</div>
                <div className="quote-author">— Steve Jobs</div>
              </div>
            </div>
            <div className="news-ticker">
              <div className="news">
                <div className="news-ticker">
                  <div className="news-ticker-content">
                    <div className="news-headline">Smart Mirror - Fallback Mode</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="user-info">
              <div className="user-greeting">
                <span>Welcome to Smart Mirror</span>
              </div>
              <div className="device-status">
                <span className="status-item">System in fallback mode</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
