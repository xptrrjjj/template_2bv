# Datastore Usage Guide

## Overview

This document explains the correct way to use the datastore API in our application to avoid confusion and ensure consistency.

## Key Concepts

### Structure
- **`identifier`** = Application namespace (CONSISTENT across all operations) 
  - Always use `process.env.NEXT_PUBLIC_APP_IDENTIFIER` or `'antd_recruiter'`
- **`app_id`** = Data type identifier (SPECIFIC to each record type)
  - Examples: `'companies'`, `'job_roles'`, `'users'`, `'permissions'`

### Data Flow
```
Namespace: 'antd_recruiter'
├── app_id: 'companies' (Company records)
├── app_id: 'job_roles' (Job role records)  
├── app_id: 'rbac_users' (User records)
└── app_id: 'rbac_permissions' (Permission records)
```

## Creating Records

### Payload Structure
```typescript
{
  "identifier": "antd_recruiter",    // <- Application namespace (CONSISTENT)
  "action": "create",
  "data": {
    "app_id": "companies",           // <- Data type identifier (SPECIFIC)
    "record_id": "company_123",      // <- Unique record ID
    "field_name": "value"            // <- Your actual data
  }
}
```

### Code Example
```typescript
const companyRecord = {
  app_id: 'companies',              // Data type identifier
  record_id: companyId,             // Unique ID
  company_id: companyId,            // Your business logic fields
  teamtailor_option_id: '12345',
  industry: 'Tech',
  // ... other company fields
};

await apiClient.createRecord('antd_recruiter', companyRecord);
//                           ^identifier      ^data with app_id
```

## Retrieving Records

### Query Structure
```typescript
{
  "identifier": "antd_recruiter",    // <- Application namespace (CONSISTENT)  
  "filters": {
    "app_id": "companies"            // <- Filter by data type
  }
}
```

### Code Example
```typescript
// Get all company records
const response = await apiClient.getRecords('antd_recruiter', { app_id: 'companies' });

// Get specific company record
const response = await apiClient.getRecords('antd_recruiter', { 
  app_id: 'companies',
  record_id: 'company_123' 
});
```

## Common Patterns

### Different Record Types in Same Application
```typescript
// Companies
await apiClient.createRecord('antd_recruiter', {
  app_id: 'companies',
  record_id: 'company_001',
  // ... company data
});

// Job Roles  
await apiClient.createRecord('antd_recruiter', {
  app_id: 'job_roles', 
  record_id: 'role_001',
  // ... job role data
});

// Users
await apiClient.createRecord('antd_recruiter', {
  app_id: 'rbac_users',
  record_id: 'user_001', 
  // ... user data
});
```

### Querying Different Types
```typescript
// Get all companies
const companies = await apiClient.getRecords('antd_recruiter', { app_id: 'companies' });

// Get all job roles
const jobRoles = await apiClient.getRecords('antd_recruiter', { app_id: 'job_roles' });

// Get all users  
const users = await apiClient.getRecords('antd_recruiter', { app_id: 'rbac_users' });
```

## WRONG vs RIGHT Examples

### ❌ WRONG - Inconsistent identifier usage
```typescript
// DON'T DO THIS
await apiClient.createRecord('companies', {
  app_id: 'antd_recruiter',  // Wrong - this should be 'companies'
  record_id: 'comp_123'
});
```

### ✅ RIGHT - Proper structure
```typescript  
// DO THIS
await apiClient.createRecord('antd_recruiter', {
  app_id: 'companies',       // Correct - data type identifier
  record_id: 'comp_123'
});
```

### ❌ WRONG - Mismatched query
```typescript
// DON'T DO THIS  
const response = await apiClient.getRecords('companies', { app_id: 'antd_recruiter' });
```

### ✅ RIGHT - Consistent query
```typescript
// DO THIS
const response = await apiClient.getRecords('antd_recruiter', { app_id: 'companies' });
```

## Environment Configuration

Always use the environment variable for the identifier:
```typescript
const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_IDENTIFIER || 'antd_recruiter';

// Use in operations
await apiClient.createRecord(APP_IDENTIFIER, {
  app_id: 'companies',
  // ... data
});
```

## Summary Rules

1. **Identifier** = Always `'antd_recruiter'` (or env var) - NEVER changes
2. **app_id** = Specific to data type (`'companies'`, `'job_roles'`, etc.) - ALWAYS changes per type
3. **Queries** = Use same identifier + filter by app_id
4. **Consistency** = Same identifier for create/read/update/delete operations
5. **Separation** = Different app_id values separate different types of records

This structure allows us to:
- Keep all application data under one namespace (`antd_recruiter`)  
- Easily separate different types of records (`companies`, `job_roles`, etc.)
- Query efficiently by data type
- Maintain consistency across all operations