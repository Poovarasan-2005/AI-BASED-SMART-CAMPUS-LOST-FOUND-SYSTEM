# API Documentation: AI Found & Lost System

The backend provides RESTful APIs built with FastAPI, accessible locally at `http://127.0.0.1:8000` with interactive Swagger documentation at `/docs`.

---

## 1. Authentication Endpoints

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/lost/register` | Register new Lost User | No |
| `POST` | `/api/found/register` | Register new Found User | No |
| `POST` | `/api/lost/login` | Login Lost User (returns JWT) | No |
| `POST` | `/api/found/login` | Login Found User (returns JWT) | No |
| `POST` | `/api/admin/login` | Login Admin User | No |
| `POST` | `/api/auth/verify-email` | Verify email with security token | No |
| `POST` | `/api/auth/send-phone-otp` | Dispatch 6-digit SMS OTP | Bearer Token |
| `POST` | `/api/auth/verify-phone-otp` | Verify 6-digit phone OTP | Bearer Token |

---

## 2. Lost & Found Reports

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/lost/reports` | Create new lost report | `LOST_USER`, `ADMIN` |
| `GET` | `/api/lost/reports` | List reports for current user | `LOST_USER`, `ADMIN` |
| `POST` | `/api/found/reports` | Create new found report | `FOUND_USER`, `ADMIN` |
| `GET` | `/api/found/reports` | List found reports for current user | `FOUND_USER`, `ADMIN` |
| `GET` | `/api/found/reports/all` | List all active found reports | Bearer Token |

---

## 3. Multimodal AI & Computer Vision

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/upload-image` | Upload & OpenCV blur/quality check | Bearer Token |
| `POST` | `/api/ai/match` | Run 7-factor multimodal matching engine | Bearer Token |
| `POST` | `/api/ai/natural-search` | Parse conversational natural language search | Bearer Token |

---

## 4. Verification & Private Conversations

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/verification/send-request` | Send direct email verification request | Bearer Token |
| `GET` | `/api/conversations` | List user's active private conversations | Bearer Token |
| `GET` | `/api/conversations/{id}/messages` | Fetch messages (auto-marks `SEEN`) | Participant / Admin |
| `POST` | `/api/conversations/{id}/messages` | Send new message (`DELIVERED`) | Participant |
| `POST` | `/api/conversations/{id}/confirm-handover` | Double-confirmation closure | Participant |
| `POST` | `/api/conversations/{id}/report` | Report abuse to campus admin | Participant |

---

## 5. Recovery & Admin Portal

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/recovery/generate-qr` | Generate single-use recovery QR token | `LOST_USER` |
| `POST` | `/api/recovery/verify-qr` | Scan & verify QR token at handover | `FOUND_USER` |
| `GET` | `/api/admin/dashboard` | Aggregated campus lost/found metrics | `ADMIN` |
| `GET` | `/api/admin/analytics` | Location & Category heatmaps | `ADMIN` |
| `POST` | `/api/admin/users/suspend` | Suspend / Reactivate account | `ADMIN` |
| `POST` | `/api/admin/items/moderate` | Moderate / Flag suspicious report | `ADMIN` |
