# Authentication Setup Guide

This guide covers the complete setup and configuration of Microsoft Azure AD authentication integration in the application.

## 🏗️ Overview

The application uses Microsoft Authentication Library (MSAL) to provide seamless Single Sign-On (SSO) integration with Microsoft Azure Active Directory. This ensures secure authentication and user identity management.

## 🔧 Azure AD Application Setup

### Step 1: Create Azure AD Application

1. **Navigate to Azure Portal**
   - Go to [Azure Portal](https://portal.azure.com)
   - Sign in with your administrator account

2. **Create App Registration**
   - Navigate to "Azure Active Directory" → "App registrations"
   - Click "New registration"
   - Fill in the details:
     ```
     Name: Recruitment Tool
     Supported account types: Accounts in this organizational directory only
     Redirect URI: Single-page application (SPA) - http://localhost:3000
     ```

3. **Configure Application Settings**
   - Note down the **Application (client) ID**
   - Note down the **Directory (tenant) ID**

### Step 2: Configure Authentication

1. **Add Redirect URIs**

   ```
   Development: http://localhost:3000
   Staging: https://your-staging-domain.com
   Production: https://your-production-domain.com
   ```

2. **Configure Token Configuration**
   - Go to "Token configuration"
   - Add optional claims:
     - ID tokens: `email`, `given_name`, `family_name`, `picture`
     - Access tokens: `email`, `given_name`, `family_name`

3. **API Permissions**
   - Add Microsoft Graph permissions:
     - `User.Read` (Delegated) - Read user profile
     - `Profile` (Delegated) - View users' basic profile
     - `OpenId` (Delegated) - Sign users in
     - `Email` (Delegated) - View users' email address

### Step 3: Configure App Manifest (Optional)

If you need additional claims or specific configurations:

```json
{
  "accessTokenAcceptedVersion": 2,
  "allowPublicClient": false,
  "appId": "your-app-id",
  "oauth2AllowIdTokenImplicitFlow": true,
  "oauth2AllowImplicitFlow": false,
  "replyUrlsWithType": [
    {
      "url": "http://localhost:3000",
      "type": "Spa"
    }
  ]
}
```

## ⚙️ Application Configuration

### Environment Variables

Create a `.env.local` file in your project root:

```bash
# Microsoft Authentication
NEXT_PUBLIC_MSAL_CLIENT_ID=your-application-client-id
NEXT_PUBLIC_MSAL_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
NEXT_PUBLIC_MSAL_REDIRECT_URI=http://localhost:3000

# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://your-api-endpoint.com

# RBAC Configuration
NEXT_PUBLIC_APP_ID=recruitment_tool
NEXT_PUBLIC_APP_NAME=Recruitment Tool
NEXT_PUBLIC_DEFAULT_ROLE=app_viewer
NEXT_PUBLIC_AUTO_PROVISION_USERS=true
NEXT_PUBLIC_REQUIRE_EXPLICIT_ACCESS=false
```

### MSAL Configuration

The MSAL configuration is defined in `src/config/msalConfig.ts`:

```typescript
import { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID!,
    authority: process.env.NEXT_PUBLIC_MSAL_AUTHORITY!,
    redirectUri: process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI!,
    postLogoutRedirectUri: process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI!,
  },
  cache: {
    cacheLocation: "localStorage", // or 'sessionStorage'
    storeAuthStateInCookie: false, // Set to true for IE11 support
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;

        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Info:
            console.info(message);
            break;
          case LogLevel.Verbose:
            console.debug(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
        }
      },
      logLevel: LogLevel.Warning,
      piiLoggingEnabled: false,
    },
  },
};

// Login request configuration
export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
  prompt: "select_account" as const,
};
```

## 🔐 Authentication Flow

### 1. Login Process

```typescript
// In AuthContext.tsx
const login = async () => {
  try {
    setAuthState((prev) => ({ ...prev, loading: true }));

    // Initiate Microsoft login
    const loginResponse = await msalInstance.loginPopup(loginRequest);

    // Get additional profile information
    const graphToken = await msalInstance.acquireTokenSilent({
      scopes: ["User.Read"],
      account: loginResponse.account,
    });

    // Fetch user profile from Microsoft Graph
    const userProfile = await fetchUserProfile(graphToken.accessToken);

    // Exchange Microsoft token for application token
    const { access_token, user } = await exchangeTokenWithBackend(loginResponse.accessToken);

    // Store authentication data
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("user", JSON.stringify(user));

    // Create enhanced user object
    const enhancedUser = {
      ...user,
      name: loginResponse.account.name || user.name,
      profilePicture: userProfile?.profilePicture,
      email: userProfile?.mail || userProfile?.userPrincipalName || user.email,
      microsoftOid: loginResponse.account.localAccountId || loginResponse.uniqueId,
    };

    // Provision user in RBAC system
    await provisionUserInRBAC({
      oid: enhancedUser.microsoftOid,
      email: enhancedUser.email,
      name: enhancedUser.name,
      profilePicture: enhancedUser.profilePicture,
    });

    // Load RBAC data
    await loadUserRBACData(enhancedUser.microsoftOid);

    // Update authentication state
    setAuthState({
      isAuthenticated: true,
      user: enhancedUser,
      accessToken: access_token,
      loading: false,
    });
  } catch (error) {
    console.error("Login failed:", error);
    // Handle error...
  }
};
```

### 2. Token Exchange

```typescript
const exchangeTokenWithBackend = async (microsoftToken: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/microsoft/callback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      microsoft_token: microsoftToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Token exchange failed");
  }

  return response.json();
};
```

### 3. RBAC User Provisioning

```typescript
const provisionUserInRBAC = async (userData: {
  oid: string;
  email: string;
  name: string;
  profilePicture?: string;
}) => {
  try {
    await userService.provisionUser({
      microsoftOid: userData.oid,
      email: userData.email,
      name: userData.name,
      profilePicture: userData.profilePicture,
    });
  } catch (error) {
    console.error("Failed to provision user in RBAC:", error);
    throw error;
  }
};
```

### 4. Logout Process

```typescript
const logout = async () => {
  try {
    // Clear local storage
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("nav-openKeys");

    // Sign out from MSAL
    await msalInstance.logoutPopup();

    // Clear authentication state
    setAuthState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      loading: false,
    });

    // Clear RBAC state
    setRbacState({
      rbacUser: null,
      loading: false,
    });
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
```

## 🔄 Session Management

### Token Refresh

```typescript
// Automatic token refresh
const refreshToken = async () => {
  try {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) throw new Error("No accounts found");

    const silentRequest = {
      scopes: ["User.Read"],
      account: accounts[0],
    };

    const response = await msalInstance.acquireTokenSilent(silentRequest);

    // Exchange refreshed token with backend
    const { access_token } = await exchangeTokenWithBackend(response.accessToken);
    localStorage.setItem("access_token", access_token);

    return access_token;
  } catch (error) {
    console.error("Token refresh failed:", error);
    // Force re-login
    await logout();
    throw error;
  }
};
```

### Session Persistence

```typescript
// Initialize authentication on app startup
const initializeAuth = async () => {
  try {
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      const user = JSON.parse(userData);

      // Verify token is still valid
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        // Token is valid, restore session
        setAuthState({
          isAuthenticated: true,
          user,
          accessToken: token,
          loading: false,
        });

        // Load RBAC data
        await loadUserRBACData(user.microsoftOid);
      } else {
        // Token is invalid, clear storage
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
      }
    }
  } catch (error) {
    console.error("Session initialization failed:", error);
    // Clear corrupted data
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  }

  setAuthState((prev) => ({ ...prev, loading: false }));
};
```

## 🛡️ Protected Routes

### ProtectedRoute Component

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || <LoginPage />;
  }

  return <>{children}</>;
};
```

### Usage

```typescript
// Protect entire pages
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>

