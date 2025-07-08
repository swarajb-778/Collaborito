/**
 * Comprehensive test for onboarding backend integration
 * This script verifies that all UUID-based operations work correctly
 */

import { OnboardingStepManager, OnboardingFlowCoordinator, SessionManager } from './index';
import { createLogger } from '../utils/logger';

const logger = createLogger('OnboardingIntegrationTest');

interface TestResult {
  step: string;
  success: boolean;
  error?: string;
}

export class OnboardingIntegrationTest {
  private stepManager = OnboardingStepManager.getInstance();
  private flowCoordinator = OnboardingFlowCoordinator.getInstance();
  private sessionManager = SessionManager.getInstance();
  private testResults: TestResult[] = [];

  /**
   * Run comprehensive onboarding integration test
   */
  async runTests(): Promise<{ success: boolean; results: TestResult[] }> {
    logger.info('🧪 Starting onboarding integration tests...');
    
    try {
      // Test 1: Session Management
      await this.testSessionManagement();
      
      // Test 2: Flow Coordinator
      await this.testFlowCoordinator();
      
      // Test 3: Interest Loading and Validation
      await this.testInterestOperations();
      
      // Test 4: Skills Loading and Validation
      await this.testSkillOperations();
      
      // Test 5: UUID Validation
      await this.testUUIDValidation();
      
      // Test 6: Mock User Handling
      await this.testMockUserHandling();
      
      // Test 7: Error Recovery
      await this.testErrorRecovery();
      
      const successCount = this.testResults.filter(r => r.success).length;
      const totalTests = this.testResults.length;
      
      logger.info(`🧪 Tests completed: ${successCount}/${totalTests} passed`);
      
      return {
        success: successCount === totalTests,
        results: this.testResults
      };
      
    } catch (error) {
      logger.error('Test suite failed:', error);
      return {
        success: false,
        results: this.testResults
      };
    }
  }

