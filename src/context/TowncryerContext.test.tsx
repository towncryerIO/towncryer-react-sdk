import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createMockTowncryerClient } from '@towncryerio/towncryer-js-sdk';
import { TowncryerProvider, useTowncryer } from './TowncryerContext';
import { FirebaseConfig, PushNotification } from '../types';

const mockInitialize = jest.fn();
const mockRequestPermission = jest.fn();
const mockReceiveNotifications = jest.fn();
const mockGetMessageHistory = jest.fn();
const mockGetStats = jest.fn();
const mockMarkRead = jest.fn();
const mockSetCustomerId = jest.fn();

jest.mock('../services/pushNotificationService', () => ({
  FirebasePushNotificationService: jest.fn().mockImplementation(() => ({
    initialize: mockInitialize,
    requestPermission: mockRequestPermission,
    receiveNotifications: mockReceiveNotifications,
    getMessageHistory: mockGetMessageHistory,
    getStats: mockGetStats,
    markRead: mockMarkRead,
    setCustomerId: mockSetCustomerId,
    registerToken: jest.fn(),
  })),
}));

const firebaseConfig: FirebaseConfig = {
  apiKey: 'key',
  authDomain: 'domain',
  projectId: 'project',
  messagingSenderId: 'sender',
  appId: 'app',
  storageBucket: 'bucket',
  measurementId: 'measurement',
};

const notification = (overrides: Partial<PushNotification> = {}): PushNotification => ({
  id: 'n1',
  title: 'Title',
  body: 'Body',
  timestamp: 1,
  read: false,
  ...overrides,
});

