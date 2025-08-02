# Datastore API Usage Guide

The Datastore API provides a comprehensive interface for managing data within the application. This guide covers all aspects of using the datastore effectively.

## 🏗️ Overview

The Datastore API is a unified data management system that handles CRUD operations for various entity types. It's designed to work with a DynamoDB-like structure and provides consistent interfaces for data manipulation.

## 📋 Core Concepts

### Data Structure
All records in the datastore follow a consistent structure:

```typescript
interface DatastoreRecord {
  app_id: string;           // Application identifier
  record_id: string;        // Unique record identifier
  created_at?: string;      // ISO timestamp
  updated_at?: string;      // ISO timestamp
  [key: string]: unknown;   // Custom fields
}
```

### Identifiers
- **app_id**: Groups records by application/domain (e.g., 'rbac_users', 'recruitment_tool')
- **record_id**: Unique identifier within the app_id scope (e.g., 'user_12345', 'role_admin')

## 🔧 API Client Usage

### Initialization
```typescript
import { apiClient } from '@/services/api';
```

The API client is pre-configured and handles authentication automatically using stored tokens.

## 📝 Basic Operations

### Create Records

#### Simple Create
```typescript
// Create a candidate record
const candidate = await apiClient.createRecord('recruitment_tool', {
  app_id: 'recruitment_tool',
  record_id: 'candidate_001',
  name: 'John Doe',
  email: 'john.doe@example.com',
  position: 'Software Engineer',
  status: 'active',
  skills: ['JavaScript', 'React', 'Node.js'],
  experience_years: 5
});
```

#### Using Datastore Create Request
```typescript
import { DatastoreCreateRequest } from '@/types/datastore';

const request: DatastoreCreateRequest = {
  identifier: 'recruitment_tool',
  action: 'create',
  data: {
    app_id: 'recruitment_tool',
    record_id: `job_${Date.now()}`,
    title: 'Senior Developer',
    department: 'Engineering',
    location: 'Remote',
    salary_range: '80000-120000',
    requirements: ['5+ years experience', 'React expertise'],
    posted_date: new Date().toISOString()
  }
};

const job = await apiClient.datastoreCreate(request);
```

### Read Records

#### Get All Records
```typescript
// Get all candidates
const allCandidates = await apiClient.getRecords('recruitment_tool');
console.log(allCandidates.data); // Array of records
```

#### Get Filtered Records
```typescript
// Get active candidates only
const activeCandidates = await apiClient.getRecords('recruitment_tool', {
  status: 'active'
});

// Get candidates by skill
const reactDevelopers = await apiClient.getRecords('recruitment_tool', {
  skills: 'React'  // Note: Array filtering depends on backend implementation
});

// Get candidates by experience range
const seniorCandidates = await apiClient.getRecords('recruitment_tool', {
  experience_years: { $gte: 5 }  // MongoDB-style queries (if supported)
});
```

#### Using Datastore Retrieve Request
```typescript
import { DatastoreRetrieveRequest } from '@/types/datastore';

const request: DatastoreRetrieveRequest = {
  identifier: 'recruitment_tool',
  filters: {
    position: 'Software Engineer',
    status: 'active'
  }
};

const results = await apiClient.datastoreRetrieve(request);
```

### Update Records

#### Simple Update
```typescript
// Update candidate status
const updatedCandidate = await apiClient.updateRecord('recruitment_tool', {
  record_id: 'candidate_001',
  status: 'interviewed',
  interview_date: new Date().toISOString(),
  notes: 'Great technical skills, good culture fit'
});
```

#### Partial Updates
```typescript
// Update only specific fields
const partialUpdate = await apiClient.updateRecord('recruitment_tool', {
  record_id: 'job_12345',
  status: 'closed',
  closed_date: new Date().toISOString()
});
```

### Delete Records

#### Delete Single Record
```typescript
// Delete a specific candidate
await apiClient.deleteRecord('recruitment_tool', 'candidate_001');
```

#### Delete All Records (Use with caution!)
```typescript
// Delete all records in the identifier
await apiClient.deleteAllRecords('recruitment_tool');
```

### Append to Records
```typescript
// Add interview feedback to existing candidate
const appendedData = await apiClient.appendToRecord('recruitment_tool', {
  record_id: 'candidate_001',
  interview_feedback: {
    interviewer: 'Jane Smith',
    date: new Date().toISOString(),
    rating: 4.5,
    comments: 'Strong problem-solving skills'
  }
});
```

