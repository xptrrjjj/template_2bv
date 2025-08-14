# Test Setup Integration Guide

## Overview

This guide explains the comprehensive Test Setup system that integrates with **TestDome** to assign technical assessments to candidates during the job role workflow.

## System Architecture

### Workflow Integration
```
Job Role Status Flow:
draft → data_collection → test_setup → management_review → ready_to_publish → published_to_teamtailor → active
                              ↑
                         Test Configuration Required
```

### Key Components
- **TestDome Integration**: Programming tests, knowledge assessments, and multiple-choice tests
- **Testing Service**: Provides interface to TestDome API with fallback to mock data
- **Test Setup Modal**: UI for configuring TestDome tests for job roles
- **Status Validation**: Ensures at least one test is configured before progression

## Features

### ✅ Implemented Features

1. **TestDome Platform Integration**
   - TestDome API integration for programming, knowledge, and multiple-choice tests
   - Unified interface with fallback to mock data for development

2. **Test Configuration**
   - Select multiple TestDome tests 
   - Mark tests as mandatory or optional
   - Configure test deadlines and delivery settings
   - Add custom instructions for candidates

3. **Workflow Enforcement**
   - Prevents progression from `test_setup` to `management_review` without tests
   - Visual indicators for test setup completion status
   - Validation rules ensure proper configuration

4. **User Interface**
   - Comprehensive test selection modal with search and filtering
   - Real-time test information including duration, difficulty, skills, and test types
   - TestDome-specific styling and test categorization

## File Structure

### Core Services
```
src/services/testing/
├── testdome.ts          # TestDome API integration
└── index.ts             # Testing service with TestDome integration
```

### UI Components
```
src/components/job-roles/
└── TestSetupModal.tsx   # Main test configuration interface
```

### Type Definitions
```
src/types/job-roles.ts   # Extended with test setup types
```

### Workflow Integration
```
src/app/roles/
├── page.tsx                               # Updated with test setup modal
├── components/JobRoleActions.tsx          # Added test setup actions
├── hooks/
│   ├── useJobRoleOperations.ts           # Added test setup operations
│   └── useJobRoleTableColumns.tsx        # Updated table columns
└── utils/statusUtils.ts                  # Enhanced status validation
```

## API Integration

### TestDome Integration

#### Available Test Types
- **Programming Tests**: JavaScript, React, Node.js, Python, etc.
- **Knowledge Tests**: SQL, Database, general technical knowledge
- **Multiple Choice**: Quick assessment tests

#### Key Functions
```typescript
// Get available tests
const tests = await testDomeService.getAvailableTests();

// Create candidate invitation
const invitation = await testDomeService.createInvitation({
  testId: 'td-js-001',
  candidateEmail: 'candidate@email.com',
  candidateName: 'John Doe',
  validDays: 7
});

// Get test results
const results = await testDomeService.getTestResults(invitationId);
```

### Testing Service

The `TestingService` class provides access to TestDome tests:

```typescript
import { testingService } from '@/services/testing';

// Get all TestDome tests
const allTests = await testingService.getAllAvailableTests();

// Search tests by keywords and skills
const searchResults = await testingService.searchTests('javascript', ['React', 'Frontend']);

// Validate API connection
const isConnected = await testingService.validateConnection();
```

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```bash
# TestDome API Key
TESTDOME_API_KEY=your_testdome_api_key_here
```

### Mock Data

If API keys are not configured, the system automatically falls back to mock data for development and demonstration purposes.

## Usage Guide

### 1. Setting Up Tests for a Job Role

1. **Navigate to Job Roles**: Go to `/roles` page
2. **Find Target Role**: Locate a role with `data_collection` status
3. **Start Test Setup**: Click the test setup icon (⚗️) to open the configuration modal
4. **Configure Settings**:
   - Toggle "Tests Required" if candidates need to complete assessments
   - Set test deadline (default: 7 days)
   - Choose delivery settings (immediate vs manual)
   - Configure pass/fail requirements

5. **Select Tests**:
   - Browse available TestDome tests (programming, knowledge, multiple-choice)
   - Use search and filters to find relevant assessments
   - Click tests to add them to your selection
   - Mark critical tests as "Mandatory"

6. **Complete Setup**: Click "Complete Test Setup" to save configuration

### 2. Test Configuration Options

#### General Configuration
- **Tests Required**: Enable/disable testing for this role
- **Test Deadline**: Days candidates have to complete tests (1-30 days)
- **Send Immediately**: Automatically send test links upon application
- **Require All Tests**: All tests must pass vs. any single test pass
- **Auto-reject Failures**: Automatically screen out failed candidates
- **Test Coordinator**: Person responsible for managing test process

#### Test Selection
- **Search**: Find tests by name, skills, or keywords
- **Filter by Difficulty**: Beginner, Intermediate, Advanced, Expert
- **Filter by Type**: Programming, Knowledge, Multiple-Choice, Open-Ended
- **Mandatory Flag**: Mark critical tests that candidates must complete

