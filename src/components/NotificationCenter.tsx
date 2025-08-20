import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationCenterProps } from '../types';

/**
 * NotificationCenter component displays a list of notifications with read/unread status
 */
export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  maxHeight = '400px',
  maxWidth = '350px',
  className = '',
  style = {},
}) => {
  const { 
    notifications, 
    showNotificationCenter, 
    closeNotificationCenter,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  // Use isOpen prop if provided, otherwise use context state
  const isVisible = isOpen !== undefined ? isOpen : showNotificationCenter;
  
  if (!isVisible) {
    return null;
  }
  
  // Handle closing
  const handleClose = () => {
    closeNotificationCenter();
    onClose?.();
  };

  // Handle reading a notification
  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };
  
  return (
    <div 
      className={`towncryer-notification-center ${className}`}
      style={{
        position: 'fixed',
        top: '60px',
        right: '20px',
        zIndex: 1000,
        maxWidth,
        width: '100%',
        maxHeight,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Notification center"
    >
      {/* Header with title and close button */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px' }}>Notifications</h3>
        <div>
          <button 
            onClick={() => markAllAsRead()}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              marginRight: '10px',
              color: '#2196f3',
            }}
          >
            Mark all read
          </button>
          <button 
            onClick={handleClose}
            aria-label="Close notification center"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '16px',
            }}
          >
            &times;
          </button>
        </div>
      </div>
      
      {/* Notifications list */}
      <div
        style={{
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {notifications.length === 0 ? (
          <div 
            style={{ 
              padding: '20px', 
              textAlign: 'center',
              color: '#757575'
            }}
          >
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                backgroundColor: notification.read ? 'transparent' : '#f5f9ff',
                transition: 'background-color 0.2s',
              }}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleNotificationClick(notification.id);
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                {!notification.read && (
                  <div 
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: '#2196f3',
                      marginTop: '6px',
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                    {notification.title || 'Notification'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#616161', marginTop: '4px' }}>
                    {notification.body}
                  </div>
                  {notification.timestamp && (
                    <div style={{ fontSize: '12px', color: '#9e9e9e', marginTop: '4px' }}>
                      {new Date(notification.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
