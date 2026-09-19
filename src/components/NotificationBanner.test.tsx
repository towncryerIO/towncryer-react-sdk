import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationBanner } from './NotificationBanner';
import { createMockNotification } from '../testing';

describe('NotificationBanner', () => {
  it('renders nothing when there is no notification', () => {
    const { container } = render(<NotificationBanner autoClose={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the notification title and body', () => {
    const notification = createMockNotification({ title: 'New message', body: 'Hello there' });
    render(<NotificationBanner notification={notification} autoClose={false} />);

    expect(screen.getByText('New message')).toBeInTheDocument();
    expect(screen.getByText('Hello there')).toBeInTheDocument();
  });

  it('falls back to a default title when none is provided', () => {
    const notification = createMockNotification({ title: '' });
    render(<NotificationBanner notification={notification} autoClose={false} />);

    expect(screen.getByText('Notification')).toBeInTheDocument();
  });

  it('calls onClose and hides itself when the close button is clicked', async () => {
    const onClose = jest.fn();
    const notification = createMockNotification();
    render(<NotificationBanner notification={notification} autoClose={false} onClose={onClose} />);

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Close notification' }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('auto-closes after showTime milliseconds when autoClose is true', () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    const notification = createMockNotification();
    render(<NotificationBanner notification={notification} autoClose showTime={1000} onClose={onClose} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('does not auto-close when autoClose is false', () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    const notification = createMockNotification();
    render(<NotificationBanner notification={notification} autoClose={false} showTime={1000} onClose={onClose} />);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(onClose).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
