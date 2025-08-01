# Next.js Application Template with Microsoft Authentication

This document serves as a comprehensive template and guide for creating Next.js applications with Microsoft authentication, Ant Design UI, and modular architecture following SOLID principles.

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Authentication Flow](#authentication-flow)
4. [UI Components](#ui-components)
5. [Navigation System](#navigation-system)
6. [API Integration](#api-integration)
7. [Environment Configuration](#environment-configuration)
8. [Implementation Guide](#implementation-guide)
9. [Key Features](#key-features)
10. [Best Practices](#best-practices)

## Tech Stack

- **Framework**: Next.js 15.4.5 with App Router
- **React Version**: React 19.1.0
- **UI Library**: Ant Design v5 (exclusively)
- **Authentication**: Microsoft MSAL (popup flow)
- **TypeScript**: Full type safety
- **State Management**: React Context API
- **Styling**: CSS-in-JS with Ant Design theming

## Project Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── components/           # Modular dashboard components
│   │   │   ├── StatCard.tsx
│   │   │   ├── WelcomeSection.tsx
│   │   │   ├── StatsSection.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── SystemHealth.tsx
│   │   │   └── index.ts          # Barrel exports
│   │   └── page.tsx
│   ├── datastore/
│   │   ├── components/
│   │   │   ├── DatastoreOperationForm.tsx
│   │   │   ├── DatastoreRetrieveForm.tsx
│   │   │   ├── ResponseDisplay.tsx
│   │   │   └── index.ts
│   │   └── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── layout.tsx               # Root layout with providers
│   └── page.tsx                 # Home page
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx   # Route protection wrapper
│   └── navigation/
│       └── AppNavigation.tsx    # Sidebar navigation
├── contexts/
│   └── AuthContext.tsx          # Authentication state management
├── config/
│   └── msalConfig.ts           # Microsoft MSAL configuration
├── lib/
│   └── utils.ts                # Utility functions
├── providers/
│   └── MSALProvider.tsx        # MSAL React provider
├── services/
│   └── api.ts                  # API client services
└── types/
    └── auth.ts                 # TypeScript interfaces
```

## Authentication Flow

### 1. Microsoft MSAL Configuration

```typescript
// src/config/msalConfig.ts
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : ''
  }
};

export const loginRequest: RedirectRequest = {
  scopes: ['User.Read', 'User.Read.All', 'User.ReadBasic.All', 'User.ReadWrite'],
  prompt: 'select_account'
};
```

### 2. Authentication Context

The AuthContext manages:
- **Authentication State**: `isAuthenticated`, `user`, `accessToken`, `loading`
- **Login Flow**: MSAL popup → Microsoft Graph profile → Backend token exchange
- **Token Management**: localStorage persistence with validation
- **Enhanced User Object**: Merges Microsoft profile with backend user data

### 3. Token Exchange Flow

1. User clicks login → MSAL popup appears
2. Microsoft returns access token and user account info
3. Fetch user profile from Microsoft Graph API (including profile picture)
4. Exchange Microsoft token with backend API
5. Backend returns application-specific access token and user data
6. Merge Microsoft profile data with backend user data
7. Store enhanced user object and access token

### 4. Console Logging for Development

```typescript
console.log('Microsoft Login Response:', loginResponse);
console.log('Backend API Response:', { access_token, user });
console.log('Enhanced User:', enhancedUser);
```

## UI Components

### Design System
- **Colors**: Linear gradients (`#1890ff` to `#722ed1`)
- **Spacing**: Consistent 16px, 24px, 32px increments
- **Typography**: Ant Design Typography components
- **Icons**: Ant Design icons exclusively
- **Cards**: Rounded corners (12px-16px), subtle shadows
- **Layout**: Responsive grid system with Ant Design Row/Col

### Component Architecture (SOLID Principles)

#### Dashboard Components
- `WelcomeSection`: Hero section with user greeting
- `StatsSection`: Grid of statistical cards
- `StatCard`: Individual metric display with trends
- `ActivityFeed`: Timeline of recent activities
- `SystemHealth`: API testing and health monitoring

#### Form Components
- Template-based forms with quick-fill buttons
- JSON validation and syntax highlighting
- Real-time error handling and notifications
- Collapsible request/response details

## Navigation System

### Sidebar Layout
- **Collapsible**: Default 280px width, collapses to 80px
- **Light Theme**: Clean white background with subtle borders
- **User Profile**: Bottom-positioned with dropdown menu
- **Logo/Branding**: Gradient logo with collapsed icon state
- **Menu Items**: Icon + label format with active state highlighting

### Navigation Structure
```typescript
const menuItems = [
  {
    key: '/dashboard',
    icon: <HomeOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/datastore',
    icon: <DatabaseOutlined />,
    label: 'Datastore Testing',
  },
];
```

## API Integration

### API Client Service
```typescript
// src/services/api.ts
class APIClient {
  private baseURL: string;
  private getAuthToken: () => string | null;

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    // Automatic token injection
    // Error handling and response parsing
    // Type-safe responses
  }
}
```

### Supported Operations
- **CRUD Operations**: Create, Read, Update, Delete
- **Datastore Operations**: Custom retrieve with filters
- **Authentication**: Token exchange and validation
- **Error Handling**: Centralized error processing

## Environment Configuration

### Required Environment Variables
```env
NEXT_PUBLIC_AZURE_CLIENT_ID=your_azure_client_id
NEXT_PUBLIC_AZURE_TENANT_ID=your_azure_tenant_id
NEXT_PUBLIC_API_BASE_URL=your_backend_api_url
```

### Microsoft Azure App Registration
1. **Scopes Required**: `User.Read`, `User.Read.All`, `User.ReadBasic.All`, `User.ReadWrite`
2. **Authentication Type**: Public client (SPA)
3. **Redirect URIs**: Your application domain
4. **API Permissions**: Microsoft Graph delegated permissions

## Implementation Guide

### 1. Project Setup
```bash
npx create-next-app@latest your-app-name --typescript --tailwind --eslint --app
cd your-app-name
npm install @azure/msal-react @azure/msal-browser antd @ant-design/icons
npm install @ant-design/v5-patch-for-react-19  # React 19 compatibility
```

### 2. Core Implementation Steps
1. **Setup MSAL Configuration**: Configure Azure client and tenant IDs
2. **Create Authentication Context**: Implement login/logout and state management
3. **Build Navigation System**: Implement Ant Design sidebar with routing
4. **Create Protected Routes**: Wrap pages with authentication checks
5. **Implement Dashboard**: Create modular components following SOLID principles
6. **Add Feature Pages**: Build feature-specific pages with consistent patterns
7. **Setup API Integration**: Create centralized API client with token management

### 3. Component Development Pattern
1. **Create Base Component**: Start with Ant Design Card container
2. **Add Business Logic**: Implement feature-specific functionality
3. **Style Consistently**: Use established design tokens and patterns
4. **Handle Loading States**: Include skeleton screens and loading indicators
5. **Error Handling**: Implement user-friendly error messages
6. **Type Safety**: Define proper TypeScript interfaces

## Key Features

### Authentication Features
- ✅ Microsoft SSO with popup flow
- ✅ Profile picture integration from Microsoft Graph
- ✅ Token persistence and validation
- ✅ Automatic logout on token expiration
- ✅ Protected route implementation

### UI/UX Features
- ✅ Responsive sidebar navigation
- ✅ Consistent Ant Design theming
- ✅ Loading states and skeleton screens
- ✅ Real-time notifications
- ✅ Modular component architecture

### Development Features
- ✅ TypeScript full coverage
- ✅ Console logging for development
- ✅ Error boundary implementation
- ✅ Environment-based configuration
- ✅ SOLID principle adherence

## Best Practices

### Code Organization
1. **Barrel Exports**: Use index.ts files for clean imports
2. **Component Separation**: Keep components focused and single-responsibility
3. **Type Safety**: Define interfaces for all data structures
4. **Error Handling**: Implement consistent error handling patterns
5. **Performance**: Use React.memo for expensive components

### Authentication Security
1. **Token Storage**: Use localStorage with validation
2. **Route Protection**: Wrap sensitive routes with authentication checks
3. **Token Refresh**: Handle token expiration gracefully
4. **Logout Cleanup**: Clear all storage and cookies on logout

### UI Consistency
1. **Design Tokens**: Use consistent spacing, colors, and typography
2. **Component Patterns**: Establish reusable patterns for common elements
3. **Responsive Design**: Ensure mobile-first responsive implementation
4. **Loading States**: Provide immediate feedback for all async operations

### Development Workflow
1. **Console Logging**: Use structured logging for development debugging
2. **Environment Variables**: Keep sensitive data in environment variables
3. **Component Testing**: Build components in isolation before integration
4. **Documentation**: Maintain up-to-date documentation for team members

---

## Template Checklist

When creating a new application based on this template:

- [ ] Setup Azure App Registration with required scopes
- [ ] Configure environment variables
- [ ] Implement MSAL configuration
- [ ] Create authentication context and flows
- [ ] Build sidebar navigation system
- [ ] Implement protected routes
- [ ] Create modular dashboard components
- [ ] Add feature-specific pages
- [ ] Setup API client with token management
- [ ] Implement consistent error handling
- [ ] Add loading states and user feedback
- [ ] Test authentication flow end-to-end
- [ ] Verify responsive design
- [ ] Remove development console logs before production

This template provides a solid foundation for building modern, secure, and user-friendly Next.js applications with Microsoft authentication integration.