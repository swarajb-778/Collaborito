// Comprehensive Onboarding Configuration
// Centralized configuration for all onboarding-related settings, flows, and validation

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  route: string;
  isRequired: boolean;
  dependencies: string[];
  validationRules: ValidationRule[];
  estimatedTime: number; // in minutes
  progressWeight: number; // percentage of total progress
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'minLength' | 'maxLength' | 'email' | 'custom';
  value?: any;
  message: string;
  customValidator?: (value: any) => boolean;
}

export interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  steps: string[];
  goalTypes: string[];
}

// Step definitions for the onboarding process
export const ONBOARDING_STEPS: Record<string, OnboardingStep> = {
  profile: {
    id: 'profile',
    title: 'Profile Setup',
    description: 'Set up your basic profile information',
    route: '/onboarding',
    isRequired: true,
    dependencies: [],
    validationRules: [
      { field: 'firstName', type: 'required', message: 'First name is required' },
      { field: 'lastName', type: 'required', message: 'Last name is required' },
      { field: 'location', type: 'required', message: 'Location is required' },
      { field: 'jobTitle', type: 'required', message: 'Job title is required' },
      { field: 'firstName', type: 'minLength', value: 2, message: 'First name must be at least 2 characters' },
      { field: 'lastName', type: 'minLength', value: 2, message: 'Last name must be at least 2 characters' },
    ],
    estimatedTime: 3,
    progressWeight: 20,
  },
  interests: {
    id: 'interests',
    title: 'Interests Selection',
    description: 'Choose your areas of interest',
    route: '/onboarding/interests',
    isRequired: true,
    dependencies: ['profile'],
    validationRules: [
      { 
        field: 'interestIds', 
        type: 'custom', 
        message: 'Please select at least one interest',
        customValidator: (value: string[]) => value && value.length > 0
      },
    ],
    estimatedTime: 2,
    progressWeight: 20,
  },
  goals: {
    id: 'goals',
    title: 'Goals Definition',
    description: 'Define your collaboration goals',
    route: '/onboarding/goals',
    isRequired: true,
    dependencies: ['interests'],
    validationRules: [
      { field: 'goalType', type: 'required', message: 'Please select a goal' },
    ],
    estimatedTime: 2,
    progressWeight: 20,
  },
  project_details: {
    id: 'project_details',
    title: 'Project Details',
    description: 'Share details about your project',
    route: '/onboarding/project-detail',
    isRequired: false, // Conditional based on goals
    dependencies: ['goals'],
    validationRules: [
      { field: 'name', type: 'required', message: 'Project name is required' },
      { field: 'description', type: 'required', message: 'Project description is required' },
      { field: 'name', type: 'minLength', value: 3, message: 'Project name must be at least 3 characters' },
      { field: 'description', type: 'minLength', value: 10, message: 'Project description must be at least 10 characters' },
      { field: 'description', type: 'maxLength', value: 500, message: 'Project description must be less than 500 characters' },
    ],
    estimatedTime: 5,
    progressWeight: 20,
  },
  skills: {
    id: 'skills',
    title: 'Skills Selection',
    description: 'Select relevant skills',
    route: '/onboarding/project-skills',
    isRequired: true,
    dependencies: ['goals'],
    validationRules: [
      { 
        field: 'skills', 
        type: 'custom', 
        message: 'Please select at least one skill',
        customValidator: (value: any[]) => value && value.length > 0
      },
    ],
    estimatedTime: 3,
    progressWeight: 20,
  },
};

// Flow definitions based on user goals
export const ONBOARDING_FLOWS: Record<string, OnboardingFlow> = {
  find_cofounder: {
    id: 'find_cofounder',
    name: 'Find Co-founder',
    description: 'Complete setup to find a co-founder for your project',
    steps: ['profile', 'interests', 'goals', 'project_details', 'skills'],
    goalTypes: ['find_cofounder'],
  },
  find_collaborators: {
    id: 'find_collaborators',
    name: 'Find Collaborators',
    description: 'Complete setup to find collaborators for your project',
    steps: ['profile', 'interests', 'goals', 'project_details', 'skills'],
    goalTypes: ['find_collaborators'],
  },
  contribute_skills: {
    id: 'contribute_skills',
    name: 'Contribute Skills',
    description: 'Complete setup to contribute your skills to projects',
    steps: ['profile', 'interests', 'goals', 'skills'], // No project details needed
    goalTypes: ['contribute_skills'],
  },
  explore_ideas: {
    id: 'explore_ideas',
    name: 'Explore Ideas',
    description: 'Complete setup to explore and participate in various ideas',
    steps: ['profile', 'interests', 'goals', 'skills'], // No project details needed
    goalTypes: ['explore_ideas'],
  },
};

