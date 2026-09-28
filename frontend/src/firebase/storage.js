import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './config';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates image before upload.
 */
export function validateImageFile(file) {
  if (!file) {
    throw new Error('No file selected.');
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type (${file.type}). Allowed formats: JPG, PNG, WEBP.`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum allowed limit of 5MB.`);
  }
  return true;
}

/**
 * Uploads an item image to Cloud Storage with structured path and progress tracking.
 * Path formats:
 * - lost-items/{userId}/{itemId}/{safeFilename}
 * - found-items/{userId}/{itemId}/{safeFilename}
 * - users/{userId}/profile/{safeFilename}
 */
export async function uploadItemImageToStorage(file, { userId, itemId, type = 'lost', onProgress = null }) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase Storage is not configured.');
  }

  validateImageFile(file);

  const cleanExt = file.name.split('.').pop() || 'jpg';
  const safeFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;
  const folder = type === 'found' ? 'found-items' : (type === 'profile' ? 'users' : 'lost-items');
  const path = type === 'profile' 
    ? `users/${userId}/profile/${safeFilename}`
    : `${folder}/${userId}/${itemId}/${safeFilename}`;

  const storageRef = ref(storage, path);
  const metadata = {
    contentType: file.type,
    customMetadata: {
      uploadedBy: userId,
      itemId: itemId || 'general',
      itemType: type
    }
  };

  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        reject(new Error(error.message || 'Image upload failed.'));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadUrl,
            storagePath: path,
            fileName: safeFilename,
            size: file.size,
            contentType: file.type
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Deletes an image from Firebase Storage.
 */
export async function deleteImageFromStorage(storagePath) {
  if (!isFirebaseConfigured || !storagePath) return;
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn('Storage delete warning:', err);
  }
}
