// RBAC Service Barrel Exports

export { UserService, userService } from './userService';
export { RoleService, roleService } from './roleService';
export { PermissionService, permissionService } from './permissionService';
export { ApplicationService, applicationService } from './applicationService';
export { BootstrapService, bootstrapService } from './bootstrapService';

// Re-export types for convenience
export type {
  UserRecord,
  RoleRecord,
  PermissionRecord,
  ApplicationRecord,
  CreateRoleRequest,
  UpdateRoleRequest,
  CreatePermissionRequest,
  CreateApplicationRequest,
  AssignUserRoleRequest,
  RemoveUserRoleRequest,
  ResolvedUser,
  ResolvedRole,
  ResolvedApplication,
  PermissionCheckResult,
  PermissionContext,
  AuditLogEntry,
  BootstrapResult,
  SystemBootstrapConfig,
  SystemHealthCheck,
  RBACError,
  RBACErrorCode
} from '@/types/rbac';