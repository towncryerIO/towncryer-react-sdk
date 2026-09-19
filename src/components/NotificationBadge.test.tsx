import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationBadge } from './NotificationBadge';
import { MockTowncryerProvider, MockTowncryerContextOverrides } from '../testing';

function renderBadge(props: React.ComponentProps<typeof NotificationBadge> = {}, overrides: MockTowncryerContextOverrides = {}) {
  return render(
    <MockTowncryerProvider {...overrides}>
      <NotificationBadge {...props} />
    </MockTowncryerProvider>
  );
}

describe('NotificationBadge', () => {
  it('renders the unreadCount from context when no count prop is given', () => {
    renderBadge({}, { unreadCount: 3 });
    expect(screen.getByRole('button')).toHaveTextContent('3');
  });

  it('prefers an explicit count prop over the context unreadCount', () => {
    renderBadge({ count: 7 }, { unreadCount: 3 });
    expect(screen.getByRole('button')).toHaveTextContent('7');
  });

  it('does not render when the count is zero and showZero is false', () => {
    renderBadge({ count: 0 });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a zero badge when showZero is true', () => {
    renderBadge({ count: 0, showZero: true });
    expect(screen.getByRole('button')).toHaveTextContent('0');
  });

  it('caps the displayed count at maxCount, appending a plus', () => {
    renderBadge({ count: 150, maxCount: 99 });
    expect(screen.getByRole('button')).toHaveTextContent('99+');
  });

  it('toggles the notification center when clicked', async () => {
    const setShowNotificationCenter = jest.fn();
    renderBadge({ count: 2 }, { showNotificationCenter: false, setShowNotificationCenter });

    await userEvent.click(screen.getByRole('button'));

    expect(setShowNotificationCenter).toHaveBeenCalledWith(true);
  });
});
