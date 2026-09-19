import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { ITowncryer } from '@towncryerio/towncryer-js-sdk';
import { FirebaseConfig, PushNotification, PushNotificationStats, TowncryerContextValue, TowncryerReactConfig } from '../types';
import { FirebasePushNotificationService, PushNotificationService } from '../services/pushNotificationService';

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
  error: null,
  clearError: () => {},
};

export const TowncryerContext = createContext<TowncryerContextValue>(defaultContextValue);

export interface TowncryerProviderProps {
  sdk: ITowncryer;
  /** Firebase configuration, required to enable browser push notifications. */
  firebaseConfig?: FirebaseConfig;
  config?: TowncryerReactConfig;
  children: ReactNode;
}

export const TowncryerProvider: React.FC<TowncryerProviderProps> = ({
  sdk,
  firebaseConfig,
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
  const [error, setError] = useState<Error | null>(null);
  const pushServiceRef = useRef<PushNotificationService | null>(null);

  const clearError = () => setError(null);

  const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)));

  const getPushService = (): PushNotificationService => {
    if (!pushServiceRef.current) {
      throw new Error('Push notifications not initialized: no firebaseConfig was provided to TowncryerProvider');
    }
    return pushServiceRef.current;
  };

  // Initialize the SDK and set up notification handling
  useEffect(() => {
    if (!firebaseConfig) {
      return;
    }

    pushServiceRef.current = new FirebasePushNotificationService(
      firebaseConfig,
      sdk.getEventService(),
      sdk.getMessagesApi(),
      sdk.getCustomerId(),
    );

    const initializeSDK = async () => {
      try {
        await getPushService().initialize();

        const permission = await Notification.permission;
        setHasPermission(permission === 'granted');
        setIsPermissionRequested(permission !== 'default');

        getPushService().receiveNotifications((notification) => {
          setNotifications(prev => [notification, ...prev]);

          setUnreadCount(prev => prev + 1);

          fetchNotificationStats();
        });

        setIsInitialized(true);
      } catch (error) {
        setError(new Error(`Failed to initialize Towncryer SDK: ${toError(error).message}`));
      }
    };

    initializeSDK();

    // Clean up function
    return () => {
      // Any cleanup needed for the SDK
    };
  }, [sdk, firebaseConfig]);

  const fetchNotifications = async (page: number = 0, size: number = 10) => {
    try {
      const response = await getPushService().getMessageHistory(page, size);

      return response;
    } catch (error) {
      setError(toError(error));
      return false;
    }
  };

  const fetchNotificationStats = async () => {
    try {
      const stats = await getPushService().getStats();
      setNotificationStats(stats);
      setUnreadCount(stats.unread);
    } catch (error) {
      setError(new Error(`Failed to fetch notification stats: ${toError(error).message}`));
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await getPushService().markRead(notificationId);

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
      setError(new Error(`Failed to mark notification ${notificationId} as read: ${toError(error).message}`));
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
          .map(notification => getPushService().markRead(notification.id))
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
      setError(new Error(`Failed to mark all notifications as read: ${toError(error).message}`));
    }
  };

  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    try {
      setIsPermissionRequested(true);
      const granted = await getPushService().requestPermission();
      setHasPermission(granted);
      return granted;
    } catch (error) {
      setError(new Error(`Failed to request notification permission: ${toError(error).message}`));
      return false;
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
    pushServiceRef.current?.setCustomerId(customerId);
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
    error,
    clearError,
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
