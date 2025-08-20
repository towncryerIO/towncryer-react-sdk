import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { PermissionRequestProps } from '../types';

/**
 * PermissionRequest component displays a button to request notification permissions
 */
export const PermissionRequest: React.FC<PermissionRequestProps> = ({
  buttonText = 'Enable Notifications',
  onPermissionChange,
  className = '',
  style = {},
}) => {
  const { requestPermission, hasPermission, isPermissionRequested } = useNotifications();

  // Handle the permission request
  const handleRequestPermission = async () => {
    const permissionGranted = await requestPermission();
    onPermissionChange?.(permissionGranted);
  };

  // Don't show anything if permission is already granted
  if (hasPermission) {
    return null;
  }

  // If permission was denied, show a different message
  if (isPermissionRequested && !hasPermission) {
    return (
      <div 
        className={`towncryer-permission-request ${className}`}
        style={{
          padding: '12px 16px',
          borderRadius: '4px',
          backgroundColor: '#f5f5f5',
          color: '#616161',
          fontSize: '14px',
          ...style
        }}
      >
        Notifications are blocked. Please enable them in your browser settings.
      </div>
    );
  }

  return (
    <button
      onClick={handleRequestPermission}
      className={`towncryer-permission-request-button ${className}`}
      style={{
        padding: '8px 16px',
        backgroundColor: '#2196f3',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        transition: 'background-color 0.2s',
        ...style
      }}
    >
      {buttonText}
    </button>
  );
};

export default PermissionRequest;
