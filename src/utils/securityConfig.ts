/**
 * Security Configuration Utilities
 * Centralized configuration for all security-related features
 */

export interface SecuritySettings {
  // Account lockout settings
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  
  // Session timeout settings
  defaultSessionTimeoutMinutes: number;
  rememberMeSessionDays: number;
  sessionWarningMinutes: number;
  
  // Device trust settings
  deviceTrustDurationDays: number;
  autoTrustCurrentDevice: boolean;
  
  // New device notification settings
  enableNewDeviceNotifications: boolean;
  notificationRetentionDays: number;
  
  // Password requirements
  minPasswordLength: number;
  requireMixedCase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  
  // Security monitoring
  enableLoginAttemptLogging: boolean;
  enableSuspiciousActivityDetection: boolean;
  enableLocationBasedChecks: boolean;
}

// Default security configuration
export const DEFAULT_SECURITY_CONFIG: SecuritySettings = {
  // Account lockout
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 15,
  
  // Session timeout
  defaultSessionTimeoutMinutes: 120, // 2 hours
  rememberMeSessionDays: 7,
  sessionWarningMinutes: 5,
  
  // Device trust
  deviceTrustDurationDays: 30,
  autoTrustCurrentDevice: false,
  
  // New device notifications
  enableNewDeviceNotifications: true,
  notificationRetentionDays: 30,
  
  // Password requirements
  minPasswordLength: 8,
  requireMixedCase: true,
  requireNumbers: true,
  requireSymbols: false,
  
  // Security monitoring
  enableLoginAttemptLogging: true,
  enableSuspiciousActivityDetection: true,
  enableLocationBasedChecks: true,
};

// Security level presets
export const SECURITY_PRESETS = {
  BASIC: {
    ...DEFAULT_SECURITY_CONFIG,
    maxFailedAttempts: 8,
    lockoutDurationMinutes: 10,
    minPasswordLength: 6,
    requireMixedCase: false,
    requireNumbers: false,
    enableSuspiciousActivityDetection: false,
  } as SecuritySettings,
  
  STANDARD: DEFAULT_SECURITY_CONFIG,
  
  STRICT: {
    ...DEFAULT_SECURITY_CONFIG,
    maxFailedAttempts: 3,
    lockoutDurationMinutes: 30,
    defaultSessionTimeoutMinutes: 60, // 1 hour
    rememberMeSessionDays: 3,
    deviceTrustDurationDays: 14,
    minPasswordLength: 12,
    requireSymbols: true,
  } as SecuritySettings,
  
  ENTERPRISE: {
    ...DEFAULT_SECURITY_CONFIG,
    maxFailedAttempts: 3,
    lockoutDurationMinutes: 60, // 1 hour
    defaultSessionTimeoutMinutes: 30,
    rememberMeSessionDays: 1,
    deviceTrustDurationDays: 7,
    minPasswordLength: 16,
    requireSymbols: true,
    autoTrustCurrentDevice: false,
  } as SecuritySettings,
};

/**
 * Validate a password against security requirements
 */
export function validatePassword(password: string, config: SecuritySettings = DEFAULT_SECURITY_CONFIG): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < config.minPasswordLength) {
    errors.push(`Password must be at least ${config.minPasswordLength} characters long`);
  }
  
  if (config.requireMixedCase) {
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
  }
  
  if (config.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (config.requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculate password strength score (0-100)
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  level: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];
  
  // Length bonus
  if (password.length >= 8) score += 25;
  else if (password.length >= 6) score += 15;
  else feedback.push('Use at least 8 characters');
  
  // Character variety
  if (/[a-z]/.test(password)) score += 15;
  else feedback.push('Add lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 15;
  else feedback.push('Add uppercase letters');
  
  if (/\d/.test(password)) score += 15;
  else feedback.push('Add numbers');
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
  else feedback.push('Add special characters');
  
  // Complexity bonus
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.8) score += 10;
  
  // Penalty for common patterns
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
  if (/123|abc|qwe/i.test(password)) score -= 10; // Sequential patterns
  
  score = Math.max(0, Math.min(100, score));
  
  let level: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  if (score < 20) level = 'Very Weak';
  else if (score < 40) level = 'Weak';
  else if (score < 60) level = 'Fair';
  else if (score < 80) level = 'Good';
  else if (score < 95) level = 'Strong';
  else level = 'Very Strong';
  
  return { score, level, feedback };
}

/**
 * Check if an email is potentially suspicious
 */
export function checkEmailSuspicion(email: string): {
  isSuspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  
  // Check for suspicious patterns
  if (/\+.*\+/.test(email)) {
    reasons.push('Multiple plus signs in email');
  }
  
  if (/\.{2,}/.test(email)) {
    reasons.push('Multiple consecutive dots');
  }
  
  if (/[0-9]{8,}/.test(email)) {
    reasons.push('Long numeric sequence');
  }
  
  if (/temp|fake|test|spam|trash/i.test(email)) {
    reasons.push('Temporary or suspicious email keywords');
  }
  
  const domain = email.split('@')[1]?.toLowerCase();
  const suspiciousDomains = [
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'tempmail.org'
  ];
  
  if (domain && suspiciousDomains.includes(domain)) {
    reasons.push('Known temporary email domain');
  }
  
  return {
    isSuspicious: reasons.length > 0,
    reasons
  };
}

/**
 * Generate security recommendations based on current settings
 */
export function generateSecurityRecommendations(config: SecuritySettings): string[] {
  const recommendations: string[] = [];
  
  if (config.maxFailedAttempts > 5) {
    recommendations.push('Consider reducing maximum failed login attempts for better security');
  }
  
  if (config.lockoutDurationMinutes < 15) {
    recommendations.push('Increase account lockout duration to deter brute force attacks');
  }
  
  if (config.defaultSessionTimeoutMinutes > 240) {
    recommendations.push('Consider shorter session timeouts for enhanced security');
  }
  
  if (!config.requireMixedCase || !config.requireNumbers) {
    recommendations.push('Enable mixed case and number requirements for stronger passwords');
  }
  
  if (config.deviceTrustDurationDays > 30) {
    recommendations.push('Consider shorter device trust duration');
  }
  
  if (!config.enableNewDeviceNotifications) {
    recommendations.push('Enable new device notifications to detect unauthorized access');
  }
  
  return recommendations;
}

/**
 * Format security settings for display
 */
export function formatSecuritySetting(key: keyof SecuritySettings, value: any): string {
  switch (key) {
    case 'maxFailedAttempts':
      return `${value} attempts`;
    case 'lockoutDurationMinutes':
      return `${value} minutes`;
    case 'defaultSessionTimeoutMinutes':
      return `${Math.floor(value / 60)} hours ${value % 60} minutes`;
    case 'rememberMeSessionDays':
      return `${value} days`;
    case 'sessionWarningMinutes':
      return `${value} minutes`;
    case 'deviceTrustDurationDays':
      return `${value} days`;
    case 'notificationRetentionDays':
      return `${value} days`;
    case 'minPasswordLength':
      return `${value} characters`;
    default:
      return value ? 'Enabled' : 'Disabled';
  }
}

