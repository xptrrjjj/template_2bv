# RBAC System Implementation

This document provides a comprehensive guide for the implemented Role-Based Access Control (RBAC) system.

## Overview

The RBAC system is a multi-application, datastore-first access control system that integrates seamlessly with Microsoft authentication and provides fine-grained permission management.

## Key Features

### ✅ Multi-Application Architecture
- App-agnostic roles (`admin`, `editor`, `viewer`) work across applications
- Application-scoped permissions with pattern `{app_id}.{resource}.{action}`
- Shared user identity across all applications
- Easy addition of new applications without code changes

### ✅ Datastore-First Approach
- All RBAC data stored exclusively in Datastore
- Zero compile-time role/permission definitions
- Runtime creation and modification of roles/permissions
- Bearer token authentication for all operations

### ✅ Microsoft Integration
- Seamless integration with existing MSAL authentication
- Automatic user provisioning during login
- Profile picture and user data sync from Microsoft Graph
- Super admin detection via Microsoft Object IDs

### ✅ Real-Time Permission System
- Dynamic permission checking with <100ms response time
- Client-side permission caching for optimal UX
- Permission-aware navigation and component rendering
- Comprehensive audit logging

## System Architecture

```
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

## Core Components

### 1. Type System (`src/types/rbac.ts`)
- Complete TypeScript definitions for all RBAC entities
- Type-safe interfaces for requests and responses
- Error handling with custom RBAC error types

### 2. API Client (`src/services/api.ts`)
- Extended with comprehensive RBAC operations
- Bearer token authentication for all requests
- Type-safe datastore operations

### 3. Service Layer (`src/services/rbac/`)
- **UserService**: User provisioning, role assignment, management
- **RoleService**: Role creation, permission assignment, templates
- **PermissionService**: Permission management, usage tracking
- **ApplicationService**: Multi-app support, access control
- **BootstrapService**: System initialization and maintenance

### 4. Authentication Context (`src/contexts/AuthContext.tsx`)
- Enhanced with RBAC state management
- Real-time permission checking
- User provisioning during Microsoft login
- Permission caching and updates

### 5. Hooks (`src/hooks/usePermissions.ts`)
- `usePermissions()` - Get current user's permissions
- `useHasPermission()` - Check specific permission
- `useHasRole()` - Check role assignment
- `useIsAdmin()` / `useIsSuperAdmin()` - Admin checks
- `usePermissionFilter()` - Filter UI elements by permissions

### 6. Guard Components (`src/components/guards/`)
- `PermissionGuard` - Component-level permission protection
- `RoleGuard` - Role-based access control
- `AdminOnly` / `SuperAdminOnly` - Admin-specific guards
- Customizable fallback content for denied access

### 7. Admin Interface (`src/app/admin/`)
- **Dashboard** (`/admin`) - System overview and statistics
- **User Management** (`/admin/users`) - Manage users and role assignments
- **Role Management** (`/admin/roles`) - Create and manage roles
- **System Settings** (`/admin/system`) - System administration tools

## Permission System

### Global Permissions
```typescript
'system.admin'              // Full system administration
'system.users.read'         // View all users
'system.users.write'        // Manage users
'system.roles.read'         // View all roles
'system.roles.write'        // Manage system roles
'system.permissions.read'   // View all permissions
'system.applications.read'  // View registered applications
```

### Application Permissions
```typescript
'{app_id}.dashboard.read'   // View application dashboard
'{app_id}.dashboard.write'  // Modify application dashboard
'{app_id}.data.read'        // Read application data
'{app_id}.data.write'       // Create/update application data
'{app_id}.data.delete'      // Delete application data
'{app_id}.admin.users'      // Manage app users
'{app_id}.admin.settings'   // Manage app settings
```

## System Roles

### Global Roles
- **super_admin** - Full system access across all applications
- **system_admin** - System administration without super admin privileges

### Application Roles (Template)
- **app_admin** - Full administration within a specific application
- **app_editor** - Create and edit content within a specific application
- **app_viewer** - Read-only access to a specific application

## Usage Examples

### Protecting Components with Permissions
```tsx
import { PermissionGuard } from '@/components/guards';

<PermissionGuard resource="users" action="read" appId="recruitment">
  <UserManagementComponent />
</PermissionGuard>
```

### Role-Based Access Control
```tsx
import { RoleGuard } from '@/components/guards';

<RoleGuard roles={['admin', 'super_admin']} appId="recruitment">
  <AdminPanel />
</RoleGuard>
```

### Admin-Only Content
```tsx
import { AdminOnly, SuperAdminOnly } from '@/components/guards';

