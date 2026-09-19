import { AsyncStatus, PushNotification, PushNotificationStats } from '../types';

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T;
  error: Error | null;
}

const idle = <T>(data: T): AsyncState<T> => ({ status: 'idle', data, error: null });

export interface TowncryerState {
  /** SDK bootstrap: sets up the push service and reads the initial permission state. */
  initialization: AsyncState<null>;
  /** A user-triggered `requestPermission()` call. Tracked separately from `initialization` so a
   *  failed permission request never flips `isInitialized` back to false. */
  permissionRequest: AsyncState<null>;
  notifications: AsyncState<PushNotification[]>;
  stats: AsyncState<PushNotificationStats | null>;
  markRead: AsyncState<null>;
  hasPermission: boolean;
  isPermissionRequested: boolean;
  unreadCount: number;
  /** The most recent error across any operation, independent of per-operation status. */
  lastError: Error | null;
}

export const initialTowncryerState: TowncryerState = {
  initialization: idle(null),
  permissionRequest: idle(null),
  notifications: idle([]),
  stats: idle(null),
  markRead: idle(null),
  hasPermission: false,
  isPermissionRequested: false,
  unreadCount: 0,
  lastError: null,
};

export type TowncryerAction =
  | { type: 'INIT_START' }
  | { type: 'INIT_SUCCESS'; payload: { hasPermission: boolean; isPermissionRequested: boolean } }
  | { type: 'INIT_ERROR'; payload: Error }
  | { type: 'PERMISSION_REQUEST_START' }
  | { type: 'PERMISSION_REQUEST_SUCCESS'; payload: { hasPermission: boolean } }
  | { type: 'PERMISSION_REQUEST_ERROR'; payload: Error }
  | { type: 'NOTIFICATION_RECEIVED'; payload: PushNotification }
  | { type: 'NOTIFICATIONS_FETCH_START' }
  | { type: 'NOTIFICATIONS_FETCH_SUCCESS' }
  | { type: 'NOTIFICATIONS_FETCH_ERROR'; payload: Error }
  | { type: 'STATS_FETCH_START' }
  | { type: 'STATS_FETCH_SUCCESS'; payload: PushNotificationStats }
  | { type: 'STATS_FETCH_ERROR'; payload: Error }
  | { type: 'MARK_READ_START' }
  | { type: 'MARK_READ_SUCCESS'; payload: { notificationId: string } }
  | { type: 'MARK_ALL_READ_SUCCESS' }
  | { type: 'MARK_READ_ERROR'; payload: Error }
  | { type: 'CLEAR_ERROR' };

const clearIfErrored = <T>(slice: AsyncState<T>): AsyncState<T> =>
  slice.status === 'error' ? { ...slice, status: 'idle', error: null } : slice;

export function towncryerReducer(state: TowncryerState, action: TowncryerAction): TowncryerState {
  switch (action.type) {
    case 'INIT_START':
      return { ...state, initialization: { ...state.initialization, status: 'loading', error: null } };
    case 'INIT_SUCCESS':
      return {
        ...state,
        initialization: { status: 'success', data: null, error: null },
        hasPermission: action.payload.hasPermission,
        isPermissionRequested: action.payload.isPermissionRequested,
      };
    case 'INIT_ERROR':
      return {
        ...state,
        initialization: { ...state.initialization, status: 'error', error: action.payload },
        lastError: action.payload,
      };

    case 'PERMISSION_REQUEST_START':
      return {
        ...state,
        permissionRequest: { ...state.permissionRequest, status: 'loading', error: null },
        isPermissionRequested: true,
      };
    case 'PERMISSION_REQUEST_SUCCESS':
      return {
        ...state,
        permissionRequest: { status: 'success', data: null, error: null },
        hasPermission: action.payload.hasPermission,
      };
    case 'PERMISSION_REQUEST_ERROR':
      return {
        ...state,
        permissionRequest: { ...state.permissionRequest, status: 'error', error: action.payload },
        lastError: action.payload,
      };

    case 'NOTIFICATION_RECEIVED':
      return {
        ...state,
        notifications: {
          status: 'success',
          data: [action.payload, ...state.notifications.data],
          error: null,
        },
        unreadCount: state.unreadCount + 1,
      };

    case 'NOTIFICATIONS_FETCH_START':
      return { ...state, notifications: { ...state.notifications, status: 'loading', error: null } };
    case 'NOTIFICATIONS_FETCH_SUCCESS':
      return { ...state, notifications: { ...state.notifications, status: 'success', error: null } };
    case 'NOTIFICATIONS_FETCH_ERROR':
      return {
        ...state,
        notifications: { ...state.notifications, status: 'error', error: action.payload },
        lastError: action.payload,
      };

    case 'STATS_FETCH_START':
      return { ...state, stats: { ...state.stats, status: 'loading', error: null } };
    case 'STATS_FETCH_SUCCESS':
      return {
        ...state,
        stats: { status: 'success', data: action.payload, error: null },
        unreadCount: action.payload.unread,
      };
    case 'STATS_FETCH_ERROR':
      return {
        ...state,
        stats: { ...state.stats, status: 'error', error: action.payload },
        lastError: action.payload,
      };

    case 'MARK_READ_START':
      return { ...state, markRead: { ...state.markRead, status: 'loading', error: null } };
    case 'MARK_READ_SUCCESS':
      return {
        ...state,
        markRead: { status: 'success', data: null, error: null },
        notifications: {
          ...state.notifications,
          data: state.notifications.data.map(notification =>
            notification.id === action.payload.notificationId
              ? { ...notification, read: true }
              : notification
          ),
        },
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case 'MARK_ALL_READ_SUCCESS':
      return {
        ...state,
        markRead: { status: 'success', data: null, error: null },
        notifications: {
          ...state.notifications,
          data: state.notifications.data.map(notification => ({ ...notification, read: true })),
        },
        unreadCount: 0,
      };
    case 'MARK_READ_ERROR':
      return {
        ...state,
        markRead: { ...state.markRead, status: 'error', error: action.payload },
        lastError: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        initialization: clearIfErrored(state.initialization),
        permissionRequest: clearIfErrored(state.permissionRequest),
        notifications: clearIfErrored(state.notifications),
        stats: clearIfErrored(state.stats),
        markRead: clearIfErrored(state.markRead),
        lastError: null,
      };

    default:
      return state;
  }
}
