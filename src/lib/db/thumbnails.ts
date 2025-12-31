// Thumbnail storage using IndexedDB for local image persistence
import { v4 as uuid } from 'uuid';

const DB_NAME = 'DentistryStudyHub_Thumbnails';
const STORE_NAME = 'thumbnails';
const DB_VERSION = 1;

// Limits
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB max upload
const MAX_DIMENSION = 512; // Max width or height in pixels
const JPEG_QUALITY = 0.85;

let db: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

interface StoredThumbnail {
  id: string;
  blob: Blob;
  mimeType: string;
  createdAt: string;
}

// Resize image to fit within max dimensions while maintaining aspect ratio
async function resizeImage(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Check if resize is needed
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        resolve(blob);
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      if (width > height) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }

      // Draw to canvas and export
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (resizedBlob) => {
          if (resizedBlob) {
            resolve(resizedBlob);
          } else {
            reject(new Error('Failed to resize image'));
          }
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for resizing'));
    };

    img.src = url;
  });
}

// Save a blob to IndexedDB and return a local URL
export async function saveThumbnail(blob: Blob): Promise<string> {
  // Resize if needed
  const resizedBlob = await resizeImage(blob);
  
  const database = await getDB();
  const id = uuid();

  const thumbnail: StoredThumbnail = {
    id,
    blob: resizedBlob,
    mimeType: resizedBlob.type,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(thumbnail);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(`local-thumbnail://${id}`);
  });
}

// Get a blob URL for a stored thumbnail
export async function getThumbnailUrl(localUrl: string): Promise<string | null> {
  if (!localUrl.startsWith('local-thumbnail://')) {
    return localUrl; // Return as-is if it's a regular URL
  }

  const id = localUrl.replace('local-thumbnail://', '');
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const thumbnail = request.result as StoredThumbnail | undefined;
      if (thumbnail) {
        const blobUrl = URL.createObjectURL(thumbnail.blob);
        resolve(blobUrl);
      } else {
        resolve(null);
      }
    };
  });
}

// Delete a stored thumbnail
export async function deleteThumbnail(localUrl: string): Promise<void> {
  if (!localUrl.startsWith('local-thumbnail://')) return;

  const id = localUrl.replace('local-thumbnail://', '');
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Download an image from URL and save it locally
export async function downloadAndSaveThumbnail(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');

    // Check content-length header if available
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      throw new Error(`Image too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    const blob = await response.blob();
    
    // Double-check actual size
    if (blob.size > MAX_FILE_SIZE) {
      throw new Error(`Image too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
    
    // Verify it's an image
    if (!blob.type.startsWith('image/')) {
      throw new Error('URL does not point to an image');
    }

    return await saveThumbnail(blob);
  } catch (error) {
    console.error('Failed to download thumbnail:', error);
    throw error;
  }
}

// Convert a File to a stored thumbnail
export async function saveFileAsThumbnail(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  return await saveThumbnail(file);
}

// Check if a URL is a local thumbnail
export function isLocalThumbnail(url: string): boolean {
  return url.startsWith('local-thumbnail://');
}
