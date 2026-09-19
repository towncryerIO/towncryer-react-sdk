import { TowncryerSDK } from '@towncryerio/towncryer-js-sdk';
import { PaginatePage } from '@towncryerio/towncryer-js-api-client';

// Firebase Cloud Messaging configuration for browser push notifications
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
  storageBucket: string;
  measurementId: string;
  vapidKey?: string;
}

// Push Notification Models
export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: object;
  imageUrl?: string;
  timestamp: number;
  read: boolean;
}

export interface PushNotificationStats {
  total: number;
  unread: number;
  lastUpdated: number;
}

export interface NotificationTheme {
  // Banner styling
  banner: {
    backgroundColor: string;
    textColor: string;
    borderColor?: string;
    borderRadius?: string;
    padding?: string;
    maxWidth?: string;
  };
  // NotificationCenter styling
  center: {
    backgroundColor: string;
    headerBackgroundColor?: string;
    textColor: string;
    borderColor?: string;
    borderRadius?: string;
    maxHeight?: string;
    maxWidth?: string;
  };
  // Badge styling
  badge: {
    backgroundColor: string;
    textColor: string;
    size?: string;
    position?: 'absolute' | 'relative';
    top?: string;
    right?: string;
  };
  // Permission request button styling
  permissionButton: {
    backgroundColor: string;
    textColor: string;
    hoverBackgroundColor?: string;
    borderRadius?: string;
    padding?: string;
  };
}

export interface TowncryerReactConfig {
  theme?: NotificationTheme;
  defaultShowTime?: number; // How long notifications are shown by default (in ms)
  autoCloseNotifications?: boolean;
  showNotificationBadge?: boolean;
  notificationCenterPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotificationsInCenter?: number;
}

export interface TowncryerContextValue {
  notifications: PushNotification[];
  notificationStats: PushNotificationStats | null;
  unreadCount: number;
  showNotificationCenter: boolean;
  setShowNotificationCenter: (show: boolean) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  hasPermission: boolean;
  isPermissionRequested: boolean;
  isInitialized: boolean;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setCustomerId: (customerId: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  fetchNotifications: (page?: number, size?: number) => Promise<PaginatePage | any>;
  fetchNotificationStats: () => Promise<void>;
  towncryerSDK: TowncryerSDK | null;
}

export interface NotificationBannerProps {
  notification?: PushNotification;
  autoClose?: boolean;
  showTime?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface NotificationCenterProps {
  isOpen?: boolean;
  onClose?: () => void;
  maxHeight?: string;
  maxWidth?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface NotificationBadgeProps {
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface PermissionRequestProps {
  buttonText?: string;
  onPermissionChange?: (granted: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}
