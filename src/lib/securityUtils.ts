// Security utilities for input validation, sanitization, and rate limiting

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface SecurityHeaders {
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Strict-Transport-Security': string;
  'Referrer-Policy': string;
  'Content-Security-Policy': string;
}

// Rate limiting storage (in-memory for now, should use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security headers configuration
export const SECURITY_HEADERS: SecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
};

// Input validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9\s\-_]+$/,
  numeric: /^\d+$/,
  currency: /^\d+(\.\d{1,2})?$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

// Sanitize input to prevent XSS and injection attacks
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/javascript:/gi, '') // Remove javascript: protocol first
    .replace(/on\w+\s*=\s*"[^"]*"|'[^']*'/gi, ' ') // Remove event handlers with quoted content
    .replace(/on\w+\s*=\s*[^\s>]*/gi, ' ') // Remove event handlers with unquoted content
    .replace(/click\s+/gi, '') // Remove "click" and following spaces
    .replace(/[<>'"&()]/g, '') // Remove dangerous characters including parentheses and quotes
    .trim()
    .slice(0, 1000); // Limit length
}

// Validate input against patterns
export function validateInput(input: string, pattern: keyof typeof VALIDATION_PATTERNS): boolean {
  return VALIDATION_PATTERNS[pattern].test(input);
}

// Rate limiting implementation
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  }
): { allowed: boolean; resetTime?: number; remaining?: number } {
  const now = Date.now();
  const key = `rate_limit:${identifier}`;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset rate limit
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    
    return { allowed: true, remaining: config.maxRequests - 1 };
  }
  
  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      resetTime: current.resetTime,
      remaining: 0,
    };
  }
  
  current.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
  };
}

// Clean up expired rate limit entries
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Validate API key format
export function validateApiKey(key: string): { isValid: boolean; type?: 'public' | 'secret' } {
  if (key.startsWith('pk_') && key.length >= 20) {
    return { isValid: true, type: 'public' };
  }
  
  if (key.startsWith('sk_') && key.length >= 30) {
    return { isValid: true, type: 'secret' };
  }
  
  return { isValid: false };
}

// Generate secure random token
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Use Web Crypto API
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      token += chars[array[i] % chars.length];
    }
  } else {
    // Fallback to Math.random (less secure)
    for (let i = 0; i < length; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return token;
}

// Hash sensitive data (simple hash for non-crypto purposes)
export function simpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Validate file upload
export function validateFileUpload(
  file: File,
  options: {
    maxSize: number;
    allowedTypes: string[];
    maxNameLength: number;
  } = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxNameLength: 255,
  }
): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }
  
  if (file.size > options.maxSize) {
    return { isValid: false, error: `File size exceeds ${options.maxSize / (1024 * 1024)}MB limit` };
  }
  
  if (!options.allowedTypes.includes(file.type)) {
    return { isValid: false, error: `File type ${file.type} not allowed` };
  }
  
  if (file.name.length > options.maxNameLength) {
    return { isValid: false, error: 'File name too long' };
  }
  
  // Check for potential malicious file names
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { isValid: false, error: 'Invalid file name' };
  }
  
  return { isValid: true };
}

// Create CSP nonce for inline scripts
export function createNonce(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
}

// Rate limiting middleware for API calls
export function createRateLimiter(config: RateLimitConfig) {
  return function rateLimitMiddleware(
    identifier: string,
    onLimitExceeded?: () => void
  ): { allowed: boolean; headers?: Record<string, string> } {
    const result = checkRateLimit(identifier, config);
    
    if (!result.allowed) {
      if (onLimitExceeded) {
        onLimitExceeded();
      }
      
      return {
        allowed: false,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime?.toString() || '',
          'Retry-After': Math.ceil(((result.resetTime || 0) - Date.now()) / 1000).toString(),
        },
      };
    }
    
    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining?.toString() || '0',
      },
    };
  };
}

// Clean up rate limit store periodically
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(cleanupRateLimitStore, 60 * 1000); // Clean up every minute
}

export default {
  sanitizeInput,
  validateInput,
  checkRateLimit,
  validateApiKey,
  generateSecureToken,
  simpleHash,
  validateFileUpload,
  createNonce,
  createRateLimiter,
  SECURITY_HEADERS,
  VALIDATION_PATTERNS,
};