// Security middleware for API routes and request validation

import { 
  sanitizeInput, 
  validateInput, 
  createRateLimiter, 
  SECURITY_HEADERS,
  validateApiKey,
  RateLimitConfig 
} from './securityUtils';
import { validateEnvironment } from './envValidation';

export interface SecurityMiddlewareConfig {
  enableRateLimiting: boolean;
  enableInputValidation: boolean;
  enableSecurityHeaders: boolean;
  enableApiKeyValidation: boolean;
  rateLimitConfig: RateLimitConfig;
}

export interface RequestContext {
  ip: string;
  userAgent: string;
  apiKey?: string;
  userId?: string;
  sessionId?: string;
}

export interface SecurityResult {
  allowed: boolean;
  statusCode?: number;
  message?: string;
  headers?: Record<string, string>;
  sanitizedData?: Record<string, any>;
}

// Default security configuration
export const DEFAULT_SECURITY_CONFIG: SecurityMiddlewareConfig = {
  enableRateLimiting: true,
  enableInputValidation: true,
  enableSecurityHeaders: true,
  enableApiKeyValidation: false,
  rateLimitConfig: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
};

// Create rate limiter instances for different endpoints
const apiRateLimiter = createRateLimiter(DEFAULT_SECURITY_CONFIG.rateLimitConfig);
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

const sensitiveRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Get client identifier for rate limiting
function getClientIdentifier(context: RequestContext): string {
  return context.ip || context.sessionId || 'anonymous';
}

// Validate API request
export function validateApiRequest(
  endpoint: string,
  data: Record<string, any>,
  context: RequestContext,
  config: SecurityMiddlewareConfig = DEFAULT_SECURITY_CONFIG
): SecurityResult {
  try {
    // Check environment validation
    const envValidation = validateEnvironment();
    if (!envValidation.isValid && process.env.NODE_ENV === 'production') {
      return {
        allowed: false,
        statusCode: 500,
        message: 'Server configuration error',
      };
    }

    // Rate limiting
    if (config.enableRateLimiting) {
      const clientId = getClientIdentifier(context);
      let rateLimitResult;

      // Use different rate limiters based on endpoint sensitivity
      if (endpoint.includes('auth') || endpoint.includes('login')) {
        rateLimitResult = authRateLimiter(clientId);
      } else if (endpoint.includes('payment') || endpoint.includes('order')) {
        rateLimitResult = sensitiveRateLimiter(clientId);
      } else {
        rateLimitResult = apiRateLimiter(clientId);
      }

      if (!rateLimitResult.allowed) {
        return {
          allowed: false,
          statusCode: 429,
          message: 'Rate limit exceeded',
          headers: rateLimitResult.headers,
        };
      }
    }

    // API key validation
    if (config.enableApiKeyValidation && context.apiKey) {
      const apiKeyValidation = validateApiKey(context.apiKey);
      if (!apiKeyValidation.isValid) {
        return {
          allowed: false,
          statusCode: 401,
          message: 'Invalid API key',
        };
      }
    }

    // Input validation and sanitization
    if (config.enableInputValidation) {
      const sanitizedData: Record<string, any> = {};
      const errors: string[] = [];

      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          // Sanitize string inputs
          sanitizedData[key] = sanitizeInput(value);
          
          // Validate based on field name patterns
          if (key.includes('email') && value && !validateInput(value, 'email')) {
            errors.push(`Invalid email format for field: ${key}`);
          } else if (key.includes('phone') && value && !validateInput(value, 'phone')) {
            errors.push(`Invalid phone format for field: ${key}`);
          } else if (key.includes('url') && value && !validateInput(value, 'url')) {
            errors.push(`Invalid URL format for field: ${key}`);
          }
        } else if (typeof value === 'number') {
          sanitizedData[key] = value;
        } else if (typeof value === 'boolean') {
          sanitizedData[key] = value;
        } else if (value && typeof value === 'object') {
          // Recursively sanitize nested objects
          const nestedResult = validateApiRequest(endpoint, value, context, config);
          if (!nestedResult.allowed) {
            return nestedResult;
          }
          sanitizedData[key] = nestedResult.sanitizedData || value;
        } else {
          sanitizedData[key] = value;
        }
      }

      if (errors.length > 0) {
        return {
          allowed: false,
          statusCode: 400,
          message: `Validation errors: ${errors.join(', ')}`,
        };
      }

      return {
        allowed: true,
        sanitizedData,
      };
    }

    return { allowed: true };
  } catch (error) {
    return {
      allowed: false,
      statusCode: 500,
      message: 'Security validation error',
    };
  }
}

