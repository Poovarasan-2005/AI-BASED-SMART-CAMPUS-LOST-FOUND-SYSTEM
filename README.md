# AI-Based Smart Campus Lost & Found System
## 100% Serverless Web Application Powered by Google Firebase

An enterprise-grade, production-ready **Smart Campus Lost & Found Platform** built with **React, Vite, and Cloud Firebase**. The system features real-time NoSQL synchronization via Cloud Firestore, Firebase Authentication (Email/Password & Google OAuth), Cloud Storage image uploads, client-side Multimodal AI Matching, Mobile OTP verification, and private in-app recovery conversations (`Sent ✓`, `Delivered ✓✓`, `Seen ✓✓`).

---

## 🌟 Key Architecture Highlights

- **100% Serverless**: No Python, Django, or external backend server required. Runs directly in modern browsers against Google Cloud Firebase.
- **Direct Cloud Firestore Integration**: All 10 collections (`users`, `lostItems`, `foundItems`, `matches`, `verificationRequests`, `conversations`, `messages`, `notifications`, `auditLogs`, `reports`) are managed in Firestore.
- **Client-Side Multimodal AI Engine**: Client-side semantic weighting algorithm evaluating category, brand, color, serial numbers, locations, dates, and visual tags.
- **Real-Time Private Chat**: Synchronized via Firestore snapshots with read receipts and double-confirmation handovers.
- **Cloud Storage**: Instant photo uploads with validation and automatic fallbacks.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18, Vite 4, React Router 6 |
| **Styling & Icons** | Glassmorphism Vanilla CSS Design System, Lucide React Icons |
| **Database** | Google Cloud Firestore (NoSQL Document Store) |
| **Authentication** | Firebase Authentication (Email/Password, Google OAuth) |
| **Media Storage** | Google Cloud Storage for Firebase |
| **Push Notifications** | Firebase Cloud Messaging (FCM) |
| **Security Rules** | Declarative Role-Based Access Control (`firestore.rules`, `storage.rules`) |
| **AI Matching** | Client-Side Multimodal AI Engine (`src/services/aiMatcher.js`) |

---

## 🚀 Quick Start Guide

### 1. Install Frontend Dependencies
```powershell
cd frontend
npm install
```

### 2. (Optional) Re-Seed Live Firestore Collections
To populate your Firebase Console with rich demo data across all 10 collections:
```powershell
cd frontend
node seed_firestore_live.js
```

### 3. Run Development Server
```powershell
cd frontend
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Build for Production
```powershell
cd frontend
npm run build
```

---

## 📚 Complete Project Documentation

- 📋 [**FIRESTORE_COLLECTIONS_FORMAT.md**](file:///c:/Users/LENOVO/Music/AI-BASED%20SMART%20CAMPUS%20LOST%20&%20FOUND%20SYSTEM/FIRESTORE_COLLECTIONS_FORMAT.md): Exact JSON schemas and data dictionary for all collections.
- 🏗️ [**FIREBASE_ARCHITECTURE.md**](file:///c:/Users/LENOVO/Music/AI-BASED%20SMART%20CAMPUS%20LOST%20&%20FOUND%20SYSTEM/FIREBASE_ARCHITECTURE.md): Serverless architecture and sequence data flows.
- 🗄️ [**DATABASE_SCHEMA.md**](file:///c:/Users/LENOVO/Music/AI-BASED%20SMART%20CAMPUS%20LOST%20&%20FOUND%20SYSTEM/DATABASE_SCHEMA.md): Complete Firestore schema definitions.
- 🔥 [**FIREBASE_SETUP_GUIDE.md**](file:///c:/Users/LENOVO/Music/AI-BASED%20SMART%20CAMPUS%20LOST%20&%20FOUND%20SYSTEM/FIREBASE_SETUP_GUIDE.md): Firebase Console setup and CLI deployment guide.
- 🛡️ [**SECURITY.md**](file:///c:/Users/LENOVO/Music/AI-BASED%20SMART%20CAMPUS%20LOST%20&%20FOUND%20SYSTEM/SECURITY.md): Firebase Security Rules and RBAC specifications.
- 🚀 [**DEPLOYMENT.md**](file:///c:/Users/LENOVO/Music/AI-BASED%20SMART%20CAMPUS%20LOST%20&%20FOUND%20SYSTEM/DEPLOYMENT.md): Firebase Hosting deployment instructions.
