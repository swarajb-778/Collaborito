/**
 * Tests for validation utility functions
 * Ensures all validation logic works correctly and prevents regression
 */

import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateFullName,
  containsSqlInjection,
  validateUserInput,
  ValidationResult
} from '../../utils/validation';

describe('Validation Utilities', () => {
  
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'first.last@subdomain.example.com'
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@example',
        'user name@example.com'
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('validatePassword', () => {
    it('should validate correct passwords', () => {
      const validPasswords = [
        'password123',
        'mySecurePass!',
        'aBcDeF123',
        '123456'  // minimum length
      ];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid passwords', () => {
      const invalidPasswords = [
        '',
        '12345',  // too short
        'a'.repeat(129)  // too long
      ];

      invalidPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('validateUsername', () => {
    it('should validate correct usernames', () => {
      const validUsernames = [
        'ghhhhh',           // The username that was failing before
        'ggjbcfknb',        // Another username that was failing
        'hellohowareyou',   // Another username that was failing
        'user123',
        'test_user',
        'my-username',
        'user.name',
        'abc',              // minimum length
        'a'.repeat(30)      // maximum length
      ];

      validUsernames.forEach(username => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        '',
        'ab',               // too short
        'a'.repeat(31),     // too long
        '_username',        // starts with underscore
        'username_',        // ends with underscore
        '-username',        // starts with hyphen
        'username-',        // ends with hyphen
        '.username',        // starts with dot
        'username.',        // ends with dot
        'user name',        // contains space
        'user@name',        // contains @ symbol
        'user#name'         // contains # symbol
      ];

      invalidUsernames.forEach(username => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('validateFullName', () => {
    it('should validate correct full names', () => {
      const validNames = [
        'John Doe',
        'Mary Jane Smith',
        'Jean-Luc Picard',
        "O'Connor",
        'José García',
        'François Müller',
        '李明',
        'AB'                // minimum length
      ];

      validNames.forEach(name => {
        const result = validateFullName(name);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid full names', () => {
      const invalidNames = [
        '',
        'A',                // too short
        'a'.repeat(101),    // too long
        'John123',          // contains numbers
        'John@Doe',         // contains @ symbol
        'John#Doe'          // contains # symbol
      ];

      invalidNames.forEach(name => {
        const result = validateFullName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('containsSqlInjection', () => {
    it('should NOT flag legitimate usernames and names', () => {
      const legitimateInputs = [
        'ghhhhh',           // Previous failing case
        'ggjbcfknb',        // Previous failing case  
        'hellohowareyou',   // Previous failing case
        'user123',
        'john_doe',
        'test-user',
        'normal.email@example.com',
        'My Name',
        'user@domain.com',
        'password123'
      ];

      legitimateInputs.forEach(input => {
        const result = containsSqlInjection(input);
        expect(result).toBe(false);
      });
    });

    it('should flag actual SQL injection attempts', () => {
      const sqlInjections = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "1; DELETE FROM users",
        "UNION SELECT * FROM passwords",
        "1' UNION SELECT null,null,null--",
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "SELECT * FROM users",
        "INSERT INTO users",
        "UPDATE users SET",
        "DELETE FROM users",
        "DROP TABLE users",
        "CREATE TABLE test",
        "ALTER TABLE users",
        "EXEC sp_password"
      ];

      sqlInjections.forEach(injection => {
        const result = containsSqlInjection(injection);
        expect(result).toBe(true);
      });
    });
  });

  describe('validateUserInput', () => {
    it('should validate different input types correctly', () => {
      const testCases = [
        { input: 'test@example.com', type: 'email' as const, shouldBeValid: true },
        { input: 'password123', type: 'password' as const, shouldBeValid: true },
        { input: 'ghhhhh', type: 'username' as const, shouldBeValid: true },
        { input: 'John Doe', type: 'fullName' as const, shouldBeValid: true }
      ];

      testCases.forEach(({ input, type, shouldBeValid }) => {
        const result = validateUserInput(input, type);
        expect(result.isValid).toBe(shouldBeValid);
      });
    });

    it('should reject SQL injection in all input types', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      const types = ['email', 'password', 'username', 'fullName'] as const;

      types.forEach(type => {
        const result = validateUserInput(sqlInjection, type);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('prohibited characters');
      });
    });
  });

  describe('Regression Tests', () => {
    it('should NOT reject the specific usernames that were failing before', () => {
      const previouslyFailingUsernames = [
        'ghhhhh',
        'ggjbcfknb', 
        'hellohowareyou'
      ];

      previouslyFailingUsernames.forEach(username => {
        // Test direct username validation
        const usernameResult = validateUsername(username);
        expect(usernameResult.isValid).toBe(true);
        expect(usernameResult.error).toBeUndefined();

        // Test SQL injection detection
        const sqlResult = containsSqlInjection(username);
        expect(sqlResult).toBe(false);

        // Test comprehensive validation
        const fullResult = validateUserInput(username, 'username');
        expect(fullResult.isValid).toBe(true);
        expect(fullResult.error).toBeUndefined();
      });
    });
  });

}); 