// RBAC Type Definitions for Multi-Application Access Control System

/**
 * User Record - Stored in datastore as the primary user identity
 */
export interface UserRecord {
  // Identity
  record_id: string;              // user_{microsoft_oid}
  microsoft_oid: string;          // Microsoft Object ID (primary key)
  email: string;                  // Microsoft email
  name: string;                   // Microsoft display name
  
  // RBAC Data
  global_roles: string[];         // Global role IDs
  app_roles: Record<string, string[]>; // App-specific role IDs {app_id: role_ids[]}
  
  // Metadata
  created_at: string;             // ISO timestamp
  updated_at: string;             // ISO timestamp
  last_login: string;             // ISO timestamp
  status: UserStatus;
  
  // System
  is_super_admin: boolean;        // Global super admin flag
  profile_picture?: string;       // Microsoft Graph profile picture
}

/**
 * Role Record - Defines roles that can be assigned to users
 */
export interface RoleRecord {
  // Identity
  record_id: string;              // role_{uuid}
  role_id: string;                // Unique identifier (e.g., 'admin', 'editor')
  name: string;                   // Display name
  description: string;            // Human-readable description
  
  // Scope
  scope: RoleScope;               // Global or app-specific role
  app_id?: string;                // Required if scope === 'app'
  
  // Permissions
  permission_ids: string[];       // Assigned permission IDs
  
  // Metadata
  is_system_role: boolean;        // Protected from deletion
  created_at: string;             // ISO timestamp
  created_by: string;             // Creator Microsoft OID
  updated_at: string;             // ISO timestamp
  updated_by: string;             // Last modifier Microsoft OID
}

/**
 * Permission Record - Individual permissions that can be granted
 */
export interface PermissionRecord {
  // Identity
  record_id: string;              // permission_{uuid}
  permission_id: string;          // Unique identifier
  name: string;                   // Display name
  description: string;            // Human-readable description
  
  // Permission Definition
  resource: string;               // Resource type (e.g., 'users', 'dashboard')
  action: string;                 // Action type (e.g., 'read', 'write', 'delete')
  
  // Scope
  scope: PermissionScope;         // Global or app-specific permission
  app_id?: string;                // Required if scope === 'app'
  
  // Metadata
  is_system_permission: boolean;  // Protected from deletion
  created_at: string;             // ISO timestamp
  created_by: string;             // Creator Microsoft OID
}

/**
 * Application Record - Registered applications in the system
 */
export interface ApplicationRecord {
  record_id: string;              // app_{app_id}
  app_id: string;                 // Unique app identifier
  name: string;                   // Display name
  description: string;            // Description
  url: string;                    // Application URL
  icon?: string;                  // Application icon
  
  // Configuration
  default_role_id?: string;       // Default role for new users
  require_explicit_access: boolean; // Require explicit role assignment
  
  // Metadata
  created_at: string;             // ISO timestamp
  created_by: string;             // Creator Microsoft OID
  is_active: boolean;             // Application status
}

// Enums and Constants

export type UserStatus = 'active' | 'inactive' | 'suspended';
export type RoleScope = 'global' | 'app';
export type PermissionScope = 'global' | 'app';

/**
 * Built-in system permissions
 */
export const GLOBAL_PERMISSIONS = {
  // System Administration
  'system.admin': 'Full system administration',
  'system.users.read': 'View all users across applications',
  'system.users.write': 'Manage users across applications',
  'system.roles.read': 'View all roles',
  'system.roles.write': 'Manage system roles',
  'system.permissions.read': 'View all permissions',
  'system.permissions.write': 'Create custom permissions',
  'system.applications.read': 'View registered applications',
  'system.applications.write': 'Register and manage applications',
  
  // Audit and Monitoring
  'system.audit.read': 'View audit logs',
  'system.monitoring.read': 'View system monitoring data',
} as const;

/**
 * Application permission patterns
 */
export const APP_PERMISSION_PATTERNS = {
  // Resource Management
  'dashboard.read': 'View application dashboard',
  'dashboard.write': 'Modify application dashboard',
  
  // Data Operations
  'data.read': 'Read application data',
  'data.write': 'Create/update application data',
  'data.delete': 'Delete application data',
  
  // Application Administration
  'admin.users': 'Manage app users',
  'admin.settings': 'Manage app settings',
} as const;

/**
 * System role definitions
 */
export const SYSTEM_ROLES = {
  // Global Roles
  super_admin: {
    name: 'Super Administrator',
    scope: 'global' as const,
    permissions: ['system.*'], // Wildcard for all permissions
    description: 'Full system access across all applications'
  },
  
  system_admin: {
    name: 'System Administrator', 
    scope: 'global' as const,
    permissions: [
      'system.users.*',
      'system.roles.*',
      'system.applications.*'
    ],
    description: 'System administration without super admin privileges'
  },
  
  // Application Roles (template - instantiated per app)
  app_admin: {
    name: 'Application Administrator',
    scope: 'app' as const,
    permissions: ['{app_id}.admin.*', '{app_id}.data.*'],
    description: 'Full administration within a specific application'
  },
  
  app_editor: {
    name: 'Application Editor',
    scope: 'app' as const, 
    permissions: ['{app_id}.data.read', '{app_id}.data.write', '{app_id}.dashboard.read'],
    description: 'Create and edit content within a specific application'
  },
  
  app_viewer: {
    name: 'Application Viewer',
    scope: 'app' as const,
    permissions: ['{app_id}.data.read', '{app_id}.dashboard.read'],
    description: 'Read-only access to a specific application'
  }
} as const;

