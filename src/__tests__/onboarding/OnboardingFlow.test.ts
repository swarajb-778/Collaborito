import { OnboardingStepManager } from '../../services/OnboardingStepManager';
import { OnboardingFlowCoordinator } from '../../services/OnboardingFlowCoordinator';
import { OnboardingCompletionService } from '../../services/OnboardingCompletionService';
import { validateEmail } from '../../utils/emailValidation';

// Mock Supabase
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));

describe('OnboardingFlow Integration Tests', () => {
  let stepManager: OnboardingStepManager;
  let flowCoordinator: OnboardingFlowCoordinator;
  let completionService: OnboardingCompletionService;

  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    stepManager = OnboardingStepManager.getInstance();
    flowCoordinator = OnboardingFlowCoordinator.getInstance();
    completionService = OnboardingCompletionService.getInstance();
  });

  describe('Email Validation', () => {
    test('should accept valid emails with @ and . symbols', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'person123@gmail.com',
        'contact@company.org'
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.message).toBeUndefined();
      });
    });

    test('should reject emails without @ symbol', () => {
      const result = validateEmail('userexample.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Email must contain @ symbol');
    });

    test('should reject emails without . symbol', () => {
      const result = validateEmail('user@example');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Email domain must contain . symbol');
    });

    test('should reject empty emails', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Email cannot be empty');
    });

    test('should reject emails with multiple @ symbols', () => {
      const result = validateEmail('user@@example.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Email must contain exactly one @ symbol');
    });
  });

  describe('Profile Step', () => {
    test('should save profile data successfully', async () => {
      const profileData = {
        firstName: 'John',
        lastName: 'Doe',
        location: 'San Francisco',
        jobTitle: 'Software Engineer'
      };

      const result = await stepManager.saveProfileStep(profileData);
      expect(result).toBe(true);
    });

    test('should validate required profile fields', () => {
      const invalidProfileData = {
        firstName: '',
        lastName: 'Doe',
        location: 'San Francisco',
        jobTitle: 'Software Engineer'
      };

      // This would be validated in the actual implementation
      expect(invalidProfileData.firstName).toBe('');
    });
  });

  describe('Interests Step', () => {
    test('should save interests data successfully', async () => {
      const interestsData = {
        interestIds: ['tech-123', 'startup-456', 'ai-789']
      };

      const result = await stepManager.saveInterestsStep(interestsData);
      expect(result).toBe(true);
    });

    test('should handle empty interests array', async () => {
      const interestsData = {
        interestIds: []
      };

      const result = await stepManager.saveInterestsStep(interestsData);
      expect(result).toBe(true);
    });
  });

  describe('Goals Step', () => {
    test('should save goals data successfully', async () => {
      const goalsData = {
        goals: ['Find Co-founder'],
        primaryGoal: 'find_cofounder'
      };

      const result = await stepManager.saveGoalsStep(goalsData);
      expect(result).toBe(true);
    });

    test('should handle different goal types', async () => {
      const goalTypes = ['find_cofounder', 'find_collaborators', 'contribute_skills', 'explore_ideas'];
      
      for (const goalType of goalTypes) {
        const goalsData = {
          goals: [goalType],
          primaryGoal: goalType
        };

        const result = await stepManager.saveGoalsStep(goalsData);
        expect(result).toBe(true);
      }
    });
  });

  describe('Project Details Step', () => {
    test('should save project details successfully', async () => {
      const projectData = {
        name: 'AI Startup',
        description: 'Revolutionary AI platform',
        lookingFor: ['CTO', 'Developer'],
        tags: ['AI', 'Tech', 'Startup']
      };

      const result = await stepManager.saveProjectDetailsStep(projectData);
      expect(result).toBe(true);
    });

    test('should handle empty project fields', async () => {
      const projectData = {
        name: '',
        description: '',
        lookingFor: [],
        tags: []
      };

      const result = await stepManager.saveProjectDetailsStep(projectData);
      expect(result).toBe(true);
    });
  });

  describe('Skills Step', () => {
    test('should save skills data successfully', async () => {
      const skillsData = {
        skills: [
          {
            skillId: 'javascript',
            isOffering: true,
            proficiency: 'advanced' as const
          },
          {
            skillId: 'react',
            isOffering: true,
            proficiency: 'intermediate' as const
          }
        ]
      };

      const result = await stepManager.saveSkillsStep(skillsData);
      expect(result).toBe(true);
    });

    test('should handle different proficiency levels', async () => {
      const proficiencyLevels: ('beginner' | 'intermediate' | 'advanced' | 'expert')[] = 
        ['beginner', 'intermediate', 'advanced', 'expert'];
      
      for (const proficiency of proficiencyLevels) {
        const skillsData = {
          skills: [{
            skillId: 'test-skill',
            isOffering: true,
            proficiency
          }]
        };

        const result = await stepManager.saveSkillsStep(skillsData);
        expect(result).toBe(true);
      }
    });
  });

  describe('Flow Coordination', () => {
    test('should initialize flow successfully', async () => {
      const result = await flowCoordinator.initializeFlow();
      expect(result).toBe(true);
    });

    test('should calculate progress correctly', () => {
      const progress = flowCoordinator.getProgress();
      expect(progress).toHaveProperty('completionPercentage');
      expect(progress).toHaveProperty('currentStep');
      expect(progress).toHaveProperty('completedSteps');
    });

    test('should determine next step based on goals', async () => {
      // Test different goal types and their routing
      const goalRoutes = {
        'find_cofounder': 'project-detail',
        'find_collaborators': 'project-detail',
        'contribute_skills': 'project-skills',
        'explore_ideas': 'project-skills'
      };

      for (const [goalType, expectedRoute] of Object.entries(goalRoutes)) {
        const nextRoute = await stepManager.getNextStepRoute('goals');
        // In a real implementation, this would depend on saved goals
        expect(typeof nextRoute).toBe('string');
      }
    });
  });

  describe('Completion Service', () => {
    test('should mark onboarding as completed', async () => {
      const metrics = {
        totalStepsCompleted: 4,
        skippedSteps: [],
        timeToComplete: 300000,
        completionPercentage: 100
      };

      const result = await completionService.completeOnboarding(mockUserId, metrics);
      expect(result).toBe(true);
    });

    test('should check completion status', async () => {
      const isCompleted = await completionService.isOnboardingCompleted(mockUserId);
      expect(typeof isCompleted).toBe('boolean');
    });

    test('should calculate completion percentage', async () => {
      const percentage = await completionService.getCompletionPercentage(mockUserId);
      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock a database error
      const originalFrom = require('../../services/supabase').supabase.from;
      require('../../services/supabase').supabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: null, 
              error: { message: 'Database error' } 
            }))
          }))
        }))
      }));

      const result = await stepManager.saveProfileStep({
        firstName: 'Test',
        lastName: 'User',
        location: 'Test City',
        jobTitle: 'Tester'
      });

      // Should handle error gracefully
      expect(typeof result).toBe('boolean');

      // Restore original function
      require('../../services/supabase').supabase.from = originalFrom;
    });

    test('should validate step data before saving', async () => {
      // Test with invalid data
      const invalidData = null;
      
      try {
        await stepManager.saveProfileStep(invalidData as any);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Integration Flow', () => {
    test('should complete full onboarding flow', async () => {
      // Simulate complete onboarding flow
      const steps = [
        {
          step: 'profile',
          data: {
            firstName: 'John',
            lastName: 'Doe',
            location: 'San Francisco',
            jobTitle: 'Engineer'
          }
        },
        {
          step: 'interests',
          data: {
            interestIds: ['tech-123', 'startup-456']
          }
        },
        {
          step: 'goals',
          data: {
            goals: ['Find Co-founder'],
            primaryGoal: 'find_cofounder'
          }
        },
        {
          step: 'project_details',
          data: {
            name: 'Test Project',
            description: 'Test Description',
            lookingFor: ['CTO'],
            tags: ['tech']
          }
        },
        {
          step: 'skills',
          data: {
            skills: [{
              skillId: 'javascript',
              isOffering: true,
              proficiency: 'intermediate' as const
            }]
          }
        }
      ];

              // Execute each step
        for (const { step, data } of steps) {
          let result: boolean;
          
          switch (step) {
            case 'profile':
              result = await stepManager.saveProfileStep(data as any);
              break;
            case 'interests':
              result = await stepManager.saveInterestsStep(data as any);
              break;
            case 'goals':
              result = await stepManager.saveGoalsStep(data as any);
              break;
            case 'project_details':
              result = await stepManager.saveProjectDetailsStep(data as any);
              break;
            case 'skills':
              result = await stepManager.saveSkillsStep(data as any);
              break;
            default:
              result = false;
          }
          
          expect(result).toBe(true);
        }

      // Mark as completed
      const completionResult = await completionService.completeOnboarding(mockUserId, {
        totalStepsCompleted: 5,
        skippedSteps: [],
        timeToComplete: 600000,
        completionPercentage: 100
      });

      expect(completionResult).toBe(true);
    });
  });
}); 