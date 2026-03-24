// Firebase Messaging Service Worker
// This file handles background push notifications from Firebase Cloud Messaging

import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage, setBackgroundMessageHandler } from 'firebase/messaging';

// Firebase configuration - must match the app's firebaseConfig
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Handle background messages
setBackgroundMessageHandler(messaging, (payload) => {
  const { notification, data } = payload;

  if (!notification) {
    return Promise.resolve();
  }

  const notificationTitle = notification.title || 'Bantayog Alert';
  const notificationOptions = {
    body: notification.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data?.url || '/',
      reportId: data?.reportId || null,
      type: data?.type || 'general',
      municipality: data?.municipality || null,
      disasterType: data?.disasterType || null,
      severity: data?.severity || null,
    },
    tag: data?.tag || 'general',
    renotify: true,
    actions: data?.actions || [],
  };

  // Determine priority based on severity
  if (data?.severity === 'critical') {
    notificationOptions.priority = 'high';
    notificationOptions.sticky = true;
    notificationOptions.requireInteraction = true;
  }

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickAction = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Try to focus an existing window/tab with the same URL
      for (const client of windowClients) {
        if (client.url.includes(clickAction) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no existing window, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(clickAction);
      }
    })
  );
});

// Handle push subscription changes (FCM token refresh)
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    registration.pushManager.subscribe({ userVisibleOnly: true }).then((subscription) => {
      // Notify the app about the new subscription
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'push-subscription-change',
            subscription: subscription.toJSON(),
          });
        });
      });
    })
  );
});

export {};