## 🎯 Advanced Usage

### Working with Complex Data

#### Nested Objects
```typescript
const candidate = await apiClient.createRecord('recruitment_tool', {
  app_id: 'recruitment_tool',
  record_id: 'candidate_002',
  personal_info: {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0123',
    location: {
      city: 'San Francisco',
      state: 'CA',
      country: 'USA'
    }
  },
  professional_info: {
    current_role: 'Frontend Developer',
    experience_years: 3,
    education: {
      degree: 'Computer Science',
      university: 'UC Berkeley',
      graduation_year: 2020
    }
  },
  application_info: {
    applied_date: new Date().toISOString(),
    source: 'LinkedIn',
    referrer: 'employee_123'
  }
});
```

#### Arrays and Lists
```typescript
const job = await apiClient.createRecord('recruitment_tool', {
  app_id: 'recruitment_tool',
  record_id: 'job_003',
  title: 'Full Stack Developer',
  required_skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
  nice_to_have_skills: ['TypeScript', 'AWS', 'Docker'],
  benefits: [
    'Health Insurance',
    'Remote Work',
    '401k Matching',
    'Professional Development Budget'
  ],
  application_stages: [
    { stage: 'application', duration_days: 1 },
    { stage: 'phone_screen', duration_days: 3 },
    { stage: 'technical_interview', duration_days: 5 },
    { stage: 'final_interview', duration_days: 2 },
    { stage: 'offer', duration_days: 1 }
  ]
});
```

### Batch Operations

#### Creating Multiple Records
```typescript
// Create multiple candidates at once
const candidates = [
  {
    app_id: 'recruitment_tool',
    record_id: 'candidate_batch_001',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    position: 'Backend Developer'
  },
  {
    app_id: 'recruitment_tool',
    record_id: 'candidate_batch_002',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    position: 'DevOps Engineer'
  }
];

const createdCandidates = await Promise.all(
  candidates.map(candidate => 
    apiClient.createRecord('recruitment_tool', candidate)
  )
);
```

### Error Handling

#### Comprehensive Error Handling
```typescript
async function createCandidateWithErrorHandling(candidateData: any) {
  try {
    const candidate = await apiClient.createRecord('recruitment_tool', {
      app_id: 'recruitment_tool',
      record_id: `candidate_${Date.now()}`,
      ...candidateData
    });
    
    console.log('Candidate created successfully:', candidate);
    return candidate;
    
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('ValidationException')) {
        console.error('Validation error:', error.message);
        throw new Error('Invalid candidate data provided');
      }
      
      if (error.message.includes('ConditionalCheckFailedException')) {
        console.error('Record already exists');
        throw new Error('Candidate with this ID already exists');
      }
      
      if (error.message.includes('401')) {
        console.error('Authentication error');
        throw new Error('Please log in again');
      }
      
      if (error.message.includes('403')) {
        console.error('Permission denied');
        throw new Error('You don\'t have permission to create candidates');
      }
    }
    
    console.error('Unexpected error:', error);
    throw new Error('Failed to create candidate');
  }
}
```

## 🔒 RBAC Integration

The datastore automatically integrates with the RBAC system for user and role management:

### User Records
```typescript
// Users are automatically managed through the RBAC system
// Direct datastore operations are handled by userService

import { userService } from '@/services/rbac';

// Get user (uses datastore internally)
const user = await userService.getUser('microsoft_oid_here');

// Create user (uses datastore internally) 
const newUser = await userService.createUser({
  microsoft_oid: 'new_user_oid',
  email: 'user@example.com',
  name: 'New User'
});
```

### Custom Application Data
```typescript
// For custom application data, use the datastore directly
const applicationRecord = await apiClient.createRecord('recruitment_tool', {
  app_id: 'recruitment_tool',
  record_id: 'settings_general',
  application_name: 'Recruitment Tool',
  version: '1.0.0',
  features: {
    candidate_tracking: true,
    interview_scheduling: true,
    reporting: true
  },
  configuration: {
    max_candidates_per_job: 100,
    interview_reminder_days: 1,
    auto_archive_days: 90
  }
});
```

## 🧪 Testing with Datastore

### Testing Interface
The application includes a built-in testing interface at `/datastore` for experimenting with datastore operations.

