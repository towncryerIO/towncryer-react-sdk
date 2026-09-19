import React, { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { useNotifications } from './useNotifications';
import { createMockNotification, MockTowncryerProvider, MockTowncryerContextOverrides } from '../testing';

function renderWithMock(overrides: MockTowncryerContextOverrides = {}) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MockTowncryerProvider {...overrides}>{children}</MockTowncryerProvider>
  );
  return renderHook(() => useNotifications(), { wrapper });
}

describe('useNotifications', () => {
  it('exposes the raw notifications, stats and unreadCount from context', () => {
    const notifications = [createMockNotification({ id: 'a' }), createMockNotification({ id: 'b', read: true })];
    const { result } = renderWithMock({ notifications, notificationStats: { total: 2, unread: 1, lastUpdated: 0 } });

    expect(result.current.notifications).toEqual(notifications);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.notificationStats).toEqual({ total: 2, unread: 1, lastUpdated: 0 });
  });

  describe('getUnreadNotifications / getReadNotifications', () => {
    it('partitions notifications by read state', () => {
      const unread = createMockNotification({ id: 'unread', read: false });
      const read = createMockNotification({ id: 'read', read: true });
      const { result } = renderWithMock({ notifications: [unread, read] });

      expect(result.current.getUnreadNotifications()).toEqual([unread]);
      expect(result.current.getReadNotifications()).toEqual([read]);
    });

    it('returns empty arrays when there are no notifications', () => {
      const { result } = renderWithMock({ notifications: [] });

      expect(result.current.getUnreadNotifications()).toEqual([]);
      expect(result.current.getReadNotifications()).toEqual([]);
    });
  });

  describe('notification center visibility', () => {
    it('openNotificationCenter calls setShowNotificationCenter(true)', () => {
      const setShowNotificationCenter = jest.fn();
      const { result } = renderWithMock({ setShowNotificationCenter });

      act(() => {
        result.current.openNotificationCenter();
      });

      expect(setShowNotificationCenter).toHaveBeenCalledWith(true);
    });

    it('closeNotificationCenter calls setShowNotificationCenter(false)', () => {
      const setShowNotificationCenter = jest.fn();
      const { result } = renderWithMock({ setShowNotificationCenter });

      act(() => {
        result.current.closeNotificationCenter();
      });

      expect(setShowNotificationCenter).toHaveBeenCalledWith(false);
    });

    it('toggleNotificationCenter flips the current visibility', () => {
      const setShowNotificationCenter = jest.fn();
      const { result } = renderWithMock({ showNotificationCenter: true, setShowNotificationCenter });

      act(() => {
        result.current.toggleNotificationCenter();
      });

      expect(setShowNotificationCenter).toHaveBeenCalledWith(false);
    });
  });

  it('forwards markAsRead/markAllAsRead/fetchNotifications/fetchNotificationStats to context', async () => {
    const markAsRead = jest.fn().mockResolvedValue(undefined);
    const markAllAsRead = jest.fn().mockResolvedValue(undefined);
    const fetchNotifications = jest.fn().mockResolvedValue(true);
    const fetchNotificationStats = jest.fn().mockResolvedValue(undefined);
    const { result } = renderWithMock({ markAsRead, markAllAsRead, fetchNotifications, fetchNotificationStats });

    await act(async () => {
      await result.current.markAsRead('id-1');
      await result.current.markAllAsRead();
      await result.current.fetchNotifications(1, 20);
      await result.current.fetchNotificationStats();
    });

    expect(markAsRead).toHaveBeenCalledWith('id-1');
    expect(markAllAsRead).toHaveBeenCalled();
    expect(fetchNotifications).toHaveBeenCalledWith(1, 20);
    expect(fetchNotificationStats).toHaveBeenCalled();
  });

  it('exposes permission state and requestPermission from context', async () => {
    const requestPermission = jest.fn().mockResolvedValue(true);
    const { result } = renderWithMock({ hasPermission: false, isPermissionRequested: true, requestPermission });

    expect(result.current.hasPermission).toBe(false);
    expect(result.current.isPermissionRequested).toBe(true);

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(requestPermission).toHaveBeenCalled();
  });

  it('exposes error state and clearError from context', () => {
    const clearError = jest.fn();
    const error = new Error('boom');
    const { result } = renderWithMock({ error, clearError });

    expect(result.current.error).toBe(error);

    act(() => {
      result.current.clearError();
    });

    expect(clearError).toHaveBeenCalled();
  });

  it('exposes per-operation status fields from context', () => {
    const { result } = renderWithMock({
      initializationStatus: 'success',
      notificationsStatus: 'loading',
      statsStatus: 'error',
      markReadStatus: 'idle',
    });

    expect(result.current.initializationStatus).toBe('success');
    expect(result.current.notificationsStatus).toBe('loading');
    expect(result.current.statsStatus).toBe('error');
    expect(result.current.markReadStatus).toBe('idle');
  });
});
