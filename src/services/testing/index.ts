/**
 * Testing Services Index
 * TestDome integration only
 */

export * from './testdome';

import { testDomeService, TestDomeTestSummary } from './testdome';
import { TestConfiguration } from '@/types/job-roles';

/**
 * TestDome-only testing service
 */
export class TestingService {
  
  /**
   * Get all available tests from TestDome
   */
  async getAllAvailableTests(): Promise<TestConfiguration[]> {
    const testDomeResponse = await testDomeService.getAvailableTests();
    
    if (!testDomeResponse.success) {
      throw new Error(`Failed to fetch TestDome tests: ${testDomeResponse.error}`);
    }

    if (!testDomeResponse.data) {
      return [];
    }


    // Convert TestDome tests to unified format
    const tests = testDomeResponse.data.map(test => this.convertTestDomeToUnified(test));
    return tests.sort((a, b) => a.test_name.localeCompare(b.test_name));
  }

  /**
   * Search TestDome tests
   */
  async searchTests(query: string, skills?: string[]): Promise<TestConfiguration[]> {
    const allTests = await this.getAllAvailableTests();
    
    const filteredTests = allTests.filter(test => {
      const matchesQuery = query === '' || 
        test.test_name.toLowerCase().includes(query.toLowerCase()) ||
        test.description?.toLowerCase().includes(query.toLowerCase()) ||
        test.skills_assessed.some(skill => skill.toLowerCase().includes(query.toLowerCase()));

      const matchesSkills = !skills || skills.length === 0 ||
        skills.some(skill => 
          test.skills_assessed.some(testSkill => 
            testSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );

      return matchesQuery && matchesSkills;
    });

    return filteredTests;
  }

  /**
   * Validate TestDome API connection
   */
  async validateConnection(): Promise<boolean> {
    return await testDomeService.validateConnection();
  }

  private convertTestDomeToUnified(test: any): TestConfiguration {
    
    // Extract skills from skills object or set default
    let skillsAssessed = ['General Knowledge'];
    if (test.skills && typeof test.skills === 'object' && test.skills.value) {
      skillsAssessed = Array.isArray(test.skills.value) ? test.skills.value : [test.skills.value];
    }
    
    // Extract duration from timeLimit object or set default
    let durationMinutes = 30;
    if (test.timeLimit && typeof test.timeLimit === 'object' && test.timeLimit.value) {
      durationMinutes = test.timeLimit.value;
    }
    
    // Determine test type based on description or default to multiple-choice
    let testType = 'multiple-choice';
    if (test.description) {
      const desc = test.description.toLowerCase();
      if (desc.includes('programming') || desc.includes('code') || desc.includes('algorithm')) {
        testType = 'programming';
      } else if (desc.includes('multiple choice') || desc.includes('screening questions')) {
        testType = 'multiple-choice';
      } else if (desc.includes('knowledge') || desc.includes('technical')) {
        testType = 'knowledge';
      }
    }
    
    // Extract difficulty or default to intermediate
    let difficulty = 'intermediate';
    if (test.expectedPassRate && typeof test.expectedPassRate === 'object' && test.expectedPassRate.value) {
      const passRate = test.expectedPassRate.value;
      if (passRate > 80) difficulty = 'beginner';
      else if (passRate > 60) difficulty = 'intermediate';  
      else if (passRate > 40) difficulty = 'advanced';
      else difficulty = 'expert';
    }
    
    return {
      test_id: String(test.id || 'unknown'),
      test_name: test.name || 'Unknown Test',
      description: test.description || '',
      duration_minutes: durationMinutes,
      skills_assessed: skillsAssessed,
      difficulty_level: difficulty as 'beginner' | 'intermediate' | 'advanced' | 'expert',
      is_mandatory: false,
      programming_languages: [], // Not available in this API version
      test_type: testType as 'programming' | 'knowledge' | 'multiple-choice' | 'open-ended',
    };
  }

  private mapTestDomeDifficulty(difficulty: 'Easy' | 'Medium' | 'Hard'): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    switch (difficulty) {
      case 'Easy': return 'beginner';
      case 'Medium': return 'intermediate';
      case 'Hard': return 'advanced';
      default: return 'intermediate';
    }
  }

}

export const testingService = new TestingService();