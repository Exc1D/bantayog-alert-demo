import { useState, useEffect, useCallback, useRef } from 'react';
import { getToken, onMessage, deleteToken } from 'firebase/messaging';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app, getMessagingInstance, isMessagingSupported, db } from '../utils/firebaseConfig';
import { captureException } from '../utils/sentry';

const functions = getFunctions(app, 'us-central1');

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const NOTIFICATION_ASKED_KEY = 'bantayog_notification_asked';
const TOKEN_STORAGE_KEY = 'bantayog_fcm_token';

function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
  return Notification.permission;
}

function checkPushSupport() {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

function formatMunicipalityTopic(municipality) {
  if (!municipality) return null;
  return `municipality_${municipality.toLowerCase().replace(/\s+/g, '_')}`;
}

export function usePushNotifications({ userId, municipality } = {}) {
  const [token, setToken] = useState(null);
  const [permission, setPermission] = useState(getNotificationPermission);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const previousMunicipalityRef = useRef(null);

  // Check browser and Firebase messaging support
  useEffect(() => {
    let mounted = true;

    const checkSupport = async () => {
      const browserSupported = checkPushSupport();
      if (!browserSupported) {
        if (mounted) setIsSupported(false);
        return;
      }

      const messagingSupported = await isMessagingSupported();
      if (mounted) setIsSupported(messagingSupported);
    };

    checkSupport();

    return () => {
      mounted = false;
    };
  }, []);

  // Setup foreground message listener
  useEffect(() => {
    let unsubscribe;

    const setupMessageListener = async () => {
      const messaging = await getMessagingInstance();
      if (!messaging) return;

      unsubscribe = onMessage(messaging, (payload) => {
        const { notification, data } = payload;

        if (notification && Notification.permission === 'granted') {
          const notificationOptions = {
            body: notification.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            data: data,
            tag: data?.tag || 'general',
          };

          new Notification(notification.title, notificationOptions);
        }
      });
    };

    if (isSupported) {
      setupMessageListener();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isSupported]);

  // Store FCM token in user profile in Firestore
  const storeTokenInProfile = useCallback(
    async (fcmToken, userUid) => {
      if (!fcmToken || !userUid) return;

      try {
        const userTokenRef = doc(db, 'users', userUid, 'fcm_tokens', 'current');
        await setDoc(
          userTokenRef,
          {
            token: fcmToken,
            updatedAt: serverTimestamp(),
            platform: 'web',
          },
          { merge: true }
        );
      } catch (err) {
        // Non-critical error - just log it
        console.warn('Failed to store FCM token in profile:', err.message);
      }
    },
    []
  );

  // Get or refresh FCM token
  const getFCMToken = useCallback(async () => {
    try {
      const messaging = await getMessagingInstance();
      if (!messaging) return null;

      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      return currentToken;
    } catch (err) {
      if (err.code === 'messaging/token-subscribe-failed') {
        captureException(err, {
          tags: { component: 'usePushNotifications', action: 'getFCMToken' },
        });
      }
      return null;
    }
  }, []);

  // Auto-request permission on first visit (if user hasn't been asked before)
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return null;
    }

    // Mark that we've asked the user (so we don't ask on every visit)
    localStorage.setItem(NOTIFICATION_ASKED_KEY, 'true');

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setError('Notification permission denied');
        return null;
      }

      const messaging = await getMessagingInstance();
      if (!messaging) {
        setError('Messaging is not supported');
        return null;
      }

      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });

      if (currentToken) {
        setToken(currentToken);
        localStorage.setItem(TOKEN_STORAGE_KEY, currentToken);

        // Store in user profile if logged in
        if (userId) {
          await storeTokenInProfile(currentToken, userId);
        }

        return currentToken;
      } else {
        setError('Failed to get registration token');
        return null;
      }
    } catch (err) {
      captureException(err, {
        tags: { component: 'usePushNotifications', action: 'requestPermission' },
      });
      setError(err.message);
      return null;
    }
  }, [isSupported, userId, storeTokenInProfile]);

  // Auto-subscribe to municipality topic when user logs in or changes municipality (moved after subscribeToTopic definition)
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      // Try to restore token from localStorage
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken) {
        // Verify the token is still valid
        const validToken = await getFCMToken();
        if (validToken && mounted) {
          setToken(validToken);
        } else if (!validToken && storedToken && mounted) {
          // Token might have been invalidated, request a new one
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      }

      if (mounted) {
        setIsInitialized(true);
      }
    };

    if (isSupported) {
      initialize();
    }

    return () => {
      mounted = false;
    };
  }, [isSupported, getFCMToken]);

  // Listen for token refresh
  useEffect(() => {
    let unsubscribe;

    const setupTokenListener = async () => {
      const messaging = await getMessagingInstance();
      if (!messaging) return;

      // Firebase handles token refresh automatically
      // The onMessage callback will be called with a payload containing the new token
    };

    if (isSupported) {
      setupTokenListener();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isSupported]);

  const subscribeToTopic = useCallback(
    async (topic) => {
      if (!topic) return false;

      let effectiveToken = token;
      if (!effectiveToken) {
        effectiveToken = await getFCMToken();
        if (!effectiveToken) {
          // No token - try to get permission first
          const newToken = await requestPermission();
          if (!newToken) return false;
          effectiveToken = newToken;
        }
      }

      try {
        const subscribeFn = httpsCallable(functions, 'subscribeToTopic');

        await subscribeFn({
          token: effectiveToken,
          topic,
        });

        // Update localStorage with latest token
        if (effectiveToken) {
          setToken(effectiveToken);
          localStorage.setItem(TOKEN_STORAGE_KEY, effectiveToken);

          // Store in user profile if logged in
          if (userId) {
            await storeTokenInProfile(effectiveToken, userId);
          }
        }

        return true;
      } catch (err) {
        captureException(err, {
          tags: { component: 'usePushNotifications', action: 'subscribeToTopic' },
        });
        setError(err.message);
        return false;
      }
    },
    [token, userId, getFCMToken, requestPermission, storeTokenInProfile]
  );

  // Auto-subscribe to municipality topic when user logs in or changes municipality
  useEffect(() => {
    if (!userId || !municipality || !isInitialized) return;

    const previousMunicipality = previousMunicipalityRef.current;
    const topic = formatMunicipalityTopic(municipality);

    // Only subscribe if municipality changed
    if (topic && topic !== previousMunicipality) {
      previousMunicipalityRef.current = topic;

      // Auto-subscribe to municipality topic
      subscribeToTopic(topic).catch((err) => {
        console.warn('Auto-subscribe to municipality topic failed:', err.message);
      });
    }
  }, [userId, municipality, isInitialized, subscribeToTopic]);

  const unsubscribeFromTopic = useCallback(
    async (topic) => {
      if (!topic) return false;

      let effectiveToken = token;
      if (!effectiveToken) {
        effectiveToken = await getFCMToken();
        if (!effectiveToken) return false;
      }

      try {
        const unsubscribeFn = httpsCallable(functions, 'unsubscribeFromTopic');
        await unsubscribeFn({ token: effectiveToken, topic });
        return true;
      } catch (err) {
        captureException(err, {
          tags: { component: 'usePushNotifications', action: 'unsubscribeFromTopic' },
        });
        setError(err.message);
        return false;
      }
    },
    [token, getFCMToken]
  );

  const unsubscribeAll = useCallback(async () => {
    try {
      const messaging = await getMessagingInstance();
      if (messaging) {
        await deleteToken(messaging);
      }
      setToken(null);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return true;
    } catch (err) {
      captureException(err, {
        tags: { component: 'usePushNotifications', action: 'unsubscribeAll' },
      });
      setError(err.message);
      return false;
    }
  }, []);

  return {
    token,
    permission,
    isSupported,
    error,
    isInitialized,
    requestPermission,
    subscribeToTopic,
    unsubscribeFromTopic,
    unsubscribeAll,
    formatMunicipalityTopic,
  };
}

export default usePushNotifications;
