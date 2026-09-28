import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import app, { isFirebaseConfigured } from './config';
import { updateFirestoreUser } from './firestore';

let messaging = null;

/**
 * Initializes Firebase Cloud Messaging if supported in browser environment.
 */
export async function initializeFCM() {
  if (!isFirebaseConfigured) return null;

  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
      return messaging;
    }
  } catch (err) {
    console.warn('FCM is not supported in this environment:', err);
  }
  return null;
}

/**
 * Requests notification permission and retrieves device registration token.
 */
export async function requestFCMToken(userId, vapidKey = '') {
  if (!isFirebaseConfigured) return null;

  try {
    const msg = messaging || await initializeFCM();
    if (!msg) return null;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(msg, { vapidKey: vapidKey || undefined });
      if (currentToken && userId) {
        // Save FCM device token in user's profile
        await updateFirestoreUser(userId, { fcmToken: currentToken });
      }
      return currentToken;
    }
  } catch (err) {
    console.warn('Unable to get FCM token:', err);
  }
  return null;
}

/**
 * Subscribes to incoming push notifications while application is in foreground.
 */
export function onForegroundMessage(callback) {
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}
