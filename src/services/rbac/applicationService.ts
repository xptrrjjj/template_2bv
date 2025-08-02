import { apiClient } from "../api";
import {
  ApplicationRecord,
  CreateApplicationRequest,
  ResolvedApplication,
  RBACError,
  RBACErrorCode,
} from "@/types/rbac";

/**
 * Application Service - Handles all application-related RBAC operations
 */
export class ApplicationService {
  /**
   * Get application by ID
   */
  async getApplication(appId: string): Promise<ApplicationRecord | null> {
    return apiClient.getApplication(appId);
  }

  /**
   * Create new application
   */
  async createApplication(
    appRequest: CreateApplicationRequest,
    createdBy: string
  ): Promise<ApplicationRecord> {
    // Validate default role exists if specified
    if (appRequest.default_role_id) {
      const role = await apiClient.getRole(appRequest.default_role_id);
      if (!role) {
        throw new RBACError(
          `Default role ${appRequest.default_role_id} not found`,
          RBACErrorCode.ROLE_NOT_FOUND
        );
      }
    }

    const app = await apiClient.createApplication(appRequest, createdBy);

    // Create audit log
    await apiClient.createAuditLog({
      user_id: createdBy,
      action: "create",
      resource_type: "application",
      resource_id: app.app_id,
      details: {
        name: app.name,
        url: app.url,
        defaultRoleId: app.default_role_id,
        requireExplicitAccess: app.require_explicit_access,
        action: "application_created",
      },
    });

    return app;
  }

  /**
   * Update existing application
   */
  async updateApplication(
    appId: string,
    updates: Partial<ApplicationRecord>,
    updatedBy: string
  ): Promise<ApplicationRecord> {
    const existingApp = await this.getApplication(appId);
    if (!existingApp) {
      throw new RBACError("Application not found", RBACErrorCode.APPLICATION_NOT_FOUND);
    }

    // Validate default role exists if being updated
    if (updates.default_role_id) {
      const role = await apiClient.getRole(updates.default_role_id);
      if (!role) {
        throw new RBACError(
          `Default role ${updates.default_role_id} not found`,
          RBACErrorCode.ROLE_NOT_FOUND
        );
      }
    }

    const app = await apiClient.updateApplication(appId, updates);

    // Create audit log
    await apiClient.createAuditLog({
      user_id: updatedBy,
      action: "update",
      resource_type: "application",
      resource_id: appId,
      details: {
        updates,
        action: "application_updated",
      },
    });

    return app;
  }

  /**
   * Delete application
   */
  async deleteApplication(appId: string, deletedBy: string): Promise<void> {
    const app = await this.getApplication(appId);
    if (!app) {
      throw new RBACError("Application not found", RBACErrorCode.APPLICATION_NOT_FOUND);
    }

    // Check if any users have app-specific roles for this application
    const allUsers = await apiClient.getAllUsers();
    const usersWithAppRoles = allUsers.filter(
      (user) => user.app_roles[appId] && user.app_roles[appId].length > 0
    );

    if (usersWithAppRoles.length > 0) {
      throw new RBACError(
        `Cannot delete application: ${usersWithAppRoles.length} users have roles assigned to this application`,
        RBACErrorCode.PERMISSION_DENIED,
        { userCount: usersWithAppRoles.length }
      );
    }

    // Check if any app-specific roles exist for this application
    const appRoles = await apiClient.getRolesByScope("app", appId);
    if (appRoles.length > 0) {
      throw new RBACError(
        `Cannot delete application: ${appRoles.length} app-specific roles exist for this application`,
        RBACErrorCode.PERMISSION_DENIED,
        { roleCount: appRoles.length }
      );
    }

    // Check if any app-specific permissions exist for this application
    const appPermissions = await apiClient.getPermissionsByScope("app", appId);
    if (appPermissions.length > 0) {
      throw new RBACError(
        `Cannot delete application: ${appPermissions.length} app-specific permissions exist for this application`,
        RBACErrorCode.PERMISSION_DENIED,
        { permissionCount: appPermissions.length }
      );
    }

    await apiClient.deleteRecord("rbac_applications", `app_${appId}`);

    // Create audit log
    await apiClient.createAuditLog({
      user_id: deletedBy,
      action: "delete",
      resource_type: "application",
      resource_id: appId,
      details: {
        name: app.name,
        url: app.url,
        action: "application_deleted",
      },
    });
  }

  /**
   * Get all applications
   */
  async getAllApplications(): Promise<ApplicationRecord[]> {
    return apiClient.getAllApplications();
  }

