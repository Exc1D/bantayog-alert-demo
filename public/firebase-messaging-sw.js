// Firebase Messaging Service Worker for Push Notifications
// This file is served as-is from /public and cannot use import.meta.env
// Configuration is provided at runtime via window.__FIREBASE_CONFIG__

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase using runtime config from the main app
const firebaseConfig = window.__FIREBASE_CONFIG__ || {};

if (!firebaseConfig.apiKey) {
  console.warn('Firebase config not available in service worker - push notifications disabled');
} else {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  // Handle background push messages
  messaging.onBackgroundMessage((payload) => {
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
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickAction = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Try to focus an existing window/tab with the same URL
      for (const client of windowClients) {
        if (client.url.endsWith(clickAction) && 'focus' in client) {
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
    self.registration.pushManager.subscribe({ userVisibleOnly: true }).then((subscription) => {
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
