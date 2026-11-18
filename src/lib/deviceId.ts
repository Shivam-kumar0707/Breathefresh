/**
 * Device ID Management
 * Pure anonymous identity via a random UUID stored in localStorage.
 * No auth, no cookies, no accounts.
 */

const STORAGE_KEY = 'breathefresh_device_id';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Standard RFC4122 v4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id || id.length !== 36) {
      id = generateUuid();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    // If localStorage is blocked in private browsing, return an ephemeral UUID
    return generateUuid();
  }
}
