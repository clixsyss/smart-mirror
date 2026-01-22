import { memo } from 'react';
import './tiles.css';

/**
 * Base Tile Component - Google Home style
 * Provides consistent structure for all device control tiles
 */
const Tile = memo(({
  title,
  subtitle,
  icon,
  iconColor = '#ffffff',
  status,
  statusColor,
  primaryAction,
  secondaryActions = [],
  children,
  loading = false,
  onClick,
  className = '',
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const handleClick = (e) => {
    if (onClick && !loading) {
      onClick(e);
    }
  };

  return (
    <div 
      className={`tile tile-${size} ${loading ? 'tile-loading' : ''} ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
    >
      {loading ? (
        <div className="tile-skeleton">
          <div className="skeleton-icon"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text short"></div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="tile-header">
            <div className="tile-icon" style={{ color: iconColor }}>
              {icon}
            </div>
            <div className="tile-title-group">
              <h3 className="tile-title">{title}</h3>
              {subtitle && <p className="tile-subtitle">{subtitle}</p>}
            </div>
          </div>

          {/* Status */}
          {status && (
            <div className="tile-status" style={{ color: statusColor }}>
              {status}
            </div>
          )}

          {/* Content */}
          {children && (
            <div className="tile-content">
              {children}
            </div>
          )}

          {/* Primary Action */}
          {primaryAction && (
            <div className="tile-primary-action">
              {primaryAction}
            </div>
          )}

          {/* Secondary Actions */}
          {secondaryActions.length > 0 && (
            <div className="tile-secondary-actions">
              {secondaryActions.map((action, index) => (
                <div key={index} className="tile-secondary-action">
                  {action}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
});

Tile.displayName = 'Tile';

export default Tile;
