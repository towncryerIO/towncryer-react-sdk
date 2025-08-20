import React, { useState } from 'react';
import Towncryer, { PushNotification } from '@towncryerio/towncryer-js-sdk';
import {
  TowncryerProvider,
  NotificationBadge,
  NotificationCenter,
  NotificationBanner,
  PermissionRequest,
  useNotifications
} from '../index';

// Sample notification for demo purposes
const sampleNotification: PushNotification = {
  id: '123',
  title: 'New Message',
  body: 'You have received a new message from the Towncryer team.',
  timestamp: new Date().getTime(),
  read: false
};

// Initialize the SDK (this would typically be done at the app level)
const towncryerSDK = new Towncryer({
  authConfig: {
    accessToken: 'your-api-key-here',
    refreshToken: 'your-refresh-token-here',
  },
  firebase: {
    apiKey: 'your-firebase-api-key',
    authDomain: 'your-app.firebaseapp.com',
    projectId: 'your-project-id',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abc123def456',
    storageBucket: 'your-storage-bucket',
    measurementId: 'your-measurement-id'
  }
});

// Component that uses the notification hooks
const NotificationControls = () => {
  const { 
    toggleNotificationCenter, 
    unreadCount, 
    hasPermission, 
    isPermissionRequested 
  } = useNotifications();
  
  const [showBanner, setShowBanner] = useState(false);
  
  return (
    <div style={{ 
      margin: '20px', 
      padding: '20px', 
      border: '1px solid #e0e0e0', 
      borderRadius: '8px' 
    }}>
      <h2>Notification Demo</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Permission Status</h3>
        {hasPermission ? (
          <p style={{ color: 'green' }}>✓ Notifications permitted</p>
        ) : (
          <div>
            <p style={{ color: 'red' }}>✗ Notifications not enabled</p>
            {!isPermissionRequested && <PermissionRequest />}
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Notification Controls</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={toggleNotificationCenter}
            style={{ padding: '8px 16px' }}
          >
            Toggle Notification Center
            <span style={{ marginLeft: '5px' }}>
              <NotificationBadge showZero={true} />
            </span>
          </button>
          
          <button 
            onClick={() => setShowBanner(!showBanner)}
            style={{ padding: '8px 16px' }}
          >
            {showBanner ? 'Hide' : 'Show'} Test Notification Banner
          </button>
        </div>
      </div>
      
      {showBanner && (
        <NotificationBanner 
          notification={sampleNotification} 
          onClose={() => setShowBanner(false)}
          position="top-right"
        />
      )}
      
      <NotificationCenter />
    </div>
  );
};

// Main example component that wraps everything with the provider
export const NotificationExample = () => {
  return (
    <TowncryerProvider sdk={towncryerSDK}>
      <NotificationControls />
    </TowncryerProvider>
  );
};

export default NotificationExample;
