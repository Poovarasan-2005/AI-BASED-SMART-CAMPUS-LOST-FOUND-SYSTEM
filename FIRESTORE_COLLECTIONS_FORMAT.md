# Cloud Firestore Database Collection Formats & Schema Specification

This specification defines the complete data models, field definitions, Firestore types, and exact JSON documents for all collections in the **AI-Based Smart Campus Lost & Found System** (Firebase Project: `ai-based-lost-and-found-system`).

---

## 📌 Summary: Why Collections Look Empty in Firebase Console

> [!IMPORTANT]
> **Firestore is a schemaless document store that does not support empty collections.**
> - A collection **does not exist or appear in the Firebase Console** until at least **one document** has been added to it.
> - If you delete the last document in a collection, the collection automatically disappears.
> - We have created and executed [`seed_firestore_live.js`](file:///c:/Users/LENOVO/Music/AI-BASED%20SMART%20CAMPUS%20LOST%20&%20FOUND%20SYSTEM/frontend/seed_firestore_live.js), which has populated all 10 core collections with real demo records. They are now visible in your [Firebase Console](https://console.firebase.google.com/project/ai-based-lost-and-found-system/firestore).

---

## 1. `users` Collection
**Path:** `/users/{uid}`  
**Document ID:** Firebase Authentication User ID (`request.auth.uid`)

### Field Specifications
| Field Name | Firestore Type | Constraints / Allowed Values | Description |
| :--- | :--- | :--- | :--- |
| `uid` | `string` | Unique Auth UID | The Firebase Authentication user ID |
| `fullName` | `string` | Min 2 chars | Full name of student or staff member |
| `email` | `string` | Valid email | Campus email address |
| `phone` | `string` | E.164 format or formatted | Contact mobile number |
| `phoneVerified` | `boolean` | `true` / `false` | Mobile OTP verification status |
| `role` | `string` | `LOST_USER`, `FOUND_USER`, `ADMIN` | Role defining user permissions |
| `department` | `string` | e.g. "Computer Science & Engineering" | Academic department or staff division |
| `year` | `string` | "1st Year", "2nd Year", "3rd Year", "4th Year", "Staff" | Graduation cohort / staff status |
| `accountStatus` | `string` | `ACTIVE`, `SUSPENDED`, `PENDING` | Current account status |
| `emailVerified` | `boolean` | `true` / `false` | Firebase email verification flag |
| `photoURL` | `string` | Valid URL | Avatar or profile photo URL |
| `fcmToken` | `string` | Optional | Firebase Cloud Messaging device push token |
| `createdAt` | `timestamp` | Server timestamp | Document creation timestamp |
| `updatedAt` | `timestamp` | Server timestamp | Last profile update timestamp |
| `lastLoginAt` | `timestamp` | Server timestamp | Last session sign-in timestamp |

### Example Document (`/users/j0ngCPx3HNWwKoAEfMei49BtKv22`)
```json
{
  "uid": "j0ngCPx3HNWwKoAEfMei49BtKv22",
  "fullName": "Alexander Pierce",
  "email": "lost.student@campuslostfound.edu",
  "phone": "+1 987-654-3210",
  "phoneVerified": true,
  "role": "LOST_USER",
  "department": "Computer Science & Engineering",
  "year": "3rd Year",
  "accountStatus": "ACTIVE",
  "emailVerified": true,
  "photoURL": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  "fcmToken": "",
  "createdAt": "2026-09-27T09:50:35Z",
  "updatedAt": "2026-09-27T09:50:35Z",
  "lastLoginAt": "2026-09-27T09:50:35Z"
}
```

---

## 2. `lostItems` Collection
**Path:** `/lostItems/{itemId}`  
**Document ID:** Auto-generated UUID or custom ID (e.g., `lost-item-001`)

### Field Specifications
| Field Name | Firestore Type | Constraints / Allowed Values | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique item identifier | Matches Document ID |
| `userId` | `string` | Valid user UID | Owner who reported losing the item |
| `title` | `string` | Non-empty | Descriptive title of the lost item |
| `category` | `string` | Electronics, Wallets, IDs, Keys, Bottles, etc. | Item category |
| `description` | `string` | Free text | Comprehensive visual description |
| `brand` | `string` | e.g. "Apple", "Samsung", "Sony" | Brand / Manufacturer |
| `model` | `string` | e.g. "MacBook Pro 14 (2023)" | Specific model name or number |
| `color` | `string` | e.g. "Space Gray", "Black", "Silver" | Primary color of the item |
| `lostLocation` | `string` | Campus building/room description | Location where item was misplaced |
| `lostDate` | `string` | `YYYY-MM-DD` | Date when item was lost |
| `lostTime` | `string` | `HH:MM` (24-hour format) | Approximate time when lost |
| `imageUrl` | `string` | Firebase Storage URL or CDN URL | Photo of the lost item or reference image |
| `secretAttribute` | `string` | Private text | Hidden identifier used for verification (e.g. sticker, wallpaper) |
| `aiFingerprint` | `map` | Nested object | Feature tags, vector embeddings & confidence score |
| `status` | `string` | `ACTIVE`, `MATCHED`, `RECOVERED`, `CLOSED` | Lifecycle status of the report |
| `matchingStatus` | `string` | `PENDING`, `REVIEWED`, `RESOLVED` | AI matching workflow status |
| `createdAt` | `timestamp` | Server timestamp | Report creation time |
| `updatedAt` | `timestamp` | Server timestamp | Last report modification time |

### Example Document (`/lostItems/lost-item-001`)
```json
{
  "id": "lost-item-001",
  "userId": "j0ngCPx3HNWwKoAEfMei49BtKv22",
  "title": "Space Gray MacBook Pro 14\"",
  "category": "Electronics & Laptops",
  "description": "14-inch Apple MacBook Pro M2 with university stickers on top cover and black hard shell.",
  "brand": "Apple",
  "model": "MacBook Pro 14 (2023)",
  "color": "Space Gray",
  "lostLocation": "Main Engineering Library - 3rd Floor Quiet Study Pods",
  "lostDate": "2026-09-26",
  "lostTime": "16:45",
  "imageUrl": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80",
  "secretAttribute": "Sticker: \"Python Guild 2025\" and serial ending in 89M",
  "aiFingerprint": {
    "tags": ["laptop", "macbook", "space gray", "apple", "stickers"],
    "vector_dim": 128,
    "confidence_score": 0.96
  },
  "status": "ACTIVE",
  "matchingStatus": "REVIEWED",
  "createdAt": "2026-09-27T09:50:40Z",
  "updatedAt": "2026-09-27T09:50:40Z"
}
```

---

## 3. `foundItems` Collection
**Path:** `/foundItems/{itemId}`  
**Document ID:** Auto-generated UUID or custom ID (e.g., `found-item-001`)

### Field Specifications
| Field Name | Firestore Type | Constraints / Allowed Values | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique item identifier | Matches Document ID |
| `userId` | `string` | Valid user UID | Finder who registered the item |
| `title` | `string` | Non-empty | Title of the found item |
| `category` | `string` | Electronics, Wallets, IDs, Keys, Bottles, etc. | Item category |
| `description` | `string` | Free text | Physical description observed |
| `brand` | `string` | Optional / observed brand | Brand name |
| `model` | `string` | Optional / observed model | Model name |
| `color` | `string` | e.g. "Space Gray", "Blue", "Black" | Color |
| `foundLocation` | `string` | Specific campus discovery spot | Location where item was picked up |
| `foundDate` | `string` | `YYYY-MM-DD` | Date discovered |
| `foundTime` | `string` | `HH:MM` | Approximate discovery time |
| `imageUrl` | `string` | Storage URL | Photo taken by finder |
| `aiFingerprint` | `map` | Nested object | Feature vectors and extracted labels |
| `status` | `string` | `ACTIVE`, `MATCHED`, `RETURNED`, `CLOSED` | Status of found item |
| `matchingStatus` | `string` | `PENDING`, `REVIEWED`, `RESOLVED` | AI matching workflow status |
| `createdAt` | `timestamp` | Server timestamp | Report creation time |
| `updatedAt` | `timestamp` | Server timestamp | Last update time |

### Example Document (`/foundItems/found-item-001`)
```json
{
  "id": "found-item-001",
  "userId": "LhWNRoQJKzT1rUJqZOvCJMzJvgC2",
  "title": "Apple MacBook Pro Laptop in Black Hard Shell",
  "category": "Electronics & Laptops",
  "description": "Found a space gray Apple MacBook laptop with a protective black case left behind on study desk.",
  "brand": "Apple",
  "model": "MacBook Pro",
  "color": "Space Gray",
  "foundLocation": "Main Engineering Library - 3rd Floor Desk #42",
  "foundDate": "2026-09-26",
  "foundTime": "17:30",
  "imageUrl": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80",
  "aiFingerprint": {
    "tags": ["laptop", "macbook", "space gray", "apple", "hard shell"],
    "vector_dim": 128,
    "confidence_score": 0.95
  },
  "status": "ACTIVE",
  "matchingStatus": "REVIEWED",
  "createdAt": "2026-09-27T09:50:45Z",
  "updatedAt": "2026-09-27T09:50:45Z"
}
```

---

## 4. `matches` Collection
**Path:** `/matches/{matchId}`  
**Document ID:** Auto-generated UUID (e.g., `match-001`)

### Field Specifications
| Field Name | Firestore Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique match identifier |
| `lostItemId` | `string` | ID reference to `lostItems` document |
| `foundItemId` | `string` | ID reference to `foundItems` document |
| `lostUserId` | `string` | UID of owner |
| `foundUserId` | `string` | UID of finder |
| `matchScore` | `number` | Float between `0.0` and `1.0` (e.g. `0.94` = 94%) |
| `confidenceTier` | `string` | `HIGH` ($\ge 0.85$), `MEDIUM` ($0.70 - 0.84$), `LOW` ($< 0.70$) |
| `breakdown` | `map` | Sub-scores: `visualSimilarity`, `textSemanticMatch`, `locationProximity`, `timeProximity` |
| `status` | `string` | `PENDING`, `CONFIRMED`, `DISMISSED` |
| `notifiedLostUser` | `boolean` | Flag if alert dispatched to lost user |
| `notifiedFoundUser` | `boolean` | Flag if alert dispatched to finder |
| `createdAt` | `timestamp` | Match generation timestamp |
| `updatedAt` | `timestamp` | Last update timestamp |

### Example Document (`/matches/match-001`)
```json
{
  "id": "match-001",
  "lostItemId": "lost-item-001",
  "foundItemId": "found-item-001",
  "lostUserId": "j0ngCPx3HNWwKoAEfMei49BtKv22",
  "foundUserId": "LhWNRoQJKzT1rUJqZOvCJMzJvgC2",
  "matchScore": 0.94,
  "confidenceTier": "HIGH",
  "breakdown": {
    "visualSimilarity": 0.96,
    "textSemanticMatch": 0.95,
    "locationProximity": 0.92,
    "timeProximity": 0.93
  },
  "status": "PENDING",
  "notifiedLostUser": true,
  "notifiedFoundUser": true,
  "createdAt": "2026-09-27T09:50:50Z",
  "updatedAt": "2026-09-27T09:50:50Z"
}
```

---

## 5. `verificationRequests` Collection
**Path:** `/verificationRequests/{requestId}`  
**Document ID:** Auto-generated ID (e.g., `verify-req-001`)

### Field Specifications
| Field Name | Firestore Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Request identifier |
| `found_item_id` | `string` | Reference to target `foundItems` document |
| `lost_item_id` | `string` | Reference to requester's `lostItems` document |
| `requester_user_id` | `string` | UID of claimant |
| `recipient_user_id` | `string` | UID of finder |
| `requester_name` | `string` | Name of claimant |
| `requester_email` | `string` | Verified email of claimant |
| `requester_mobile` | `string` | Contact phone |
| `claim_details` | `string` | Ownership explanation and private identifying marks |
| `verification_status` | `string` | `PENDING`, `APPROVED`, `REJECTED` |
| `otp_code` | `string` | 6-digit verification code |
| `otp_verified` | `boolean` | Verification status |
| `otp_expires_at` | `string` / `timestamp` | ISO expiration timestamp |
| `created_at` | `timestamp` | Timestamp request was submitted |
| `updated_at` | `timestamp` | Timestamp last modified |

### Example Document (`/verificationRequests/verify-req-001`)
```json
{
  "id": "verify-req-001",
  "found_item_id": "found-item-001",
  "lost_item_id": "lost-item-001",
  "requester_user_id": "j0ngCPx3HNWwKoAEfMei49BtKv22",
  "recipient_user_id": "LhWNRoQJKzT1rUJqZOvCJMzJvgC2",
  "requester_name": "Alexander Pierce",
  "requester_email": "lost.student@campuslostfound.edu",
  "requester_mobile": "+1 987-654-3210",
  "claim_details": "Hi! I left my MacBook on the 3rd floor study pod right before 5 PM. It has a Python sticker on it.",
  "verification_status": "PENDING",
  "otp_code": "482910",
  "otp_verified": false,
  "otp_expires_at": "2026-09-28T12:00:00Z",
  "created_at": "2026-09-27T09:50:55Z",
  "updated_at": "2026-09-27T09:50:55Z"
}
```

---

## 6. `conversations` Collection
**Path:** `/conversations/{conversationId}`  
**Document ID:** Auto-generated ID (e.g., `conv-001`)

### Field Specifications
| Field Name | Firestore Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Thread identifier |
| `verificationRequestId` | `string` | Associated verification request ID |
| `participants` | `array [string]` | Array of 2 UIDs: `[lostUserId, foundUserId]` |
| `lost_user_id` | `string` | UID of lost user |
| `found_user_id` | `string` | UID of found user |
| `lost_item_id` | `string` | Associated lost item ID |
| `found_item_id` | `string` | Associated found item ID |
| `status` | `string` | `ACTIVE`, `CLOSED`, `BLOCKED` |
| `lastMessageText` | `string` | Snip preview of the most recent message |
| `lastMessageAt` | `timestamp` | Time of the most recent message |
| `handoverConfirmedByFinder` | `boolean` | Flag if finder confirmed handoff |
| `handoverConfirmedByOwner` | `boolean` | Flag if owner confirmed receipt |
| `createdAt` | `timestamp` | Thread creation timestamp |
| `updatedAt` | `timestamp` | Thread update timestamp |

### Example Document (`/conversations/conv-001`)
```json
{
  "id": "conv-001",
  "verificationRequestId": "verify-req-001",
  "participants": [
    "j0ngCPx3HNWwKoAEfMei49BtKv22",
    "LhWNRoQJKzT1rUJqZOvCJMzJvgC2"
  ],
  "lost_user_id": "j0ngCPx3HNWwKoAEfMei49BtKv22",
  "found_user_id": "LhWNRoQJKzT1rUJqZOvCJMzJvgC2",
  "lost_item_id": "lost-item-001",
  "found_item_id": "found-item-001",
  "status": "ACTIVE",
  "lastMessageText": "Hello Alexander! I handed it to the Campus Security desk in Student Center Building A.",
  "lastMessageAt": "2026-09-27T09:51:02Z",
  "handoverConfirmedByFinder": false,
  "handoverConfirmedByOwner": false,
  "createdAt": "2026-09-27T09:51:00Z",
  "updatedAt": "2026-09-27T09:51:02Z"
}
```

---

## 7. `messages` Collection
**Path:** `/messages/{messageId}`  
**Document ID:** Auto-generated ID (e.g., `msg-001`)

### Field Specifications
| Field Name | Firestore Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Message identifier |
| `conversationId` | `string` | Parent `conversations` ID |
| `senderUserId` | `string` | UID of sender |
| `receiverUserId` | `string` | UID of receiver |
| `senderName` | `string` | Display name of sender |
| `senderRole` | `string` | `LOST_USER` or `FOUND_USER` |
| `messageText` | `string` | Sanitized message content |
| `sentAt` | `timestamp` | Time sent |
| `deliveredAt` | `timestamp` | Time delivered |
| `readAt` | `timestamp` / `null` | Time opened by recipient |
| `status` | `string` | `DELIVERED`, `SEEN` |
| `createdAt` | `timestamp` | Document creation timestamp |

### Example Document (`/messages/msg-001`)
```json
{
  "id": "msg-001",
  "conversationId": "conv-001",
  "senderUserId": "j0ngCPx3HNWwKoAEfMei49BtKv22",
  "receiverUserId": "LhWNRoQJKzT1rUJqZOvCJMzJvgC2",
  "senderName": "Alexander Pierce",
  "senderRole": "LOST_USER",
  "messageText": "Hi Sophia! Thank you so much for finding my MacBook. Can we meet to hand it over?",
  "sentAt": "2026-09-27T09:51:01Z",
  "deliveredAt": "2026-09-27T09:51:01Z",
  "readAt": "2026-09-27T09:51:02Z",
  "status": "SEEN",
  "createdAt": "2026-09-27T09:51:01Z"
}
```

---

## 8. `notifications` Collection
**Path:** `/notifications/{notificationId}`  
**Document ID:** Auto-generated ID (e.g., `notif-001`)

### Field Specifications
| Field Name | Firestore Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique notification ID |
| `userId` | `string` | Recipient user UID |
| `type` | `string` | `AI_MATCH`, `VERIFICATION_REQUEST`, `MESSAGE`, `SYSTEM` |
| `title` | `string` | Notification heading |
| `message` | `string` | Body text |
| `link` | `string` | Navigation destination in the frontend app |
| `relatedItemId` | `string` / `null` | Associated item reference ID |
| `relatedMatchId` | `string` / `null` | Associated match reference ID |
| `read` | `boolean` | `true` if opened, else `false` |
| `createdAt` | `timestamp` | Alert creation timestamp |

### Example Document (`/notifications/notif-001`)
```json
{
  "id": "notif-001",
  "userId": "j0ngCPx3HNWwKoAEfMei49BtKv22",
  "type": "AI_MATCH",
  "title": "High Confidence Match Found! (94%)",
  "message": "An item matching your \"Space Gray MacBook Pro 14\" was reported found in Main Engineering Library.",
  "link": "/matches/match-001",
  "relatedItemId": "lost-item-001",
  "relatedMatchId": "match-001",
  "read": false,
  "createdAt": "2026-09-27T09:51:05Z"
}
```

---

## 9. `auditLogs` Collection
**Path:** `/auditLogs/{logId}`  
**Document ID:** Auto-generated ID (e.g., `log-001`)

### Field Specifications
| Field Name | Firestore Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique audit entry identifier |
| `actorId` | `string` | User UID or `SYSTEM_AI_ENGINE` |
| `actorRole` | `string` | `LOST_USER`, `FOUND_USER`, `ADMIN`, `SYSTEM` |
| `action` | `string` | `CREATE_LOST_REPORT`, `CREATE_FOUND_REPORT`, `AI_MATCH_GENERATED`, etc. |
| `targetType` | `string` | `LOST_ITEM`, `FOUND_ITEM`, `MATCH`, `USER` |
| `targetId` | `string` | ID of the target resource |
| `ipAddress` | `string` | Source IP or network host |
| `metadata` | `map` | Additional audit payload |
| `timestamp` | `timestamp` | Immutable server timestamp |

### Example Document (`/auditLogs/log-001`)
```json
{
  "id": "log-001",
  "actorId": "j0ngCPx3HNWwKoAEfMei49BtKv22",
  "actorRole": "LOST_USER",
  "action": "CREATE_LOST_REPORT",
  "targetType": "LOST_ITEM",
  "targetId": "lost-item-001",
  "ipAddress": "127.0.0.1",
  "metadata": {
    "category": "Electronics & Laptops",
    "location": "Main Engineering Library"
  },
  "timestamp": "2026-09-27T09:51:10Z"
}
```

---

## 10. `reports` Collection (Moderation & Safety)
**Path:** `/reports/{reportId}`  
**Document ID:** Auto-generated ID (e.g., `flag-001`)

### Field Specifications
| Field Name | Firestore Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique report flag ID |
| `reporterId` | `string` | UID of reporting user |
| `reportedItemId` | `string` | ID of item or user being flagged |
| `reportType` | `string` | `SUSPICIOUS_LISTING`, `SPAM`, `HARASSMENT`, `FALSE_CLAIM` |
| `reason` | `string` | Detailed explanation of the issue |
| `status` | `string` | `UNDER_REVIEW`, `RESOLVED`, `DISMISSED` |
| `adminNotes` | `string` | Resolution notes by security staff |
| `createdAt` | `timestamp` | Timestamp report was submitted |
| `updatedAt` | `timestamp` | Timestamp report was last resolved |

### Example Document (`/reports/flag-001`)
```json
{
  "id": "flag-001",
  "reporterId": "LhWNRoQJKzT1rUJqZOvCJMzJvgC2",
  "reportedItemId": "item-flagged-demo",
  "reportType": "SUSPICIOUS_LISTING",
  "reason": "Duplicate listing or incorrect serial information reported.",
  "status": "UNDER_REVIEW",
  "adminNotes": "",
  "createdAt": "2026-09-27T09:51:12Z",
  "updatedAt": "2026-09-27T09:51:12Z"
}
```

---

## 11. Reference Collections: `categories` & `locations`
**Path:** `/categories/{categoryId}` and `/locations/{locationId}`

### `categories` Example:
```json
{
  "id": "cat-electronics",
  "name": "Electronics & Laptops",
  "icon": "laptop",
  "priority": 1,
  "subcategories": ["Laptops", "Tablets", "Smartphones", "Accessories"]
}
```

### `locations` Example:
```json
{
  "id": "loc-eng-lib",
  "building": "Main Engineering Library",
  "zone": "North Campus",
  "floors": ["Ground", "1st Floor", "2nd Floor", "3rd Floor Quiet Study"],
  "securityDesk": "Ground Floor Reception Desk"
}
```

---

## 🚀 How to Re-Run or Seed New Data
Whenever you wish to reset or seed new documents into your live Cloud Firestore database:

```powershell
cd frontend
node seed_firestore_live.js
```
The script automatically signs into Firebase Auth, passes Firestore security rule checks, and writes all collection schemas cleanly.