  /**
   * Get active applications only
   */
  async getActiveApplications(): Promise<ApplicationRecord[]> {
    return apiClient.getActiveApplications();
  }

  /**
   * Activate application
   */
  async activateApplication(appId: string, updatedBy: string): Promise<ApplicationRecord> {
    return this.updateApplication(appId, { is_active: true }, updatedBy);
  }

  /**
   * Deactivate application
   */
  async deactivateApplication(appId: string, updatedBy: string): Promise<ApplicationRecord> {
    return this.updateApplication(appId, { is_active: false }, updatedBy);
  }

  /**
   * Get application with resolved statistics
   */
  async getResolvedApplication(appId: string): Promise<ResolvedApplication | null> {
    const app = await this.getApplication(appId);
    if (!app) {
      return null;
    }

    // Get app-specific roles
    const appRoles = await apiClient.getRolesByScope("app", appId);

    // Count users with roles in this application
    const allUsers = await apiClient.getAllUsers();
    const userCount = allUsers.filter(
      (user) => user.app_roles[appId] && user.app_roles[appId].length > 0
    ).length;

    // Get default role if set
    let defaultRole: import("@/types/rbac").RoleRecord | undefined = undefined;
    if (app.default_role_id) {
      defaultRole = await apiClient.getRole(app.default_role_id) || undefined;
    }

    return {
      application: app,
      roleCount: appRoles.length,
      userCount,
      defaultRole,
    };
  }

  /**
   * Get users with access to application
   */
  async getApplicationUsers(appId: string): Promise<import("@/types/rbac").UserRecord[]> {
    const allUsers = await apiClient.getAllUsers();
    return allUsers.filter((user) => {
      // Super admins have access to all apps
      if (user.is_super_admin) return true;

      // Users with app-specific roles
      if (user.app_roles[appId] && user.app_roles[appId].length > 0) return true;

      // Users with global admin roles might have access
      // This would depend on specific permission logic
      return false;
    });
  }

  /**
   * Get application roles
   */
  async getApplicationRoles(appId: string): Promise<import("@/types/rbac").RoleRecord[]> {
    return apiClient.getRolesByScope("app", appId);
  }

  /**
   * Get application permissions
   */
  async getApplicationPermissions(
    appId: string
  ): Promise<import("@/types/rbac").PermissionRecord[]> {
    return apiClient.getPermissionsByScope("app", appId);
  }

  /**
   * Grant user access to application with default role
   */
  async grantUserAccess(appId: string, microsoftOid: string, grantedBy: string): Promise<void> {
    const app = await this.getApplication(appId);
    if (!app) {
      throw new RBACError("Application not found", RBACErrorCode.APPLICATION_NOT_FOUND);
    }

    const user = await apiClient.getUser(microsoftOid);
    if (!user) {
      throw new RBACError("User not found", RBACErrorCode.USER_NOT_FOUND);
    }

    // Use default role if set, otherwise use environment default
    const roleId = app.default_role_id || process.env.NEXT_PUBLIC_DEFAULT_ROLE || "app_viewer";

    await apiClient.assignUserRole({
      user_id: microsoftOid,
      role_id: roleId,
      app_id: appId,
    });

    // Create audit log
    await apiClient.createAuditLog({
      user_id: grantedBy,
      action: "assign",
      resource_type: "role_assignment",
      resource_id: `${appId}:${microsoftOid}:${roleId}`,
      details: {
        appId,
        userId: microsoftOid,
        roleId,
        action: "application_access_granted",
      },
    });
  }

  /**
   * Revoke user access to application (remove all app roles)
   */
  async revokeUserAccess(appId: string, microsoftOid: string, revokedBy: string): Promise<void> {
    const user = await apiClient.getUser(microsoftOid);
    if (!user) {
      throw new RBACError("User not found", RBACErrorCode.USER_NOT_FOUND);
    }

    const userAppRoles = user.app_roles[appId] || [];

    // Remove all app-specific roles for this application
    for (const roleId of userAppRoles) {
      await apiClient.removeUserRole({
        user_id: microsoftOid,
        role_id: roleId,
        app_id: appId,
      });
    }

    // Create audit log
    await apiClient.createAuditLog({
      user_id: revokedBy,
      action: "revoke",
      resource_type: "role_assignment",
      resource_id: `${appId}:${microsoftOid}`,
      details: {
        appId,
        userId: microsoftOid,
        rolesRemoved: userAppRoles,
        action: "application_access_revoked",
      },
    });
  }

