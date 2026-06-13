// ============================================================================
// AUTH UTILS TESTS
// Tests for JWT tokens, password hashing, email validation, and credential encryption
// ============================================================================

import {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  hashPassword,
  comparePasswords,
  encryptCredentials,
  decryptCredentials,
  isValidEmail,
  validatePasswordStrength
} from './auth-utils';

describe('Auth Utils - Token Management', () => {
  describe('JWT Token Generation and Verification', () => {
    it('should generate valid JWT token', () => {
      const token = generateToken('user-123', 'user@example.com');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should verify generated token', () => {
      const token = generateToken('user-123', 'user@example.com');
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('user-123');
      expect(decoded?.email).toBe('user@example.com');
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid.token.here');
      expect(decoded).toBeNull();
    });

    it('should return null for expired/malformed token', () => {
      const decoded = verifyToken('');
      expect(decoded).toBeNull();
    });
  });

  describe('Extract Token from Header', () => {
    it('should extract valid Bearer token', () => {
      const token = generateToken('user-123', 'user@example.com');
      const extracted = extractTokenFromHeader(`Bearer ${token}`);
      
      expect(extracted).toBe(token);
    });

    it('should return null for missing Bearer prefix', () => {
      const token = generateToken('user-123', 'user@example.com');
      const extracted = extractTokenFromHeader(token);
      
      expect(extracted).toBeNull();
    });

    it('should return null for undefined header', () => {
      const extracted = extractTokenFromHeader(undefined);
      expect(extracted).toBeNull();
    });

    it('should return null for malformed header', () => {
      const extracted = extractTokenFromHeader('InvalidFormat token');
      expect(extracted).toBeNull();
    });
  });
});

describe('Auth Utils - Password Management', () => {
  describe('Password Hashing and Comparison', () => {
    it('should hash password', async () => {
      const password = 'MyPassword123';
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(20); // bcrypt hashes are long
    });

    it('should compare passwords correctly', async () => {
      const password = 'MyPassword123';
      const hashed = await hashPassword(password);
      const match = await comparePasswords(password, hashed);
      
      expect(match).toBe(true);
    });

    it('should not match incorrect password', async () => {
      const password = 'MyPassword123';
      const hashed = await hashPassword(password);
      const match = await comparePasswords('WrongPassword456', hashed);
      
      expect(match).toBe(false);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'MyPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2); // Different salts = different hashes
    });
  });
});

describe('Auth Utils - AWS Credentials Encryption', () => {
  const testAccessKey = 'AKIAIOSFODNN7EXAMPLE';
  const testSecretKey = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

  describe('Encrypt and Decrypt Credentials', () => {
    it('should encrypt credentials', () => {
      const result = encryptCredentials(testAccessKey, testSecretKey);
      
      expect(result).toBeDefined();
      expect(result.encrypted).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(typeof result.encrypted).toBe('string');
      expect(typeof result.iv).toBe('string');
    });

    it('should decrypt encrypted credentials', () => {
      const encrypted = encryptCredentials(testAccessKey, testSecretKey);
      const decrypted = decryptCredentials(encrypted.encrypted, encrypted.iv);
      
      expect(decrypted.accessKey).toBe(testAccessKey);
      expect(decrypted.secretKey).toBe(testSecretKey);
    });

    it('should produce different IV for each encryption', () => {
      const result1 = encryptCredentials(testAccessKey, testSecretKey);
      const result2 = encryptCredentials(testAccessKey, testSecretKey);
      
      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.encrypted).not.toBe(result2.encrypted);
    });

    it('should handle long credential strings', () => {
      const longAccessKey = 'A'.repeat(100);
      const longSecretKey = 'S'.repeat(200);
      
      const encrypted = encryptCredentials(longAccessKey, longSecretKey);
      const decrypted = decryptCredentials(encrypted.encrypted, encrypted.iv);
      
      expect(decrypted.accessKey).toBe(longAccessKey);
      expect(decrypted.secretKey).toBe(longSecretKey);
    });
  });
});

describe('Auth Utils - Email Validation', () => {
  describe('Email Format Validation', () => {
    it('should validate correct email format', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('admin+tag@company.org')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(isValidEmail('user @example.com')).toBe(false);
      expect(isValidEmail('user@ example.com')).toBe(false);
    });
  });
});

describe('Auth Utils - Password Strength Validation', () => {
  describe('Password Requirements Check', () => {
    it('should accept strong password', () => {
      const result = validatePasswordStrength('MyStr0ngPassword');
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Password is strong');
    });

    it('should reject password less than 8 chars', () => {
      const result = validatePasswordStrength('Weak1');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 8 characters');
    });

    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('lowercase123');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = validatePasswordStrength('UPPERCASE123');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePasswordStrength('NoNumbers');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('number');
    });

    it('should accept various strong passwords', () => {
      const passwords = [
        'P@ssw0rd',
        'MyP@ss123',
        'Correct1Horse',
        'SecurePass99'
      ];

      passwords.forEach(pwd => {
        const result = validatePasswordStrength(pwd);
        expect(result.isValid).toBe(true);
      });
    });
  });
});
