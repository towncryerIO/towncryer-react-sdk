import { initialTowncryerState, towncryerReducer, TowncryerState } from './towncryerReducer';
import { PushNotification } from '../types';

const notification = (overrides: Partial<PushNotification> = {}): PushNotification => ({
  id: 'n1',
  title: 'Title',
  body: 'Body',
  timestamp: 1,
  read: false,
  ...overrides,
});

describe('towncryerReducer', () => {
  describe('initialization', () => {
    it('sets initialization to loading on INIT_START', () => {
      const state = towncryerReducer(initialTowncryerState, { type: 'INIT_START' });
      expect(state.initialization.status).toBe('loading');
    });

    it('marks initialization successful and stores permission info on INIT_SUCCESS', () => {
      const state = towncryerReducer(initialTowncryerState, {
        type: 'INIT_SUCCESS',
        payload: { hasPermission: true, isPermissionRequested: true },
      });

      expect(state.initialization.status).toBe('success');
      expect(state.hasPermission).toBe(true);
      expect(state.isPermissionRequested).toBe(true);
    });

    it('records the error and sets lastError on INIT_ERROR', () => {
      const error = new Error('boom');
      const state = towncryerReducer(initialTowncryerState, { type: 'INIT_ERROR', payload: error });

      expect(state.initialization.status).toBe('error');
      expect(state.initialization.error).toBe(error);
      expect(state.lastError).toBe(error);
    });
  });

  describe('NOTIFICATION_RECEIVED', () => {
    it('prepends the notification and increments unreadCount', () => {
      const state: TowncryerState = {
        ...initialTowncryerState,
        notifications: { status: 'success', data: [notification({ id: 'existing' })], error: null },
        unreadCount: 1,
      };

      const incoming = notification({ id: 'new' });
      const next = towncryerReducer(state, { type: 'NOTIFICATION_RECEIVED', payload: incoming });

      expect(next.notifications.data.map((n) => n.id)).toEqual(['new', 'existing']);
      expect(next.unreadCount).toBe(2);
    });
  });

  describe('mark as read', () => {
    const stateWithNotifications: TowncryerState = {
      ...initialTowncryerState,
      notifications: {
        status: 'success',
        data: [notification({ id: 'a' }), notification({ id: 'b' }), notification({ id: 'c' })],
        error: null,
      },
      unreadCount: 3,
    };

    it('marks a single notification read and decrements unreadCount on MARK_READ_SUCCESS', () => {
      const next = towncryerReducer(stateWithNotifications, {
        type: 'MARK_READ_SUCCESS',
        payload: { notificationId: 'b' },
      });

      expect(next.notifications.data.find((n) => n.id === 'b')?.read).toBe(true);
      expect(next.notifications.data.find((n) => n.id === 'a')?.read).toBe(false);
      expect(next.unreadCount).toBe(2);
      expect(next.markRead.status).toBe('success');
    });

    it('never drops unreadCount below zero', () => {
      const zeroUnread: TowncryerState = { ...stateWithNotifications, unreadCount: 0 };
      const next = towncryerReducer(zeroUnread, {
        type: 'MARK_READ_SUCCESS',
        payload: { notificationId: 'a' },
      });

      expect(next.unreadCount).toBe(0);
    });

    it('marks only the succeeded ids read on MARK_ALL_READ_SUCCESS, leaving the rest unread', () => {
      // Simulates a partial failure: only 'a' and 'c' succeeded, 'b' failed and stays unread.
      const next = towncryerReducer(stateWithNotifications, {
        type: 'MARK_ALL_READ_SUCCESS',
        payload: { succeededIds: ['a', 'c'] },
      });

      expect(next.notifications.data.find((n) => n.id === 'a')?.read).toBe(true);
      expect(next.notifications.data.find((n) => n.id === 'b')?.read).toBe(false);
      expect(next.notifications.data.find((n) => n.id === 'c')?.read).toBe(true);
      expect(next.unreadCount).toBe(1);
      expect(next.markRead.status).toBe('success');
    });

    it('never drops unreadCount below zero on MARK_ALL_READ_SUCCESS', () => {
      const zeroUnread: TowncryerState = { ...stateWithNotifications, unreadCount: 0 };
      const next = towncryerReducer(zeroUnread, {
        type: 'MARK_ALL_READ_SUCCESS',
        payload: { succeededIds: ['a', 'b', 'c'] },
      });

      expect(next.unreadCount).toBe(0);
    });

    it('records the error and sets lastError on MARK_READ_ERROR without touching notification data', () => {
      const error = new Error('failed to mark all as read');
      const next = towncryerReducer(stateWithNotifications, { type: 'MARK_READ_ERROR', payload: error });

      expect(next.markRead.status).toBe('error');
      expect(next.markRead.error).toBe(error);
      expect(next.lastError).toBe(error);
      expect(next.notifications.data).toEqual(stateWithNotifications.notifications.data);
    });
  });

  describe('CLEAR_ERROR', () => {
    it('resets every errored slice to idle and clears lastError', () => {
      const error = new Error('boom');
      const erroredState: TowncryerState = {
        ...initialTowncryerState,
        initialization: { status: 'error', data: null, error },
        markRead: { status: 'error', data: null, error },
        stats: { status: 'success', data: null, error: null },
        lastError: error,
      };

      const next = towncryerReducer(erroredState, { type: 'CLEAR_ERROR' });

      expect(next.initialization.status).toBe('idle');
      expect(next.initialization.error).toBeNull();
      expect(next.markRead.status).toBe('idle');
      expect(next.markRead.error).toBeNull();
      // Non-errored slices are left untouched.
      expect(next.stats.status).toBe('success');
      expect(next.lastError).toBeNull();
    });
  });

  it('returns the same state for an unknown action', () => {
    const next = towncryerReducer(initialTowncryerState, { type: 'UNKNOWN' } as any);
    expect(next).toBe(initialTowncryerState);
  });
});
