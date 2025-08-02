# RBAC Implementation Guide

This document provides a comprehensive guide to the Role-Based Access Control (RBAC) system implementation in the application.

## 🏗️ Architecture Overview

The RBAC system is built on a flexible, hierarchical permission model that supports both global and application-specific access control.

### Core Components

```
Users ← Roles ← Permissions ← Applications
```

- **Users**: Individual accounts authenticated via Microsoft Azure AD
- **Roles**: Collections of permissions that define access levels
- **Permissions**: Granular access rights to specific resources and actions
- **Applications**: Logical groupings for multi-tenant scenarios

## 📋 Data Models

### User Record

```typescript
interface UserRecord {
  record_id: string; // user_{microsoft_oid}
  microsoft_oid: string; // Azure AD unique identifier
  email: string; // User's email address
  name: string; // Display name
  profile_picture?: string; // Base64 or URL

  // RBAC Fields
  global_roles: string[]; // Array of global role IDs
  app_roles: Record<string, string[]>; // App-specific role assignments
  status: "active" | "inactive" | "suspended";
  is_super_admin: boolean; // Bypass all permission checks

  // Timestamps
  created_at: string;
  updated_at: string;
  last_login: string;
}
```

### Role Record

```typescript
interface RoleRecord {
  record_id: string; // role_{role_id}
  role_id: string; // Unique role identifier
  name: string; // Human-readable name
  description: string; // Role description

  // Scope
  scope: "global" | "app"; // Global or application-specific
  app_id?: string; // Required if scope is 'app'

  // Permissions
  permission_ids: string[]; // Array of permission identifiers

  // Metadata
  is_system_role: boolean; // Cannot be deleted
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}
```

### Permission Record

```typescript
interface PermissionRecord {
  record_id: string; // permission_{permission_id}
  permission_id: string; // Unique permission identifier
  name: string; // Human-readable name
  description: string; // Permission description

  // Scope
  scope: "global" | "app"; // Global or application-specific
  app_id?: string; // Required if scope is 'app'

  // Resource and Action
  resource: string; // Entity being accessed
  action: string; // Operation being performed

  // Metadata
  is_system_permission: boolean; // Cannot be deleted
  created_at: string;
  created_by: string;
}
```

### Application Record

```typescript
interface ApplicationRecord {
  record_id: string; // app_{app_id}
  app_id: string; // Unique application identifier
  name: string; // Application name
  description: string; // Application description

  // Configuration
  default_role?: string; // Default role for new users
  auto_provision_users: boolean; // Automatically create users
  require_explicit_access: boolean; // Require explicit permission grants

  // Metadata
  is_active: boolean;
  created_at: string;
  created_by: string;
}
```

## 🔐 Permission System

### Permission Naming Convention

Permissions follow the pattern: `{scope}.{resource}.{action}`

#### Scope

- `system`: Global system permissions
- `{app_id}`: Application-specific permissions (e.g., `recruitment_tool`)

#### Resource

The entity being accessed:

- `users`: User management
- `roles`: Role management
- `permissions`: Permission management
- `applications`: Application management
- `data`: Data access
- `dashboard`: Dashboard access
- `admin`: Administrative functions

#### Action

The operation being performed:

- `read`: View/list resources
- `write`: Create/update resources
- `delete`: Remove resources
- `admin`: Full administrative access
- `*`: Wildcard (all actions)

### Permission Examples

```typescript
// System-level permissions
"system.users.read"; // Read all users
"system.roles.write"; // Create/update system roles
"system.admin.*"; // Full system administration
"system.*"; // Full system access (super admin)

// Application-level permissions
"recruitment_tool.data.read"; // Read recruitment data
"recruitment_tool.users.write"; // Manage app users
"recruitment_tool.admin.*"; // App administration
"recruitment_tool.*"; // Full app access
```

## 👤 User Management

### User Creation and Provisioning

```typescript
import { userService } from "@/services/rbac";

// Create a new user
const newUser = await userService.createUser({
  microsoft_oid: "user-oid-from-azure",
  email: "user@company.com",
  name: "John Doe",
  status: "active",
  global_roles: ["app_viewer"], // Default roles
  app_roles: {
    recruitment_tool: ["candidate_manager"],
  },
});

// Get user by Microsoft OID
const user = await userService.getUser("microsoft-oid");

// Update user
const updatedUser = await userService.updateUser("microsoft-oid", {
  status: "inactive",
  global_roles: ["admin"],
});
```

### User Provisioning Flow

1. User logs in with Microsoft authentication
2. System checks if user exists in RBAC datastore
3. If not exists and auto-provisioning is enabled:
   - Create user record with default role
   - Assign application-specific roles if configured
4. If exists, update last_login timestamp
5. Load user's role and permission data

## 🎭 Role Management

### Creating Roles

