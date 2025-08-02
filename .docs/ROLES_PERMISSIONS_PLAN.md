# Multi-Application RBAC System Implementation Plan

## Overview

This document outlines the implementation of a comprehensive, multi-application Role-Based Access Control (RBAC) system that integrates seamlessly with the Next.js Application Template. The system is designed for **open-ended, multi-app usage** with all data stored exclusively in the Datastore and authenticated via Microsoft Bearer tokens.

## Core Design Principles

### 1. Multi-Application Architecture

- **App-Agnostic Roles**: Roles like `admin`, `editor`, `viewer` work across all applications
- **Application Scoping**: Permissions can be scoped to specific applications or global
- **Extensible Design**: Easy addition of new applications without code changes
- **Shared Identity**: Single user identity across all applications

### 2. Datastore-First Approach

- **Single Source of Truth**: All RBAC data stored exclusively in Datastore
- **No Hardcoding**: Zero compile-time role/permission definitions
- **Runtime Flexibility**: Dynamic creation and modification of roles/permissions
- **Token Security**: All operations require valid Microsoft Bearer token

### 3. Integration with Application Template

- **Consistent Authentication**: Leverages existing Microsoft MSAL flow
- **Ant Design UI**: Admin interfaces follow established design patterns
- **Modular Components**: RBAC components integrate with existing architecture
- **TypeScript Safety**: Full type coverage with existing type patterns

## System Architecture

### Core Components

```typescript
// Multi-app RBAC Architecture
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Recruitment   │   CRM System    │   Project Management    │
│   Application   │   Application   │      Application        │
└─────────────────┴─────────────────┴─────────────────────────┘
           │              │                      │
           └──────────────┼──────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│                 RBAC Service Layer                          │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐   │
│  │    User     │ │     Role     │ │     Permission      │   │
│  │   Service   │ │   Service    │ │      Service        │   │
│  └─────────────┘ └──────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│              Datastore (Single Source of Truth)            │
│   ┌──────────┐ ┌───────────┐ ┌──────────────────────────┐   │
│   │  Users   │ │   Roles   │ │      Permissions         │   │
│   │ Collection│ │Collection │ │      Collection          │   │
│   └──────────┘ └───────────┘ └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Models

#### User Record

```typescript
interface UserRecord {
  // Identity
  record_id: string; // user_{microsoft_oid}
  microsoft_oid: string; // Microsoft Object ID (primary key)
  email: string; // Microsoft email
  name: string; // Microsoft display name

  // RBAC Data
  global_roles: string[]; // Global role IDs
  app_roles: Record<string, string[]>; // App-specific role IDs

  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  last_login: string; // ISO timestamp
  status: "active" | "inactive" | "suspended";

  // System
  is_super_admin: boolean; // Global super admin flag
  profile_picture?: string; // Microsoft Graph profile picture
}
```

#### Role Record

```typescript
interface RoleRecord {
  // Identity
  record_id: string; // role_{uuid}
  role_id: string; // Unique identifier (e.g., 'admin', 'editor')
  name: string; // Display name
  description: string; // Human-readable description

  // Scope
  scope: "global" | "app"; // Global or app-specific role
  app_id?: string; // Required if scope === 'app'

  // Permissions
  permission_ids: string[]; // Assigned permission IDs

  // Metadata
  is_system_role: boolean; // Protected from deletion
  created_at: string; // ISO timestamp
  created_by: string; // Creator Microsoft OID
  updated_at: string; // ISO timestamp
  updated_by: string; // Last modifier Microsoft OID
}
```

#### Permission Record

```typescript
interface PermissionRecord {
  // Identity
  record_id: string; // permission_{uuid}
  permission_id: string; // Unique identifier
  name: string; // Display name
  description: string; // Human-readable description

  // Permission Definition
  resource: string; // Resource type (e.g., 'users', 'dashboard')
  action: string; // Action type (e.g., 'read', 'write', 'delete')

  // Scope
  scope: "global" | "app"; // Global or app-specific permission
  app_id?: string; // Required if scope === 'app'

  // Metadata
  is_system_permission: boolean; // Protected from deletion
  created_at: string; // ISO timestamp
  created_by: string; // Creator Microsoft OID
}
```

#### Application Record

```typescript
interface ApplicationRecord {
  record_id: string; // app_{app_id}
  app_id: string; // Unique app identifier
  name: string; // Display name
  description: string; // Description
  url: string; // Application URL
  icon?: string; // Application icon

