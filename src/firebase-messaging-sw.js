// Firebase Messaging Service Worker
// Firebase v9+ pattern with onBackgroundMessage from firebase/messaging/sw
// This file is bundled by Vite, so import.meta.env.VITE_* variables are replaced at build time

import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
import { firebaseConfig } from '../config/index.js';

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  const { notification, data } = payload;
  console.log('Firebase background message received:', payload);

  if (!notification) {
    return;
  }

  const options = {
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
    tag: data?.tag || 'background-notification',
    renotify: true,
    actions: data?.actions || [],
  };

  // Determine priority based on severity
  if (data?.severity === 'critical') {
    options.priority = 'high';
    options.sticky = true;
    options.requireInteraction = true;
  }

  return self.registration.showNotification(notification.title || 'Bantayog Alert', options);
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