### 3. Status Validation

The system enforces the following rules:

- **Cannot progress from `test_setup` to `management_review`** without:
  - Either having "Tests Required" set to false, OR
  - Having at least one test selected

- **Visual Indicators**:
  - ⚠️ Warning indicators for incomplete test setup
  - ✅ Completion indicators when tests are properly configured
  - 🚫 Disabled progression buttons when requirements not met

## Data Structure

### TestSetupData Interface

```typescript
interface TestSetupData {
  tests_required: boolean;
  selected_tests: TestConfiguration[];
  test_instructions?: string;
  test_deadline_days?: number;
  send_test_immediately?: boolean;
  require_all_tests?: boolean;
  auto_screen_failures?: boolean;
  test_coordinator?: string;
  custom_test_requirements?: string;
  completion_metadata?: {
    configured_at?: string;
    configured_by?: string;
    configuration_notes?: string;
  };
}
```

### TestConfiguration Interface

```typescript
interface TestConfiguration {
  test_id: string;
  test_name: string;
  test_url?: string;
  duration_minutes?: number;
  passing_score?: number;
  description?: string;
  skills_assessed: string[];
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  is_mandatory: boolean;
  test_order?: number;
  programming_languages?: string[];
  test_type: 'programming' | 'knowledge' | 'multiple-choice' | 'open-ended';
}
```

## Testing

### Mock Data Available

The system includes comprehensive TestDome mock data:

#### TestDome Mock Tests
- JavaScript Fundamentals (45 min, Easy, Programming)
- React Developer Assessment (60 min, Medium, Programming) 
- Node.js Backend Development (90 min, Hard, Programming)
- SQL Database Queries (40 min, Medium, Knowledge)
- Python Programming (55 min, Medium, Programming)

### Development Testing

1. **Without API Keys**: System automatically uses mock data
2. **With API Keys**: System attempts real API calls, falls back to mock on failure
3. **Connection Validation**: Use `testingService.validateConnection()` to check API status

## Best Practices

### Test Selection Strategy
1. **Role-Specific**: Choose tests that align with job requirements
2. **Test Type Mix**: Combine programming, knowledge, and multiple-choice tests as needed
3. **Reasonable Duration**: Keep total test time under 2-3 hours
4. **Clear Instructions**: Provide context about test purpose and expectations

### Workflow Management
1. **Early Configuration**: Set up tests immediately after data collection
2. **Review Process**: Have technical leads review test selections
3. **Candidate Communication**: Clearly communicate test requirements upfront
4. **Results Review**: Establish process for reviewing and acting on test results

### Performance Optimization
1. **Caching**: Test lists are cached to reduce API calls
2. **Lazy Loading**: Tests loaded only when modal is opened
3. **Error Handling**: Graceful fallback to mock data
4. **Connection Validation**: Periodic API health checks

## Troubleshooting

### Common Issues

1. **"No tests found"**
   - Check API key configuration
   - Verify network connectivity
   - Review mock data fallback

2. **"Cannot progress to next stage"**
   - Ensure at least one test is selected OR tests disabled
   - Check test setup completion status
   - Verify status validation logic

3. **"API connection failed"**
   - Validate API keys in environment variables
   - Check service-specific connection methods
   - Review error logs for specific issues

### Debug Information

Enable debug logging by checking browser console for:
- API request/response logs
- Mock data usage notifications  
- Status validation results
- Test selection changes

## Future Enhancements

### Planned Features
1. **Candidate Portal**: Direct test links and progress tracking
2. **Results Dashboard**: Comprehensive test analytics and reporting  
3. **Automated Screening**: AI-powered candidate screening based on results
4. **Integration Expansion**: Additional testing platform integrations
5. **Advanced Scoring**: Custom scoring algorithms and benchmarks

### API Enhancements
1. **Webhook Integration**: Real-time test completion notifications
2. **Bulk Operations**: Mass candidate invitation management
3. **Advanced Analytics**: Detailed performance metrics and insights
4. **Custom Tests**: Create custom assessments within platforms

## Support

### Documentation
- **TestDome API**: https://api.testdome.com/docs
- **TestGorilla API**: https://api.testgorilla.com/docs
- **Component Documentation**: See individual file comments

### Contact
For technical support or feature requests related to the test setup system, please create an issue in the project repository.

---

## Summary

The Test Setup Integration provides a comprehensive solution for incorporating TestDome technical assessments into the job role workflow. With support for programming, knowledge, and multiple-choice tests, configurable test requirements, and proper workflow validation, it ensures candidates are properly assessed before moving through the hiring pipeline.

The system is designed for scalability, maintainability, and ease of use, with robust error handling and fallback mechanisms to ensure reliable operation even when the TestDome API is unavailable.