  // Configuration
  default_role_id?: string; // Default role for new users
  require_explicit_access: boolean; // Require explicit role assignment

  // Metadata
  created_at: string; // ISO timestamp
  created_by: string; // Creator Microsoft OID
  is_active: boolean; // Application status
}
```

## Implementation Plan

### Phase 1: Core Infrastructure

**Duration**: 1-2 weeks

#### 1.1 Type System and Service Layer

```typescript
// src/types/rbac.ts - Complete type definitions
// src/services/rbac/ - Service layer with datastore integration
//   ├── userService.ts
//   ├── roleService.ts
//   ├── permissionService.ts
//   └── applicationService.ts
```

#### 1.2 Datastore Integration

- Extend existing API client with RBAC operations
- Implement Bearer token authentication for all RBAC endpoints
- Create type-safe datastore operations following existing patterns

#### 1.3 System Bootstrap

```typescript
// Bootstrap process for initial system setup
interface SystemBootstrap {
  createDefaultApplications(): Promise<void>;
  createSystemRoles(): Promise<void>;
  createSystemPermissions(): Promise<void>;
  assignSuperAdmins(): Promise<void>;
}
```

### Phase 2: Authentication Integration

**Duration**: 1 week

#### 2.1 Enhanced AuthContext

```typescript
// Extend existing AuthContext with RBAC capabilities
interface EnhancedAuthContext extends AuthContextType {
  // RBAC State
  userRoles: UserRole[];
  userPermissions: Permission[];
  currentApp: string;

  // RBAC Methods
  checkPermission(resource: string, action: string, appId?: string): boolean;
  switchApplication(appId: string): Promise<void>;
  refreshPermissions(): Promise<void>;
}
```

#### 2.2 User Provisioning Enhancement

- Extend existing user provisioning to include RBAC setup
- Auto-assign default roles based on application configuration
- Handle super admin detection via environment variables

#### 2.3 Permission Context

```typescript
// New context for runtime permission checking
const PermissionContext = createContext<{
  hasPermission: (resource: string, action: string, appId?: string) => boolean;
  hasRole: (roleId: string, appId?: string) => boolean;
  isAdmin: (appId?: string) => boolean;
  isSuperAdmin: () => boolean;
}>();
```

### Phase 3: UI Components and Guards

**Duration**: 1-2 weeks

#### 3.1 Permission Hooks

```typescript
// Reusable hooks following existing patterns
export const usePermission = (resource: string, action: string, appId?: string) => boolean;
export const useRole = (roleId: string, appId?: string) => boolean;
export const useUserRoles = (appId?: string) => UserRole[];
export const useApplications = () => Application[];
```

#### 3.2 Guard Components

```typescript
// Permission-based component guards
<PermissionGuard resource="users" action="read" appId="recruitment">
  <UserManagementComponent />
</PermissionGuard>

<RoleGuard roles={['admin', 'super_admin']} appId="recruitment">
  <AdminPanel />
</RoleGuard>

<SuperAdminOnly>
  <SystemConfiguration />
