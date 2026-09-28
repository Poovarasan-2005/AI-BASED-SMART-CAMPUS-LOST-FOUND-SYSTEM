# Database Migration Plan: MongoDB / Local DB to Cloud Firestore

**Project:** AI Found & Lost System  
**Version:** 1.0.0 (Production Migration)  
**Date:** September 2026

---

## 1. Migration Strategy Overview

The system supports a **Zero-Downtime Dual-Mode Strategy (Hybrid-Ready Coexistence)**:

```
┌─────────────────────────────────────────────────────────────┐
│                 CURRENT LOCAL / MONGODB                     │
│  - Collections: users, lost_reports, found_reports,         │
│                 verification_requests, conversations,       │
│                 conversation_messages, notifications        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ [migrate_to_firestore.py]
┌─────────────────────────────────────────────────────────────┐
│                     CLOUD FIRESTORE                         │
│  - Collections: users, lostItems, foundItems, matches,      │
│                 verificationRequests, conversations,        │
│                 messages, notifications, auditLogs          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Schema Transformation Matrix

| Current Field / Collection | Firestore Target Document | Type / Transformation | Notes |
| :--- | :--- | :--- | :--- |
| `users` (`id`, `email`, `role`, ...) | `users/{uid}` | Document ID = `uid` | Passwords handled by Firebase Auth; metadata stored in Firestore. |
| `lost_reports` | `lostItems/{lostItemId}` | Object | Map `item_name` ➔ `title`, add `matchingStatus: 'PENDING'`. |
| `found_reports` | `foundItems/{foundItemId}` | Object | Map `item_name` ➔ `title`, store Cloud Storage URLs. |
| `verification_requests` | `verificationRequests/{id}` | Object | Preserves `status` (`DELIVERED`, `SEEN`, `APPROVED`). |
| `conversations` | `conversations/{id}` | Object | Index `participants: [lostUserId, foundUserId]`. |
| `conversation_messages` | `messages/{id}` | Sub-collection / Top-level with `conversationId` | Preserves `Sent ✓`, `Delivered ✓✓`, `Seen ✓✓` read timestamps. |
| `notifications` | `notifications/{id}` | Object | Indexed by `userId` and `createdAt`. |
| `audit_logs` | `auditLogs/{id}` | Object | Immutable security logs. |

---

## 3. Step-by-Step Migration Process

### Step 1: Backup Existing Database
Create a point-in-time snapshot of the current state:
```powershell
python -c "import shutil, datetime; shutil.copy('.dev_db.json', f'.dev_db_backup_{datetime.datetime.now().strftime(\"%Y%m%d_%H%M%S\")}.json'); print('Backup complete!')"
```

### Step 2: Validate Data Integrity
Run migration validation in dry-run mode:
```powershell
$env:PYTHONPATH="backend"; python migrate_to_firestore.py --dry-run
```

### Step 3: Execute Live Migration
Migrate all documents into Firestore with batch writes:
```powershell
$env:PYTHONPATH="backend"; python migrate_to_firestore.py --execute
```

### Step 4: Verification & Smoke Test
Verify that document counts match and indexes are active.

---

## 4. Rollback Plan
If any discrepancy occurs:
1. Revert environment variable `USE_FIREBASE_FIRESTORE=False` to run directly on the local database.
2. Restore `.dev_db.json` from the timestamped backup file.
3. No user data is destroyed or lost.
