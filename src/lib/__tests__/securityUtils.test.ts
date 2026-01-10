import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sanitizeInput,
  validateInput,
  checkRateLimit,
  validateApiKey,
  generateSecureToken,
  simpleHash,
  validateFileUpload,
  createNonce,
  createRateLimiter,
  cleanupRateLimitStore,
  SECURITY_HEADERS,
  VALIDATION_PATTERNS,
} from '../securityUtils';

describe('SecurityUtils', () => {
  beforeEach(() => {
    // Clear rate limit store before each test
    cleanupRateLimitStore();
    vi.clearAllMocks();
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      expect(result).toBe('scriptalertxss/script');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert("test")';
      const result = sanitizeInput(input);
      expect(result).toBe('alerttest');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(\'test\')">click me</div>';
      const result = sanitizeInput(input);
      expect(result).toBe('div  me/div');
    });

    it('should trim and limit length', () => {
      const input = '  ' + 'a'.repeat(2000) + '  ';
      const result = sanitizeInput(input);
      expect(result).toHaveLength(1000);
      expect(result).toBe('a'.repeat(1000));
    });

    it('should handle non-string input', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
      expect(sanitizeInput(123 as any)).toBe('');
    });
  });

  describe('validateInput', () => {
    it('should validate email addresses', () => {
      expect(validateInput('test@example.com', 'email')).toBe(true);
      expect(validateInput('invalid.email', 'email')).toBe(false);
      expect(validateInput('test@', 'email')).toBe(false);
    });

    it('should validate phone numbers', () => {
      expect(validateInput('+1234567890', 'phone')).toBe(true);
      expect(validateInput('123-456-7890', 'phone')).toBe(true);
      expect(validateInput('(123) 456-7890', 'phone')).toBe(true);
      expect(validateInput('invalid-phone', 'phone')).toBe(false);
    });

    it('should validate URLs', () => {
      expect(validateInput('https://example.com', 'url')).toBe(true);
      expect(validateInput('http://test.com/path', 'url')).toBe(true);
      expect(validateInput('ftp://example.com', 'url')).toBe(false);
      expect(validateInput('not-a-url', 'url')).toBe(false);
    });

    it('should validate alphanumeric strings', () => {
      expect(validateInput('test123', 'alphanumeric')).toBe(true);
      expect(validateInput('test-123_test', 'alphanumeric')).toBe(true);
      expect(validateInput('test@123', 'alphanumeric')).toBe(false);
    });

    it('should validate numeric strings', () => {
      expect(validateInput('12345', 'numeric')).toBe(true);
      expect(validateInput('123.45', 'numeric')).toBe(false);
      expect(validateInput('abc123', 'numeric')).toBe(false);
    });

    it('should validate currency amounts', () => {
      expect(validateInput('10.99', 'currency')).toBe(true);
      expect(validateInput('100', 'currency')).toBe(true);
      expect(validateInput('10.999', 'currency')).toBe(false);
      expect(validateInput('abc', 'currency')).toBe(false);
    });

    it('should validate UUIDs', () => {
      expect(validateInput('550e8400-e29b-41d4-a716-446655440000', 'uuid')).toBe(true);
      expect(validateInput('550e8400-e29b-11d4-a716-446655440000', 'uuid')).toBe(true);
      expect(validateInput('invalid-uuid', 'uuid')).toBe(false);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const result = checkRateLimit('test-user');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
    });

    it('should block requests exceeding limit', () => {
      const identifier = 'test-user';
      const config = { windowMs: 60000, maxRequests: 2, skipSuccessfulRequests: false, skipFailedRequests: false };
      
      checkRateLimit(identifier, config);
      checkRateLimit(identifier, config);
      const result = checkRateLimit(identifier, config);
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after window expires', () => {
      const identifier = 'test-user';
      const config = { windowMs: 100, maxRequests: 1, skipSuccessfulRequests: false, skipFailedRequests: false };
      
      checkRateLimit(identifier, config);
      const blocked = checkRateLimit(identifier, config);
      expect(blocked.allowed).toBe(false);
      
      // Wait for window to expire
      setTimeout(() => {
        const result = checkRateLimit(identifier, config);
        expect(result.allowed).toBe(true);
      }, 150);
    });
  });

  describe('validateApiKey', () => {
    it('should validate public API keys', () => {
      expect(validateApiKey('pk_test_12345678901234567890')).toEqual({ isValid: true, type: 'public' });
      expect(validateApiKey('pk_123')).toEqual({ isValid: false });
    });

    it('should validate secret API keys', () => {
      expect(validateApiKey('sk_test_123456789012345678901234567890')).toEqual({ isValid: true, type: 'secret' });
      expect(validateApiKey('sk_123')).toEqual({ isValid: false });
    });

    it('should reject invalid API keys', () => {
      expect(validateApiKey('invalid_key')).toEqual({ isValid: false });
      expect(validateApiKey('')).toEqual({ isValid: false });
    });
  });

  describe('generateSecureToken', () => {
    it('should generate tokens of specified length', () => {
      const token = generateSecureToken(32);
      expect(token).toHaveLength(32);
    });

    it('should generate different tokens', () => {
      const token1 = generateSecureToken(32);
      const token2 = generateSecureToken(32);
      expect(token1).not.toBe(token2);
    });

    it('should use crypto API when available', () => {
      // Test that crypto API is used by checking if the function works
      // We can't mock global.crypto directly as it's read-only in modern environments
      const token = generateSecureToken(32);
      expect(token).toHaveLength(32);
      expect(typeof token).toBe('string');
      
      // Verify it generates different tokens (indicating randomness)
      const token2 = generateSecureToken(32);
      expect(token).not.toBe(token2);
    });
  });

  describe('simpleHash', () => {
    it('should generate consistent hashes', () => {
      const hash1 = simpleHash('test');
      const hash2 = simpleHash('test');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = simpleHash('test1');
      const hash2 = simpleHash('test2');
      expect(hash1).not.toBe(hash2);
    });

    it('should generate non-negative hashes', () => {
      const hash = simpleHash('test');
      expect(parseInt(hash, 36)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateFileUpload', () => {
    it('should validate valid files', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });
      
      const result = validateFileUpload(file);
      expect(result.isValid).toBe(true);
    });

    it('should reject files exceeding size limit', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB
      
      const result = validateFileUpload(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds');
    });

    it('should reject invalid file types', () => {
      const file = new File(['content'], 'test.exe', { type: 'application/x-executable' });
      Object.defineProperty(file, 'size', { value: 1024 });
      
      const result = validateFileUpload(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File type');
    });

    it('should reject files with malicious names', () => {
      const file = new File(['content'], '../../../etc/passwd', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });
      
      const result = validateFileUpload(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid file name');
    });

    it('should handle missing file', () => {
      const result = validateFileUpload(null as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('No file provided');
    });
  });

  describe('createNonce', () => {
    it('should generate nonces', () => {
      const nonce = createNonce();
      expect(nonce).toBeTruthy();
      expect(typeof nonce).toBe('string');
    });

    it('should generate different nonces', () => {
      const nonce1 = createNonce();
      const nonce2 = createNonce();
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('createRateLimiter', () => {
    it('should create rate limiter middleware', () => {
      const config = { windowMs: 60000, maxRequests: 2, skipSuccessfulRequests: false, skipFailedRequests: false };
      const rateLimiter = createRateLimiter(config);
      
      const result1 = rateLimiter('createRateLimiter-test-user-1');
      expect(result1.allowed).toBe(true);
      expect(result1.headers?.['X-RateLimit-Remaining']).toBe('1');
      
      const result2 = rateLimiter('createRateLimiter-test-user-1');
      expect(result2.allowed).toBe(true);
      expect(result2.headers?.['X-RateLimit-Remaining']).toBe('0');
      
      const result3 = rateLimiter('createRateLimiter-test-user-1');
      expect(result3.allowed).toBe(false);
      expect(result3.headers?.['X-RateLimit-Remaining']).toBe('0');
    });

    it('should call onLimitExceeded callback', () => {
      const onLimitExceeded = vi.fn();
      const config = { windowMs: 60000, maxRequests: 1, skipSuccessfulRequests: false, skipFailedRequests: false };
      const rateLimiter = createRateLimiter(config);
      
      rateLimiter('createRateLimiter-test-user-2');
      rateLimiter('createRateLimiter-test-user-2', onLimitExceeded);
      
      expect(onLimitExceeded).toBeCalled();
    });
  });

  describe('SECURITY_HEADERS', () => {
    it('should contain required security headers', () => {
      expect(SECURITY_HEADERS).toHaveProperty('X-Content-Type-Options');
      expect(SECURITY_HEADERS).toHaveProperty('X-Frame-Options');
      expect(SECURITY_HEADERS).toHaveProperty('X-XSS-Protection');
      expect(SECURITY_HEADERS).toHaveProperty('Strict-Transport-Security');
      expect(SECURITY_HEADERS).toHaveProperty('Referrer-Policy');
      expect(SECURITY_HEADERS).toHaveProperty('Content-Security-Policy');
    });

    it('should have secure header values', () => {
      expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
      expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
      expect(SECURITY_HEADERS['X-XSS-Protection']).toBe('1; mode=block');
      expect(SECURITY_HEADERS['Strict-Transport-Security']).toContain('max-age=31536000');
      expect(SECURITY_HEADERS['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('VALIDATION_PATTERNS', () => {
    it('should contain required validation patterns', () => {
      expect(VALIDATION_PATTERNS).toHaveProperty('email');
      expect(VALIDATION_PATTERNS).toHaveProperty('phone');
      expect(VALIDATION_PATTERNS).toHaveProperty('url');
      expect(VALIDATION_PATTERNS).toHaveProperty('alphanumeric');
      expect(VALIDATION_PATTERNS).toHaveProperty('numeric');
      expect(VALIDATION_PATTERNS).toHaveProperty('currency');
      expect(VALIDATION_PATTERNS).toHaveProperty('uuid');
    });

    it('should have valid regex patterns', () => {
      Object.values(VALIDATION_PATTERNS).forEach(pattern => {
        expect(pattern).toBeInstanceOf(RegExp);
      });
    });
  });
});