function renderTowncryer(sdk: ReturnType<typeof createMockTowncryerClient>, config?: FirebaseConfig) {
  return renderHook(() => useTowncryer(), {
    wrapper: ({ children }) => (
      <TowncryerProvider sdk={sdk} firebaseConfig={config}>
        {children}
      </TowncryerProvider>
    ),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockInitialize.mockResolvedValue(undefined);
  mockGetStats.mockResolvedValue({ total: 0, unread: 0, lastUpdated: Date.now() });
  (global as any).Notification.permission = 'default';
});

describe('TowncryerProvider', () => {
  describe('without a firebaseConfig', () => {
    it('never runs initialization and stays uninitialized', async () => {
      const sdk = createMockTowncryerClient();
      const { result } = renderTowncryer(sdk);

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.initializationStatus).toBe('idle');
      expect(mockInitialize).not.toHaveBeenCalled();
    });
  });

  describe('initialization', () => {
    it('initializes successfully and reflects granted permission', async () => {
      (global as any).Notification.permission = 'granted';
      const sdk = createMockTowncryerClient();
      const { result } = renderTowncryer(sdk, firebaseConfig);

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      expect(result.current.initializationStatus).toBe('success');
      expect(result.current.hasPermission).toBe(true);
      expect(result.current.isPermissionRequested).toBe(true);
      expect(mockReceiveNotifications).toHaveBeenCalledTimes(1);
    });

    it('treats "default" permission as not yet requested', async () => {
      (global as any).Notification.permission = 'default';
      const sdk = createMockTowncryerClient();
      const { result } = renderTowncryer(sdk, firebaseConfig);

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      expect(result.current.hasPermission).toBe(false);
      expect(result.current.isPermissionRequested).toBe(false);
    });

    it('surfaces initialization failures via error/initializationStatus', async () => {
      mockInitialize.mockRejectedValue(new Error('firebase down'));
      const sdk = createMockTowncryerClient();
      const { result } = renderTowncryer(sdk, firebaseConfig);

      await waitFor(() => expect(result.current.initializationStatus).toBe('error'));

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.error?.message).toContain('firebase down');
    });

    it('feeds notifications pushed by the push service into state', async () => {
      const sdk = createMockTowncryerClient();
      const { result } = renderTowncryer(sdk, firebaseConfig);

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      const pushed = notification({ id: 'pushed' });
      act(() => {
        mockReceiveNotifications.mock.calls[0][0](pushed);
      });

      expect(result.current.notifications).toContainEqual(pushed);
      // A received notification triggers a background stats refresh; let it settle.
      await waitFor(() => expect(mockGetStats).toHaveBeenCalled());
    });
  });

  describe('fetchNotifications', () => {
    it('resolves and marks notificationsStatus success', async () => {
      mockGetMessageHistory.mockResolvedValue({ content: [], totalElements: 0 });
      const sdk = createMockTowncryerClient();
      const { result } = renderTowncryer(sdk, firebaseConfig);
      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      let response: unknown;
      await act(async () => {
        response = await result.current.fetchNotifications();
      });

      expect(response).toEqual({ content: [], totalElements: 0 });
      expect(result.current.notificationsStatus).toBe('success');
    });

    it('returns false and records the error on failure', async () => {
      mockGetMessageHistory.mockRejectedValue(new Error('network error'));
      const sdk = createMockTowncryerClient();
      const { result } = renderTowncryer(sdk, firebaseConfig);
      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      let response: unknown;
      await act(async () => {
        response = await result.current.fetchNotifications();
      });

      expect(response).toBe(false);
      expect(result.current.notificationsStatus).toBe('error');
    });
  });

  describe('markAsRead', () => {
    it('marks the notification read and refreshes stats', async () => {
      mockMarkRead.mockResolvedValue(undefined);
      const sdk = createMockTowncryerClient();
      const { result } = renderTowncryer(sdk, firebaseConfig);
      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      act(() => {
        mockReceiveNotifications.mock.calls[0][0](notification({ id: 'a' }));
      });

      mockGetStats.mockClear();

      await act(async () => {
        await result.current.markAsRead('a');
      });

      expect(mockMarkRead).toHaveBeenCalledWith('a');
      expect(result.current.notifications.find((n) => n.id === 'a')?.read).toBe(true);
      expect(result.current.markReadStatus).toBe('success');
      // markAsRead refreshes stats after a successful update.
      expect(mockGetStats).toHaveBeenCalled();
    });

    it('records the error when the underlying API call fails', async () => {
      mockMarkRead.mockRejectedValue(new Error('server error'));
      const sdk = createMockTowncryerClient();
      const { result } = renderTowncryer(sdk, firebaseConfig);
      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      act(() => {
        mockReceiveNotifications.mock.calls[0][0](notification({ id: 'a' }));
      });

      await act(async () => {
        await result.current.markAsRead('a');
      });

      expect(result.current.markReadStatus).toBe('error');
      expect(result.current.error?.message).toContain('notification a');
      expect(result.current.error?.message).toContain('server error');
      // The notification's read state is untouched since the API call failed.
      expect(result.current.notifications.find((n) => n.id === 'a')?.read).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('marks every unread notification read when all calls succeed', async () => {
      mockMarkRead.mockResolvedValue(undefined);
      const sdk = createMockTowncryerClient();
      const { result } = renderTowncryer(sdk, firebaseConfig);
      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      act(() => {
        mockReceiveNotifications.mock.calls[0][0](notification({ id: 'a' }));
        mockReceiveNotifications.mock.calls[0][0](notification({ id: 'b' }));
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(result.current.notifications.every((n) => n.read)).toBe(true);
      expect(result.current.markReadStatus).toBe('success');
      expect(result.current.error).toBeNull();
    });

    it('marks only the notifications that succeeded and surfaces an error for the rest', async () => {
      // Regression test for the partial-failure bug: markAllAsRead must not
      // discard successful updates just because one notification failed.
      mockMarkRead.mockImplementation((id: string) =>
        id === 'fail' ? Promise.reject(new Error('boom')) : Promise.resolve(undefined)
      );
      const sdk = createMockTowncryerClient();
      const { result } = renderTowncryer(sdk, firebaseConfig);
      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      act(() => {
        mockReceiveNotifications.mock.calls[0][0](notification({ id: 'ok' }));
        mockReceiveNotifications.mock.calls[0][0](notification({ id: 'fail' }));
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(result.current.notifications.find((n) => n.id === 'ok')?.read).toBe(true);
      expect(result.current.notifications.find((n) => n.id === 'fail')?.read).toBe(false);
      expect(result.current.markReadStatus).toBe('error');
      expect(result.current.error?.message).toContain('fail');
    });
  });

  describe('requestPermission', () => {
    it('updates hasPermission when granted', async () => {
      mockRequestPermission.mockResolvedValue(true);
      const sdk = createMockTowncryerClient();
      const { result } = renderTowncryer(sdk, firebaseConfig);
      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      let granted: boolean | undefined;
      await act(async () => {
        granted = await result.current.requestPermission();
      });

      expect(granted).toBe(true);
      expect(result.current.hasPermission).toBe(true);
    });

    it('surfaces an error and returns false when the request fails', async () => {
      mockRequestPermission.mockRejectedValue(new Error('denied'));
      const sdk = createMockTowncryerClient();
      const { result } = renderTowncryer(sdk, firebaseConfig);
      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      let granted: boolean | undefined;
      await act(async () => {
        granted = await result.current.requestPermission();
      });

      expect(granted).toBe(false);
      expect(result.current.hasPermission).toBe(false);
      expect(result.current.error?.message).toContain('denied');
    });
  });

  describe('SDK passthrough actions', () => {
    it('delegates createCustomer to the sdk and stores the response', async () => {
      const sdk = createMockTowncryerClient({
        createCustomer: jest.fn().mockResolvedValue({ code: '200', message: 'OK', data: { id: 'c1' } }),
      });
      const { result } = renderTowncryer(sdk);

      let response: unknown;
      await act(async () => {
        response = await result.current.createCustomer({ externalId: 'c1' } as any);
      });

      expect(sdk.createCustomer).toHaveBeenCalledWith({ externalId: 'c1' });
      expect(response).toEqual({ code: '200', message: 'OK', data: { id: 'c1' } });
      expect(result.current.lastCreatedCustomer).toEqual({ code: '200', message: 'OK', data: { id: 'c1' } });
      expect(result.current.createCustomerStatus).toBe('success');
    });

    it('records an error when createCustomer rejects', async () => {
      const sdk = createMockTowncryerClient({
        createCustomer: jest.fn().mockRejectedValue(new Error('duplicate customer')),
      });
      const { result } = renderTowncryer(sdk);

      let response: unknown;
      await act(async () => {
        response = await result.current.createCustomer({ externalId: 'c1' } as any);
      });

      expect(response).toBe(false);
      expect(result.current.createCustomerStatus).toBe('error');
      expect(result.current.error?.message).toContain('duplicate customer');
    });

    it('delegates publishEvent to the sdk', async () => {
      const sdk = createMockTowncryerClient({
        publishEvent: jest.fn().mockResolvedValue({ code: '200', message: 'OK' }),
      });
      const { result } = renderTowncryer(sdk);

      await act(async () => {
        await result.current.publishEvent({ name: 'evt' } as any);
      });

      expect(sdk.publishEvent).toHaveBeenCalledWith({ name: 'evt' });
      expect(result.current.publishEventStatus).toBe('success');
    });

    it('delegates sendMessages to the sdk', async () => {
      const sdk = createMockTowncryerClient({
        sendMessages: jest.fn().mockResolvedValue({ jobId: 'job-1' }),
      });
      const { result } = renderTowncryer(sdk);

      await act(async () => {
        await result.current.sendMessages({ messages: [] } as any);
      });

      expect(sdk.sendMessages).toHaveBeenCalledWith({ messages: [] });
      expect(result.current.sendMessagesStatus).toBe('success');
      expect(result.current.lastSentMessagesInfo).toEqual({ jobId: 'job-1' });
    });
  });

  describe('token/customer setters', () => {
    it('forwards setAccessToken, setRefreshToken and setTokens to the sdk', () => {
      const sdk = createMockTowncryerClient({
        setAccessToken: jest.fn(),
        setRefreshToken: jest.fn(),
      });
      const { result } = renderTowncryer(sdk);

      act(() => {
        result.current.setAccessToken('access');
        result.current.setRefreshToken('refresh');
        result.current.setTokens('access2', 'refresh2');
      });

      expect(sdk.setAccessToken).toHaveBeenNthCalledWith(1, 'access');
      expect(sdk.setRefreshToken).toHaveBeenNthCalledWith(1, 'refresh');
      expect(sdk.setAccessToken).toHaveBeenNthCalledWith(2, 'access2');
      expect(sdk.setRefreshToken).toHaveBeenNthCalledWith(2, 'refresh2');
    });

    it('forwards setCustomerId to the sdk', () => {
      const sdk = createMockTowncryerClient({ setCustomerId: jest.fn() });
      const { result } = renderTowncryer(sdk);

      act(() => {
        result.current.setCustomerId('customer-1');
      });

      expect(sdk.setCustomerId).toHaveBeenCalledWith('customer-1');
    });
  });

  describe('clearError', () => {
    it('clears a recorded error', async () => {
      mockMarkRead.mockRejectedValue(new Error('boom'));
      const sdk = createMockTowncryerClient();
      const { result } = renderTowncryer(sdk, firebaseConfig);
      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      act(() => {
        mockReceiveNotifications.mock.calls[0][0](notification({ id: 'a' }));
      });

      await act(async () => {
        await result.current.markAsRead('a');
      });
      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.markReadStatus).toBe('idle');
    });
  });
});

describe('useTowncryer', () => {
  it('returns the default context value outside of a provider', () => {
    const { result } = renderHook(() => useTowncryer());
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.notifications).toEqual([]);
  });
});
