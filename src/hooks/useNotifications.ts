import { useTowncryer } from '../context/TowncryerContext';
import { PushNotification } from '@towncryerio/towncryer-js-sdk';

/**
 * Hook for working with notifications in the Towncryer React SDK
 */
export const useNotifications = () => {
  const {
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
    fetchNotifications,
    fetchNotificationStats,
    towncryerSDK,
  } = useTowncryer();

  /**
   * Open the notification center
   */
  const openNotificationCenter = () => {
    setShowNotificationCenter(true);
  };

  /**
   * Close the notification center
   */
  const closeNotificationCenter = () => {
    setShowNotificationCenter(false);
  };

  /**
   * Toggle the notification center
   */
  const toggleNotificationCenter = () => {
    setShowNotificationCenter(!showNotificationCenter);
  };

  /**
   * Get unread notifications
   */
  const getUnreadNotifications = (): PushNotification[] => {
    return notifications.filter(notification => !notification.read);
  };

  /**
   * Get read notifications
   */
  const getReadNotifications = (): PushNotification[] => {
    return notifications.filter(notification => notification.read);
  };

  return {
    // Notification data
    notifications,
    notificationStats,
    unreadCount,
    
    // Notification center state
    showNotificationCenter,
    openNotificationCenter,
    closeNotificationCenter,
    toggleNotificationCenter,
    
    // Notification actions
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    fetchNotificationStats,
    
    // Permission handling
    requestPermission,
    hasPermission,
    isPermissionRequested,
    
    // Helper methods
    getUnreadNotifications,
    getReadNotifications,
    
    // Status
    isInitialized,

    towncryerSDK,
  };
};
