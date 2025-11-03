import crypto from 'crypto';

/**
 * Encryption utilities for AI advisor message content
 * Uses AES-256-CBC encryption with key derived from JWT_SECRET
 */

// Derive encryption key from JWT_SECRET
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(process.env.JWT_SECRET || 'fallback-secret-key')
  .digest();

const IV_LENGTH = 16; // AES block size
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt text content
 * @param text Plain text to encrypt
 * @returns Base64 encoded encrypted string in format: iv:encryptedData
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV and encrypted data separated by colon
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('[Encryption] Failed to encrypt:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt encrypted content
 * @param encryptedText Encrypted string in format: iv:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[Encryption] Failed to decrypt:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Test encryption/decryption functionality
 * Should only be used in development
 */
export function testEncryption(): boolean {
  try {
    const testMessage = 'Hello, this is a test message for AI advisor encryption';
    const encrypted = encrypt(testMessage);
    const decrypted = decrypt(encrypted);
    
    if (testMessage === decrypted) {
      console.log('[Encryption] Test passed ✓');
      return true;
    } else {
      console.error('[Encryption] Test failed: decrypted text does not match original');
      return false;
    }
  } catch (error) {
    console.error('[Encryption] Test failed with error:', error);
    return false;
  }
}
