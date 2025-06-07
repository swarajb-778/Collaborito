/**
 * Authentication Error Handler
 * 
 * Provides better error messages and guidance for authentication issues
 */

export interface AuthError {
  code: string;
  message: string;
  userMessage: string;
  actionRequired?: string;
}

export class AuthErrorHandler {
  static handleSignupError(error: any): AuthError {
    console.log('Handling signup error:', error);
    
    // Check for email confirmation required
    if (!error.session && error.user && !error.user.email_confirmed_at) {
      return {
        code: 'EMAIL_CONFIRMATION_REQUIRED',
        message: 'Email confirmation is required',
        userMessage: 'Please check your email and click the confirmation link to complete your registration.',
        actionRequired: 'Check your email for a confirmation link'
      };
    }
    
    // Handle other common signup errors
    if (error.message?.includes('User already registered')) {
      return {
        code: 'USER_ALREADY_EXISTS',
        message: 'User already exists',
        userMessage: 'An account with this email already exists. Please sign in instead.',
        actionRequired: 'Try signing in'
      };
    }
    
    if (error.message?.includes('Invalid email')) {
      return {
        code: 'INVALID_EMAIL',
        message: 'Invalid email format',
        userMessage: 'Please enter a valid email address.',
        actionRequired: 'Check your email format'
      };
    }
    
    if (error.message?.includes('Password should be at least')) {
      return {
        code: 'WEAK_PASSWORD',
        message: 'Password too weak',
        userMessage: 'Password must be at least 6 characters long.',
        actionRequired: 'Choose a stronger password'
      };
    }
    
    // Default error
    return {
      code: 'SIGNUP_FAILED',
      message: error.message || 'Signup failed',
      userMessage: 'There was a problem creating your account. Please try again.',
      actionRequired: 'Try again or contact support'
    };
  }
  
  static handleSessionError(error: any): AuthError {
    console.log('Handling session error:', error);
    
    if (error.message?.includes('No authenticated user found')) {
      return {
        code: 'NO_SESSION',
        message: 'No authenticated user session',
        userMessage: 'Your session has expired. Please sign in again.',
        actionRequired: 'Please sign in again'
      };
    }
    
    if (error.message?.includes('Invalid JWT')) {
      return {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
        userMessage: 'Your authentication token is invalid. Please sign in again.',
        actionRequired: 'Please sign in again'
      };
    }
    
    return {
      code: 'SESSION_ERROR',
      message: error.message || 'Session error',
      userMessage: 'There was a problem with your authentication. Please sign in again.',
      actionRequired: 'Please sign in again'
    };
  }
  
  static handleDatabaseError(error: any): AuthError {
    console.log('Handling database error:', error);
    
    if (error.message?.includes('row-level security')) {
      return {
        code: 'PERMISSION_DENIED',
        message: 'Database permission denied',
        userMessage: 'You don\'t have permission to access this data. Please sign in again.',
        actionRequired: 'Please sign in again'
      };
    }
    
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return {
        code: 'DATABASE_SETUP_ERROR',
        message: 'Database table missing',
        userMessage: 'The app database is not properly set up. Please contact support.',
        actionRequired: 'Contact support'
      };
    }
    
    return {
      code: 'DATABASE_ERROR',
      message: error.message || 'Database error',
      userMessage: 'There was a problem saving your data. Please try again.',
      actionRequired: 'Try again'
    };
  }
  
  static getErrorGuidance(errorCode: string): string {
    const guidance: Record<string, string> = {
      EMAIL_CONFIRMATION_REQUIRED: 
        'This app requires email confirmation. Check your Supabase settings to disable this for development.',
      NO_SESSION: 
        'The user session was not properly established. This may be due to email confirmation being enabled.',
      USER_ALREADY_EXISTS: 
        'The user tried to sign up with an email that already has an account.',
      INVALID_EMAIL: 
        'The email format was rejected by Supabase validation.',
      WEAK_PASSWORD: 
        'The password doesn\'t meet Supabase security requirements.',
      DATABASE_SETUP_ERROR: 
        'The required database tables are missing. Run the database setup script.',
      PERMISSION_DENIED: 
        'Row-level security policies are blocking the operation.'
    };
    
    return guidance[errorCode] || 'Unknown error occurred.';
  }
} 