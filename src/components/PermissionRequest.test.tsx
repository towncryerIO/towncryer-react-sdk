import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PermissionRequest } from './PermissionRequest';
import { MockTowncryerProvider, MockTowncryerContextOverrides } from '../testing';

function renderPermissionRequest(
  props: React.ComponentProps<typeof PermissionRequest> = {},
  overrides: MockTowncryerContextOverrides = {}
) {
  return render(
    <MockTowncryerProvider {...overrides}>
      <PermissionRequest {...props} />
    </MockTowncryerProvider>
  );
}

describe('PermissionRequest', () => {
  it('renders nothing when permission is already granted', () => {
    renderPermissionRequest({}, { hasPermission: true });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText(/blocked/i)).not.toBeInTheDocument();
  });

  it('shows a blocked message when permission was requested and denied', () => {
    renderPermissionRequest({}, { hasPermission: false, isPermissionRequested: true });
    expect(screen.getByText(/notifications are blocked/i)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the request button with default text when permission has not been requested', () => {
    renderPermissionRequest({}, { hasPermission: false, isPermissionRequested: false });
    expect(screen.getByRole('button', { name: 'Enable Notifications' })).toBeInTheDocument();
  });

  it('renders custom button text', () => {
    renderPermissionRequest({ buttonText: 'Turn on alerts' }, { hasPermission: false, isPermissionRequested: false });
    expect(screen.getByRole('button', { name: 'Turn on alerts' })).toBeInTheDocument();
  });

  it('calls requestPermission and onPermissionChange when clicked', async () => {
    const requestPermission = jest.fn().mockResolvedValue(true);
    const onPermissionChange = jest.fn();
    renderPermissionRequest(
      { onPermissionChange },
      { hasPermission: false, isPermissionRequested: false, requestPermission }
    );

    await userEvent.click(screen.getByRole('button'));

    expect(requestPermission).toHaveBeenCalled();
    expect(onPermissionChange).toHaveBeenCalledWith(true);
  });

  it('calls onPermissionChange with false when permission is denied', async () => {
    const requestPermission = jest.fn().mockResolvedValue(false);
    const onPermissionChange = jest.fn();
    renderPermissionRequest(
      { onPermissionChange },
      { hasPermission: false, isPermissionRequested: false, requestPermission }
    );

    await userEvent.click(screen.getByRole('button'));

    expect(onPermissionChange).toHaveBeenCalledWith(false);
  });
});