// Configuration settings
export const ONBOARDING_CONFIG = {
  // Session management
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  
  // Caching
  CACHE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  CACHE_KEYS: {
    ONBOARDING_STATE: 'onboarding_state',
    USER_PROGRESS: 'user_progress',
    AVAILABLE_INTERESTS: 'available_interests',
    AVAILABLE_SKILLS: 'available_skills',
  },
  
  // Validation
  MIN_INTERESTS: 1,
  MAX_INTERESTS: 10,
  MIN_SKILLS: 1,
  MAX_SKILLS: 15,
  
  // Progress tracking
  PROGRESS_SYNC_INTERVAL: 30 * 1000, // 30 seconds
  
  // Error handling
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  NETWORK_TIMEOUT: 10000, // 10 seconds
  
  // UI settings
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  
  // Routes
  ROUTES: {
    PROFILE: '/onboarding',
    INTERESTS: '/onboarding/interests',
    GOALS: '/onboarding/goals',
    PROJECT_DETAILS: '/onboarding/project-detail',
    SKILLS: '/onboarding/project-skills',
    COMPLETE: '/(tabs)',
    SIGNIN: '/welcome/signin',
  },
};

// Goal type mappings
export const GOAL_TYPE_MAPPINGS = {
  UI_TO_DB: {
    'Find a co-founder': 'find_cofounder',
    'Find collaborators': 'find_collaborators',
    'Contribute my skills': 'contribute_skills',
    'Explore ideas': 'explore_ideas',
  },
  DB_TO_UI: {
    'find_cofounder': 'Find a co-founder',
    'find_collaborators': 'Find collaborators',
    'contribute_skills': 'Contribute my skills',
    'explore_ideas': 'Explore ideas',
  },
};

// Utility functions
export const getFlowForGoalType = (goalType: string): OnboardingFlow | null => {
  return Object.values(ONBOARDING_FLOWS).find(flow => 
    flow.goalTypes.includes(goalType)
  ) || null;
};

export const getStepByRoute = (route: string): OnboardingStep | null => {
  return Object.values(ONBOARDING_STEPS).find(step => 
    step.route === route
  ) || null;
};

export const validateStepData = (stepId: string, data: any): { valid: boolean; errors: string[] } => {
  const step = ONBOARDING_STEPS[stepId];
  if (!step) {
    return { valid: false, errors: ['Invalid step'] };
  }

  const errors: string[] = [];

  step.validationRules.forEach(rule => {
    const fieldValue = data[rule.field];

    switch (rule.type) {
      case 'required':
        if (!fieldValue || (typeof fieldValue === 'string' && !fieldValue.trim())) {
          errors.push(rule.message);
        }
        break;
      case 'minLength':
        if (fieldValue && fieldValue.length < rule.value) {
          errors.push(rule.message);
        }
        break;
      case 'maxLength':
        if (fieldValue && fieldValue.length > rule.value) {
          errors.push(rule.message);
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (fieldValue && !emailRegex.test(fieldValue)) {
          errors.push(rule.message);
        }
        break;
      case 'custom':
        if (rule.customValidator && !rule.customValidator(fieldValue)) {
          errors.push(rule.message);
        }
        break;
    }
  });

  return { valid: errors.length === 0, errors };
};

export const calculateProgress = (completedSteps: string[], goalType?: string): number => {
  const flow = goalType ? getFlowForGoalType(goalType) : null;
  const relevantSteps = flow ? flow.steps : Object.keys(ONBOARDING_STEPS);
  
  if (relevantSteps.length === 0) return 0;
  
  const totalWeight = relevantSteps.reduce((total, stepId) => {
    return total + (ONBOARDING_STEPS[stepId]?.progressWeight || 0);
  }, 0);
  
  const completedWeight = completedSteps.reduce((total, stepId) => {
    if (relevantSteps.includes(stepId)) {
      return total + (ONBOARDING_STEPS[stepId]?.progressWeight || 0);
    }
    return total;
  }, 0);
  
  return Math.round((completedWeight / totalWeight) * 100);
};

export const getNextStep = (currentStep: string, goalType?: string): string | null => {
  const flow = goalType ? getFlowForGoalType(goalType) : null;
  const steps = flow ? flow.steps : Object.keys(ONBOARDING_STEPS);
  
  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === steps.length - 1) {
    return null; // Current step not found or is the last step
  }
  
  return steps[currentIndex + 1];
};

export const getPreviousStep = (currentStep: string, goalType?: string): string | null => {
  const flow = goalType ? getFlowForGoalType(goalType) : null;
  const steps = flow ? flow.steps : Object.keys(ONBOARDING_STEPS);
  
  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex <= 0) {
    return null; // Current step not found or is the first step
  }
  
  return steps[currentIndex - 1];
};

export const isStepRequired = (stepId: string, goalType?: string): boolean => {
  const step = ONBOARDING_STEPS[stepId];
  if (!step) return false;
  
  // Check if step is required by default
  if (step.isRequired) return true;
  
  // Check if step is required by the current flow
  const flow = goalType ? getFlowForGoalType(goalType) : null;
  return flow ? flow.steps.includes(stepId) : false;
};

export const getEstimatedTimeRemaining = (completedSteps: string[], goalType?: string): number => {
  const flow = goalType ? getFlowForGoalType(goalType) : null;
  const relevantSteps = flow ? flow.steps : Object.keys(ONBOARDING_STEPS);
  
  const remainingSteps = relevantSteps.filter(stepId => !completedSteps.includes(stepId));
  
  return remainingSteps.reduce((total, stepId) => {
    return total + (ONBOARDING_STEPS[stepId]?.estimatedTime || 0);
  }, 0);
}; 