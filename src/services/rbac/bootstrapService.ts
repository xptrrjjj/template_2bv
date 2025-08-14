import { apiClient } from "../api";
import {
  SystemBootstrapConfig,
  BootstrapResult,
  CreateApplicationRequest,
  CreatePermissionRequest,
  CreateRoleRequest,
  GLOBAL_PERMISSIONS,
  APP_PERMISSION_PATTERNS,
  SYSTEM_ROLES,
} from "@/types/rbac";

/**
 * Bootstrap Service - Handles system initialization and setup
 */
export class BootstrapService {
  private _bootstrapCheckCache: { result: boolean; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds cache
  /**
   * Bootstrap the entire RBAC system
   */
  async bootstrapSystem(): Promise<BootstrapResult> {
    console.log('🚀 BootstrapService: Starting bootstrap system...');
    // Clear cache since we're about to modify the system
    this._bootstrapCheckCache = null;
    
    const config = this.generateBootstrapConfig();
    console.log('📋 BootstrapService: Generated config:', {
      applications: config.applications.length,
      permissions: config.permissions.length, 
      roles: config.roles.length,
      superAdminOids: config.superAdminOids.length
    });
    console.log('📋 BootstrapService: Full config:', config);
    
    const result = await apiClient.bootstrapSystem(config);
    
    // Clear cache again after bootstrap to force fresh check
    this._bootstrapCheckCache = null;
    
    return result;
  }

  /**
   * Generate bootstrap configuration from environment and constants
   */
  private generateBootstrapConfig(): SystemBootstrapConfig {
    const currentAppId = process.env.NEXT_PUBLIC_APP_ID || "recruitment_tool";
    const currentAppName = process.env.NEXT_PUBLIC_APP_NAME || "Recruitment Tool";
    const superAdminOids = (process.env.NEXT_PUBLIC_SUPER_ADMIN_OIDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Create applications
    const applications: CreateApplicationRequest[] = [
      {
        app_id: currentAppId,
        name: currentAppName,
        description: `${currentAppName} - Primary application for recruitment management`,
        url: typeof window !== "undefined" ? window.location.origin : "",
        default_role_id: "app_viewer",
        require_explicit_access: process.env.NEXT_PUBLIC_REQUIRE_EXPLICIT_ACCESS === "true",
      },
    ];

    // Create global permissions
    const globalPermissions: CreatePermissionRequest[] = Object.entries(GLOBAL_PERMISSIONS).map(
      ([id, description]) => ({
        permission_id: id,
        name: description,
        description,
        resource: this.extractResourceFromPermissionId(id),
        action: this.extractActionFromPermissionId(id),
        scope: "global",
      })
    );

    // Create app-specific permissions for current application
    const appPermissions: CreatePermissionRequest[] = Object.entries(APP_PERMISSION_PATTERNS).map(
      ([pattern, description]) => {
        const permissionId = pattern.replace("{app_id}", currentAppId);
        const cleanPattern = pattern.replace("{app_id}.", "");
        const parts = cleanPattern.split(".");

        return {
          permission_id: permissionId,
          name: description,
          description,
          resource: parts[0] || "data",
          action: parts[1] || "read",
          scope: "app",
          app_id: currentAppId,
        };
      }
    );

    const permissions = [...globalPermissions, ...appPermissions];

    // Create roles
    const roles: CreateRoleRequest[] = [];

    // Global roles
    Object.entries(SYSTEM_ROLES).forEach(([roleKey, roleConfig]) => {
      if (roleConfig.scope === "global") {
        roles.push({
          role_id: roleKey,
          name: roleConfig.name,
          description: roleConfig.description,
          scope: "global",
          permission_ids: [...roleConfig.permissions],
        });
      }
    });

    // App-specific roles for current application
    Object.entries(SYSTEM_ROLES).forEach(([roleKey, roleConfig]) => {
      if (roleConfig.scope === "app") {
        const permissionIds = roleConfig.permissions.map((p) =>
          p.replace("{app_id}", currentAppId)
        );
        roles.push({
          role_id: `${currentAppId}_${roleKey}`,
          name: `${currentAppName} ${roleConfig.name}`,
          description: `${roleConfig.description} for ${currentAppName}`,
          scope: "app",
          app_id: currentAppId,
          permission_ids: permissionIds,
        });
      }
    });

    return {
      applications,
      permissions,
      roles,
      superAdminOids,
    };
  }

  /**
   * Extract resource from permission ID
   */
  private extractResourceFromPermissionId(permissionId: string): string {
    const parts = permissionId.split(".");
    if (parts[0] === "system") {
      return parts[1] || "system";
    }
    return parts[1] || "data";
  }

  /**
   * Extract action from permission ID
   */
  private extractActionFromPermissionId(permissionId: string): string {
    const parts = permissionId.split(".");
    if (parts.length < 3) return "read";
    return parts.slice(2).join(".") || "read";
  }

  /**
   * Check if system is already bootstrapped (with caching)
   */
  async isSystemBootstrapped(): Promise<boolean> {
    // Check cache first
    if (this._bootstrapCheckCache) {
      const now = Date.now();
      if (now - this._bootstrapCheckCache.timestamp < this.CACHE_DURATION) {
        console.log('🔍 BootstrapService: Using cached bootstrap status:', this._bootstrapCheckCache.result);
        return this._bootstrapCheckCache.result;
      }
    }

    try {
      console.log('🔍 BootstrapService: Checking if system is bootstrapped...');
      const [applications, roles, permissions] = await Promise.all([
        apiClient.getAllApplications(),
        apiClient.getAllRoles(),
        apiClient.getAllPermissions(),
      ]);

      const currentAppId = process.env.NEXT_PUBLIC_APP_ID || "recruitment_tool";
      const hasCurrentApp = applications.some((app) => app.app_id === currentAppId);
      const hasSystemRoles = roles.some((role) => role.is_system_role);
      const hasSystemPermissions = permissions.some(
        (permission) => permission.is_system_permission
      );

      console.log('🔍 BootstrapService: Bootstrap status check:', {
        currentAppId,
        totalApplications: applications.length,
        totalRoles: roles.length,
        totalPermissions: permissions.length,
        hasCurrentApp,
        hasSystemRoles,
        hasSystemPermissions,
        systemRoles: roles.filter(r => r.is_system_role).length,
        systemPermissions: permissions.filter(p => p.is_system_permission).length
      });

      const isBootstrapped = hasCurrentApp && hasSystemRoles && hasSystemPermissions;
      console.log('🔍 BootstrapService: System is bootstrapped:', isBootstrapped);
      
      // Cache the result
      this._bootstrapCheckCache = {
        result: isBootstrapped,
        timestamp: Date.now()
      };
      
      return isBootstrapped;
    } catch (error) {
      console.error("Error checking bootstrap status:", error);
      return false;
    }
  }

  /**
   * Bootstrap only if not already bootstrapped
   */
  async ensureBootstrapped(): Promise<BootstrapResult> {
    const isBootstrapped = await this.isSystemBootstrapped();

    if (isBootstrapped) {
      return {
        success: true,
        applicationsCreated: 0,
        permissionsCreated: 0,
        rolesCreated: 0,
        superAdminsAssigned: 0,
        errors: ["System already bootstrapped"],
      };
    }

    return this.bootstrapSystem();
  }

  /**
   * Reset system (dangerous - removes all RBAC data)
   */
  async resetSystem(): Promise<void> {
    console.warn("DANGER: Resetting entire RBAC system");

    try {
      await Promise.all([
        apiClient.deleteAllRecords("rbac_users"),
        apiClient.deleteAllRecords("rbac_roles"),
        apiClient.deleteAllRecords("rbac_permissions"),
        apiClient.deleteAllRecords("rbac_applications"),
        apiClient.deleteAllRecords("rbac_audit_logs"),
      ]);
    } catch (error) {
      console.error("Error during system reset:", error);
      throw error;
    }
  }

  /**
   * Get system health check
   */
  async getSystemHealth(): Promise<import("@/types/rbac").SystemHealthCheck> {
    return apiClient.getSystemHealth();
  }

  /**
   * Create system permissions from templates
   */
  async createSystemPermissions(): Promise<void> {
    const currentAppId = process.env.NEXT_PUBLIC_APP_ID || "recruitment_tool";

    // Create global permissions
    for (const [permissionId, description] of Object.entries(GLOBAL_PERMISSIONS)) {
      try {
        const existing = await apiClient.getPermission(permissionId);
        if (!existing) {
          await apiClient.createPermission(
            {
              permission_id: permissionId,
              name: description,
              description,
              resource: this.extractResourceFromPermissionId(permissionId),
              action: this.extractActionFromPermissionId(permissionId),
              scope: "global",
            },
            "system"
          );
        }
      } catch (error) {
        console.error(`Failed to create global permission ${permissionId}:`, error);
      }
    }

    // Create app-specific permissions
    for (const [pattern, description] of Object.entries(APP_PERMISSION_PATTERNS)) {
      try {
        const permissionId = pattern.replace("{app_id}", currentAppId);
        const existing = await apiClient.getPermission(permissionId);
        if (!existing) {
          const cleanPattern = pattern.replace("{app_id}.", "");
          const parts = cleanPattern.split(".");

          await apiClient.createPermission(
            {
              permission_id: permissionId,
              name: description,
              description,
              resource: parts[0] || "data",
              action: parts[1] || "read",
              scope: "app",
              app_id: currentAppId,
            },
            "system"
          );
        }
      } catch (error) {
        console.error(`Failed to create app permission ${pattern}:`, error);
      }
    }
  }

  /**
   * Create system roles from templates
   */
  async createSystemRoles(): Promise<void> {
    const currentAppId = process.env.NEXT_PUBLIC_APP_ID || "recruitment_tool";
    const currentAppName = process.env.NEXT_PUBLIC_APP_NAME || "Recruitment Tool";

    // Create global roles
    for (const [roleKey, roleConfig] of Object.entries(SYSTEM_ROLES)) {
      if (roleConfig.scope === "global") {
        try {
          const existing = await apiClient.getRole(roleKey);
          if (!existing) {
            await apiClient.createRole(
              {
                role_id: roleKey,
                name: roleConfig.name,
                description: roleConfig.description,
                scope: "global",
                permission_ids: [...roleConfig.permissions],
              },
              "system"
            );
          }
        } catch (error) {
          console.error(`Failed to create global role ${roleKey}:`, error);
        }
      }
    }

    // Create app-specific roles
    for (const [roleKey, roleConfig] of Object.entries(SYSTEM_ROLES)) {
      if (roleConfig.scope === "app") {
        try {
          const appRoleId = `${currentAppId}_${roleKey}`;
          const existing = await apiClient.getRole(appRoleId);
          if (!existing) {
            const permissionIds = roleConfig.permissions.map((p) =>
              p.replace("{app_id}", currentAppId)
            );
            await apiClient.createRole(
              {
                role_id: appRoleId,
                name: `${currentAppName} ${roleConfig.name}`,
                description: `${roleConfig.description} for ${currentAppName}`,
                scope: "app",
                app_id: currentAppId,
                permission_ids: permissionIds,
              },
              "system"
            );
          }
        } catch (error) {
          console.error(`Failed to create app role ${roleKey}:`, error);
        }
      }
    }
  }

  /**
   * Create current application
   */
  async createCurrentApplication(): Promise<void> {
    const currentAppId = process.env.NEXT_PUBLIC_APP_ID || "recruitment_tool";
    const currentAppName = process.env.NEXT_PUBLIC_APP_NAME || "Recruitment Tool";

    try {
      const existing = await apiClient.getApplication(currentAppId);
      if (!existing) {
        await apiClient.createApplication(
          {
            app_id: currentAppId,
            name: currentAppName,
            description: `${currentAppName} - Primary application for recruitment management`,
            url: typeof window !== "undefined" ? window.location.origin : "",
            default_role_id: `${currentAppId}_app_viewer`,
            require_explicit_access: process.env.NEXT_PUBLIC_REQUIRE_EXPLICIT_ACCESS === "true",
          },
          "system"
        );
      }
    } catch (error) {
      console.error("Failed to create current application:", error);
    }
  }

  /**
   * Assign super admin roles
   */
  async assignSuperAdmins(): Promise<void> {
    const superAdminOids = (process.env.NEXT_PUBLIC_SUPER_ADMIN_OIDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const oid of superAdminOids) {
      try {
        const user = await apiClient.getUser(oid);
        if (user && !user.is_super_admin) {
          await apiClient.updateUser(oid, { is_super_admin: true });
        }
      } catch (error) {
        console.error(`Failed to assign super admin ${oid}:`, error);
      }
    }
  }

  /**
   * Validate system configuration
   */
  async validateConfiguration(): Promise<{
    valid: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check required environment variables
    if (!process.env.NEXT_PUBLIC_APP_ID) {
      issues.push("NEXT_PUBLIC_APP_ID environment variable is required");
    }

    if (!process.env.NEXT_PUBLIC_APP_NAME) {
      warnings.push("NEXT_PUBLIC_APP_NAME not set, using default");
    }

    if (!process.env.NEXT_PUBLIC_SUPER_ADMIN_OIDS) {
      warnings.push("No super admin OIDs configured");
    }

    if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
      issues.push("NEXT_PUBLIC_API_BASE_URL environment variable is required");
    }

    // Check API connectivity
    try {
      await apiClient.getSystemHealth();
    } catch {
      issues.push("Cannot connect to API backend");
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
   * Get bootstrap progress
   */
  async getBootstrapProgress(): Promise<{
    applications: { created: number; total: number };
    permissions: { created: number; total: number };
    roles: { created: number; total: number };
    superAdmins: { assigned: number; total: number };
  }> {
    const config = this.generateBootstrapConfig();

    const [existingApps, existingPermissions, existingRoles, existingUsers] = await Promise.all([
      apiClient.getAllApplications(),
      apiClient.getAllPermissions(),
      apiClient.getAllRoles(),
      apiClient.getAllUsers(),
    ]);

    const appsCreated = config.applications.filter((app) =>
      existingApps.some((existing) => existing.app_id === app.app_id)
    ).length;

    const permissionsCreated = config.permissions.filter((permission) =>
      existingPermissions.some((existing) => existing.permission_id === permission.permission_id)
    ).length;

    const rolesCreated = config.roles.filter((role) =>
      existingRoles.some((existing) => existing.role_id === role.role_id)
    ).length;

    const superAdminsAssigned = config.superAdminOids.filter((oid) =>
      existingUsers.some((user) => user.microsoft_oid === oid && user.is_super_admin)
    ).length;

    return {
      applications: { created: appsCreated, total: config.applications.length },
      permissions: { created: permissionsCreated, total: config.permissions.length },
      roles: { created: rolesCreated, total: config.roles.length },
      superAdmins: { assigned: superAdminsAssigned, total: config.superAdminOids.length },
    };
  }

  /**
   * Repair system (fix common issues)
   */
  async repairSystem(): Promise<{
    repaired: string[];
    failed: string[];
  }> {
    const repaired: string[] = [];
    const failed: string[] = [];

    try {
      // Ensure system permissions exist
      await this.createSystemPermissions();
      repaired.push("System permissions verified/created");
    } catch (error) {
      failed.push(
        `Failed to create system permissions: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    try {
      // Ensure system roles exist
      await this.createSystemRoles();
      repaired.push("System roles verified/created");
    } catch (error) {
      failed.push(
        `Failed to create system roles: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    try {
      // Ensure current application exists
      await this.createCurrentApplication();
      repaired.push("Current application verified/created");
    } catch (error) {
      failed.push(
        `Failed to create current application: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    try {
      // Ensure super admins are assigned
      await this.assignSuperAdmins();
      repaired.push("Super admin assignments verified");
    } catch (error) {
      failed.push(
        `Failed to assign super admins: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    return { repaired, failed };
  }
}

export const bootstrapService = new BootstrapService();
