import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Live Firebase configuration for AI-BASED LOST AND FOUND SYSTEM
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDpmW4WH2XHXnjaFLOunROzb0qM5KTFK8Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ai-based-lost-and-found-system.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ai-based-lost-and-found-system",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ai-based-lost-and-found-system.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "548680433603",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:548680433603:web:e0dde48bbc725a826c8776",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-P6Q5450R0D"
};

// Singleton App Initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Core Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Always active with live credentials
export const isFirebaseConfigured = true;

export default app;
