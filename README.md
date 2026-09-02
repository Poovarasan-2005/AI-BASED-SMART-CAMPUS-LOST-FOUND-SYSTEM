# Smart Campus Lost & Found System

## Secure AI-Based Smart Campus Lost & Found System with Dual Login, Multimodal AI Matching, Email OTP and Secure Recovery

An end-to-end, production-grade **Smart Campus Lost & Found Platform** combining dual-user authentication, OpenCV visual image analysis, multimodal weighted AI matching, 6-digit cryptographic OTP verification, secret attribute ownership checks, temporary single-use QR handovers, and admin analytics.

---

## 🌟 Key Features

### 1. Dual Authentication & Role Isolation
- **Lost User Portal** (`/lost/login`): Report lost items, review incoming verification requests, request 6-digit OTPs, and complete ownership checks.
- **Found User Portal** (`/found/login`): Report found items, run AI similarity matching, and request verification against potential lost matches.
- **Admin Moderation Portal** (`/admin/login`): View campus location analytics, monitor security audit trails, and suspend/activate accounts.
- **Deny-by-Default Security**: Backend verifies resource ownership on every protected API endpoint to prevent IDOR / BOLA attacks.

### 2. Multimodal AI Matching & Explainable AI
- **Image Quality Check**: Uses OpenCV Laplacian variance to detect blurry, dark, or low-resolution uploads.
- **Weighted Multimodal Engine**:
  - Image Similarity (40%)
  - Text NLP Description Similarity (20%)
  - Distinctive Features / Color (15%)
  - Campus Location Proximity (10%)
  - Date Proximity (5%)
  - Time Proximity (5%)
  - Category / Brand (5%)
- **Explainable AI**: Displays matching reasons (e.g., `✓ Same category`, `✓ Matching brand`, `✓ Nearby location`).
- **AI Natural Language Search**: Converts conversational queries ("I lost my black bag near the library yesterday") into structured search attributes.

### 3. Critical Dual-User Verification & OTP Security
- Found User creates a verification request on a potential match.
- Backend retrieves the Lost User's verified email address (never provided by the Found User).
- Sends email alert to Lost User.
- Lost User logs in -> requests 6-digit OTP -> system generates cryptographic random OTP hashed with SHA-256 (5-minute expiry, max 5 attempts).
- OTP validated -> Single-use invalidation.
- Lost User confirms private secret attribute -> Approves verification.
- System issues temporary single-use Handover QR Code.
- Handover confirmed -> Status updated to `RETURNED` -> Digital Recovery Receipt issued.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, Vanilla CSS Design System (Glassmorphism, gradients, micro-animations), Lucide Icons.
- **Backend**: Python 3.10+, FastAPI, PyMongo / Motor async driver, Passlib (Bcrypt), Python-JOSE (JWT).
- **AI/ML**: OpenCV (`cv2`), NumPy, Scikit-learn (TF-IDF & Cosine Similarity), Pillow, QRCode.
- **Database**: MongoDB (Atlas or local instance, with automatic in-memory fallback for local development).

---

## 🚀 Quick Setup & Execution Guide

### 1. Environment Setup
Clone the repository and copy the environment template:
```bash
cp .env.example .env
```

### 2. Backend Installation & Start
Navigate to the root workspace and install Python dependencies:
```bash
pip install -r backend/requirements.txt
```

Run the backend server:
```bash
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```
The API documentation will be available at `http://localhost:8000/docs`.

### 3. Load Demo Seed Data
In a separate terminal, seed demo accounts and sample lost/found reports:
```bash
python seed_demo.py
```

### 4. Frontend Installation & Start
Install Node dependencies and start Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔐 Pre-configured Demo Accounts

| Portal | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Lost User Portal** | `lost.user@campus.edu` | `LostPass123!` | `LOST_USER` |
| **Found User Portal** | `found.user@campus.edu` | `FoundPass123!` | `FOUND_USER` |
| **Admin Portal** | `admin@campuslostfound.edu` | `AdminPass123!` | `ADMIN` |

---

## 🧪 Security & Verification Testing

Run the automated pytest test suite to verify role enforcement, IDOR protection, OTP security, and AI match scoring:
```bash
pytest tests/test_security_and_flow.py -v
```

---

## 📄 License & System Authority
Campus Lost & Found System © 2026. Built with security, transparency, and explainable AI.