  /**
   * Check if user has access to application
   */
  async hasUserAccess(appId: string, microsoftOid: string): Promise<boolean> {
    const user = await apiClient.getUser(microsoftOid);
    if (!user) {
      return false;
    }

    // Super admins have access to all applications
    if (user.is_super_admin) {
      return true;
    }

    // Check if user has any app-specific roles
    const userAppRoles = user.app_roles[appId] || [];
    if (userAppRoles.length > 0) {
      return true;
    }

    // Check if application requires explicit access
    const app = await this.getApplication(appId);
    if (app && app.require_explicit_access) {
      return false;
    }

    // If application doesn't require explicit access, global roles might grant access
    // This would depend on specific permission logic
    return user.global_roles.length > 0;
  }

  /**
   * Get application statistics
   */
  async getApplicationStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withDefaultRole: number;
    requireExplicitAccess: number;
  }> {
    const allApps = await this.getAllApplications();

    return {
      total: allApps.length,
      active: allApps.filter((app) => app.is_active).length,
      inactive: allApps.filter((app) => !app.is_active).length,
      withDefaultRole: allApps.filter((app) => app.default_role_id).length,
      requireExplicitAccess: allApps.filter((app) => app.require_explicit_access).length,
    };
  }

  /**
   * Search applications
   */
  async searchApplications(query: string): Promise<ApplicationRecord[]> {
    const allApps = await this.getAllApplications();
    const lowerQuery = query.toLowerCase();

    return allApps.filter(
      (app) =>
        app.name.toLowerCase().includes(lowerQuery) ||
        app.description.toLowerCase().includes(lowerQuery) ||
        app.app_id.toLowerCase().includes(lowerQuery) ||
        app.url.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get current application (from environment)
   */
  getCurrentApplication(): {
    appId: string;
    appName: string;
  } {
    return {
      appId: process.env.NEXT_PUBLIC_APP_ID || "recruitment_tool",
      appName: process.env.NEXT_PUBLIC_APP_NAME || "Recruitment Tool",
    };
  }

  /**
   * Initialize current application in datastore
   */
  async initializeCurrentApplication(createdBy: string): Promise<ApplicationRecord> {
    const current = this.getCurrentApplication();

    // Check if application already exists
    const app = await this.getApplication(current.appId);
    if (app) {
      return app;
    }

    // Create the current application
    const appRequest: CreateApplicationRequest = {
      app_id: current.appId,
      name: current.appName,
      description: `${current.appName} - Automatically created from environment configuration`,
      url: typeof window !== "undefined" ? window.location.origin : "",
      default_role_id: process.env.NEXT_PUBLIC_DEFAULT_ROLE || "app_viewer",
      require_explicit_access: process.env.NEXT_PUBLIC_REQUIRE_EXPLICIT_ACCESS === "true",
    };

    return this.createApplication(appRequest, createdBy);
  }

  /**
   * Validate application URL
   */
  validateApplicationUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get application health status
   */
  async getApplicationHealth(appId: string): Promise<{
    healthy: boolean;
    issues: string[];
    stats: {
      userCount: number;
      roleCount: number;
      permissionCount: number;
      hasDefaultRole: boolean;
    };
  }> {
    const issues: string[] = [];
    let healthy = true;

    try {
      const app = await this.getApplication(appId);
      if (!app) {
        return {
          healthy: false,
          issues: ["Application not found"],
          stats: { userCount: 0, roleCount: 0, permissionCount: 0, hasDefaultRole: false },
        };
      }

      if (!app.is_active) {
        issues.push("Application is inactive");
        healthy = false;
      }

      if (!this.validateApplicationUrl(app.url)) {
        issues.push("Invalid application URL");
      }

      const [users, roles, permissions] = await Promise.all([
        this.getApplicationUsers(appId),
        this.getApplicationRoles(appId),
        this.getApplicationPermissions(appId),
      ]);

      if (roles.length === 0) {
        issues.push("No roles defined for this application");
      }

      if (permissions.length === 0) {
        issues.push("No permissions defined for this application");
      }

      const hasDefaultRole = app.default_role_id && (await apiClient.getRole(app.default_role_id));
      if (app.default_role_id && !hasDefaultRole) {
        issues.push("Default role not found");
        healthy = false;
      }

      return {
        healthy: healthy && issues.length === 0,
        issues,
        stats: {
          userCount: users.length,
          roleCount: roles.length,
          permissionCount: permissions.length,
          hasDefaultRole: !!hasDefaultRole,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        issues: [
          `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
        stats: { userCount: 0, roleCount: 0, permissionCount: 0, hasDefaultRole: false },
      };
    }
  }
}

export const applicationService = new ApplicationService();