// Service Request/Response Types

/**
 * Request to create a new role
 */
export interface CreateRoleRequest {
  role_id: string;
  name: string;
  description: string;
  scope: RoleScope;
  app_id?: string;
  permission_ids: string[];
}

/**
 * Request to update an existing role
 */
export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permission_ids?: string[];
}

/**
 * Request to create a new permission
 */
export interface CreatePermissionRequest {
  permission_id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  scope: PermissionScope;
  app_id?: string;
}

/**
 * Request to create a new application
 */
export interface CreateApplicationRequest {
  app_id: string;
  name: string;
  description: string;
  url: string;
  icon?: string;
  default_role_id?: string;
  require_explicit_access: boolean;
}

/**
 * Request to assign roles to a user
 */
export interface AssignUserRoleRequest {
  user_id: string;
  role_id: string;
  app_id?: string;
}

/**
 * Request to remove roles from a user
 */
export interface RemoveUserRoleRequest {
  user_id: string;
  role_id: string;
  app_id?: string;
}

// Resolved Types (for UI consumption)

/**
 * User with resolved role and permission information
 */
export interface ResolvedUser {
  user: UserRecord;
  globalRoles: RoleRecord[];
  appRoles: Record<string, RoleRecord[]>;
  allPermissions: ResolvedPermission[];
}

/**
 * Role with resolved permission information
 */
export interface ResolvedRole {
  role: RoleRecord;
  permissions: PermissionRecord[];
  userCount: number;
}

/**
 * Permission with contextual information
 */
export interface ResolvedPermission {
  permission: PermissionRecord;
  sourceRoles: RoleRecord[];
  isInherited: boolean;
}

/**
 * Application with role and user statistics
 */
export interface ResolvedApplication {
  application: ApplicationRecord;
  roleCount: number;
  userCount: number;
  defaultRole?: RoleRecord;
}

// Permission Checking Types

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;
  sourceRole?: string;
}

/**
 * Permission context for checking
 */
export interface PermissionContext {
  userId: string;
  appId?: string;
  resource: string;
  action: string;
}

// Navigation Types

/**
 * Navigation item with permission requirements
 */
export interface NavigationItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  requiredPermission?: {
    resource: string;
    action: string;
    appId?: string;
  };
  requiredRole?: string[];
  children?: NavigationItem[];
}

// Audit Types

/**
 * Audit log entry for RBAC operations
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  action: AuditAction;
  resource_type: AuditResourceType;
  resource_id: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'assign' 
  | 'revoke' 
  | 'login' 
  | 'permission_check';

export type AuditResourceType = 
  | 'user' 
  | 'role' 
  | 'permission' 
  | 'application' 
  | 'role_assignment';

// Bootstrap Types

/**
 * System bootstrap configuration
 */
export interface SystemBootstrapConfig {
  applications: CreateApplicationRequest[];
  permissions: CreatePermissionRequest[];
  roles: CreateRoleRequest[];
  superAdminOids: string[];
}

/**
 * Bootstrap result
 */
export interface BootstrapResult {
  success: boolean;
  applicationsCreated: number;
  permissionsCreated: number;
  rolesCreated: number;
  superAdminsAssigned: number;
  errors: string[];
}

// Error Types

/**
 * RBAC-specific error types
 */
export class RBACError extends Error {
  constructor(
    message: string,
    public code: RBACErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'RBACError';
  }
}

export enum RBACErrorCode {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  ROLE_NOT_FOUND = 'ROLE_NOT_FOUND',
  PERMISSION_NOT_FOUND = 'PERMISSION_NOT_FOUND',
  APPLICATION_NOT_FOUND = 'APPLICATION_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_SCOPE = 'INVALID_SCOPE',
  SYSTEM_ROLE_PROTECTED = 'SYSTEM_ROLE_PROTECTED',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  DUPLICATE_IDENTIFIER = 'DUPLICATE_IDENTIFIER',
  INVALID_TOKEN = 'INVALID_TOKEN',
  BOOTSTRAP_FAILED = 'BOOTSTRAP_FAILED'
}

// Utility Types

/**
 * Deep partial type for updates
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Permission wildcard matcher
 */
export type PermissionPattern = string | RegExp;

/**
 * Role assignment summary
 */
export interface RoleAssignmentSummary {
  userId: string;
  userName: string;
  globalRoles: string[];
  appRoles: Record<string, string[]>;
  totalPermissions: number;
  lastUpdated: string;
}

/**
 * Permission usage statistics
 */
export interface PermissionUsageStats {
  permissionId: string;
  usageCount: number;
  userCount: number;
  roleCount: number;
  lastUsed: string;
}

/**
 * System health check result
 */
export interface SystemHealthCheck {
  healthy: boolean;
  userCount: number;
  roleCount: number;
  permissionCount: number;
  applicationCount: number;
  lastBootstrap?: string;
  issues: string[];
}