</SuperAdminOnly>
```

#### 3.3 Enhanced Navigation

```typescript
// Extend existing AppNavigation with permission-aware menu items
interface NavigationItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  requiredPermission?: {
    resource: string;
    action: string;
    appId?: string;
  };
  requiredRole?: string[];
}
```

### Phase 4: Admin Interface

**Duration**: 2-3 weeks

#### 4.1 User Management

- User listing with role assignments across applications
- Role assignment/removal interface
- Application access management
- User status management (active/inactive/suspended)

#### 4.2 Role Management

- Create/edit/delete roles (respecting system role protection)
- Permission assignment interface with visual permission tree
- Role usage analytics and impact analysis
- Role templates for common use cases

#### 4.3 Application Management

- Register new applications in the system
- Configure default roles and permissions per application
- Application-specific role and permission management
- Cross-application role mapping

#### 4.4 Permission Management

- View all system and application permissions
- Create custom permissions for specific use cases
- Permission usage tracking and analytics
- Bulk permission operations

### Phase 5: Advanced Features

**Duration**: 2-4 weeks (optional)

#### 5.1 Multi-Application Dashboard

```typescript
// Enhanced dashboard showing user's access across applications
interface MultiAppDashboard {
  applications: ApplicationAccess[];
  recentActivity: AuditLogEntry[];
  rolesSummary: RoleSummary[];
  permissionUsage: PermissionUsage[];
}
```

#### 5.2 Audit Trail System

- Track all RBAC changes with full audit trail
- Permission usage analytics
- Security event monitoring
- Compliance reporting

#### 5.3 Advanced Permission Features

- Context-aware permissions (e.g., "edit own profile")
- Temporary role assignments with expiration
- Conditional permissions based on data attributes
- API rate limiting based on roles

## System Permissions Structure

### Global System Permissions

```typescript
const GLOBAL_PERMISSIONS = {
  // System Administration
  "system.admin": "Full system administration",
  "system.users.read": "View all users across applications",
  "system.users.write": "Manage users across applications",
  "system.roles.read": "View all roles",
  "system.roles.write": "Manage system roles",
  "system.permissions.read": "View all permissions",
  "system.permissions.write": "Create custom permissions",
  "system.applications.read": "View registered applications",
  "system.applications.write": "Register and manage applications",

  // Audit and Monitoring
  "system.audit.read": "View audit logs",
  "system.monitoring.read": "View system monitoring data",
} as const;
```

### Application-Scoped Permissions

```typescript
// Pattern: {app_id}.{resource}.{action}
const APP_PERMISSION_PATTERN = {
  // Resource Management
  "{app_id}.dashboard.read": "View application dashboard",
  "{app_id}.dashboard.write": "Modify application dashboard",

  // Data Operations
  "{app_id}.data.read": "Read application data",
  "{app_id}.data.write": "Create/update application data",
  "{app_id}.data.delete": "Delete application data",

  // Application Administration
  "{app_id}.admin.users": "Manage app users",
  "{app_id}.admin.settings": "Manage app settings",
} as const;
```

### Default Role Structure

```typescript
const SYSTEM_ROLES = {
  // Global Roles
  super_admin: {
    name: "Super Administrator",
    scope: "global",
    permissions: ["system.*"], // Wildcard for all permissions
    description: "Full system access across all applications",
  },

  system_admin: {
    name: "System Administrator",
    scope: "global",
    permissions: ["system.users.*", "system.roles.*", "system.applications.*"],
    description: "System administration without super admin privileges",
  },

  // Application Roles (template - instantiated per app)
  app_admin: {
    name: "Application Administrator",
    scope: "app",
    permissions: ["{app_id}.admin.*", "{app_id}.data.*"],
    description: "Full administration within a specific application",
  },

  app_editor: {
    name: "Application Editor",
    scope: "app",
    permissions: ["{app_id}.data.read", "{app_id}.data.write", "{app_id}.dashboard.read"],
    description: "Create and edit content within a specific application",
  },

  app_viewer: {
    name: "Application Viewer",
    scope: "app",
    permissions: ["{app_id}.data.read", "{app_id}.dashboard.read"],
    description: "Read-only access to a specific application",
  },
} as const;
```

## Integration with Application Template

### Enhanced API Client

```typescript
// Extend existing API client with RBAC operations
class APIClient {
  // Existing methods...

  // RBAC Methods
  async getUserRoles(userId: string): Promise<UserRole[]>;
  async assignUserRole(userId: string, roleId: string, appId?: string): Promise<void>;
  async createRole(role: CreateRoleRequest): Promise<Role>;
  async getPermissions(appId?: string): Promise<Permission[]>;
  async checkPermission(resource: string, action: string, appId?: string): Promise<boolean>;
}
```

### Enhanced Dashboard Components

```typescript
// Permission-aware dashboard components
export const ProtectedStatCard: React.FC<StatCardProps & {
  requiredPermission: { resource: string; action: string; }
}> = ({ requiredPermission, ...props }) => {
  const hasPermission = usePermission(
    requiredPermission.resource,
    requiredPermission.action
  );

  if (!hasPermission) return null;
  return <StatCard {...props} />;
};
```

### Enhanced Navigation

```typescript
// Permission-aware navigation items
const getNavigationItems = (userPermissions: Permission[]): NavigationItem[] => {
  return [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: 'Dashboard',
      requiredPermission: { resource: 'dashboard', action: 'read' }
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'User Management',
      requiredPermission: { resource: 'users', action: 'read' }
    },
    // Only visible to system admins
    {
      key: '/system',
      icon: <SettingOutlined />,
      label: 'System Administration',
      requiredRole: ['super_admin', 'system_admin']
    }
  ].filter(item => checkNavigationAccess(item, userPermissions));
};
```

## Security Implementation

### Token-Based Authentication

- All RBAC operations require valid Microsoft Bearer token
- Token validation on every permission check
- Automatic token refresh integration with existing auth flow

### Permission Checking Strategy

```typescript
// Server-side permission verification (when possible)
const verifyPermission = async (
  token: string,
  resource: string,
  action: string,
  appId?: string
): Promise<boolean> => {
  // 1. Validate token with Microsoft
  // 2. Fetch user from datastore
  // 3. Resolve user roles and permissions
  // 4. Check specific permission
  // 5. Log access attempt for audit
};

