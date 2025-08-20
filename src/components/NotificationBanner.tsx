import React, { useState, useEffect } from 'react';
import { NotificationBannerProps } from '../types';
import { PushNotification } from '@towncryerio/towncryer-js-sdk';

/**
 * NotificationBanner component displays a single notification as a toast-style banner
 */
export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  autoClose = true,
  showTime = 5000,
  position = 'top-right',
  onClose,
  className = '',
  style = {},
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Auto-close the notification after showTime if autoClose is true
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, showTime);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, isVisible, onClose, showTime]);
  
  if (!notification || !isVisible) {
    return null;
  }
  
  // Position styles for different positions
  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return { top: '20px', right: '20px' };
      case 'top-left':
        return { top: '20px', left: '20px' };
      case 'bottom-right':
        return { bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { bottom: '20px', left: '20px' };
      default:
        return { top: '20px', right: '20px' };
    }
  };
  
  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };
  
  return (
    <div 
      className={`towncryer-notification-banner ${className}`}
      style={{
        position: 'fixed',
        zIndex: 9999,
        maxWidth: '400px',
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        ...getPositionStyles(),
        ...style
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Header with title and close button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontWeight: 'bold' }}>
          {notification.title || 'Notification'}
        </div>
        <button 
          onClick={handleClose}
          aria-label="Close notification"
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
      
      {/* Notification content */}
      <div>
        {notification.body}
      </div>
      
      {/* Timestamp if available */}
      {notification.timestamp && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#757575' }}>
          {new Date(notification.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default NotificationBanner;
