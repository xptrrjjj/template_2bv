# Centralized Authentication Interceptor

## Overview

The `authInterceptor` provides a **single, centralized place** to handle all 401 authentication errors across the entire application. No more scattered auth handling!

## How It Works

1. **Global Fetch Interceptor**: Automatically intercepts ALL fetch requests
2. **401 Detection**: Detects any 401 response from any API call
3. **Automatic Cleanup**: Clears all auth data (localStorage, sessionStorage, cookies)
4. **Auto Redirect**: Redirects to login page
5. **Zero Configuration**: Works automatically once initialized

## Benefits

✅ **Centralized**: One place handles all auth errors  
✅ **Automatic**: No manual error handling needed  
✅ **Consistent**: Same behavior across entire app  
✅ **Clean**: Removes duplicate code  
✅ **Reliable**: Never miss a 401 error  

## Usage

### Initialization (AppLayout.tsx)
```typescript
import { authInterceptor } from '@/services/authInterceptor';

useEffect(() => {
  authInterceptor.configure({
    onUnauthorized: () => {
      console.log('🔒 User session expired');
    },
    redirectUrl: '/login',
  });
}, []);
```

### Manual Logout (AuthContext.tsx)
```typescript
import { authInterceptor } from '@/services/authInterceptor';

const logout = () => {
  authInterceptor.logout(); // Handles everything automatically
  setAuthState({ isAuthenticated: false, ... });
};
```

### API Client (api.ts) - Simplified!
```typescript
// Before: Manual 401 handling
if (response.status === 401) {
  localStorage.removeItem('access_token');
  window.location.href = '/login';
}

// After: Nothing needed! Interceptor handles it
if (!response.ok) {
  throw new Error(`API request failed: ${response.status}`);
}
```

## What Gets Cleaned Up

When a 401 is detected, the interceptor automatically:

- ✅ Clears `localStorage` (access_token, user)
- ✅ Clears `sessionStorage` 
- ✅ Clears all cookies (including domain variations)
- ✅ Redirects to login page
- ✅ Calls custom cleanup handlers

## Example Scenarios

### Scenario 1: User clicks "Load Users" - Token Expired
```
1. User clicks button
2. API call made to /api/users
3. Server returns 401
4. Interceptor detects 401
5. Auto cleanup + redirect to login
6. User sees login page
```

### Scenario 2: Background API Call - Token Expired
```
1. Timer triggers background sync
2. API call made to /api/sync
3. Server returns 401
4. Interceptor handles it automatically
5. User redirected to login (seamless)
```

### Scenario 3: Manual Logout
```
1. User clicks "Logout"
2. authInterceptor.logout() called
3. Same cleanup process
4. Redirect to login
```

## Migration Benefits

**Before** (scattered handling):
- ❌ 15+ places with manual 401 checks
- ❌ Inconsistent cleanup logic
- ❌ Easy to miss edge cases
- ❌ Duplicate code everywhere

**After** (centralized):
- ✅ 1 place handles everything
- ✅ Consistent behavior
- ✅ Automatic coverage
- ✅ Clean, maintainable code

## Testing

```typescript
// Test 401 handling
const response = await fetch('/api/test-401');
// Interceptor automatically handles the 401
// User will be redirected to login
```

## Configuration Options

```typescript
authInterceptor.configure({
  // Custom handler for additional cleanup
  onUnauthorized: () => {
    // Analytics, logging, etc.
    analytics.track('session_expired');
  },
  
  // Custom redirect URL
  redirectUrl: '/custom-login',
});
```

This approach follows the **DRY principle** and **Single Responsibility Principle** - one service handles one concern (authentication errors) across the entire application!