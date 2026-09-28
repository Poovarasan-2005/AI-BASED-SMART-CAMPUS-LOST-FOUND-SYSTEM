# Firebase Console Setup Guide: AI Found & Lost System

This step-by-step guide walks you through setting up and connecting Firebase to your **AI Found & Lost System**.

---

## 1. Create a Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** (or **Create a project**).
3. Name your project: `smart-campus-lost-found` (or any custom name).
4. (Optional) Enable Google Analytics and select or create an account.
5. Click **Create Project** and wait for provisioning to finish.

---

## 2. Register Your Web Application
1. In the Project Overview page, click the **Web icon (`</>`)** to add an app.
2. Enter App nickname: `Smart Campus Lost & Found Web`.
3. Check the box **"Also set up Firebase Hosting for this app"**.
4. Click **Register app**.
5. Copy the `firebaseConfig` object keys into your `.env` file:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=smart-campus-lost-found.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=smart-campus-lost-found
   VITE_FIREBASE_STORAGE_BUCKET=smart-campus-lost-found.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   ```

---

## 3. Enable Firebase Authentication
1. In the Firebase left navigation bar, click **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab:
   - **Email/Password**: Click **Enable** and save.
   - **Google**: Click **Enable**, configure support email, and save.
4. Under **Settings > Authorized domains**, ensure `localhost` is listed.

---

## 4. Provision Cloud Firestore Database
1. In the left navigation, click **Build > Firestore Database**.
2. Click **Create Database**.
3. Choose location (e.g., `us-central1` or nearest region to your campus).
4. Start in **Production mode** (we will deploy strict rules next).
5. Click **Create**.

---

## 5. Provision Cloud Storage Bucket
1. In the left navigation, click **Build > Storage**.
2. Click **Get Started**.
3. Select default security rules and choose your storage bucket location.
4. Click **Done**.

---

## 6. Deploy Security Rules & Indexes via Firebase CLI
1. Install Firebase CLI globally (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```
2. Log in to your Firebase account:
   ```bash
   firebase login
   ```
3. Associate with your project:
   ```bash
   firebase use --add
   ```
4. Deploy Firestore rules, Storage rules, and Indexes:
   ```bash
   firebase deploy --only firestore,storage
   ```

---

## 7. Generate Backend Admin SDK Service Account (Optional / Production)
1. Go to **Project Settings (gear icon) > Service accounts**.
2. Select **Python** and click **Generate new private key**.
3. Save the JSON file securely (e.g., `service_account.json`).
4. Set the path in your `.env`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=service_account.json
   ```

---

## 8. Run & Verify Locally
1. Start the FastAPI backend:
   ```powershell
   $env:PYTHONPATH="backend"; uvicorn app.main:app --reload --port 8000
   ```
2. Start the Vite React frontend:
   ```powershell
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.
