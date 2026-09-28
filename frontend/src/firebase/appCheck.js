import { initializeAppCheck, ReCaptchaV3Provider, CustomProvider } from 'firebase/app-check';
import app, { isFirebaseConfigured } from './config';

/**
 * Initializes Firebase App Check with reCAPTCHA v3 or Debug Provider.
 */
export function initAppCheck() {
  if (!isFirebaseConfigured || typeof window === 'undefined') {
    return null;
  }

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const isDev = import.meta.env.DEV;

  try {
    if (isDev) {
      // In development, enable debug token
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    if (siteKey) {
      return initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
    }
  } catch (err) {
    console.warn('App Check initialization skipped:', err);
  }
  return null;
}
