/**
 * Shared validation utilities for Collaborito app
 * Ensures consistent validation logic across all components
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates email format using regex
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

/**
 * Validates password strength and format
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password must be less than 128 characters long' };
  }
  
  return { isValid: true };
};

/**
 * Validates username format and restrictions
 */
export const validateUsername = (username: string): ValidationResult => {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }
  
  if (username.length > 30) {
    return { isValid: false, error: 'Username must be less than 30 characters long' };
  }
  
  // Allow alphanumeric characters, underscores, hyphens, and dots
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, dots, underscores, and hyphens' };
  }
  
  // Username cannot start or end with special characters
  if (/^[._-]|[._-]$/.test(username)) {
    return { isValid: false, error: 'Username cannot start or end with dots, underscores, or hyphens' };
  }
  
  return { isValid: true };
};

/**
 * Validates full name format
 */
export const validateFullName = (fullName: string): ValidationResult => {
  if (!fullName) {
    return { isValid: false, error: 'Full name is required' };
  }
  
  if (fullName.length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters long' };
  }
  
  if (fullName.length > 100) {
    return { isValid: false, error: 'Full name must be less than 100 characters long' };
  }
  
  // Allow letters, spaces, hyphens, apostrophes, and common international characters
  const nameRegex = /^[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F\s'-]+$/;
  if (!nameRegex.test(fullName)) {
    return { isValid: false, error: 'Full name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { isValid: true };
};

/**
 * Detects potential SQL injection patterns in input
 * More targeted approach to avoid false positives
 */
export const containsSqlInjection = (input: string): boolean => {
  // More targeted SQL injection detection
  const sqlPatterns = [
    // Actual SQL injection patterns
    /('|(\\'))/i,                    // Single quotes
    /(\-\-)/i,                       // SQL comments
    /(\;)/i,                         // Statement terminators
    /(\bunion\b)/i,                  // UNION keyword
    /(\bselect\b)/i,                 // SELECT keyword
    /(\binsert\b)/i,                 // INSERT keyword
    /(\bdelete\b)/i,                 // DELETE keyword
    /(\bupdate\b)/i,                 // UPDATE keyword
    /(\bdrop\b)/i,                   // DROP keyword
    /(\bcreate\b)/i,                 // CREATE keyword
    /(\balter\b)/i,                  // ALTER keyword
    /(\bexec\b|\bexecute\b)/i,       // EXEC/EXECUTE keywords
    /(<script>|<\/script>)/i,        // Script tags
    /(\bjavascript:)/i               // JavaScript protocol
  ];
  
  // Allow normal names/usernames with alphanumeric characters, spaces, underscores, and hyphens
  // Only flag if it contains actual SQL injection patterns
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Comprehensive input validation that checks both format and security
 */
export const validateUserInput = (
  input: string, 
  type: 'email' | 'password' | 'username' | 'fullName'
): ValidationResult => {
  // First check for SQL injection
  if (containsSqlInjection(input)) {
    return { isValid: false, error: 'Input contains prohibited characters' };
  }
  
  // Then validate format based on type
  switch (type) {
    case 'email':
      return validateEmail(input);
    case 'password':
      return validatePassword(input);
    case 'username':
      return validateUsername(input);
    case 'fullName':
      return validateFullName(input);
    default:
      return { isValid: false, error: 'Unknown validation type' };
  }
}; 