import React, { createContext, useContext, useReducer, useState, useEffect, useRef, ReactNode } from 'react';
import { ITowncryer } from '@towncryerio/towncryer-js-sdk';
import { CreateCustomerRequest, PublishEventPayload, SendBulkMessagesPayload } from '@towncryerio/towncryer-js-api-client';
import { FirebaseConfig, TowncryerContextValue, TowncryerReactConfig } from '../types';
import { FirebasePushNotificationService, PushNotificationService } from '../services/pushNotificationService';
import { initialTowncryerState, towncryerReducer } from './towncryerReducer';

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
  createCustomer: async () => false,
  lastCreatedCustomer: null,
  publishEvent: async () => false,
  lastPublishedEvent: null,
  sendMessages: async () => false,
  lastSentMessagesInfo: null,
  towncryerSDK: null,
  error: null,
  clearError: () => {},
  initializationStatus: 'idle',
  notificationsStatus: 'idle',
  statsStatus: 'idle',
  markReadStatus: 'idle',
  createCustomerStatus: 'idle',
  publishEventStatus: 'idle',
  sendMessagesStatus: 'idle',
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
  const [state, dispatch] = useReducer(towncryerReducer, initialTowncryerState);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const pushServiceRef = useRef<PushNotificationService | null>(null);

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

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
      dispatch({ type: 'INIT_START' });
      try {
        await getPushService().initialize();

        const permission = await Notification.permission;

        getPushService().receiveNotifications((notification) => {
          dispatch({ type: 'NOTIFICATION_RECEIVED', payload: notification });
          fetchNotificationStats();
        });

        dispatch({
          type: 'INIT_SUCCESS',
          payload: {
            hasPermission: permission === 'granted',
            isPermissionRequested: permission !== 'default',
          },
        });
      } catch (error) {
        dispatch({
          type: 'INIT_ERROR',
          payload: new Error(`Failed to initialize Towncryer SDK: ${toError(error).message}`),
        });
      }
    };

    initializeSDK();

    // Clean up function
    return () => {
      // Any cleanup needed for the SDK
    };
  }, [sdk, firebaseConfig]);

  const fetchNotifications = async (page: number = 0, size: number = 10) => {
    dispatch({ type: 'NOTIFICATIONS_FETCH_START' });
    try {
      const response = await getPushService().getMessageHistory(page, size);
      dispatch({ type: 'NOTIFICATIONS_FETCH_SUCCESS' });

      return response;
    } catch (error) {
      dispatch({ type: 'NOTIFICATIONS_FETCH_ERROR', payload: toError(error) });
      return false;
    }
  };

  const fetchNotificationStats = async () => {
    dispatch({ type: 'STATS_FETCH_START' });
    try {
      const stats = await getPushService().getStats();
      dispatch({ type: 'STATS_FETCH_SUCCESS', payload: stats });
    } catch (error) {
      dispatch({
        type: 'STATS_FETCH_ERROR',
        payload: new Error(`Failed to fetch notification stats: ${toError(error).message}`),
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    dispatch({ type: 'MARK_READ_START' });
    try {
      await getPushService().markRead(notificationId);

      dispatch({ type: 'MARK_READ_SUCCESS', payload: { notificationId } });

      fetchNotificationStats();
    } catch (error) {
      dispatch({
        type: 'MARK_READ_ERROR',
        payload: new Error(`Failed to mark notification ${notificationId} as read: ${toError(error).message}`),
      });
    }
  };

  const markAllAsRead = async () => {
    dispatch({ type: 'MARK_READ_START' });
    try {
      // This assumes the core SDK has a markAllRead method
      // If it doesn't, we would need to iterate through unread notifications
      // and mark each one as read
      await Promise.all(
        state.notifications.data
          .filter(notification => !notification.read)
          .map(notification => getPushService().markRead(notification.id))
      );

      dispatch({ type: 'MARK_ALL_READ_SUCCESS' });

      // Refresh stats
      fetchNotificationStats();
    } catch (error) {
      dispatch({
        type: 'MARK_READ_ERROR',
        payload: new Error(`Failed to mark all notifications as read: ${toError(error).message}`),
      });
    }
  };

  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    dispatch({ type: 'PERMISSION_REQUEST_START' });
    try {
      const granted = await getPushService().requestPermission();
      dispatch({ type: 'PERMISSION_REQUEST_SUCCESS', payload: { hasPermission: granted } });
      return granted;
    } catch (error) {
      dispatch({
        type: 'PERMISSION_REQUEST_ERROR',
        payload: new Error(`Failed to request notification permission: ${toError(error).message}`),
      });
      return false;
    }
  };

  const createCustomer = async (customer: CreateCustomerRequest) => {
    dispatch({ type: 'CREATE_CUSTOMER_START' });
    try {
      const response = await sdk.createCustomer(customer);
      dispatch({ type: 'CREATE_CUSTOMER_SUCCESS', payload: response });
      return response;
    } catch (error) {
      dispatch({
        type: 'CREATE_CUSTOMER_ERROR',
        payload: new Error(`Failed to create customer: ${toError(error).message}`),
      });
      return false as const;
    }
  };

  const publishEvent = async (event: PublishEventPayload) => {
    dispatch({ type: 'PUBLISH_EVENT_START' });
    try {
      const response = await sdk.publishEvent(event);
      dispatch({ type: 'PUBLISH_EVENT_SUCCESS', payload: response });
      return response;
    } catch (error) {
      dispatch({
        type: 'PUBLISH_EVENT_ERROR',
        payload: new Error(`Failed to publish event: ${toError(error).message}`),
      });
      return false as const;
    }
  };

  const sendMessages = async (messages: SendBulkMessagesPayload) => {
    dispatch({ type: 'SEND_MESSAGES_START' });
    try {
      const response = await sdk.sendMessages(messages);
      dispatch({ type: 'SEND_MESSAGES_SUCCESS', payload: response });
      return response;
    } catch (error) {
      dispatch({
        type: 'SEND_MESSAGES_ERROR',
        payload: new Error(`Failed to send messages: ${toError(error).message}`),
      });
      return false as const;
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
    notifications: state.notifications.data,
    notificationStats: state.stats.data,
    unreadCount: state.unreadCount,
    showNotificationCenter,
    setShowNotificationCenter,
    markAsRead,
    markAllAsRead,
    requestPermission,
    hasPermission: state.hasPermission,
    isPermissionRequested: state.isPermissionRequested,
    isInitialized: state.initialization.status === 'success',
    setAccessToken,
    setRefreshToken,
    setCustomerId,
    setTokens,
    fetchNotifications,
    fetchNotificationStats,
    createCustomer,
    lastCreatedCustomer: state.createCustomer.data,
    publishEvent,
    lastPublishedEvent: state.publishEvent.data,
    sendMessages,
    lastSentMessagesInfo: state.sendMessages.data,
    towncryerSDK,
    error: state.lastError,
    clearError,
    initializationStatus: state.initialization.status,
    notificationsStatus: state.notifications.status,
    statsStatus: state.stats.status,
    markReadStatus: state.markRead.status,
    createCustomerStatus: state.createCustomer.status,
    publishEventStatus: state.publishEvent.status,
    sendMessagesStatus: state.sendMessages.status,
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
