import '@testing-library/jest-dom';

// jsdom does not implement the Notification API. TowncryerProvider reads
// `Notification.permission` during initialization, so stub a minimal version
// here; individual tests can override `Notification.permission` as needed.
if (typeof (global as any).Notification === 'undefined') {
  (global as any).Notification = class {
    static permission: NotificationPermission = 'default';
    static requestPermission = jest.fn().mockResolvedValue('default');
    constructor(_title: string, _options?: unknown) {}
  };
}
