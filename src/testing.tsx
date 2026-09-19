/**
 * Testing utilities for consumers of this SDK.
 *
 * These let a consuming app render components that call `useNotifications()`/
 * `useTowncryer()` without wiring up a real `TowncryerProvider` (which requires
 * a live core SDK instance and, for push support, a real Firebase config).
 */
import React, { ReactNode } from 'react';
import { TowncryerContext } from './context/TowncryerContext';
import { PushNotification, TowncryerContextValue } from './types';

/**
 * Per-field overrides for {@link createMockTowncryerContextValue} and
 * {@link MockTowncryerProvider}. Every field is optional; anything not
 * provided falls back to a benign default (see {@link createMockTowncryerContextValue}).
 */
export type MockTowncryerContextOverrides = Partial<TowncryerContextValue>;

/**
 * Build a fixture `PushNotification`, overriding only the fields a test cares about.
 */
export function createMockNotification(overrides: Partial<PushNotification> = {}): PushNotification {
  return {
    id: `mock-notification-${Math.random().toString(36).slice(2)}`,
    title: 'Mock notification',
    body: 'This is a mock notification body.',
    timestamp: Date.now(),
    read: false,
    ...overrides,
  };
}

/**
 * Create a fake `TowncryerContextValue` for use in a consumer's own test
 * suite, in place of the value `TowncryerProvider` would normally compute.
 *
 * Every field has a working default, so you only need to override the ones
 * your test actually exercises. Pass `jest.fn()`-wrapped functions for
 * actions (e.g. `markAsRead: jest.fn()`) if you want to assert on calls.
 */
export function createMockTowncryerContextValue(
  overrides: MockTowncryerContextOverrides = {}
): TowncryerContextValue {
  const notifications = overrides.notifications ?? [];
  const unreadCount = overrides.unreadCount ?? notifications.filter((notification) => !notification.read).length;

  return {
    notifications,
    notificationStats: null,
    unreadCount,
    showNotificationCenter: false,
    setShowNotificationCenter: () => {},
    markAsRead: async () => {},
    markAllAsRead: async () => {},
    requestPermission: async () => false,
    hasPermission: false,
    isPermissionRequested: false,
    isInitialized: true,
    setAccessToken: () => {},
    setRefreshToken: () => {},
    setCustomerId: () => {},
    setTokens: () => {},
    fetchNotifications: async () => false,
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
    initializationStatus: 'success',
    notificationsStatus: 'idle',
    statsStatus: 'idle',
    markReadStatus: 'idle',
    createCustomerStatus: 'idle',
    publishEventStatus: 'idle',
    sendMessagesStatus: 'idle',
    ...overrides,
  };
}

export interface MockTowncryerProviderProps extends MockTowncryerContextOverrides {
  children: ReactNode;
}

/**
 * Drop-in replacement for `TowncryerProvider` in tests. Renders `children`
 * against a fixed, fixture-backed context value instead of driving the real
 * SDK initialization/permission/mark-as-read flow.
 *
 * @example
 * ```tsx
 * render(
 *   <MockTowncryerProvider notifications={[createMockNotification({ title: 'Hi' })]}>
 *     <NotificationCenter isOpen />
 *   </MockTowncryerProvider>
 * );
 * ```
 */
export const MockTowncryerProvider: React.FC<MockTowncryerProviderProps> = ({ children, ...overrides }) => {
  const value = createMockTowncryerContextValue(overrides);

  return <TowncryerContext.Provider value={value}>{children}</TowncryerContext.Provider>;
};
