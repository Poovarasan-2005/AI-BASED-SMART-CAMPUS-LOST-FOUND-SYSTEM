# Troubleshooting & FAQ: AI Found & Lost System

This guide provides solutions to common questions, errors, and configuration issues.

---

## 1. Firebase Initialization & Permissions

### Q: "Firebase configuration is missing in environment variables"
- **Cause:** The `.env` file does not contain `VITE_FIREBASE_API_KEY` or `VITE_FIREBASE_PROJECT_ID`.
- **Solution:** Copy the keys from your Firebase Console into `.env` (refer to `.env.example`).

### Q: "Missing or insufficient permissions (Firestore / Storage)"
- **Cause:** You are attempting to read/write documents without being logged in or trying to access another user's private data.
- **Solution:** Ensure you are authenticated. Check `firestore.rules` and `storage.rules` to verify document ownership (`request.auth.uid == resource.data.userId`).

---

## 2. Image Upload & Computer Vision Quality

### Q: "File size exceeds maximum allowed limit of 5MB"
- **Cause:** Uploaded image is larger than 5 Megabytes.
- **Solution:** Compress the image before uploading or adjust `MAX_FILE_SIZE` in `ai_routes.py` and `storage.rules`.

### Q: "Corrupted or invalid image file"
- **Cause:** The file uploaded failed PIL header validation (e.g. non-image renamed to `.jpg`).
- **Solution:** Ensure the file is a genuine JPEG, PNG, or WEBP image.

---

## 3. Real-Time Conversation & Status Tracking

### Q: Why is message status showing "Delivered ✓✓" instead of "Seen ✓✓"?
- **Expected Behavior:** A message shows `Delivered ✓✓` until the recipient opens and fetches the conversation thread. Once viewed by the recipient, the status turns cyan with `Seen ✓✓`.

---

## 4. Backend & MongoDB Fallback

### Q: "MongoDB not available... Initializing Persistent Dev Database"
- **Status:** Normal for local development without a running MongoDB daemon. The backend automatically switches to the persistent in-memory database (`.dev_db.json`), ensuring full functionality without manual MongoDB setup.
