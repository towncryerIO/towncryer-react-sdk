import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useTowncryer } from './context/TowncryerContext';
import { createMockNotification, createMockTowncryerContextValue, MockTowncryerProvider } from './testing';

describe('createMockNotification', () => {
  it('produces a valid, unread notification with sensible defaults', () => {
    const notification = createMockNotification();
    expect(notification.read).toBe(false);
    expect(notification.title).toBeTruthy();
    expect(notification.body).toBeTruthy();
    expect(typeof notification.id).toBe('string');
    expect(typeof notification.timestamp).toBe('number');
  });

  it('generates unique ids across calls', () => {
    const a = createMockNotification();
    const b = createMockNotification();
    expect(a.id).not.toEqual(b.id);
  });

  it('honors overrides', () => {
    const notification = createMockNotification({ id: 'fixed-id', read: true, title: 'Custom' });
    expect(notification).toMatchObject({ id: 'fixed-id', read: true, title: 'Custom' });
  });
});

describe('createMockTowncryerContextValue', () => {
  it('derives unreadCount from unread notifications when not explicitly overridden', () => {
    const value = createMockTowncryerContextValue({
      notifications: [createMockNotification({ read: false }), createMockNotification({ read: true })],
    });
    expect(value.unreadCount).toBe(1);
  });

  it('lets an explicit unreadCount override the derived value', () => {
    const value = createMockTowncryerContextValue({
      notifications: [createMockNotification({ read: false })],
      unreadCount: 42,
    });
    expect(value.unreadCount).toBe(42);
  });

  it('defaults isInitialized to true so consumers do not need to model SDK bootstrap', () => {
    const value = createMockTowncryerContextValue();
    expect(value.isInitialized).toBe(true);
  });
});

describe('MockTowncryerProvider', () => {
  it('renders children', () => {
    render(
      <MockTowncryerProvider>
        <div>child content</div>
      </MockTowncryerProvider>
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('feeds overrides through to useTowncryer', () => {
    const notifications = [createMockNotification({ id: 'a' })];
    const { result } = renderHook(() => useTowncryer(), {
      wrapper: ({ children }) => (
        <MockTowncryerProvider notifications={notifications} hasPermission>
          {children}
        </MockTowncryerProvider>
      ),
    });

    expect(result.current.notifications).toEqual(notifications);
    expect(result.current.hasPermission).toBe(true);
  });
});
