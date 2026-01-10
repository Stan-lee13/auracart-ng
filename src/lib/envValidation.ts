// Environment variable validation utilities

export interface EnvironmentConfig {
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  requiredVars: string[];
  optionalVars: string[];
}

export interface ValidationResult {
  isValid: boolean;
  missingVars: string[];
  invalidVars: string[];
  warnings: string[];
}

// Required environment variables for the application
const REQUIRED_ENV_VARS = {
  production: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_PAYSTACK_PUBLIC_KEY',
    'VITE_APP_URL',
  ],
  development: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_PAYSTACK_PUBLIC_KEY',
  ],
  test: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ],
} as const;

// Optional environment variables with validation rules
const OPTIONAL_ENV_VARS = {
  'VITE_ENVIRONMENT': (value: string) => ['development', 'production', 'test'].includes(value),
  'VITE_API_URL': (value: string) => isValidUrl(value),
  'VITE_CURRENCY_API_KEY': (value: string) => value.length >= 10,
  'VITE_ANALYTICS_ID': (value: string) => value.startsWith('G-') || value.startsWith('UA-'),
  'VITE_SENTRY_DSN': (value: string) => value.includes('sentry.io'),
  'VITE_LOG_LEVEL': (value: string) => ['debug', 'info', 'warn', 'error'].includes(value),
} as const;

// Helper functions
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeInput(input: string): string {
  return input.replace(/[<>"'&]/g, '');
}

// Main validation function
export function validateEnvironment(): ValidationResult {
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
  const requiredVars = REQUIRED_ENV_VARS[environment as keyof typeof REQUIRED_ENV_VARS] || REQUIRED_ENV_VARS.development;
  
  const missingVars: string[] = [];
  const invalidVars: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of requiredVars) {
    const value = import.meta.env[envVar];
    if (!value || value.trim() === '') {
      missingVars.push(envVar);
    } else if (!isValidValue(envVar, value)) {
      invalidVars.push(envVar);
    }
  }

  // Check optional variables
  for (const [envVar, validator] of Object.entries(OPTIONAL_ENV_VARS)) {
    const value = import.meta.env[envVar];
    if (value && value.trim() !== '') {
      if (!validator(value)) {
        warnings.push(`Optional environment variable ${envVar} has invalid format`);
      }
    }
  }

  // Security checks
  if (environment === 'production') {
    // Check for development-only variables in production
    if (import.meta.env.VITE_DEBUG === 'true') {
      warnings.push('DEBUG mode is enabled in production environment');
    }
    
    // Check for localhost URLs in production
    const appUrl = import.meta.env.VITE_APP_URL;
    if (appUrl && (appUrl.includes('localhost') || appUrl.includes('127.0.0.1'))) {
      warnings.push('APP_URL contains localhost in production environment');
    }
  }

  return {
    isValid: missingVars.length === 0 && invalidVars.length === 0,
    missingVars,
    invalidVars,
    warnings,
  };
}

// Validate specific environment variable values
function isValidValue(envVar: string, value: string): boolean {
  switch (envVar) {
    case 'VITE_SUPABASE_URL':
      return isValidUrl(value) && value.includes('supabase.co');
    
    case 'VITE_SUPABASE_ANON_KEY':
      return value.length >= 50 && value.startsWith('eyJ'); // JWT token format
    
    case 'VITE_PAYSTACK_PUBLIC_KEY':
      return value.startsWith('pk_') && value.length >= 20;
    
    case 'VITE_APP_URL':
      return isValidUrl(value);
    
    default:
      return true;
  }
}

// Get environment configuration
export function getEnvironmentConfig(): EnvironmentConfig {
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
  
  return {
    isProduction: environment === 'production',
    isDevelopment: environment === 'development',
    isTest: environment === 'test',
    requiredVars: [...(REQUIRED_ENV_VARS[environment as keyof typeof REQUIRED_ENV_VARS] || REQUIRED_ENV_VARS.development)],
    optionalVars: Object.keys(OPTIONAL_ENV_VARS),
  };
}

// Security validation
export function validateSecuritySettings(): { isSecure: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for secure headers
  if (typeof window !== 'undefined') {
    // Client-side security checks
    if (window.location.protocol !== 'https:' && getEnvironmentConfig().isProduction) {
      issues.push('Site should use HTTPS in production');
    }
  }
  
  // Check for exposed sensitive data
  const sensitivePatterns = [
    /sk_(live|test)_[a-zA-Z0-9]{20,}/, // Stripe secret keys
    /pk_(live|test)_[a-zA-Z0-9]{20,}/, // Stripe public keys (should be public but validate format)
    /[a-zA-Z0-9]{40,}/, // Generic long strings that might be API keys
  ];
  
  // Check environment variables for potential security issues
  Object.entries(import.meta.env).forEach(([key, value]) => {
    if (typeof value === 'string' && key !== 'VITE_PAYSTACK_PUBLIC_KEY') {
      sensitivePatterns.forEach(pattern => {
        if (pattern.test(value) && !key.toLowerCase().includes('public')) {
          issues.push(`Potential sensitive data in environment variable: ${key}`);
        }
      });
    }
  });
  
  return {
    isSecure: issues.length === 0,
    issues,
  };
}

// Initialize environment validation
export function initializeEnvironment(): void {
  const validation = validateEnvironment();
  const security = validateSecuritySettings();
  
  if (!validation.isValid) {
    console.error('Environment validation failed:');
    
    if (validation.missingVars.length > 0) {
      console.error('Missing required variables:', validation.missingVars);
    }
    
    if (validation.invalidVars.length > 0) {
      console.error('Invalid variables:', validation.invalidVars);
    }
    
    // In production, throw error to prevent app startup
    if (getEnvironmentConfig().isProduction) {
      throw new Error('Environment validation failed');
    }
  }
  
  if (validation.warnings.length > 0) {
    console.warn('Environment warnings:', validation.warnings);
  }
  
  if (!security.isSecure) {
    console.warn('Security issues found:', security.issues);
  }
  
  // Log successful validation
  if (validation.isValid && security.isSecure) {
    console.log('Environment validation passed');
  }
}

export default {
  validateEnvironment,
  getEnvironmentConfig,
  validateSecuritySettings,
  initializeEnvironment,
};