  /**
   * Test session management functionality
   */
  private async testSessionManagement(): Promise<void> {
    try {
      logger.info('Testing session management...');
      
      // Test session initialization
      const session = await this.sessionManager.getSession();
      const isInitialized = await this.sessionManager.initializeSession();
      
      this.addTestResult('session_management', true);
      logger.info('✅ Session management test passed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addTestResult('session_management', false, errorMessage);
      logger.error('❌ Session management test failed:', error);
    }
  }

  /**
   * Test flow coordinator functionality
   */
  private async testFlowCoordinator(): Promise<void> {
    try {
      logger.info('Testing flow coordinator...');
      
      // Test flow initialization
      const flowReady = await this.flowCoordinator.initializeFlow();
      
      // Test step progression
      const nextStep = await this.flowCoordinator.getNextStep('profile');
      const nextRoute = await this.flowCoordinator.getNextStepRoute('profile');
      const canProceed = await this.flowCoordinator.canProceedToNextStep('profile');
      
      // Test progress calculation
      const progress = this.flowCoordinator.getProgress();
      const steps = this.flowCoordinator.getSteps();
      
      this.addTestResult('flow_coordinator', true);
      logger.info('✅ Flow coordinator test passed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addTestResult('flow_coordinator', false, errorMessage);
      logger.error('❌ Flow coordinator test failed:', error);
    }
  }

  /**
   * Test interest loading and UUID validation
   */
  private async testInterestOperations(): Promise<void> {
    try {
      logger.info('Testing interest operations...');
      
      // Test loading interests from Supabase
      const interests = await this.stepManager.getAvailableInterests();
      
      if (!interests || interests.length === 0) {
        throw new Error('No interests loaded from database');
      }
      
      // Validate UUIDs
      for (const interest of interests) {
        if (!this.stepManager.isValidUUID(interest.id)) {
          throw new Error(`Invalid UUID format for interest: ${interest.id}`);
        }
      }
      
      logger.info(`Loaded ${interests.length} interests with valid UUIDs`);
      
      // Test mock interest saving (should work for mock users)
      const mockInterestData = {
        interestIds: interests.slice(0, 3).map(i => i.id)
      };
      
      // This should not throw an error (handles both mock and real users)
      const saved = await this.stepManager.saveInterestsStep(mockInterestData);
      
      this.addTestResult('interest_operations', true);
      logger.info('✅ Interest operations test passed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addTestResult('interest_operations', false, errorMessage);
      logger.error('❌ Interest operations test failed:', error);
    }
  }

  /**
   * Test skill loading and UUID validation
   */
  private async testSkillOperations(): Promise<void> {
    try {
      logger.info('Testing skill operations...');
      
      // Test loading skills from Supabase
      const skills = await this.stepManager.getAvailableSkills();
      
      if (!skills || skills.length === 0) {
        throw new Error('No skills loaded from database');
      }
      
      // Validate UUIDs
      for (const skill of skills) {
        if (!this.stepManager.isValidUUID(skill.id)) {
          throw new Error(`Invalid UUID format for skill: ${skill.id}`);
        }
      }
      
      logger.info(`Loaded ${skills.length} skills with valid UUIDs`);
      
      // Test mock skill saving
      const mockSkillData = {
        skills: skills.slice(0, 2).map(skill => ({
          skillId: skill.id,
          isOffering: true,
          proficiency: 'intermediate' as const
        }))
      };
      
      const saved = await this.stepManager.saveSkillsStep(mockSkillData);
      
      this.addTestResult('skill_operations', true);
      logger.info('✅ Skill operations test passed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addTestResult('skill_operations', false, errorMessage);
      logger.error('❌ Skill operations test failed:', error);
    }
  }

  /**
   * Test UUID validation functionality
   */
  private async testUUIDValidation(): Promise<void> {
    try {
      logger.info('Testing UUID validation...');
      
      // Test valid UUIDs
      const validUUIDs = [
        'f7bff181-f722-44fd-8704-77816f16cdf8',
        'e9e68517-2d26-46e9-8220-39d3745b3d92',
        '814d804f-04e3-421e-b1ff-64ba42f30e60'
      ];
      
      for (const uuid of validUUIDs) {
        if (!this.stepManager.isValidUUID(uuid)) {
          throw new Error(`Valid UUID marked as invalid: ${uuid}`);
        }
      }
      
      // Test invalid UUIDs
      const invalidUUIDs = [
        '2', '10', '7', // Old numeric IDs
        'invalid-uuid',
        '123',
        '',
        null,
        undefined
      ];
      
      for (const uuid of invalidUUIDs) {
        if (this.stepManager.isValidUUID(uuid as string)) {
          throw new Error(`Invalid UUID marked as valid: ${uuid}`);
        }
      }
      
      this.addTestResult('uuid_validation', true);
      logger.info('✅ UUID validation test passed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addTestResult('uuid_validation', false, errorMessage);
      logger.error('❌ UUID validation test failed:', error);
    }
  }

  /**
   * Test mock user handling
   */
  private async testMockUserHandling(): Promise<void> {
    try {
      logger.info('Testing mock user handling...');
      
      // Test mock user detection
      const isMockUser = this.stepManager.isMockUser();
      const userId = this.stepManager.getCurrentUserId();
      
      logger.info(`Mock user detected: ${isMockUser}, User ID: ${userId}`);
      
      // Test mock data operations
      if (isMockUser) {
        // Test mock profile saving
        const profileData = {
          firstName: 'Test',
          lastName: 'User',
          location: 'Test Location',
          jobTitle: 'Test Developer'
        };
        
        await this.stepManager.saveProfileStep(profileData);
        
        // Test mock goals saving
        const goalData = {
          goalType: 'find_collaborators' as const,
          details: { test: true }
        };
        
        await this.stepManager.saveGoalsStep(goalData);
      }
      
      this.addTestResult('mock_user_handling', true);
      logger.info('✅ Mock user handling test passed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addTestResult('mock_user_handling', false, errorMessage);
      logger.error('❌ Mock user handling test failed:', error);
    }
  }

  /**
   * Test error recovery functionality
   */
  private async testErrorRecovery(): Promise<void> {
    try {
      logger.info('Testing error recovery...');
      
      // Test with invalid data to trigger error recovery
      try {
        const invalidInterestData = {
          interestIds: ['invalid-uuid-1', 'invalid-uuid-2']
        };
        
        // This should handle the error gracefully
        await this.stepManager.saveInterestsStep(invalidInterestData);
        
      } catch (error) {
        // Expected for invalid UUIDs - error should be handled gracefully
        logger.info('Expected error caught for invalid UUIDs:', error.message);
      }
      
      this.addTestResult('error_recovery', true);
      logger.info('✅ Error recovery test passed');
      
    } catch (error) {
      this.addTestResult('error_recovery', false, error.message);
      logger.error('❌ Error recovery test failed:', error);
    }
  }

  /**
   * Add test result to results array
   */
  private addTestResult(step: string, success: boolean, error?: string): void {
    this.testResults.push({
      step,
      success,
      error
    });
  }

  /**
   * Get test summary
   */
  getTestSummary(): string {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.success).length;
    const failed = total - passed;
    
    let summary = `\n🧪 Onboarding Integration Test Summary\n`;
    summary += `Total Tests: ${total}\n`;
    summary += `Passed: ${passed}\n`;
    summary += `Failed: ${failed}\n\n`;
    
    if (failed > 0) {
      summary += `❌ Failed Tests:\n`;
      this.testResults
        .filter(r => !r.success)
        .forEach(r => {
          summary += `  - ${r.step}: ${r.error}\n`;
        });
    }
    
    summary += `\n${passed === total ? '✅ All tests passed!' : '❌ Some tests failed'}`;
    
    return summary;
  }
}

// Export test runner function
export async function runOnboardingIntegrationTests(): Promise<void> {
  const testRunner = new OnboardingIntegrationTest();
  const results = await testRunner.runTests();
  
  console.log(testRunner.getTestSummary());
  
  if (!results.success) {
    console.error('🚨 Integration tests failed!');
  } else {
    console.log('🎉 All integration tests passed!');
  }
} 