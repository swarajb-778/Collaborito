import { createLogger } from './logger';

const logger = createLogger('EmailValidation');

/**
 * Simple email validation that only checks for @ and . symbols
 * As specifically requested in requirements
 */
export interface EmailValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validates email with simple rules - only checks for @ and . symbols
 * @param email - Email string to validate
 * @returns EmailValidationResult with validation status and message
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      message: 'Email is required'
    };
  }

  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    return {
      isValid: false,
      message: 'Email cannot be empty'
    };
  }

  // Simple validation: must contain @ and .
  const hasAt = trimmedEmail.includes('@');
  const hasDot = trimmedEmail.includes('.');
  
  if (!hasAt) {
    return {
      isValid: false,
      message: 'Email must contain @ symbol'
    };
  }
  
  if (!hasDot) {
    return {
      isValid: false,
      message: 'Email must contain . symbol'
    };
  }
  
  // Additional basic checks
  const atCount = (trimmedEmail.match(/@/g) || []).length;
  if (atCount !== 1) {
    return {
      isValid: false,
      message: 'Email must contain exactly one @ symbol'
    };
  }
  
  // Must have content before and after @
  const atIndex = trimmedEmail.indexOf('@');
  if (atIndex === 0 || atIndex === trimmedEmail.length - 1) {
    return {
      isValid: false,
      message: 'Email must have content before and after @'
    };
  }
  
  // Must have dot after @
  const domainPart = trimmedEmail.substring(atIndex + 1);
  if (!domainPart.includes('.')) {
    return {
      isValid: false,
      message: 'Email domain must contain . symbol'
    };
  }
  
  logger.debug('Email validation passed:', trimmedEmail);
  
  return {
    isValid: true
  };
}

/**
 * Quick boolean check for email validity
 * @param email - Email to validate
 * @returns boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email).isValid;
}

/**
 * Normalize email by trimming and converting to lowercase
 * @param email - Email to normalize
 * @returns normalized email string
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  return email.trim().toLowerCase();
}

/**
 * Extract domain from email address
 * @param email - Email address
 * @returns domain part of email or empty string if invalid
 */
export function extractEmailDomain(email: string): string {
  const validation = validateEmail(email);
  if (!validation.isValid) {
    return '';
  }
  
  const atIndex = email.indexOf('@');
  return email.substring(atIndex + 1).toLowerCase();
}

/**
 * Check if email is from a common provider (for analytics)
 * @param email - Email address
 * @returns boolean indicating if from common provider
 */
export function isCommonEmailProvider(email: string): boolean {
  const domain = extractEmailDomain(email);
  const commonProviders = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'aol.com',
    'protonmail.com'
  ];
  
  return commonProviders.includes(domain);
} 