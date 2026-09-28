import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  getIdToken
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Registers a new user with Firebase Auth and initializes Firestore profile.
 */
export async function registerWithFirebase({ email, password, fullName, role = 'LOST_USER', phone = '', department = 'General', year = '2026' }) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase configuration is missing in environment variables.');
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update Auth Display Name
  await updateProfile(user, { displayName: fullName });

  // Send Email Verification
  try {
    await sendEmailVerification(user);
  } catch (e) {
    console.warn('Email verification dispatch warning:', e);
  }

  // Create Firestore User Document
  const userRef = doc(db, 'users', user.uid);
  const profileData = {
    uid: user.uid,
    id: user.uid,
    uuid: user.uid,
    fullName: fullName,
    email: email.toLowerCase().trim(),
    phone: phone,
    mobile: phone,
    phoneVerified: false,
    department: department,
    year: year,
    role: role, // "LOST_USER" or "FOUND_USER" (ADMIN must be assigned by Admin)
    accountStatus: 'ACTIVE',
    emailVerified: user.emailVerified,
    photoURL: user.photoURL || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp()
  };

  await setDoc(userRef, profileData, { merge: true });

  const token = await getIdToken(user, true);
  return { user: profileData, token, firebaseUser: user };
}

/**
 * Signs in user with email/password and retrieves Firestore user profile.
 */
export async function loginWithFirebase(email, password) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase configuration is missing in environment variables.');
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Retrieve user document from Firestore
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  let profileData;
  if (userSnap.exists()) {
    profileData = userSnap.data();
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      emailVerified: user.emailVerified
    });
  } else {
    // Self-heal profile document if missing
    profileData = {
      uid: user.uid,
      id: user.uid,
      uuid: user.uid,
      fullName: user.displayName || 'User',
      email: user.email,
      role: 'LOST_USER',
      accountStatus: 'ACTIVE',
      emailVerified: user.emailVerified,
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    };
    await setDoc(userRef, profileData);
  }

  const token = await getIdToken(user);
  return { user: profileData, token, firebaseUser: user };
}

/**
 * Signs in with Google Popup and synchronizes Firestore user profile.
 */
export async function loginWithGoogle(defaultRole = 'LOST_USER') {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase configuration is missing in environment variables.');
  }

  const userCredential = await signInWithPopup(auth, googleProvider);
  const user = userCredential.user;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  let profileData;
  if (userSnap.exists()) {
    profileData = userSnap.data();
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      emailVerified: user.emailVerified,
      photoURL: user.photoURL || profileData.photoURL || ''
    });
  } else {
    profileData = {
      uid: user.uid,
      id: user.uid,
      uuid: user.uid,
      fullName: user.displayName || 'Google User',
      email: user.email,
      phone: user.phoneNumber || '',
      mobile: user.phoneNumber || '',
      phoneVerified: Boolean(user.phoneNumber),
      role: defaultRole,
      accountStatus: 'ACTIVE',
      emailVerified: user.emailVerified,
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    };
    await setDoc(userRef, profileData);
  }

  const token = await getIdToken(user);
  return { user: profileData, token, firebaseUser: user };
}

/**
 * Sends a password reset email.
 */
export async function resetFirebasePassword(email) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase configuration is missing in environment variables.');
  }
  await sendPasswordResetEmail(auth, email);
  return { message: `Password reset email sent to ${email}. Please check your inbox.` };
}

/**
 * Resends email verification link to current authenticated user.
 */
export async function resendFirebaseVerification() {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
    return { message: 'Verification email sent.' };
  }
  throw new Error('No user is currently signed in.');
}

/**
 * Signs out current user from Firebase.
 */
export async function logoutFromFirebase() {
  if (isFirebaseConfigured) {
    await signOut(auth);
  }
}

/**
 * Subscribes to Firebase Auth state transitions.
 */
export function onFirebaseAuthStateChanged(callback) {
  if (!isFirebaseConfigured) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        const token = await getIdToken(firebaseUser);

        if (userSnap.exists()) {
          callback({ user: userSnap.data(), token, firebaseUser });
        } else {
          callback({
            user: {
              uid: firebaseUser.uid,
              id: firebaseUser.uid,
              email: firebaseUser.email,
              fullName: firebaseUser.displayName || 'User',
              role: 'LOST_USER'
            },
            token,
            firebaseUser
          });
        }
      } catch (err) {
        console.error('Error in onAuthStateChanged:', err);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}
