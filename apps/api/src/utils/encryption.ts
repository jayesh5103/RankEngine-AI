/**
 * AES-256-GCM encryption utility for sensitive fields at rest.
 *
 * Key source:  process.env.ENCRYPTION_KEY (32-byte hex string = 64 hex chars)
 * Algorithm:   AES-256-GCM (authenticated encryption — detects tampering)
 * IV:          Random 12-byte nonce, prepended to ciphertext as hex
 * Auth tag:    16-byte GCM tag, appended after the ciphertext as hex
 *
 * Wire format (all hex, ':' delimited):
 *   <iv_hex>:<ciphertext_hex>:<authTag_hex>
 *
 * Usage:
 *   const cipher = encrypt('my-secret-value');   // store this string
 *   const plain  = decrypt(cipher);               // retrieve original
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;  // 96-bit nonce — recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY ?? '';
  if (raw.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(raw, 'hex');
}

/**
 * Encrypts a plaintext string.
 * Returns a ':' delimited hex string: <iv>:<ciphertext>:<authTag>
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('hex'), encrypted.toString('hex'), authTag.toString('hex')].join(':');
}

/**
 * Decrypts a value produced by encrypt().
 * Throws if the auth tag does not match (data was tampered with).
 */
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted value format. Expected <iv>:<ciphertext>:<authTag>.');
  }

  const [ivHex, encHex, tagHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
