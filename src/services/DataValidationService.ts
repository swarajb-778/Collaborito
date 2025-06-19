import { createLogger } from '../utils/logger';

const logger = createLogger('DataValidationService');

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class DataValidationService {
  private static instance: DataValidationService;

  static getInstance(): DataValidationService {
    if (!DataValidationService.instance) {
      DataValidationService.instance = new DataValidationService();
    }
    return DataValidationService.instance;
  }

  /**
   * Validate profile data
   */
  validateProfileData(data: {
    firstName: string;
    lastName: string;
    email: string;
    location?: string;
    jobTitle?: string;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.firstName?.trim()) {
      errors.push('First name is required');
    } else if (data.firstName.length < 2) {
      errors.push('First name must be at least 2 characters');
    } else if (data.firstName.length > 50) {
      errors.push('First name must be less than 50 characters');
    }

    if (!data.lastName?.trim()) {
      errors.push('Last name is required');
    } else if (data.lastName.length < 2) {
      errors.push('Last name must be at least 2 characters');
    } else if (data.lastName.length > 50) {
      errors.push('Last name must be less than 50 characters');
    }

    if (!data.email?.trim()) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(data.email)) {
      errors.push('Please enter a valid email address');
    }

    // Optional field validation
    if (data.location && data.location.length > 100) {
      warnings.push('Location should be less than 100 characters');
    }

    if (data.jobTitle && data.jobTitle.length > 100) {
      warnings.push('Job title should be less than 100 characters');
    }

    // Name security checks
    if (this.containsSuspiciousContent(data.firstName)) {
      errors.push('First name contains invalid characters');
    }

    if (this.containsSuspiciousContent(data.lastName)) {
      errors.push('Last name contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate interests data
   */
  validateInterestsData(interestIds: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(interestIds)) {
      errors.push('Interest IDs must be an array');
      return { isValid: false, errors, warnings };
    }

    if (interestIds.length === 0) {
      warnings.push('No interests selected');
    } else if (interestIds.length > 10) {
      errors.push('Maximum 10 interests can be selected');
    }

    // Validate UUID format for each interest
    const invalidIds = interestIds.filter(id => !this.isValidUUID(id));
    if (invalidIds.length > 0) {
      warnings.push(`${invalidIds.length} invalid interest IDs will be filtered out`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate goals data
   */
  validateGoalsData(goals: string[], primaryGoal?: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(goals)) {
      errors.push('Goals must be an array');
      return { isValid: false, errors, warnings };
    }

    if (goals.length === 0) {
      errors.push('At least one goal must be selected');
    } else if (goals.length > 5) {
      errors.push('Maximum 5 goals can be selected');
    }

    // Validate each goal
    for (const goal of goals) {
      if (typeof goal !== 'string' || goal.trim().length === 0) {
        errors.push('All goals must be valid strings');
        break;
      }
      
      if (goal.length > 200) {
        errors.push('Goals must be less than 200 characters each');
        break;
      }

      if (this.containsSuspiciousContent(goal)) {
        errors.push('Goals contain inappropriate content');
        break;
      }
    }

    // Validate primary goal if provided
    if (primaryGoal && !goals.includes(primaryGoal)) {
      warnings.push('Primary goal is not in the selected goals list');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate project details data
   */
  validateProjectDetailsData(data: {
    name: string;
    description: string;
    lookingFor: string[];
    timeline?: string;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Project name validation
    if (!data.name?.trim()) {
      errors.push('Project name is required');
    } else if (data.name.length < 3) {
      errors.push('Project name must be at least 3 characters');
    } else if (data.name.length > 100) {
      errors.push('Project name must be less than 100 characters');
    } else if (this.containsSuspiciousContent(data.name)) {
      errors.push('Project name contains inappropriate content');
    }

    // Project description validation
    if (!data.description?.trim()) {
      errors.push('Project description is required');
    } else if (data.description.length < 10) {
      errors.push('Project description must be at least 10 characters');
    } else if (data.description.length > 1000) {
      errors.push('Project description must be less than 1000 characters');
    } else if (this.containsSuspiciousContent(data.description)) {
      errors.push('Project description contains inappropriate content');
    }

    // Looking for validation
    if (!Array.isArray(data.lookingFor)) {
      errors.push('Looking for must be an array');
    } else if (data.lookingFor.length === 0) {
      errors.push('Must specify what you are looking for');
    } else if (data.lookingFor.length > 10) {
      errors.push('Maximum 10 items in looking for list');
    }

    // Timeline validation
    if (data.timeline && data.timeline.length > 50) {
      warnings.push('Timeline should be less than 50 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate skills data
   */
  validateSkillsData(skills: Array<{
    skillId: string;
    proficiencyLevel: string;
    offeringSkill: boolean;
  }>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(skills)) {
      errors.push('Skills must be an array');
      return { isValid: false, errors, warnings };
    }

    if (skills.length === 0) {
      warnings.push('No skills selected');
    } else if (skills.length > 20) {
      errors.push('Maximum 20 skills can be selected');
    }

    const validProficiencyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    
    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];
      
      if (!this.isValidUUID(skill.skillId)) {
        warnings.push(`Skill ${i + 1} has invalid ID and will be filtered out`);
        continue;
      }

      if (!validProficiencyLevels.includes(skill.proficiencyLevel)) {
        errors.push(`Skill ${i + 1} has invalid proficiency level`);
      }

      if (typeof skill.offeringSkill !== 'boolean') {
        errors.push(`Skill ${i + 1} offering status must be a boolean`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Check for suspicious content (basic XSS/injection prevention)
   */
  private containsSuspiciousContent(text: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /SELECT.*FROM/i,
      /INSERT.*INTO/i,
      /DROP.*TABLE/i,
      /UPDATE.*SET/i,
      /DELETE.*FROM/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Sanitize string input
   */
  sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .replace(/[<>\"'&]/g, (match) => {
        const entities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[match] || match;
      });
  }

  /**
   * Validate all onboarding data at once
   */
  validateAllOnboardingData(data: {
    profile?: any;
    interests?: string[];
    goals?: { goals: string[]; primaryGoal?: string };
    projectDetails?: any;
    skills?: any[];
  }): { [key: string]: ValidationResult } {
    const results: { [key: string]: ValidationResult } = {};

    if (data.profile) {
      results.profile = this.validateProfileData(data.profile);
    }

    if (data.interests) {
      results.interests = this.validateInterestsData(data.interests);
    }

    if (data.goals) {
      results.goals = this.validateGoalsData(data.goals.goals, data.goals.primaryGoal);
    }

    if (data.projectDetails) {
      results.projectDetails = this.validateProjectDetailsData(data.projectDetails);
    }

    if (data.skills) {
      results.skills = this.validateSkillsData(data.skills);
    }

    return results;
  }

  /**
   * Check if validation results indicate critical errors
   */
  hasCriticalErrors(results: ValidationResult | { [key: string]: ValidationResult }): boolean {
    if ('isValid' in results) {
      return !results.isValid;
    }

    return Object.values(results).some(result => !result.isValid);
  }

  /**
   * Get all errors from validation results
   */
  getAllErrors(results: { [key: string]: ValidationResult }): string[] {
    const allErrors: string[] = [];
    
    Object.entries(results).forEach(([step, result]) => {
      result.errors.forEach(error => {
        allErrors.push(`${step}: ${error}`);
      });
    });

    return allErrors;
  }

  /**
   * Get all warnings from validation results
   */
  getAllWarnings(results: { [key: string]: ValidationResult }): string[] {
    const allWarnings: string[] = [];
    
    Object.entries(results).forEach(([step, result]) => {
      result.warnings.forEach(warning => {
        allWarnings.push(`${step}: ${warning}`);
      });
    });

    return allWarnings;
  }
} 