```typescript
import { roleService } from "@/services/rbac";

// Create a global role
const globalRole = await roleService.createRole(
  {
    role_id: "global_manager",
    name: "Global Manager",
    description: "Manages users across all applications",
    scope: "global",
    permission_ids: ["system.users.read", "system.users.write", "system.roles.read"],
  },
  "creator-user-oid"
);

// Create an application-specific role
const appRole = await roleService.createRole(
  {
    role_id: "recruitment_admin",
    name: "Recruitment Administrator",
    description: "Full access to recruitment features",
    scope: "app",
    app_id: "recruitment_tool",
    permission_ids: [
      "recruitment_tool.data.read",
      "recruitment_tool.data.write",
      "recruitment_tool.users.read",
    ],
  },
  "creator-user-oid"
);
```

### Default System Roles

```typescript
// System roles created during bootstrap
const systemRoles = [
  {
    role_id: "super_admin",
    name: "Super Administrator",
    scope: "global",
    permission_ids: ["system.*"],
  },
  {
    role_id: "system_admin",
    name: "System Administrator",
    scope: "global",
    permission_ids: ["system.users.*", "system.roles.*", "system.applications.*"],
  },
  {
    role_id: "user_manager",
    name: "User Manager",
    scope: "global",
    permission_ids: ["system.users.read", "system.users.write"],
  },
];
```

### Role Assignment

```typescript
// Assign global role to user
await userService.assignRole({
  user_id: "microsoft-oid",
  role_id: "user_manager",
});

// Assign application-specific role
await userService.assignRole({
  user_id: "microsoft-oid",
  role_id: "recruitment_admin",
  app_id: "recruitment_tool",
});

// Remove role from user
await userService.removeRole({
  user_id: "microsoft-oid",
  role_id: "user_manager",
});
```

## 🔒 Permission Checking

### Server-Side Permission Checking

```typescript
import { apiClient } from "@/services/api";

// Check if user has permission
const permissionResult = await apiClient.checkPermission({
  userId: "microsoft-oid",
  resource: "users",
  action: "write",
  appId: "recruitment_tool", // Optional for app-specific checks
});

if (permissionResult.granted) {
  // User has permission
  console.log(`Permission granted via role: ${permissionResult.sourceRole}`);
} else {
  // Permission denied
  console.log(`Permission denied: ${permissionResult.reason}`);
}
```

### Client-Side Permission Guards

#### Component-Level Guards

```typescript
import { PermissionGuard } from '@/components/guards';

// Protect entire components
<PermissionGuard resource="users" action="write">
  <UserCreateForm />
</PermissionGuard>

// With application scope
<PermissionGuard resource="data" action="read" appId="recruitment_tool">
  <CandidateList />
</PermissionGuard>

// With fallback content
<PermissionGuard
  resource="admin"
  action="read"
  fallback={<div>Access Denied</div>}
  showFallback={true}
>
  <AdminPanel />
</PermissionGuard>
```

#### Route-Level Guards

```typescript
import { AdminOnly, SuperAdminOnly } from '@/components/guards';

// Restrict to admin users
<AdminOnly>
  <AdminDashboard />
</AdminOnly>

// Restrict to super admin users only
<SuperAdminOnly>
  <SystemSettings />
</SuperAdminOnly>
```

#### Hook-Based Permission Checking

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { checkPermission, hasRole } = useAuth();

  // Check specific permission
  const canEditUsers = checkPermission('users', 'write');
  const canViewData = checkPermission('data', 'read', 'recruitment_tool');

  // Check role membership
  const isAdmin = hasRole('admin');
  const isSuperAdmin = hasRole('super_admin');

  return (
    <div>
      {canEditUsers && <EditUserButton />}
      {canViewData && <DataTable />}
      {isAdmin && <AdminMenu />}
    </div>
  );
}
```

## 🚀 System Bootstrap

### Bootstrap Process

The system bootstrap creates essential roles, permissions, and applications:

```typescript
import { bootstrapService } from "@/services/rbac";

// Bootstrap the entire system
const result = await bootstrapService.bootstrapSystem();

if (result.success) {
  console.log("System bootstrapped successfully");
  console.log(`Created ${result.applicationsCreated} applications`);
  console.log(`Created ${result.permissionsCreated} permissions`);
  console.log(`Created ${result.rolesCreated} roles`);
} else {
  console.error("Bootstrap failed:", result.errors);
}
```

### Custom Bootstrap Configuration

```typescript
import { SystemBootstrapConfig } from "@/types/rbac";

const customConfig: SystemBootstrapConfig = {
  applications: [
    {
      app_id: "recruitment_tool",
      name: "Recruitment Tool",
      description: "Candidate and job management system",
      default_role: "app_viewer",
      auto_provision_users: true,
      require_explicit_access: false,
    },
  ],
  permissions: [
    {
      permission_id: "recruitment_tool.candidates.read",
      name: "View Candidates",
      description: "View candidate profiles and applications",
      scope: "app",
      app_id: "recruitment_tool",
      resource: "candidates",
      action: "read",
    },
    // ... more permissions
  ],
  roles: [
    {
      role_id: "hr_manager",
      name: "HR Manager",
      description: "Manages recruitment process",
      scope: "app",
      app_id: "recruitment_tool",
      permission_ids: [
        "recruitment_tool.candidates.read",
        "recruitment_tool.candidates.write",
        "recruitment_tool.jobs.read",
      ],
    },
  ],
  superAdminOids: ["azure-oid-of-initial-admin"],
};