// Validate file upload request
export function validateFileUploadRequest(
  file: File,
  context: RequestContext,
  config: SecurityMiddlewareConfig = DEFAULT_SECURITY_CONFIG
): SecurityResult {
  try {
    // Rate limiting for file uploads
    if (config.enableRateLimiting) {
      const clientId = `file_upload:${getClientIdentifier(context)}`;
      const rateLimitResult = sensitiveRateLimiter(clientId);
      
      if (!rateLimitResult.allowed) {
        return {
          allowed: false,
          statusCode: 429,
          message: 'File upload rate limit exceeded',
          headers: rateLimitResult.headers,
        };
      }
    }

    // Validate file name
    if (file.name) {
      const sanitizedName = sanitizeInput(file.name);
      if (sanitizedName !== file.name) {
        return {
          allowed: false,
          statusCode: 400,
          message: 'Invalid file name',
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    return {
      allowed: false,
      statusCode: 500,
      message: 'File upload validation error',
    };
  }
}

// Add security headers to response
export function addSecurityHeaders(headers: Record<string, string> = {}): Record<string, string> {
  return {
    ...headers,
    ...SECURITY_HEADERS,
    // Add additional security headers
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

// Create security middleware for different endpoint types
export function createSecurityMiddleware(
  endpointType: 'api' | 'auth' | 'payment' | 'file_upload',
  customConfig?: Partial<SecurityMiddlewareConfig>
) {
  const config = { ...DEFAULT_SECURITY_CONFIG, ...customConfig };
  
  return function middleware(
    data: Record<string, any> | File,
    context: RequestContext
  ): SecurityResult {
    switch (endpointType) {
      case 'auth':
        return validateApiRequest('/auth', data as Record<string, any>, context, {
          ...config,
          rateLimitConfig: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 5,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
          },
        });
        
      case 'payment':
        return validateApiRequest('/payment', data as Record<string, any>, context, {
          ...config,
          enableApiKeyValidation: true,
          rateLimitConfig: {
            windowMs: 60 * 60 * 1000,
            maxRequests: 10,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
          },
        });
        
      case 'file_upload':
        return validateFileUploadRequest(data as File, context, config);
        
      default:
        return validateApiRequest('/api', data as Record<string, any>, context, config);
    }
  };
}

// Helper function to generate secure tokens
function generateSecureToken(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

// CSRF protection utilities
export function generateCSRFToken(): string {
  return generateSecureToken(32);
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length === 32;
}

// Session security utilities
export function validateSessionId(sessionId: string): boolean {
  return validateInput(sessionId, 'uuid');
}

export function generateSecureSessionId(): string {
  return generateSecureToken(32);
}

// IP address validation
export function validateIPAddress(ip: string): boolean {
  const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Pattern = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  
  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

// User agent validation
export function validateUserAgent(userAgent: string): boolean {
  if (!userAgent || typeof userAgent !== 'string') {
    return false;
  }
  
  const sanitized = sanitizeInput(userAgent);
  return sanitized.length > 0 && sanitized.length <= 500;
}

export default {
  validateApiRequest,
  validateFileUploadRequest,
  addSecurityHeaders,
  createSecurityMiddleware,
  generateCSRFToken,
  validateCSRFToken,
  validateSessionId,
  generateSecureSessionId,
  validateIPAddress,
  validateUserAgent,
  DEFAULT_SECURITY_CONFIG,
};