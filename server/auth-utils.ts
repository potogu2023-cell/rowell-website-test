import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ENV } from './_core/env';

const SALT_ROUNDS = 10;

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate email verification token
 */
export function generateEmailVerificationToken(email: string): string {
  return jwt.sign(
    { email, type: 'email_verification' },
    ENV.cookieSecret,
    { expiresIn: '24h' }
  );
}

/**
 * Verify email verification token
 */
export function verifyEmailVerificationToken(token: string): { email: string } | null {
  try {
    const decoded = jwt.verify(token, ENV.cookieSecret) as { email: string; type: string };
    if (decoded.type !== 'email_verification') {
      return null;
    }
    return { email: decoded.email };
  } catch (error) {
    return null;
  }
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(email: string): string {
  return jwt.sign(
    { email, type: 'password_reset' },
    ENV.cookieSecret,
    { expiresIn: '1h' }
  );
}

/**
 * Verify password reset token
 */
export function verifyPasswordResetToken(token: string): { email: string } | null {
  try {
    const decoded = jwt.verify(token, ENV.cookieSecret) as { email: string; type: string };
    if (decoded.type !== 'password_reset') {
      return null;
    }
    return { email: decoded.email };
  } catch (error) {
    return null;
  }
}

