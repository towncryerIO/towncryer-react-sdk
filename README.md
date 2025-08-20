# Towncryer React SDK

A React component library and hooks for integrating Towncryer notifications into React applications. This SDK wraps the Towncryer Core SDK to provide React-specific components and functionality for managing push notifications.

![Towncryer React SDK](https://via.placeholder.com/800x400?text=Towncryer+React+SDK)

## Features

- **Push Notification UI Components**: Ready-to-use notification banner, badge, center, and permission request components
- **React Context**: Centralized state management for notifications
- **Custom Hooks**: Easy access to notification data and functionality
- **Real-time Updates**: Badge counter updates automatically when new notifications arrive
- **Customizable Styling**: Flexible theming options
- **TypeScript Support**: Full type definitions included

## Installation

```bash
# Using npm
npm install @volvlabs/towncryer-react-sdk @towncryerio/towncryer-js-sdk

# Using yarn
yarn add @volvlabs/towncryer-react-sdk @towncryerio/towncryer-js-sdk
```

## Prerequisites

- React 16.8 or higher (for hooks support)
- Towncryer Core SDK configured with a valid API key
- Firebase configuration for push notifications

## Setup

### 1. Configure the Towncryer SDK

First, initialize the core Towncryer SDK:

```jsx
import { TowncryerSDK } from '@towncryerio/towncryer-js-sdk';

// Initialize the core SDK
const towncryerSDK = new TowncryerSDK({
  accessToken: 'your-towncryer-access-token',
  refreshToken: 'your-towncryer-refresh-token',
  firebaseConfig: {
    apiKey: 'your-firebase-api-key',
    authDomain: 'your-firebase-project.firebaseapp.com',
    projectId: 'your-firebase-project-id',
    storageBucket: 'your-firebase-project.appspot.com',
    messagingSenderId: 'your-firebase-sender-id',
    appId: 'your-firebase-app-id'
  }
});
```

### 2. Wrap your application with the TowncryerProvider

```jsx
import React from 'react';
import { TowncryerProvider } from '@volvlabs/towncryer-react-sdk';

function App() {
  return (
    <TowncryerProvider 
      sdk={towncryerSDK}
      config={{
        // Optional configuration
        theme: {
          // Custom theme options
          banner: {
            backgroundColor: '#ffffff',
            textColor: '#333333',
          },
          badge: {
            backgroundColor: '#ff0000',
            textColor: '#ffffff',
          }
        },
        defaultShowTime: 5000,
        autoCloseNotifications: true,
        notificationCenterPosition: 'top-right'
      }}
    >
      <YourAppComponents />
    </TowncryerProvider>
  );
}
```

## Components

### NotificationBadge

A small badge that displays the number of unread notifications.

```jsx
import { NotificationBadge, useNotifications } from '@volvlabs/towncryer-react-sdk';

function Header() {
  const { toggleNotificationCenter } = useNotifications();
  
  return (
    <div className="header">
      <button onClick={toggleNotificationCenter}>
        Notifications 
        <NotificationBadge 
          count={undefined} // Uses the global unread count by default
          maxCount={99} // Display 99+ if count exceeds this value
          showZero={false} // Hide when count is zero
          className="custom-badge-class"
          style={{ backgroundColor: 'red' }} // Custom inline styles
        />
      </button>
    </div>
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `count` | `number` | `undefined` | Custom count to display; if undefined, uses the unread count from context |
| `maxCount` | `number` | `99` | Maximum count to display before showing '+' |
| `showZero` | `boolean` | `false` | Whether to display the badge when count is zero |
| `className` | `string` | `''` | Additional CSS class names |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles |

### NotificationBanner

Displays a toast-style notification banner when new notifications arrive.

```jsx
import { NotificationBanner } from '@volvlabs/towncryer-react-sdk';

function Notifications() {
  return (
    <NotificationBanner
      notification={notification} // A PushNotification object
      autoClose={true} // Auto close after showTime
      showTime={5000} // Time in ms before auto closing
      position="top-right" // Position on screen
      onClose={() => console.log('Banner closed')}
    />
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `notification` | `PushNotification` | `undefined` | Notification object to display |
| `autoClose` | `boolean` | `true` | Whether to automatically close after a timeout |
| `showTime` | `number` | `5000` | Time in milliseconds before auto-closing |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | Position on screen |
| `onClose` | `() => void` | `undefined` | Callback function when banner closes |
| `className` | `string` | `''` | Additional CSS class names |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles |

### NotificationCenter

A dropdown panel that displays all notifications with read/unread status.

```jsx
import { NotificationCenter, useNotifications } from '@volvlabs/towncryer-react-sdk';

function NotificationPanel() {
  const { showNotificationCenter } = useNotifications();
  
  return (
    <NotificationCenter
      isOpen={showNotificationCenter} // Control visibility externally
      maxHeight="400px"
      maxWidth="350px"
      onClose={() => console.log('Notification center closed')}
    />
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `undefined` | External control of visibility; if undefined, uses context state |
| `onClose` | `() => void` | `undefined` | Callback function when notification center closes |
| `maxHeight` | `string` | `'400px'` | Maximum height of the notification center |
| `maxWidth` | `string` | `'350px'` | Maximum width of the notification center |
| `className` | `string` | `''` | Additional CSS class names |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles |

### PermissionRequest

A button to request notification permissions from the user.

```jsx
import { PermissionRequest } from '@volvlabs/towncryer-react-sdk';

function Settings() {
  return (
    <div className="settings-page">
      <h2>Notification Settings</h2>
      <PermissionRequest 
        buttonText="Enable Push Notifications"
        onPermissionChange={(granted) => {
          if (granted) {
            console.log('Permission granted');
          } else {
            console.log('Permission denied');
          }
        }}
      />
    </div>
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `buttonText` | `string` | `'Enable Notifications'` | Text to display on the button |
| `onPermissionChange` | `(granted: boolean) => void` | `undefined` | Callback when permission status changes |
| `className` | `string` | `''` | Additional CSS class names |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles |

## Hooks

### useNotifications

A custom hook to access and manage notification state.

```jsx
import { useNotifications } from '@volvlabs/towncryer-react-sdk';

function NotificationDashboard() {
  const {
    notifications,
    unreadCount,
    notificationStats,
    markAsRead,
    markAllAsRead,
    openNotificationCenter,
    closeNotificationCenter,
    toggleNotificationCenter,
    requestPermission,
    hasPermission,
    isPermissionRequested,
    getUnreadNotifications,
    getReadNotifications,
    isInitialized,
  } = useNotifications();
  
  return (
    <div>
      <h2>Notifications Dashboard</h2>
      <p>You have {unreadCount} unread notifications</p>
      <button onClick={toggleNotificationCenter}>Toggle Notification Center</button>
      <button onClick={markAllAsRead}>Mark All Read</button>
      
      <h3>Latest Notifications</h3>
      <ul>
        {getUnreadNotifications().slice(0, 5).map(notification => (
          <li key={notification.id} onClick={() => markAsRead(notification.id)}>
            {notification.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### Return Values

| Name | Type | Description |
|------|------|-------------|
| `notifications` | `PushNotification[]` | Array of all notifications |
| `notificationStats` | `PushNotificationStats \| null` | Notification statistics |
| `unreadCount` | `number` | Number of unread notifications |
| `showNotificationCenter` | `boolean` | Whether the notification center is visible |
| `setShowNotificationCenter` | `(show: boolean) => void` | Function to control notification center visibility |
| `openNotificationCenter` | `() => void` | Function to open notification center |
| `closeNotificationCenter` | `() => void` | Function to close notification center |
| `toggleNotificationCenter` | `() => void` | Function to toggle notification center |
| `markAsRead` | `(id: string) => Promise<void>` | Function to mark a notification as read |
| `markAllAsRead` | `() => Promise<void>` | Function to mark all notifications as read |
| `requestPermission` | `() => Promise<boolean>` | Function to request notification permission |
| `hasPermission` | `boolean` | Whether notification permission is granted |
| `isPermissionRequested` | `boolean` | Whether notification permission has been requested |
| `getUnreadNotifications` | `() => PushNotification[]` | Function to get unread notifications |
| `getReadNotifications` | `() => PushNotification[]` | Function to get read notifications |
| `isInitialized` | `boolean` | Whether the SDK is initialized |

## Customization

### Theme Customization

You can customize the appearance of all components using the `theme` prop on the `TowncryerProvider`:

```jsx
const customTheme = {
  // Banner styling
  banner: {
    backgroundColor: '#ffffff',
    textColor: '#333333',
    borderColor: '#e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    maxWidth: '400px'
  },
  // NotificationCenter styling
  center: {
    backgroundColor: '#ffffff',
    headerBackgroundColor: '#f5f5f5',
    textColor: '#333333',
    borderColor: '#e0e0e0',
    borderRadius: '8px',
    maxHeight: '500px',
    maxWidth: '400px'
  },
  // Badge styling
  badge: {
    backgroundColor: '#ff0000',
    textColor: '#ffffff',
    size: '20px',
    position: 'absolute',
    top: '-5px',
    right: '-5px'
  },
  // Permission request button styling
  permissionButton: {
    backgroundColor: '#4caf50',
    textColor: '#ffffff',
    hoverBackgroundColor: '#45a049',
    borderRadius: '4px',
    padding: '8px 16px'
  }
};

<TowncryerProvider 
  sdk={towncryerSDK}
  config={{ theme: customTheme }}
>
  {children}
</TowncryerProvider>
```

### Component-level Styling

You can also style individual components using the `className` and `style` props:

```jsx
<NotificationBadge 
  className="custom-badge"
  style={{ 
    backgroundColor: '#ff5722', 
    fontWeight: 'bold' 
  }}
/>
```

## Complete Example

Here's a complete example that shows how to integrate all components:

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { TowncryerSDK } from '@towncryerio/towncryer-js-sdk';
import {
  TowncryerProvider,
  NotificationBadge,
  NotificationCenter,
  NotificationBanner,
  PermissionRequest,
  useNotifications
} from '@volvlabs/towncryer-react-sdk';

// Initialize Towncryer SDK
const towncryerSDK = new TowncryerSDK({
  apiKey: 'your-api-key',
  firebaseConfig: {
    apiKey: 'your-firebase-api-key',
    // ...other firebase config
  }
});

function NotificationsHeader() {
  const { toggleNotificationCenter, unreadCount } = useNotifications();
  
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', padding: '16px' }}>
      <h1>My App</h1>
      <div>
        <button 
          onClick={toggleNotificationCenter}
          style={{ position: 'relative' }}
        >
          🔔 
          <NotificationBadge />
        </button>
        <PermissionRequest />
      </div>
      <NotificationCenter />
    </header>
  );
}

function App() {
  return (
    <TowncryerProvider sdk={towncryerSDK}>
      <NotificationsHeader />
      <main>
        <h1>Welcome to My App</h1>
        <p>This app demonstrates the Towncryer React SDK integration.</p>
      </main>
    </TowncryerProvider>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
```

## Browser Support

This SDK supports all modern browsers that support Firebase Cloud Messaging:
- Chrome
- Firefox
- Safari
- Edge
- Opera

## Troubleshooting

### Notifications Not Working in Development

When testing notifications locally:
1. Ensure your app is served over HTTPS (required for service workers)
2. Check browser console for any errors
3. Verify Firebase configuration is correct
4. Make sure to test on a supported browser

### Permission Issues

If users aren't receiving the permission prompt:
1. Check if `requestPermission` is being called
2. Ensure the site is served over HTTPS
3. Some browsers may block permission requests if the user has denied them multiple times

## License

Commercial license - VolvLabs
