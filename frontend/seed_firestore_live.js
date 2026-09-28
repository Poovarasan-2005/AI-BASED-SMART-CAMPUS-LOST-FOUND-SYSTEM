import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDpmW4WH2XHXnjaFLOunROzb0qM5KTFK8Y',
  authDomain: 'ai-based-lost-and-found-system.firebaseapp.com',
  projectId: 'ai-based-lost-and-found-system',
  storageBucket: 'ai-based-lost-and-found-system.firebasestorage.app',
  messagingSenderId: '548680433603',
  appId: '1:548680433603:web:e0dde48bbc725a826c8776'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function signInUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

async function main() {
  console.log('====================================================');
  console.log('FIRESTORE LIVE DATABASE SEEDER: POPULATING ALL COLLECTIONS');
  console.log('Project: ai-based-lost-and-found-system');
  console.log('====================================================');

  // 1. Sign in as Lost User and create their own profile
  console.log('\n--- 1. Seeding `users` Collection ---');
  const lostUser = await signInUser('lost.student@campuslostfound.edu', 'CampusLost123!');
  console.log('Signed in as Lost User:', lostUser.uid);
  await setDoc(doc(db, 'users', lostUser.uid), {
    uid: lostUser.uid,
    fullName: 'Alexander Pierce',
    email: 'lost.student@campuslostfound.edu',
    phone: '+1 987-654-3210',
    phoneVerified: true,
    role: 'LOST_USER',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    fcmToken: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp()
  }, { merge: true });
  console.log('✓ Lost User profile written to `users`');

  // 2. Sign in as Found User and create their own profile
  const foundUser = await signInUser('found.student@campuslostfound.edu', 'CampusFound123!');
  console.log('Signed in as Found User:', foundUser.uid);
  await setDoc(doc(db, 'users', foundUser.uid), {
    uid: foundUser.uid,
    fullName: 'Sophia Bennett',
    email: 'found.student@campuslostfound.edu',
    phone: '+1 987-654-3211',
    phoneVerified: true,
    role: 'FOUND_USER',
    department: 'Electrical Engineering',
    year: '2nd Year',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    fcmToken: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp()
  }, { merge: true });
  console.log('✓ Found User profile written to `users`');

  // 3. Write Lost Items as Lost User
  await signInUser('lost.student@campuslostfound.edu', 'CampusLost123!');
  console.log('\n--- 2. Seeding `lostItems` Collection ---');
  const lostItemId = 'lost-item-001';
  await setDoc(doc(db, 'lostItems', lostItemId), {
    id: lostItemId,
    userId: lostUser.uid,
    title: 'Space Gray MacBook Pro 14"',
    category: 'Electronics & Laptops',
    description: '14-inch Apple MacBook Pro M2 with university stickers on top cover and black hard shell.',
    brand: 'Apple',
    model: 'MacBook Pro 14 (2023)',
    color: 'Space Gray',
    lostLocation: 'Main Engineering Library - 3rd Floor Quiet Study Pods',
    lostDate: '2026-09-26',
    lostTime: '16:45',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    secretAttribute: 'Sticker: "Python Guild 2025" and serial ending in 89M',
    aiFingerprint: {
      tags: ['laptop', 'macbook', 'space gray', 'apple', 'stickers'],
      vector_dim: 128,
      confidence_score: 0.96
    },
    status: 'ACTIVE',
    matchingStatus: 'REVIEWED',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  const lostItemId2 = 'lost-item-002';
  await setDoc(doc(db, 'lostItems', lostItemId2), {
    id: lostItemId2,
    userId: lostUser.uid,
    title: 'Sony WH-1000XM5 Wireless Headphones',
    category: 'Audio & Headphones',
    description: 'Silver/Platinum Sony noise-canceling headphones inside dark gray carrying case.',
    brand: 'Sony',
    model: 'WH-1000XM5',
    color: 'Silver',
    lostLocation: 'Student Cafeteria - Booth #14',
    lostDate: '2026-09-27',
    lostTime: '12:15',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
    secretAttribute: 'Small initials "AP" marked with silver marker inside right ear cup',
    aiFingerprint: {
      tags: ['headphones', 'sony', 'silver', 'wireless', 'over-ear'],
      vector_dim: 128,
      confidence_score: 0.94
    },
    status: 'ACTIVE',
    matchingStatus: 'PENDING',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  console.log('✓ `lostItems` collection populated (2 items).');

  // 4. Write Found Items as Found User
  await signInUser('found.student@campuslostfound.edu', 'CampusFound123!');
  console.log('\n--- 3. Seeding `foundItems` Collection ---');
  const foundItemId = 'found-item-001';
  await setDoc(doc(db, 'foundItems', foundItemId), {
    id: foundItemId,
    userId: foundUser.uid,
    title: 'Apple MacBook Pro Laptop in Black Hard Shell',
    category: 'Electronics & Laptops',
    description: 'Found a space gray Apple MacBook laptop with a protective black case left behind on study desk.',
    brand: 'Apple',
    model: 'MacBook Pro',
    color: 'Space Gray',
    foundLocation: 'Main Engineering Library - 3rd Floor Desk #42',
    foundDate: '2026-09-26',
    foundTime: '17:30',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    aiFingerprint: {
      tags: ['laptop', 'macbook', 'space gray', 'apple', 'hard shell'],
      vector_dim: 128,
      confidence_score: 0.95
    },
    status: 'ACTIVE',
    matchingStatus: 'REVIEWED',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  const foundItemId2 = 'found-item-002';
  await setDoc(doc(db, 'foundItems', foundItemId2), {
    id: foundItemId2,
    userId: foundUser.uid,
    title: 'Scientific Calculator Casio fx-991EX',
    category: 'Stationery & Calculators',
    description: 'Casio ClassWiz calculator found on bench outside Physics Lecture Hall 101.',
    brand: 'Casio',
    model: 'fx-991EX ClassWiz',
    color: 'Black & White',
    foundLocation: 'Science Complex - Physics Hall 101 Bench',
    foundDate: '2026-09-27',
    foundTime: '10:00',
    imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&auto=format&fit=crop&q=80',
    aiFingerprint: {
      tags: ['calculator', 'casio', 'scientific', 'classwiz'],
      vector_dim: 128,
      confidence_score: 0.92
    },
    status: 'ACTIVE',
    matchingStatus: 'PENDING',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  console.log('✓ `foundItems` collection populated (2 items).');

  // 5. Matches Collection (any authenticated user can create match record)
  console.log('\n--- 4. Seeding `matches` Collection ---');
  const matchId = 'match-001';
  await setDoc(doc(db, 'matches', matchId), {
    id: matchId,
    lostItemId: lostItemId,
    foundItemId: foundItemId,
    lostUserId: lostUser.uid,
    foundUserId: foundUser.uid,
    matchScore: 0.94,
    confidenceTier: 'HIGH',
    breakdown: {
      visualSimilarity: 0.96,
      textSemanticMatch: 0.95,
      locationProximity: 0.92,
      timeProximity: 0.93
    },
    status: 'PENDING',
    notifiedLostUser: true,
    notifiedFoundUser: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  console.log('✓ `matches` collection populated (1 AI match).');

  // 6. Verification Requests (requester_user_id must match auth.uid)
  await signInUser('lost.student@campuslostfound.edu', 'CampusLost123!');
  console.log('\n--- 5. Seeding `verificationRequests` Collection ---');
  const verificationRequestId = 'verify-req-001';
  await setDoc(doc(db, 'verificationRequests', verificationRequestId), {
    id: verificationRequestId,
    found_item_id: foundItemId,
    lost_item_id: lostItemId,
    requester_user_id: lostUser.uid,
    recipient_user_id: foundUser.uid,
    requester_name: 'Alexander Pierce',
    requester_email: 'lost.student@campuslostfound.edu',
    requester_mobile: '+1 987-654-3210',
    claim_details: 'Hi! I left my MacBook on the 3rd floor study pod right before 5 PM. It has a Python sticker on it.',
    verification_status: 'PENDING',
    otp_code: '482910',
    otp_verified: false,
    otp_expires_at: '2026-09-28T12:00:00Z',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  }, { merge: true });
  console.log('✓ `verificationRequests` collection populated (1 request).');

  // 7. Conversations (participants must include auth.uid)
  console.log('\n--- 6. Seeding `conversations` Collection ---');
  const conversationId = 'conv-001';
  await setDoc(doc(db, 'conversations', conversationId), {
    id: conversationId,
    verificationRequestId: verificationRequestId,
    participants: [lostUser.uid, foundUser.uid],
    lost_user_id: lostUser.uid,
    found_user_id: foundUser.uid,
    lost_item_id: lostItemId,
    found_item_id: foundItemId,
    status: 'ACTIVE',
    lastMessageText: 'Hello Alexander! I have your MacBook safe at the Campus Security desk.',
    lastMessageAt: serverTimestamp(),
    handoverConfirmedByFinder: false,
    handoverConfirmedByOwner: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  console.log('✓ `conversations` collection populated (1 conversation thread).');

  // 8. Messages (senderUserId must match auth.uid)
  console.log('\n--- 7. Seeding `messages` Collection ---');
  const msg1Id = 'msg-001';
  await setDoc(doc(db, 'messages', msg1Id), {
    id: msg1Id,
    conversationId: conversationId,
    senderUserId: lostUser.uid,
    receiverUserId: foundUser.uid,
    senderName: 'Alexander Pierce',
    senderRole: 'LOST_USER',
    messageText: 'Hi Sophia! Thank you so much for finding my MacBook. Can we meet to hand it over?',
    sentAt: serverTimestamp(),
    deliveredAt: serverTimestamp(),
    readAt: serverTimestamp(),
    status: 'SEEN',
    createdAt: serverTimestamp()
  }, { merge: true });

  // Switch to found user for second message
  await signInUser('found.student@campuslostfound.edu', 'CampusFound123!');
  const msg2Id = 'msg-002';
  await setDoc(doc(db, 'messages', msg2Id), {
    id: msg2Id,
    conversationId: conversationId,
    senderUserId: foundUser.uid,
    receiverUserId: lostUser.uid,
    senderName: 'Sophia Bennett',
    senderRole: 'FOUND_USER',
    messageText: 'Hello Alexander! I handed it to the Campus Security desk in Student Center Building A. You can pick it up with your student ID!',
    sentAt: serverTimestamp(),
    deliveredAt: serverTimestamp(),
    readAt: null,
    status: 'DELIVERED',
    createdAt: serverTimestamp()
  }, { merge: true });
  console.log('✓ `messages` collection populated (2 chat messages).');

  // 9. Notifications (any authenticated user can write notification)
  console.log('\n--- 8. Seeding `notifications` Collection ---');
  await setDoc(doc(db, 'notifications', 'notif-001'), {
    id: 'notif-001',
    userId: lostUser.uid,
    type: 'AI_MATCH',
    title: 'High Confidence Match Found! (94%)',
    message: 'An item matching your "Space Gray MacBook Pro 14" was reported found in Main Engineering Library.',
    link: `/matches/${matchId}`,
    relatedItemId: lostItemId,
    relatedMatchId: matchId,
    read: false,
    createdAt: serverTimestamp()
  }, { merge: true });

  await setDoc(doc(db, 'notifications', 'notif-002'), {
    id: 'notif-002',
    userId: foundUser.uid,
    type: 'VERIFICATION_REQUEST',
    title: 'New Ownership Claim Received',
    message: 'Alexander Pierce submitted a claim for the MacBook Pro you reported found.',
    link: `/verification/${verificationRequestId}`,
    relatedItemId: foundItemId,
    relatedMatchId: null,
    read: true,
    createdAt: serverTimestamp()
  }, { merge: true });
  console.log('✓ `notifications` collection populated (2 notifications).');

  // 10. Audit Logs
  console.log('\n--- 9. Seeding `auditLogs` Collection ---');
  await setDoc(doc(db, 'auditLogs', 'log-001'), {
    id: 'log-001',
    actorId: foundUser.uid,
    actorRole: 'FOUND_USER',
    action: 'CREATE_FOUND_REPORT',
    targetType: 'FOUND_ITEM',
    targetId: foundItemId,
    ipAddress: '127.0.0.1',
    metadata: {
      category: 'Electronics & Laptops',
      location: 'Main Engineering Library'
    },
    timestamp: serverTimestamp()
  }, { merge: true });

  await setDoc(doc(db, 'auditLogs', 'log-002'), {
    id: 'log-002',
    actorId: 'SYSTEM_AI_ENGINE',
    actorRole: 'SYSTEM',
    action: 'AI_MATCH_GENERATED',
    targetType: 'MATCH',
    targetId: matchId,
    metadata: {
      score: 0.94,
      lostItemId: lostItemId,
      foundItemId: foundItemId
    },
    timestamp: serverTimestamp()
  }, { merge: true });
  console.log('✓ `auditLogs` collection populated (2 audit log records).');

  // 11. Reports (reporterId must match auth.uid)
  console.log('\n--- 10. Seeding `reports` Collection ---');
  await setDoc(doc(db, 'reports', 'flag-001'), {
    id: 'flag-001',
    reporterId: foundUser.uid,
    reportedItemId: 'item-flagged-demo',
    reportType: 'SUSPICIOUS_LISTING',
    reason: 'Duplicate listing or incorrect serial information reported.',
    status: 'UNDER_REVIEW',
    adminNotes: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  console.log('✓ `reports` collection populated (1 moderation report).');

  console.log('\n====================================================');
  console.log('SUCCESS! ALL 10 FIRESTORE COLLECTIONS POPULATED LIVE!');
  console.log('Collections now visible in Firebase Console:');
  console.log('  1. users');
  console.log('  2. lostItems');
  console.log('  3. foundItems');
  console.log('  4. matches');
  console.log('  5. verificationRequests');
  console.log('  6. conversations');
  console.log('  7. messages');
  console.log('  8. notifications');
  console.log('  9. auditLogs');
  console.log('  10. reports');
  console.log('====================================================');
  process.exit(0);
}

main().catch(err => {
  console.error('\n[FATAL ERROR SEEDING FIRESTORE]:', err);
  process.exit(1);
});