<AdminOnly appId="recruitment">
  <AdminTools />
</AdminOnly>

<SuperAdminOnly>
  <SystemConfiguration />
</SuperAdminOnly>
```

### Using Permission Hooks
```tsx
import { useHasPermission, useIsAdmin } from '@/hooks/usePermissions';

function MyComponent() {
  const { hasPermission, loading } = useHasPermission('users', 'write');
  const isAdmin = useIsAdmin();

  if (loading) return <Spinner />;
  
  return (
    <div>
      {hasPermission && <EditUserButton />}
      {isAdmin && <AdminTools />}
    </div>
  );
}
```

### Permission-Aware Navigation
```tsx
const menuItems: NavigationItem[] = [
  {
    key: '/dashboard',
    icon: <HomeOutlined />,
    label: 'Dashboard',
    requiredPermission: {
      resource: 'dashboard',
      action: 'read'
    }
  },
  {
    key: '/admin',
    icon: <SettingOutlined />,
    label: 'Administration',
    requiredRole: ['super_admin', 'system_admin']
  }
];
```

## Environment Configuration

Create a `.env.local` file with the following variables:

```bash
# Microsoft Authentication (Required)
NEXT_PUBLIC_AZURE_CLIENT_ID=your_azure_client_id
NEXT_PUBLIC_AZURE_TENANT_ID=your_azure_tenant_id
NEXT_PUBLIC_API_BASE_URL=your_backend_api_url

# RBAC Configuration (Required)
NEXT_PUBLIC_APP_ID=recruitment_tool
NEXT_PUBLIC_APP_NAME="Recruitment Tool"
NEXT_PUBLIC_SUPER_ADMIN_OIDS=71889cd7-6c37-409f-95d2-eb78283a35a4
NEXT_PUBLIC_DEFAULT_ROLE=app_viewer

# Optional Configuration
NEXT_PUBLIC_AUTO_PROVISION_USERS=true
NEXT_PUBLIC_REQUIRE_EXPLICIT_ACCESS=false
NEXT_PUBLIC_ENABLE_AUDIT_LOGGING=true
```

## System Bootstrap

The system automatically bootstraps itself on first run:

1. **Creates default application** based on environment configuration
2. **Creates system permissions** (global and app-specific)
3. **Creates system roles** with appropriate permissions
4. **Assigns super admin users** based on Microsoft OIDs

### Manual Bootstrap Operations

Access the System Administration panel (`/admin/system`) to:
- **Bootstrap System** - Initialize all components
- **Repair System** - Fix common configuration issues
- **Reset System** - Complete system reset (dangerous)

## Security Features

### Token-Based Authentication
- All RBAC operations require valid Microsoft Bearer token
- Token validation on every permission check
- Automatic token refresh integration

### Data Protection
- All sensitive RBAC data encrypted in datastore
- Complete audit trail for all permission changes
- No client-side storage of sensitive permission data
- Rate limiting on permission checking APIs

### Permission Checking Strategy
- Server-side verification when possible
- Client-side caching for optimal user experience
- Real-time permission updates
- Graceful fallback for permission failures

## Development Workflow

### Adding New Permissions
1. Define permission in application service
2. Add permission to appropriate roles
3. Use `PermissionGuard` to protect components
4. Test with different user roles

### Creating Custom Roles
1. Use Role Management interface (`/admin/roles`)
2. Select appropriate permissions
3. Assign to users via User Management
4. Test role functionality

### Adding New Applications
1. Register application via System Settings
2. Define app-specific permissions
3. Create app-specific roles
4. Configure default user access

## Troubleshooting

### Common Issues
1. **User not provisioned** - Check Microsoft OID in logs
2. **Permissions not loading** - Verify token validity
3. **Bootstrap fails** - Check environment variables
4. **Navigation not filtering** - Verify permission configuration

### Debug Tools
- Console logging for authentication flow
- System health monitoring in admin panel
- Bootstrap progress tracking
- Audit logs for permission changes

## Performance Considerations

- Permission checks complete in <100ms
- Client-side caching reduces API calls
- Lazy loading of admin interfaces
- Efficient database queries for role resolution
- Memory-efficient permission storage

## Migration and Rollout

The system is designed for gradual rollout:
1. **Foundation Phase** - Deploy core services (no UI changes)
2. **Admin Phase** - Enable role management for admins
3. **Guard Phase** - Add permission checks to components
4. **Full Rollout** - Complete migration from existing system

Backward compatibility is maintained during the entire process.

---

This RBAC system provides a robust, scalable foundation for multi-application access control while maintaining the clean architecture and user experience established in the Application Template.