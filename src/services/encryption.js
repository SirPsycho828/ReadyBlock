/**
 * Encrypt/decrypt sensitive data for local IndexedDB storage.
 * Uses Web Crypto API, keyed to the user's UID.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

/**
 * Derive an encryption key from the user's UID.
 * In production, this should use the Firebase Auth token for better security.
 */
async function deriveKey(uid) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(uid),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('readyblock-local-encryption'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt a JSON-serializable object.
 * Returns a base64 string containing IV + ciphertext.
 */
export async function encryptData(uid, data) {
  const key = await deriveKey(uid);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    plaintext,
  );

  // Combine IV + ciphertext into a single buffer
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Base64 encode for storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a base64 string back to an object.
 */
export async function decryptData(uid, encryptedString) {
  try {
    const key = await deriveKey(uid);

    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedString), (c) => c.charCodeAt(0));

    // Extract IV (first 12 bytes) and ciphertext
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext,
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(plaintext));
  } catch {
    return null;
  }
}
