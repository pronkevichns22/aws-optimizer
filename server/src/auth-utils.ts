// ============================================================================
// FILE: auth-utils.ts
// LOCATION: server/src/
// PURPOSE: Authentication utilities - JWT tokens, password hashing, credential encryption
// ============================================================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRATION = '30d'; // Token expires in 30 days
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars!!!!!'; // Should be 32 chars for AES-256

// ============================================================================
// JWT TOKEN MANAGEMENT
// ============================================================================

/**
 * Generate JWT token for user session
 * @param userId - MongoDB user ID
 * @param email - User email
 * @returns JWT token string
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
}

/**
 * Verify and decode JWT token
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value (e.g., "Bearer token123")
 * @returns Token string or null
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

// ============================================================================
// PASSWORD HASHING
// ============================================================================

/**
 * Hash password using bcryptjs
 * @param password - Plain text password
 * @returns Promise<hashed password>
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain text password with hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password
 * @returns Promise<boolean>
 */
export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ============================================================================
// AWS CREDENTIALS ENCRYPTION/DECRYPTION
// ============================================================================

/**
 * Encrypt AWS credentials using AES-256-CBC
 * @param accessKey - AWS Access Key ID
 * @param secretKey - AWS Secret Access Key
 * @returns Object with encrypted data and IV
 */
export function encryptCredentials(accessKey: string, secretKey: string): { encrypted: string; iv: string } {
  try {
    // Ensure encryption key is exactly 32 bytes
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    
    // Generate random IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    // Combine credentials to encrypt
    const credentials = JSON.stringify({ accessKey, secretKey });
    
    // Encrypt
    let encrypted = cipher.update(credentials, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
    };
  } catch (error) {
    console.error('Error encrypting credentials:', error);
    throw new Error('Failed to encrypt credentials');
  }
}

/**
 * Decrypt AWS credentials
 * @param encrypted - Encrypted credentials (hex string)
 * @param iv - Initialization vector (hex string)
 * @returns Object with decrypted accessKey and secretKey
 */
export function decryptCredentials(encrypted: string, iv: string): { accessKey: string; secretKey: string } {
  try {
    // Ensure encryption key is exactly 32 bytes
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    
    // Convert IV from hex
    const ivBuffer = Buffer.from(iv, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    
    // Parse credentials
    const credentials = JSON.parse(decrypted);
    return {
      accessKey: credentials.accessKey,
      secretKey: credentials.secretKey,
    };
  } catch (error) {
    console.error('Error decrypting credentials:', error);
    throw new Error('Failed to decrypt credentials');
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate email format
 * @param email - Email to validate
 * @returns boolean
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Password must be at least 8 characters with mixed case and numbers
 * @param password - Password to validate
 * @returns Object with isValid boolean and message
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  return { isValid: true, message: 'Password is strong' };
}
