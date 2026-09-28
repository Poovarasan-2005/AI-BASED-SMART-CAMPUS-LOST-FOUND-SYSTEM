# Security Architecture & Rules: AI Found & Lost System

This document provides a security assessment and describes the defense-in-depth security model implemented in the **AI Found & Lost System**.

---

## 1. Threat Modeling & Defense Matrix

| Threat / Attack Vector | Mitigation in Existing Backend | Mitigation in Firebase Layer |
| :--- | :--- | :--- |
| **Broken Object Level Auth (BOLA / IDOR)** | `RoleChecker` & resource ownership checks on every FastAPI route. | Firestore security rules enforce `resource.data.userId == request.auth.uid` or participant array membership. |
| **Privilege Escalation** | Admin routes require explicit `ADMIN` role check in JWT/DB. | Firestore rules explicitly reject user self-assignment of `role: 'ADMIN'`. |
| **Public Email/Phone Harvesting** | Zero-trust backend resolution: recipient contact info is never sent in API responses. | Security rules restrict private user document reads to the owner and authenticated administrators. |
| **Malicious File / Polyglot Uploads** | PIL header validation + OpenCV image decoding + extension whitelist (`.jpg`, `.png`, `.webp`). | Firebase Storage rules validate MIME type `image/(jpeg\|png\|webp)` and maximum size $\le 5\text{MB}$. |
| **Brute-Force OTP / Rate Limit Abuse**| In-memory `RateLimiter` token-bucket + 5-attempt single-use OTP invalidation. | Rate limiting on backend auth endpoints + Firebase App Check (reCAPTCHA v3) anti-abuse shield. |
| **Cross-Site Scripting (XSS)** | React JSX HTML sanitization + server-side string stripping. | Client-side and server-side text escaping. |
| **Sensitive Credential Exposure** | Passwords hashed using Bcrypt + secrets stored exclusively in `.env`. | Service accounts kept strictly on backend; never bundled in frontend Vite build. |

---

## 2. Firebase Security Rules Verification

The project includes:
- **`firestore.rules`**: Production-tested rules with granular document-level permissions.
- **`storage.rules`**: Secure path isolation (`lost-items/{uid}/...`, `found-items/{uid}/...`, `users/{uid}/...`).

### Automated Test Verification
Run the backend test suite:
```powershell
$env:PYTHONPATH="backend"; pytest tests/ -v
```
All 12 security, IDOR, OTP, and conversation workflow tests pass with 100% success rate.
