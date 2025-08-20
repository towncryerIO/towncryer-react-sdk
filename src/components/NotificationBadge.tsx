import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationBadgeProps } from '../types';

/**
 * NotificationBadge component displays an unread notification count
 */
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  showZero = false,
  className = '',
  style = {},
}) => {
  const { unreadCount, toggleNotificationCenter } = useNotifications();
  
  // Use provided count or fall back to context unreadCount
  const displayCount = count !== undefined ? count : unreadCount;
  
  // Don't render if count is zero and showZero is false
  if (displayCount === 0 && !showZero) {
    return null;
  }
  
  // Format the count for display
  const formattedCount = displayCount > maxCount ? `${maxCount}+` : displayCount.toString();
  
  return (
    <div 
      className={`towncryer-notification-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '20px',
        height: '20px',
        borderRadius: '10px',
        backgroundColor: '#f44336',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
        padding: '0 6px',
        cursor: 'pointer',
        ...style
      }}
      onClick={toggleNotificationCenter}
      role="button"
      aria-label={`${formattedCount} unread notifications`}
    >
      {formattedCount}
    </div>
  );
};

export default NotificationBadge;
