import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationCenter } from './NotificationCenter';
import { createMockNotification, MockTowncryerProvider, MockTowncryerContextOverrides } from '../testing';

function renderCenter(
  props: React.ComponentProps<typeof NotificationCenter> = {},
  overrides: MockTowncryerContextOverrides = {}
) {
  return render(
    <MockTowncryerProvider {...overrides}>
      <NotificationCenter {...props} />
    </MockTowncryerProvider>
  );
}

describe('NotificationCenter', () => {
  it('renders nothing when closed via context and no isOpen prop is given', () => {
    renderCenter({}, { showNotificationCenter: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when open via context', () => {
    renderCenter({}, { showNotificationCenter: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('lets the isOpen prop override the context visibility', () => {
    renderCenter({ isOpen: true }, { showNotificationCenter: false });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows an empty state when there are no notifications', () => {
    renderCenter({ isOpen: true }, { notifications: [] });
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  it('lists each notification title and body', () => {
    const notifications = [
      createMockNotification({ id: 'a', title: 'First', body: 'First body' }),
      createMockNotification({ id: 'b', title: 'Second', body: 'Second body' }),
    ];
    renderCenter({ isOpen: true }, { notifications });

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('First body')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Second body')).toBeInTheDocument();
  });

  it('marks a notification read when clicked', async () => {
    const markAsRead = jest.fn().mockResolvedValue(undefined);
    const notifications = [createMockNotification({ id: 'a', title: 'First' })];
    renderCenter({ isOpen: true }, { notifications, markAsRead });

    await userEvent.click(screen.getByText('First'));

    expect(markAsRead).toHaveBeenCalledWith('a');
  });

  it('marks all notifications read when "Mark all read" is clicked', async () => {
    const markAllAsRead = jest.fn().mockResolvedValue(undefined);
    renderCenter({ isOpen: true }, { markAllAsRead });

    await userEvent.click(screen.getByRole('button', { name: 'Mark all read' }));

    expect(markAllAsRead).toHaveBeenCalled();
  });

  it('closes the notification center and calls onClose when closed', async () => {
    const setShowNotificationCenter = jest.fn();
    const onClose = jest.fn();
    renderCenter({ isOpen: true, onClose }, { setShowNotificationCenter });

    await userEvent.click(screen.getByRole('button', { name: 'Close notification center' }));

    expect(setShowNotificationCenter).toHaveBeenCalledWith(false);
    expect(onClose).toHaveBeenCalled();
  });
});