// With custom fallback
<ProtectedRoute fallback={<CustomLoginPage />}>
  <AdminPanel />
</ProtectedRoute>
```

## 🌐 Microsoft Graph Integration

### Fetching User Profile

```typescript
const fetchUserProfile = async (accessToken: string) => {
  try {
    const response = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }

    const profile = await response.json();

    // Fetch profile photo
    const photoResponse = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let profilePicture = null;
    if (photoResponse.ok) {
      const photoBlob = await photoResponse.blob();
      profilePicture = await blobToBase64(photoBlob);
    }

    return {
      ...profile,
      profilePicture,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
```

## 🧪 Testing Authentication

### Mock Authentication for Development

```typescript
// Create a mock auth provider for testing
export const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const mockAuthState = {
    isAuthenticated: true,
    user: {
      microsoftOid: 'mock-user-oid',
      name: 'Test User',
      email: 'test@example.com',
    },
    accessToken: 'mock-token',
    loading: false,
  };

  const mockAuthMethods = {
    login: () => Promise.resolve(),
    logout: () => Promise.resolve(),
    checkPermission: () => true,
    hasRole: () => true,
  };

  return (
    <AuthContext.Provider value={{ ...mockAuthState, ...mockAuthMethods }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Unit Testing

```typescript
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MockAuthProvider } from './MockAuthProvider';

test('renders children when authenticated', () => {
  render(
    <MockAuthProvider>
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    </MockAuthProvider>
  );

  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});
```

## 🚨 Error Handling

### Common Authentication Errors

#### 1. MSAL Configuration Errors

```typescript
// Handle configuration errors
try {
  const msalInstance = new PublicClientApplication(msalConfig);
} catch (error) {
  console.error("MSAL configuration error:", error);
  // Show user-friendly error message
  setError("Authentication service is not properly configured");
}
```

#### 2. Login Popup Blocked

```typescript
const login = async () => {
  try {
    const result = await msalInstance.loginPopup(loginRequest);
  } catch (error) {
    if (error.errorCode === "popup_window_error") {
      // Fallback to redirect flow
      await msalInstance.loginRedirect(loginRequest);
    }
  }
};
```

#### 3. Token Expiration

```typescript
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  let token = localStorage.getItem("access_token");

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      // Token expired, try to refresh
      token = await refreshToken();

      // Retry request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return response;
  } catch (error) {
    console.error("Authenticated request failed:", error);
    throw error;
  }
};
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Redirect URI Mismatch

**Error**: `AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application`

**Solution**:

- Verify redirect URIs in Azure AD match exactly
- Check environment variables are correct
- Ensure protocol (http/https) matches

#### 2. Consent Required

**Error**: `AADSTS65001: The user or administrator has not consented to use the application`

**Solution**:

- Admin consent required for organization
- Add required permissions in Azure AD
- Test with personal Microsoft account first

#### 3. Popup Blocked

**Error**: `popup_window_error` or `user_cancelled`

**Solution**:

- Use redirect flow instead of popup
- Instruct users to allow popups
- Implement fallback to redirect

#### 4. Token Validation Errors

**Error**: `AADSTS50027: JWT token is invalid or malformed`

**Solution**:

- Check token expiration
- Verify audience and issuer claims
- Ensure clock synchronization

### Debug Mode

Enable detailed logging for troubleshooting:

```typescript
// In msalConfig.ts
system: {
  loggerOptions: {
    logLevel: LogLevel.Verbose, // Enable verbose logging
    piiLoggingEnabled: true,    // Enable for debugging only
  },
},
```

## 📊 Production Considerations

### Security Best Practices

1. **Token Storage**
   - Use secure storage mechanisms
   - Implement token rotation
   - Set appropriate token lifetimes

2. **HTTPS Requirements**
   - Always use HTTPS in production
   - Configure proper SSL certificates
   - Update redirect URIs to use HTTPS

3. **Monitoring**
   - Log authentication events
   - Monitor failed login attempts
   - Set up alerts for suspicious activity

### Performance Optimization

1. **Token Caching**
   - Use appropriate cache location
   - Implement token refresh logic
   - Handle cache corruption gracefully

2. **Network Optimization**
   - Minimize API calls during auth flow
   - Implement proper loading states
   - Handle slow network conditions

This comprehensive authentication guide covers all aspects of setting up and managing Microsoft Azure AD authentication in your application. For additional support, refer to the [Microsoft Authentication Library documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview).