await bootstrapService.bootstrapSystem(customConfig);
```

## 🔧 Navigation Integration

### Menu Filtering

The navigation system automatically filters menu items based on user permissions:

```typescript
// Menu items are defined with required permissions
const menuItems: NavigationItem[] = [
  {
    key: '/dashboard',
    label: 'Dashboard',
    icon: <HomeOutlined />,
    requiredPermission: {
      resource: 'dashboard',
      action: 'read'
    }
  },
  {
    key: '/admin',
    label: 'Administration',
    icon: <SettingOutlined />,
    requiredPermission: {
      resource: 'admin',
      action: 'read'
    },
    children: [
      {
        key: '/admin/users',
        label: 'User Management',
        requiredPermission: {
          resource: 'users',
          action: 'read'
        }
      }
    ]
  }
];
```

### Permission-Based Rendering

```typescript
import { usePermissionFilter } from '@/hooks/usePermissions';

function Navigation() {
  const visibleMenuItems = usePermissionFilter(allMenuItems);

  return (
    <Menu items={visibleMenuItems} />
  );
}
```

## 🛡️ Security Considerations

### Super Admin Bypass

Super administrators bypass all permission checks:

```typescript
// In permission checking logic
if (user.is_super_admin) {
  return { granted: true, reason: "Super admin access" };
}
```

### Token-Based Authentication

- JWT tokens are exchanged with backend after Microsoft authentication
- Tokens are stored in localStorage with automatic refresh
- API calls include Authorization header with Bearer token

### Permission Caching

- User permissions are loaded once during login
- Cached in React context for performance
- Refreshed when roles change

### Audit Logging

```typescript
// Log security-relevant actions
await apiClient.createAuditLog({
  userId: "microsoft-oid",
  action: "role_assigned",
  resourceType: "user",
  resourceId: "target-user-oid",
  details: {
    roleId: "admin",
    assignedBy: "assigner-oid",
  },
});
```

## 🧪 Testing RBAC

### Unit Testing Permissions

```typescript
// Mock user with specific permissions
const mockUser = {
  microsoft_oid: "test-user",
  global_roles: ["user_manager"],
  app_roles: { recruitment_tool: ["hr_manager"] },
  is_super_admin: false,
};

// Test permission checking
const canEditUsers = checkUserPermission(mockUser, "users", "write");
expect(canEditUsers).toBe(true);
```

### Integration Testing

```typescript
// Test role assignment workflow
test("assign role to user", async () => {
  const user = await userService.createUser(testUserData);

  await userService.assignRole({
    user_id: user.microsoft_oid,
    role_id: "admin",
  });

  const updatedUser = await userService.getUser(user.microsoft_oid);
  expect(updatedUser.global_roles).toContain("admin");
});
```

## 📊 Monitoring and Analytics

### System Health Checks

```typescript
const health = await bootstrapService.getSystemHealth();

console.log(`System healthy: ${health.healthy}`);
console.log(`Users: ${health.userCount}`);
console.log(`Roles: ${health.roleCount}`);
console.log(`Permissions: ${health.permissionCount}`);
```

### Permission Usage Analytics

```typescript
// Track permission usage for optimization
const auditLogs = await apiClient.getAuditLogs({
  action: "permission_check",
  startDate: "2024-01-01",
  endDate: "2024-12-31",
});

// Analyze most-used permissions
const permissionStats = analyzePermissionUsage(auditLogs);
```

## 🔄 Migration and Updates

### Role Migration

```typescript
// Migrate users from old role to new role
const usersWithOldRole = await apiClient.getAllUsers();
const usersToMigrate = usersWithOldRole.filter((user) => user.global_roles.includes("old_role_id"));

for (const user of usersToMigrate) {
  await userService.removeRole({
    user_id: user.microsoft_oid,
    role_id: "old_role_id",
  });

  await userService.assignRole({
    user_id: user.microsoft_oid,
    role_id: "new_role_id",
  });
}
```

### Permission Updates

```typescript
// Update role permissions
await roleService.updateRole(
  "role_id",
  {
    permission_ids: [...existingPermissions, "new_permission_id"],
  },
  "updater-oid"
);
```

## 🚨 Troubleshooting

### Common Issues

#### Permission Denied Errors

1. Check user's role assignments
2. Verify role has required permissions
3. Confirm permission IDs match exactly
4. Check if user is active

#### Bootstrap Failures

1. Verify datastore connectivity
2. Check for existing conflicting data
3. Ensure proper authentication tokens
4. Review error logs for specific failures

#### Navigation Issues

1. Clear localStorage to reset cached permissions
2. Check console for permission check errors
3. Verify menu item permission requirements
4. Confirm user has required roles

This comprehensive guide covers the complete RBAC implementation. For additional details, refer to the source code in `src/services/rbac/` and type definitions in `src/types/rbac.ts`.