// Client-side permission caching (for UX)
const PermissionCache = {
  getUserPermissions: (userId: string) => Permission[],
  invalidateUser: (userId: string) => void,
  invalidateAll: () => void
};
```

### Data Protection

- All sensitive RBAC data encrypted in datastore
- Audit trail for all permission changes
- No client-side storage of permission data
- Rate limiting on permission checking APIs

## Environment Configuration

### Required Environment Variables

```bash
# Existing Microsoft Auth
NEXT_PUBLIC_AZURE_CLIENT_ID=your_client_id
NEXT_PUBLIC_AZURE_TENANT_ID=your_tenant_id
NEXT_PUBLIC_API_BASE_URL=your_api_url

# New RBAC Configuration
NEXT_PUBLIC_APP_ID=recruitment_tool
NEXT_PUBLIC_APP_NAME="Recruitment Tool"
NEXT_PUBLIC_SUPER_ADMIN_OIDS=71889cd7-6c37-409f-95d2-eb78283a35a4
NEXT_PUBLIC_DEFAULT_ROLE=app_viewer
NEXT_PUBLIC_AUTO_PROVISION_USERS=true
NEXT_PUBLIC_REQUIRE_EXPLICIT_ACCESS=false

# Optional Advanced Features
NEXT_PUBLIC_ENABLE_AUDIT_LOGGING=true
NEXT_PUBLIC_PERMISSION_CACHE_TTL=300000
NEXT_PUBLIC_MAX_ROLES_PER_USER=10
```

## Migration and Rollout Strategy

### Phase-by-Phase Rollout

1. **Foundation**: Deploy core RBAC services (no UI changes)
2. **Admin Interface**: Enable role management for admins
3. **Permission Guards**: Gradually add permission checks to components
4. **Full Rollout**: Complete migration from existing auth system

### Backward Compatibility

- Maintain existing authentication flow during transition
- Feature flags for gradual RBAC feature enablement
- Fallback to existing permissions if RBAC check fails

### Data Migration

```typescript
// Migration script for existing users
const migrateExistingUsers = async () => {
  // 1. Identify all existing authenticated users
  // 2. Create user records in datastore
  // 3. Assign appropriate default roles
  // 4. Validate migration success
  // 5. Enable RBAC for migrated users
};
```

## Success Criteria

### Functional Requirements

- [ ] Multi-application user identity works across all apps
- [ ] Role and permission management via admin interface
- [ ] Dynamic permission checking with <100ms response time
- [ ] Automatic user provisioning on first login
- [ ] Super admin capabilities properly restricted and audited

### Security Requirements

- [ ] All RBAC operations require valid Bearer token
- [ ] No unauthorized access to protected resources
- [ ] Complete audit trail for all permission changes
- [ ] No privilege escalation vulnerabilities
- [ ] Secure handling of cross-application permissions

### Performance Requirements

- [ ] Permission checks complete in <100ms
- [ ] Admin interfaces load in <2 seconds
- [ ] No degradation in existing authentication flow
- [ ] Efficient caching of user permissions
- [ ] Scalable to 1000+ users across multiple applications

### Usability Requirements

- [ ] Intuitive admin interface following Ant Design patterns
- [ ] Clear permission denied messages with guidance
- [ ] Seamless user experience across applications
- [ ] Easy role assignment and management workflows
- [ ] Comprehensive help documentation and tooltips

This comprehensive RBAC system provides a robust foundation for multi-application access control while maintaining the clean architecture and user experience established in the Application Template.