### Sample Test Operations
```typescript
// Test data creation
const testRecord = await apiClient.createRecord('test_app', {
  app_id: 'test_app',
  record_id: `test_${Date.now()}`,
  test_data: 'Hello World',
  timestamp: new Date().toISOString()
});

// Test data retrieval
const testRecords = await apiClient.getRecords('test_app');

// Test data update
const updatedRecord = await apiClient.updateRecord('test_app', {
  record_id: testRecord.data.record_id,
  test_data: 'Updated Hello World',
  updated_timestamp: new Date().toISOString()
});

// Test data deletion
await apiClient.deleteRecord('test_app', testRecord.data.record_id);
```

## 📊 Best Practices

### Record ID Generation
```typescript
// Use consistent patterns for record IDs
const generateRecordId = (type: string, identifier?: string) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  
  if (identifier) {
    return `${type}_${identifier}`;
  }
  
  return `${type}_${timestamp}_${random}`;
};

// Examples
const candidateId = generateRecordId('candidate', 'john_doe');
const jobId = generateRecordId('job'); // Uses timestamp + random
```

### Data Validation
```typescript
// Validate data before sending to datastore
const validateCandidateData = (data: any): boolean => {
  const required = ['name', 'email', 'position'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new Error('Invalid email format');
  }
  
  return true;
};
```

### Timestamp Management
```typescript
// Always use ISO timestamps
const now = new Date().toISOString();

const record = await apiClient.createRecord('recruitment_tool', {
  app_id: 'recruitment_tool',
  record_id: 'candidate_001',
  created_at: now,
  updated_at: now,
  // ... other fields
});
```

### Query Optimization
```typescript
// Use specific filters to reduce data transfer
const recentApplications = await apiClient.getRecords('recruitment_tool', {
  status: 'applied',
  created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
});

// Instead of fetching all and filtering in JavaScript
const allRecords = await apiClient.getRecords('recruitment_tool');
const filtered = allRecords.data.filter(/* complex filtering */);
```

## 🚨 Common Pitfalls

### 1. Missing Required Fields
```typescript
// ❌ Wrong - missing app_id and record_id
const badRecord = await apiClient.createRecord('recruitment_tool', {
  name: 'John Doe'
});

// ✅ Correct - includes required fields
const goodRecord = await apiClient.createRecord('recruitment_tool', {
  app_id: 'recruitment_tool',
  record_id: 'candidate_001',
  name: 'John Doe'
});
```

### 2. Inconsistent Record IDs
```typescript
// ❌ Wrong - inconsistent naming
const record1 = { record_id: 'user-123' };
const record2 = { record_id: 'USER_456' };
const record3 = { record_id: 'candidate789' };

// ✅ Correct - consistent naming convention
const record1 = { record_id: 'user_123' };
const record2 = { record_id: 'user_456' };
const record3 = { record_id: 'candidate_789' };
```

### 3. Not Handling Async Operations
```typescript
// ❌ Wrong - not awaiting async operations
const createMultiple = () => {
  apiClient.createRecord('app', record1);
  apiClient.createRecord('app', record2);
  // Operations may complete out of order
};

// ✅ Correct - properly handling async
const createMultiple = async () => {
  await apiClient.createRecord('app', record1);
  await apiClient.createRecord('app', record2);
  // Or use Promise.all for parallel execution
};
```

## 📈 Performance Tips

1. **Batch Operations**: Use Promise.all for parallel operations when order doesn't matter
2. **Specific Filters**: Use datastore-level filtering instead of client-side filtering
3. **Pagination**: Implement pagination for large datasets (if supported by backend)
4. **Caching**: Cache frequently accessed data at the application level
5. **Minimal Data**: Only fetch the fields you need

## 🔧 Troubleshooting

### Common Errors and Solutions

#### ValidationException
```
Error: Datastore error: ValidationException - Missing required field 'record_id'
```
**Solution**: Ensure all required fields (app_id, record_id) are included in your data.

#### ConditionalCheckFailedException
```
Error: Datastore error: ConditionalCheckFailedException
```
**Solution**: The record already exists. Use update instead of create, or choose a different record_id.

#### 401 Unauthorized
```
Error: API request failed: 401 Unauthorized
```
**Solution**: Check your authentication. Log out and log back in to refresh tokens.

#### 403 Forbidden
```
Error: API request failed: 403 Forbidden
```
**Solution**: You don't have the required permissions. Contact your administrator.

This comprehensive guide covers all aspects of using the Datastore API effectively. For additional help, refer to the type definitions in `src/types/datastore.ts` and the API client implementation in `src/services/api.ts`.