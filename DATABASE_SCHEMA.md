# Database Schema: Cloud Firestore & Local Engine

This document defines the schema across all Firestore collections and local persistence engines for the **AI Found & Lost System**.

---

## 1. `users` Collection
**Path:** `/users/{uid}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `uid` | string | Unique Firebase Authentication User ID |
| `fullName` | string | Full name of student/staff |
| `email` | string | Verified campus email address |
| `phone` | string | Mobile phone number |
| `phoneVerified` | boolean | Mobile verification status |
| `role` | string | `LOST_USER`, `FOUND_USER`, or `ADMIN` |
| `department` | string | Academic/administrative department |
| `year` | string | Graduation year / staff indicator |
| `accountStatus` | string | `ACTIVE`, `SUSPENDED`, or `EMAIL_VERIFICATION_PENDING` |
| `emailVerified` | boolean | Email verification flag |
| `photoURL` | string | Avatar image URL |
| `fcmToken` | string (optional)| Device registration token for push alerts |
| `createdAt` | timestamp | Document creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |
| `lastLoginAt` | timestamp | Last authentication timestamp |

---

## 2. `lostItems` Collection
**Path:** `/lostItems/{lostItemId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Unique item report UUID |
| `userId` | string | UID of owner who lost the item |
| `title` | string | Item display title |
| `category` | string | Electronics, Wallets, IDs, Keys, Books, etc. |
| `description` | string | Detailed physical description |
| `brand` | string | Brand name (e.g. Apple, Samsung, Dell) |
| `model` | string | Model name / number |
| `color` | string | Primary color |
| `lostLocation` | string | Campus location where item was lost |
| `lostDate` | string (YYYY-MM-DD)| Date lost |
| `lostTime` | string (HH:MM)| Approximate time lost |
| `imageUrl` | string | Cloud Storage image URL |
| `secretAttribute` | string (optional)| Private identifier (e.g. sticker, wallpaper) |
| `aiFingerprint` | map | Feature vectors & extracted keywords |
| `status` | string | `ACTIVE`, `MATCHED`, `RECOVERED`, `CLOSED` |
| `matchingStatus` | string | `PENDING`, `REVIEWED`, `RESOLVED` |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Update timestamp |

---

## 3. `foundItems` Collection
**Path:** `/foundItems/{foundItemId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Unique found report UUID |
| `userId` | string | UID of finder |
| `title` | string | Item display title |
| `category` | string | Category |
| `description` | string | Detailed physical description |
| `brand` | string | Brand name |
| `model` | string | Model name |
| `color` | string | Primary color |
| `foundLocation` | string | Campus location where item was discovered |
| `foundDate` | string | Date found |
| `foundTime` | string | Time found |
| `imageUrl` | string | Cloud Storage URL |
| `aiFingerprint` | map | Feature vectors & extracted keywords |
| `status` | string | `ACTIVE`, `MATCHED`, `RETURNED`, `CLOSED` |
| `matchingStatus` | string | `PENDING`, `REVIEWED`, `RESOLVED` |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Update timestamp |

---

## 4. `conversations` Collection
**Path:** `/conversations/{conversationId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Conversation UUID |
| `verificationRequestId`| string | Associated verification request ID |
| `participants` | array [string] | `[requesterUserId, recipientUserId]` |
| `lostUserId` | string | UID of lost user |
| `foundUserId` | string | UID of found user |
| `status` | string | `ACTIVE`, `CLOSED`, `BLOCKED` |
| `lastMessageText` | string | Preview of most recent message |
| `lastMessageAt` | timestamp | Timestamp of last message |
| `handoverConfirmedByFinder`| boolean | Finder handover confirmation flag |
| `handoverConfirmedByOwner`| boolean | Owner handover confirmation flag |
| `createdAt` | timestamp | Thread creation timestamp |

---

## 5. `messages` Collection
**Path:** `/messages/{messageId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `conversationId` | string | Parent conversation reference |
| `senderUserId` | string | Message author UID |
| `receiverUserId` | string | Message recipient UID |
| `senderName` | string | Display name of sender |
| `senderRole` | string | `LOST_USER` or `FOUND_USER` |
| `messageText` | string | Encrypted / Sanitized chat text |
| `sentAt` | timestamp | Sent timestamp |
| `deliveredAt` | timestamp | Delivered timestamp |
| `readAt` | timestamp (nullable)| Timestamp when viewed (`SEEN`) |
| `status` | string | `DELIVERED`, `SEEN` |

---

## 6. `notifications` Collection
**Path:** `/notifications/{notificationId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | string | Recipient user UID |
| `type` | string | `AI_MATCH`, `VERIFICATION_REQUEST`, `MESSAGE`, `SYSTEM` |
| `title` | string | Notification title |
| `message` | string | Notification body text |
| `link` | string | In-app navigation URL |
| `read` | boolean | Read status |
| `createdAt` | timestamp | Timestamp of alert |

---

## 7. `matches` Collection
**Path:** `/matches/{matchId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Unique match UUID |
| `lostItemId` | string | Reference to `lostItems` document ID |
| `foundItemId` | string | Reference to `foundItems` document ID |
| `lostUserId` | string | UID of user who lost item |
| `foundUserId` | string | UID of user who found item |
| `matchScore` | number | Float `0.0` - `1.0` (overall match score) |
| `confidenceTier` | string | `HIGH`, `MEDIUM`, `LOW` |
| `breakdown` | map | `{visualSimilarity, textSemanticMatch, locationProximity, timeProximity}` |
| `status` | string | `PENDING`, `CONFIRMED`, `DISMISSED` |
| `notifiedLostUser` | boolean | Whether lost user was notified |
| `notifiedFoundUser` | boolean | Whether found user was notified |
| `createdAt` | timestamp | Match generation timestamp |
| `updatedAt` | timestamp | Last status change timestamp |

---

## 8. `verificationRequests` Collection
**Path:** `/verificationRequests/{requestId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Request UUID |
| `found_item_id` | string | Reference to found item ID |
| `lost_item_id` | string | Reference to lost item ID |
| `requester_user_id` | string | UID of claimant |
| `recipient_user_id` | string | UID of finder |
| `requester_name` | string | Full name of requester |
| `requester_email` | string | Campus email of requester |
| `requester_mobile` | string | Phone number of requester |
| `claim_details` | string | Detailed proof of ownership text |
| `verification_status` | string | `PENDING`, `APPROVED`, `REJECTED` |
| `otp_code` | string | 6-digit verification OTP |
| `otp_verified` | boolean | Whether OTP was validated |
| `otp_expires_at` | string / timestamp | OTP expiration time |
| `created_at` | timestamp | Submission timestamp |
| `updated_at` | timestamp | Last update timestamp |

---

## 9. `auditLogs` Collection
**Path:** `/auditLogs/{logId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Unique log entry UUID |
| `actorId` | string | UID of user or `SYSTEM_AI_ENGINE` |
| `actorRole` | string | `LOST_USER`, `FOUND_USER`, `ADMIN`, `SYSTEM` |
| `action` | string | Action name (e.g. `CREATE_LOST_REPORT`, `AI_MATCH_GENERATED`) |
| `targetType` | string | Target entity type (`LOST_ITEM`, `FOUND_ITEM`, `MATCH`, etc.) |
| `targetId` | string | Identifier of target entity |
| `ipAddress` | string | Client IP address |
| `metadata` | map | Contextual key-value payload |
| `timestamp` | timestamp | Immutable server timestamp |

---

## 10. `reports` Collection
**Path:** `/reports/{reportId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Unique flag report UUID |
| `reporterId` | string | UID of reporting user |
| `reportedItemId` | string | ID of reported item or user |
| `reportType` | string | `SUSPICIOUS_LISTING`, `SPAM`, `HARASSMENT`, `FALSE_CLAIM` |
| `reason` | string | Explanation of violation |
| `status` | string | `UNDER_REVIEW`, `RESOLVED`, `DISMISSED` |
| `adminNotes` | string | Notes added by security staff |
| `createdAt` | timestamp | Report submission timestamp |
| `updatedAt` | timestamp | Last update timestamp |

---

> For copy-pasteable JSON documents and live testing details, see [FIRESTORE_COLLECTIONS_FORMAT.md](file:///c:/Users/LENOVO/Music/AI-BASED%20SMART%20CAMPUS%20LOST%20&%20FOUND%20SYSTEM/FIRESTORE_COLLECTIONS_FORMAT.md).

