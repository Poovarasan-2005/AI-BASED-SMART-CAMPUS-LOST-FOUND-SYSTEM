# Production Deployment Guide: AI Found & Lost System

This guide explains how to build, containerize, and deploy both the **React Frontend** and **FastAPI Python Backend** to production.

---

## 1. Frontend Deployment

### A. Deploy to Vercel (Recommended)

Since the frontend is built with **Vite + React** and connects directly to Firebase client services (Auth, Firestore, Storage), Vercel is the fastest and easiest hosting platform.

#### Method 1: Via Vercel Web Dashboard (GitHub)
1. Push your repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **"Add New..."** -> **"Project"**.
4. Import your GitHub repository (`Poovarasan-2005/AI-BASED-SMART-CAMPUS-LOST-FOUND-SYSTEM`).
5. In the **Configure Project** screen:
   - **Framework Preset**: Vite
   - **Root Directory**: Click **Edit** and select `frontend` (⚠️ **Essential step!**)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Expand **Environment Variables** and add your Firebase credentials:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
7. Click **Deploy**.
8. **Crucial Post-Deploy Step (Firebase Auth)**:
   - Copy your Vercel URL (e.g. `your-app.vercel.app`).
   - Open **Firebase Console** -> **Authentication** -> **Settings** tab -> **Authorized Domains**.
   - Click **Add Domain** and paste `your-app.vercel.app`.

#### Method 2: Via Vercel CLI (Direct Terminal)
```powershell
# 1. Install Vercel CLI globally (if not installed)
npm install -g vercel

# 2. Navigate to frontend directory
cd frontend

# 3. Deploy to preview
vercel

# 4. Deploy to production
vercel --prod
```

> **Note**: A `frontend/vercel.json` rewrite file is already configured so client-side routes (e.g. `/items`, `/dashboard`) reload without 404 errors.

---

### B. Deploy to Firebase Hosting (Alternative)

```powershell
cd frontend
npm install
npm run build
firebase deploy --only hosting
```


---

## 2. Backend Deployment (Docker / Cloud Run / Linux VM)

### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system libraries for OpenCV and Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY .env .env

ENV PYTHONPATH=/app/backend

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Build & Run Container
```bash
docker build -t smart-campus-backend .
docker run -d -p 8000:8000 --env-file .env --name campus-lost-found smart-campus-backend
```

---

## 3. Deploying Firebase Rules & Indexes
```powershell
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

---

## 4. Production Checklist
- [x] Environment variables configured in `.env` (No API keys or service account keys in source control).
- [x] CORS restricted to authorized campus domain(s).
- [x] Firebase Security Rules and Storage Rules active.
- [x] SSL/TLS certificates configured (HTTPS enforced).
- [x] Database backups scheduled.
