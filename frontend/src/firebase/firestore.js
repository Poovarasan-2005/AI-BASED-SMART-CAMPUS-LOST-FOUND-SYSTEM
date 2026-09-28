import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

// ----------------------------------------------------
// USERS & PROFILES
// ----------------------------------------------------
export async function getFirestoreUser(uid) {
  if (!isFirebaseConfigured) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateFirestoreUser(uid, data) {
  if (!isFirebaseConfigured) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });
}

// ----------------------------------------------------
// LOST ITEMS
// ----------------------------------------------------
export async function createFirestoreLostItem(itemData, userId) {
  if (!isFirebaseConfigured) return null;
  const colRef = collection(db, 'lostItems');
  const docRef = await addDoc(colRef, {
    ...itemData,
    userId,
    status: 'ACTIVE',
    matchingStatus: 'PENDING',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: docRef.id, ...itemData };
}

export async function getFirestoreLostItemsByUser(userId) {
  if (!isFirebaseConfigured) return [];
  const q = query(
    collection(db, 'lostItems'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllActiveLostItems(limitCount = 50) {
  if (!isFirebaseConfigured) return [];
  const q = query(
    collection(db, 'lostItems'),
    where('status', '==', 'ACTIVE'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ----------------------------------------------------
// FOUND ITEMS
// ----------------------------------------------------
export async function createFirestoreFoundItem(itemData, userId) {
  if (!isFirebaseConfigured) return null;
  const colRef = collection(db, 'foundItems');
  const docRef = await addDoc(colRef, {
    ...itemData,
    userId,
    status: 'ACTIVE',
    matchingStatus: 'PENDING',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: docRef.id, ...itemData };
}

export async function getFirestoreFoundItemsByUser(userId) {
  if (!isFirebaseConfigured) return [];
  const q = query(
    collection(db, 'foundItems'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllActiveFoundItems(limitCount = 50) {
  if (!isFirebaseConfigured) return [];
  const q = query(
    collection(db, 'foundItems'),
    where('status', '==', 'ACTIVE'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ----------------------------------------------------
// REAL-TIME CONVERSATIONS & MESSAGES
// ----------------------------------------------------
export function subscribeToUserConversations(userId, callback) {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );

  return onSnapshot(q, (snap) => {
    const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(convs);
  }, (err) => {
    console.error('Conversation subscription error:', err);
  });
}

export function subscribeToMessages(conversationId, callback) {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('sentAt', 'asc')
  );

  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(msgs);
  }, (err) => {
    console.error('Messages subscription error:', err);
  });
}

export async function sendFirestoreMessage({ conversationId, senderUserId, receiverUserId, senderName, senderRole, messageText }) {
  if (!isFirebaseConfigured) return null;

  const now = serverTimestamp();
  const msgDocRef = await addDoc(collection(db, 'messages'), {
    conversationId,
    senderUserId,
    receiverUserId,
    senderName,
    senderRole,
    messageText,
    sentAt: now,
    deliveredAt: now,
    readAt: null,
    status: 'DELIVERED',
    createdAt: now
  });

  // Update conversation lastMessageAt
  const convRef = doc(db, 'conversations', conversationId);
  await updateDoc(convRef, {
    lastMessageAt: now,
    lastMessageText: messageText,
    updatedAt: now
  });

  return { id: msgDocRef.id };
}

export async function markMessagesAsSeen(conversationId, currentUserId) {
  if (!isFirebaseConfigured) return;

  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    where('receiverUserId', '==', currentUserId),
    where('status', '!=', 'SEEN')
  );

  const snap = await getDocs(q);
  const now = serverTimestamp();
  const promises = snap.docs.map(d => updateDoc(d.ref, { status: 'SEEN', readAt: now }));
  await Promise.all(promises);
}

// ----------------------------------------------------
// NOTIFICATIONS
// ----------------------------------------------------
export function subscribeToNotifications(userId, callback) {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(30)
  );

  return onSnapshot(q, (snap) => {
    const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(notifs);
  }, (err) => {
    console.error('Notifications subscription error:', err);
  });
}

export async function createFirestoreNotification({ userId, type, title, message, link = '', relatedItemId = null, relatedMatchId = null }) {
  if (!isFirebaseConfigured) return null;
  return await addDoc(collection(db, 'notifications'), {
    userId,
    type, // "AI_MATCH", "VERIFICATION_REQUEST", "MESSAGE", "SYSTEM"
    title,
    message,
    link,
    relatedItemId,
    relatedMatchId,
    read: false,
    createdAt: serverTimestamp()
  });
}

export async function markNotificationAsRead(notificationId) {
  if (!isFirebaseConfigured) return;
  const notifRef = doc(db, 'notifications', notificationId);
  await updateDoc(notifRef, { read: true });
}

// ----------------------------------------------------
// AUDIT LOGS
// ----------------------------------------------------
export async function logFirestoreAuditEvent({ actorId, actorRole, action, targetType, targetId, metadata = {} }) {
  if (!isFirebaseConfigured) return;
  try {
    await addDoc(collection(db, 'auditLogs'), {
      actorId,
      actorRole,
      action,
      targetType,
      targetId,
      metadata,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.warn('Audit logging warning:', e);
  }
}
