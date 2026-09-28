# Testing & Quality Assurance: AI Found & Lost System

This document describes the automated test suites, coverage, and manual test workflows for the **AI Found & Lost System**.

---

## 1. Automated Backend Test Suite

Run the full pytest suite:
```powershell
$env:PYTHONPATH="backend"; pytest tests/ -v
```

### Test Suite Breakdown

| Test File | Test Case | Purpose | Result |
| :--- | :--- | :--- | :--- |
| `test_email_verification_and_conversation.py` | `test_send_direct_verification_request_workflow` | Validates requester workflow, zero-trust email dispatch, and conversation binding. | **PASSED** |
| `test_email_verification_and_conversation.py` | `test_message_read_and_seen_status_transition` | Validates `Sent ✓` ➔ `Delivered ✓✓` ➔ `Seen ✓✓` read timestamp progression. | **PASSED** |
| `test_email_verification_and_conversation.py` | `test_bidirectional_conversation_reply` | Validates in-app bidirectional messaging & reply email notifications. | **PASSED** |
| `test_security_and_flow.py` | `test_password_hashing_security` | Tests Bcrypt hashing resistance and verification. | **PASSED** |
| `test_security_and_flow.py` | `test_secure_otp_generation_and_hashing` | Tests cryptographic 6-digit OTP generation and SHA-256 hash checks. | **PASSED** |
| `test_security_and_flow.py` | `test_multimodal_ai_matching_scoring` | Tests 7-factor weighted scoring and explainability output. | **PASSED** |
| `test_security_and_flow.py` | `test_natural_language_search_parser` | Tests conversational NLP query extraction (color, category, location). | **PASSED** |
| `test_security_and_flow.py` | `test_unauthenticated_api_rejection` | Tests 401 Unauthorized protection on private endpoints. | **PASSED** |
| `test_security_and_flow.py` | `test_idor_and_role_protection` | Tests BOLA/IDOR role access restriction. | **PASSED** |
| `test_mobile_otp_and_conversation.py` | `test_cryptographic_mobile_otp_security` | Tests single-use OTP expiration and verification counters. | **PASSED** |
| `test_mobile_otp_and_conversation.py` | `test_bola_idor_conversation_access` | Tests that third parties cannot access or inject messages into private conversations. | **PASSED** |
| `test_mobile_otp_and_conversation.py` | `test_double_handover_confirmation` | Tests that cases only resolve to `RETURNED` when both parties confirm. | **PASSED** |

---

## 2. Frontend Build Verification

Run Vite build verification:
```powershell
cd frontend
npm run build
```
Result: 0 errors, chunks generated cleanly with gzip compression.
