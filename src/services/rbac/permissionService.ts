import { apiClient } from "../api";
import {
  PermissionRecord,
  CreatePermissionRequest,
  PermissionContext,
  PermissionCheckResult,
  GLOBAL_PERMISSIONS,
  APP_PERMISSION_PATTERNS,
  RBACError,
  RBACErrorCode,
} from "@/types/rbac";

/**
 * Permission Service - Handles all permission-related RBAC operations
 */
export class PermissionService {
  /**
   * Get permission by ID
   */
  async getPermission(permissionId: string): Promise<PermissionRecord | null> {
    return apiClient.getPermission(permissionId);
  }

  /**
   * Create new permission
   */
  async createPermission(
    permissionRequest: CreatePermissionRequest,
    createdBy: string
  ): Promise<PermissionRecord> {
    const permission = await apiClient.createPermission(permissionRequest, createdBy);

    // Create audit log
    await apiClient.createAuditLog({
      user_id: createdBy,
      action: "create",
      resource_type: "permission",
      resource_id: permission.permission_id,
      details: {
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        scope: permission.scope,
        appId: permission.app_id,
        action_type: "permission_created",
      },
    });

    return permission;
  }

  /**
   * Delete permission
   */
  async deletePermission(permissionId: string, deletedBy: string): Promise<void> {
    const permission = await this.getPermission(permissionId);
    if (!permission) {
      throw new RBACError("Permission not found", RBACErrorCode.PERMISSION_NOT_FOUND);
    }

    if (permission.is_system_permission) {
      throw new RBACError("Cannot delete system permission", RBACErrorCode.SYSTEM_ROLE_PROTECTED);
    }

    // Check if any roles use this permission
    const allRoles = await apiClient.getAllRoles();
    const rolesWithPermission = allRoles.filter((role) =>
      role.permission_ids.includes(permissionId)
    );

    if (rolesWithPermission.length > 0) {
      throw new RBACError(
        `Cannot delete permission: ${rolesWithPermission.length} roles still use this permission`,
        RBACErrorCode.PERMISSION_DENIED,
        { roleCount: rolesWithPermission.length, roles: rolesWithPermission.map((r) => r.role_id) }
      );
    }

    await apiClient.deletePermission(permissionId, deletedBy);

    // Create audit log
    await apiClient.createAuditLog({
      user_id: deletedBy,
      action: "delete",
      resource_type: "permission",
      resource_id: permissionId,
      details: {
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        action_type: "permission_deleted",
      },
    });
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<PermissionRecord[]> {
    return apiClient.getAllPermissions();
  }

  /**
   * Get permissions by scope
   */
  async getPermissionsByScope(
    scope: PermissionRecord["scope"],
    appId?: string
  ): Promise<PermissionRecord[]> {
    return apiClient.getPermissionsByScope(scope, appId);
  }

  /**
   * Get global permissions
   */
  async getGlobalPermissions(): Promise<PermissionRecord[]> {
    return this.getPermissionsByScope("global");
  }

  /**
   * Get app-specific permissions
   */
  async getAppPermissions(appId: string): Promise<PermissionRecord[]> {
    return this.getPermissionsByScope("app", appId);
  }

  /**
   * Get system permissions (non-modifiable)
   */
  async getSystemPermissions(): Promise<PermissionRecord[]> {
    const allPermissions = await this.getAllPermissions();
    return allPermissions.filter((permission) => permission.is_system_permission);
  }

  /**
   * Get custom permissions (user-created)
   */
  async getCustomPermissions(): Promise<PermissionRecord[]> {
    const allPermissions = await this.getAllPermissions();
    return allPermissions.filter((permission) => !permission.is_system_permission);
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(context: PermissionContext): Promise<PermissionCheckResult> {
    const result = await apiClient.checkPermission(context);

    // Create audit log for permission check
    await apiClient.createAuditLog({
      user_id: context.userId,
      action: "permission_check",
      resource_type: "permission",
      resource_id: `${context.resource}.${context.action}`,
      details: {
        resource: context.resource,
        action: context.action,
        appId: context.appId,
        granted: result.granted,
        reason: result.reason,
        sourceRole: result.sourceRole,
      },
    });

    return result;
  }

  /**
   * Get permissions by resource type
   */
  async getPermissionsByResource(resource: string, appId?: string): Promise<PermissionRecord[]> {
    const allPermissions = await this.getAllPermissions();
    return allPermissions.filter((permission) => {
      if (permission.resource !== resource) return false;
      if (appId && permission.scope === "app" && permission.app_id !== appId) return false;
      return true;
    });
  }

  /**
   * Get permissions by action type
   */
  async getPermissionsByAction(action: string, appId?: string): Promise<PermissionRecord[]> {
    const allPermissions = await this.getAllPermissions();
    return allPermissions.filter((permission) => {
      if (permission.action !== action) return false;
      if (appId && permission.scope === "app" && permission.app_id !== appId) return false;
      return true;
    });
  }

  /**
   * Generate permission ID from components
   */
  generatePermissionId(resource: string, action: string, appId?: string): string {
    if (appId) {
      return `${appId}.${resource}.${action}`;
    } else {
      return `system.${resource}.${action}`;
    }
  }

  /**
   * Parse permission ID into components
   */
  parsePermissionId(permissionId: string): {
    scope: "global" | "app";
    appId?: string;
    resource: string;
    action: string;
  } | null {
    const parts = permissionId.split(".");
    if (parts.length < 3) return null;

    if (parts[0] === "system") {
      return {
        scope: "global",
        resource: parts[1],
        action: parts.slice(2).join("."),
      };
    } else {
      return {
        scope: "app",
        appId: parts[0],
        resource: parts[1],
        action: parts.slice(2).join("."),
      };
    }
  }

  /**
   * Get available permission templates
   */
  getPermissionTemplates(): { [key: string]: Omit<CreatePermissionRequest, "permission_id"> } {
    const globalTemplates = Object.entries(GLOBAL_PERMISSIONS).map(([id, description]) => {
      const parsed = this.parsePermissionId(id);
      return [
        id,
        {
          name: description,
          description,
          resource: parsed?.resource || "system",
          action: parsed?.action || "admin",
          scope: "global" as const,
        },
      ];
    });

    const appTemplates = Object.entries(APP_PERMISSION_PATTERNS).map(([pattern, description]) => {
      const cleanPattern = pattern.replace("{app_id}.", "");
      const parts = cleanPattern.split(".");
      return [
        pattern,
        {
          name: description,
          description,
          resource: parts[0] || "data",
          action: parts[1] || "read",
          scope: "app" as const,
        },
      ];
    });

    return Object.fromEntries([...globalTemplates, ...appTemplates]);
  }

  /**
   * Create permission from template
   */
  async createPermissionFromTemplate(
    templateId: string,
    appId: string | undefined,
    createdBy: string,
    customizations?: Partial<CreatePermissionRequest>
  ): Promise<PermissionRecord> {
    const templates = this.getPermissionTemplates();
    const template = templates[templateId];

    if (!template) {
      throw new RBACError(
        `Permission template ${templateId} not found`,
        RBACErrorCode.PERMISSION_NOT_FOUND
      );
    }

    let permissionId: string;
    if (template.scope === "global") {
      permissionId = templateId;
    } else {
      if (!appId) {
        throw new RBACError(
          "App ID required for app-scoped permission",
          RBACErrorCode.INVALID_SCOPE
        );
      }
      permissionId = templateId.replace("{app_id}", appId);
    }

    const permissionRequest: CreatePermissionRequest = {
      permission_id: customizations?.permission_id || permissionId,
      name: customizations?.name || template.name,
      description: customizations?.description || template.description,
      resource: customizations?.resource || template.resource,
      action: customizations?.action || template.action,
      scope: template.scope,
      ...(appId && { app_id: appId }),
    };

    return this.createPermission(permissionRequest, createdBy);
  }

  /**
   * Get permission usage statistics
   */
  async getPermissionStats(): Promise<{
    total: number;
    global: number;
    app: number;
    system: number;
    custom: number;
    byResource: Record<string, number>;
    byAction: Record<string, number>;
  }> {
    const allPermissions = await this.getAllPermissions();

    const byResource: Record<string, number> = {};
    const byAction: Record<string, number> = {};

    allPermissions.forEach((permission) => {
      byResource[permission.resource] = (byResource[permission.resource] || 0) + 1;
      byAction[permission.action] = (byAction[permission.action] || 0) + 1;
    });

    return {
      total: allPermissions.length,
      global: allPermissions.filter((p) => p.scope === "global").length,
      app: allPermissions.filter((p) => p.scope === "app").length,
      system: allPermissions.filter((p) => p.is_system_permission).length,
      custom: allPermissions.filter((p) => !p.is_system_permission).length,
      byResource,
      byAction,
    };
  }

  /**
   * Search permissions
   */
  async searchPermissions(query: string): Promise<PermissionRecord[]> {
    const allPermissions = await this.getAllPermissions();
    const lowerQuery = query.toLowerCase();

    return allPermissions.filter(
      (permission) =>
        permission.name.toLowerCase().includes(lowerQuery) ||
        permission.description.toLowerCase().includes(lowerQuery) ||
        permission.permission_id.toLowerCase().includes(lowerQuery) ||
        permission.resource.toLowerCase().includes(lowerQuery) ||
        permission.action.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get roles that have specific permission
   */
  async getRolesWithPermission(permissionId: string): Promise<import("@/types/rbac").RoleRecord[]> {
    const allRoles = await apiClient.getAllRoles();
    return allRoles.filter((role) => role.permission_ids.includes(permissionId));
  }

  /**
   * Get users who have specific permission (through roles)
   */
  async getUsersWithPermission(permissionId: string): Promise<import("@/types/rbac").UserRecord[]> {
    const rolesWithPermission = await this.getRolesWithPermission(permissionId);
    const roleIds = rolesWithPermission.map((role) => role.role_id);

    const allUsers = await apiClient.getAllUsers();
    return allUsers.filter((user) => {
      // Check if user has any role that contains this permission
      const hasGlobalRole = user.global_roles.some((roleId) => roleIds.includes(roleId));
      const hasAppRole = Object.values(user.app_roles).some((appRoles) =>
        appRoles.some((roleId) => roleIds.includes(roleId))
      );
      return hasGlobalRole || hasAppRole;
    });
  }

  /**
   * Validate permission pattern
   */
  validatePermissionPattern(permissionId: string): boolean {
    // Check if it matches expected patterns
    const globalPattern = /^system\.[a-zA-Z_]+\.[a-zA-Z_*]+$/;
    const appPattern = /^[a-zA-Z_]+\.[a-zA-Z_]+\.[a-zA-Z_*]+$/;

    return globalPattern.test(permissionId) || appPattern.test(permissionId);
  }

  /**
   * Get effective permissions for user
   */
  async getEffectivePermissions(microsoftOid: string, appId?: string): Promise<PermissionRecord[]> {
    const user = await apiClient.getUser(microsoftOid);
    if (!user) {
      return [];
    }

    // Super admin has all permissions
    if (user.is_super_admin) {
      return this.getAllPermissions();
    }

    const permissions: PermissionRecord[] = [];
    const permissionIds = new Set<string>();

    // Get permissions from global roles
    for (const roleId of user.global_roles) {
      const role = await apiClient.getRole(roleId);
      if (role) {
        for (const permissionId of role.permission_ids) {
          if (!permissionIds.has(permissionId)) {
            const permission = await this.getPermission(permissionId);
            if (permission) {
              permissions.push(permission);
              permissionIds.add(permissionId);
            }
          }
        }
      }
    }

    // Get permissions from app-specific roles
    if (appId && user.app_roles[appId]) {
      for (const roleId of user.app_roles[appId]) {
        const role = await apiClient.getRole(roleId);
        if (role) {
          for (const permissionId of role.permission_ids) {
            if (!permissionIds.has(permissionId)) {
              const permission = await this.getPermission(permissionId);
              if (permission) {
                permissions.push(permission);
                permissionIds.add(permissionId);
              }
            }
          }
        }
      }
    }

    return permissions;
  }

  /**
   * Check if permission can be deleted safely
   */
  async canDeletePermission(permissionId: string): Promise<{
    canDelete: boolean;
    blockers: {
      roles: string[];
      users: string[];
    };
  }> {
    const permission = await this.getPermission(permissionId);
    if (!permission) {
      return { canDelete: false, blockers: { roles: [], users: [] } };
    }

    if (permission.is_system_permission) {
      return { canDelete: false, blockers: { roles: [], users: [] } };
    }

    const rolesWithPermission = await this.getRolesWithPermission(permissionId);
    const usersWithPermission = await this.getUsersWithPermission(permissionId);

    return {
      canDelete: rolesWithPermission.length === 0,
      blockers: {
        roles: rolesWithPermission.map((role) => role.role_id),
        users: usersWithPermission.map((user) => user.email),
      },
    };
  }
}

export const permissionService = new PermissionService();
