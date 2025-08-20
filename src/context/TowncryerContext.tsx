import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PushNotification, PushNotificationStats, TowncryerSDK } from '@towncryerio/towncryer-js-sdk';
import { TowncryerContextValue, TowncryerReactConfig } from '../types';

const defaultContextValue: TowncryerContextValue = {
  notifications: [],
  notificationStats: null,
  unreadCount: 0,
  showNotificationCenter: false,
  setShowNotificationCenter: () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  requestPermission: async () => false,
  hasPermission: false,
  isPermissionRequested: false,
  isInitialized: false,
  setAccessToken: () => {},
  setRefreshToken: () => {},
  setCustomerId: () => {},
  setTokens: () => {},
  fetchNotifications: async (page?: number, size?: number) => false,
  fetchNotificationStats: async () => {},
  towncryerSDK: null,
};

export const TowncryerContext = createContext<TowncryerContextValue>(defaultContextValue);

export interface TowncryerProviderProps {
  sdk: TowncryerSDK;
  config?: TowncryerReactConfig;
  children: ReactNode;
}

export const TowncryerProvider: React.FC<TowncryerProviderProps> = ({ 
  sdk, 
  config = {}, 
  children 
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [notificationStats, setNotificationStats] = useState<PushNotificationStats | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isPermissionRequested, setIsPermissionRequested] = useState(false);

  // Initialize the SDK and set up notification handling
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        await sdk.getPushNotificationService().initialize();
        
        const permission = await Notification.permission;
        setHasPermission(permission === 'granted');
        setIsPermissionRequested(permission !== 'default');
        
        sdk.getPushNotificationService().receiveNotifications((notification) => {
          setNotifications(prev => [notification, ...prev]);
          
          setUnreadCount(prev => prev + 1);
          
          fetchNotificationStats();
        });
        
        setIsInitialized(true);
      } catch (error) {
        throw new Error(`Failed to initialize Towncryer SDK: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    initializeSDK();

    // Clean up function
    return () => {
      // Any cleanup needed for the SDK
    };
  }, [sdk]);

  const fetchNotifications = async (page: number = 0, size: number = 10) => {
    try {
      const response = await sdk.getPushNotificationService().getMessageHistory(page, size);
      
      return response;
    } catch (error: any) {
      throw error;
    }
  };

  const fetchNotificationStats = async () => {
    try {
      const stats = await sdk.getPushNotificationService().getStats();
      setNotificationStats(stats);
      setUnreadCount(stats.unread);
    } catch (error) {
      throw new Error(`Failed to fetch notification stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await sdk.getPushNotificationService().markRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      fetchNotificationStats();
    } catch (error) {
      throw new Error(`Failed to mark notification ${notificationId} as read: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const markAllAsRead = async () => {
    try {
      // This assumes the core SDK has a markAllRead method
      // If it doesn't, we would need to iterate through unread notifications
      // and mark each one as read
      await Promise.all(
        notifications
          .filter(notification => !notification.read)
          .map(notification => sdk.getPushNotificationService().markRead(notification.id))
      );
      
      // Update all notifications in state to reflect read status
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      // Refresh stats
      fetchNotificationStats();
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    try {
      setIsPermissionRequested(true);
      const granted = await sdk.getPushNotificationService().requestPermission();
      setHasPermission(granted);
      return granted;
    } catch (error) {
      throw new Error(`Failed to request notification permission: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Update access token and reinitialize if needed
  const setAccessToken = (token: string): void => {
    sdk.setAccessToken(token);
  };

  // Update refresh token and reinitialize if needed
  const setRefreshToken = (token: string): void => {
    sdk.setRefreshToken(token);
  };

  const setCustomerId = (customerId: string): void => {
    sdk.setCustomerId(customerId);
  }
  
  // Update both tokens at once
  const setTokens = (accessToken: string, refreshToken: string): void => {
    sdk.setAccessToken(accessToken);
    sdk.setRefreshToken(refreshToken);
  };

  const towncryerSDK = sdk;

  const contextValue: TowncryerContextValue = {
    notifications,
    notificationStats,
    unreadCount,
    showNotificationCenter,
    setShowNotificationCenter,
    markAsRead,
    markAllAsRead,
    requestPermission,
    hasPermission,
    isPermissionRequested,
    isInitialized,
    setAccessToken,
    setRefreshToken,
    setCustomerId,
    setTokens,
    fetchNotifications,
    fetchNotificationStats,
    towncryerSDK,
  };

  return (
    <TowncryerContext.Provider value={contextValue}>
      {children}
    </TowncryerContext.Provider>
  );
};

// Custom hook to use the Towncryer context
export const useTowncryer = () => {
  const context = useContext(TowncryerContext);
  if (context === undefined) {
    throw new Error('useTowncryer must be used within a TowncryerProvider');
  }
  return context;
};
