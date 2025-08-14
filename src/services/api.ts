import {
  DatastoreCreateRequest,
  DatastoreRetrieveRequest,
  DatastoreResponse,
} from "@/types/datastore";
import {
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
  PermissionCheckResult,
  PermissionContext,
  AuditLogEntry,
  BootstrapResult,
  SystemBootstrapConfig,
  SystemHealthCheck,
  RBACError,
  RBACErrorCode,
} from "@/types/rbac";

class ApiClient {
  private baseUrl: string;
  private apiBaseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  }

  private getAuthHeaders(): Record<string, string> {
    // Check if we're in a browser environment
    const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null;
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private getHeaders(): Record<string, string> {
    return this.getAuthHeaders();
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Datastore operations
  async datastoreCreate(request: DatastoreCreateRequest): Promise<DatastoreResponse> {
    return this.makeRequest<DatastoreResponse>("/api/datastore/create", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async datastoreRetrieve(request: DatastoreRetrieveRequest): Promise<DatastoreResponse> {
    return this.makeRequest<DatastoreResponse>("/api/datastore/retrieve", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Convenience methods for specific actions
  async createRecord(
    identifier: string,
    data: Record<string, unknown>
  ): Promise<DatastoreResponse> {
    return this.datastoreCreate({
      identifier,
      action: "create",
      data,
    });
  }

  async updateRecord(
    identifier: string,
    data: Record<string, unknown>
  ): Promise<DatastoreResponse> {
    return this.datastoreCreate({
      identifier,
      action: "update",
      data,
    });
  }

  async appendToRecord(
    identifier: string,
    data: Record<string, unknown>
  ): Promise<DatastoreResponse> {
    return this.datastoreCreate({
      identifier,
      action: "append",
      data,
    });
  }

  async deleteRecord(identifier: string, recordId: string): Promise<DatastoreResponse> {
    return this.datastoreCreate({
      identifier,
      action: "delete",
      data: { record_id: recordId },
    });
  }

  async deleteAllRecords(identifier: string): Promise<DatastoreResponse> {
    return this.datastoreCreate({
      identifier,
      action: "delete_all",
      data: {},
    });
  }

  async getRecords(
    identifier: string,
    filters?: Record<string, unknown>
  ): Promise<DatastoreResponse> {
    return this.datastoreRetrieve({
      identifier,
      filters,
    });
  }

  // RBAC Operations

  // User Management
  async getUser(microsoftOid: string): Promise<UserRecord | null> {
    try {
      const response = await this.getRecords("rbac_users", { microsoft_oid: microsoftOid });
      return (response.data?.[0] as UserRecord) || null;
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async createUser(
    user: Omit<UserRecord, "record_id" | "created_at" | "updated_at">
  ): Promise<UserRecord> {
    try {
      console.log("ApiClient.createUser: Input user data:", user);

      const userData = {
        // Required datastore fields
        app_id: "rbac_users",
        record_id: `user_${user.microsoft_oid}`,

        // User identity fields
        microsoft_oid: user.microsoft_oid,
        email: user.email,
        name: user.name,

        // RBAC fields
        global_roles: user.global_roles || [],
        app_roles: user.app_roles || {},
        status: user.status || "active",
        is_super_admin: user.is_super_admin || false,

        // Optional fields
        profile_picture: user.profile_picture || null,

        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };

      console.log("ApiClient.createUser: Final user data with timestamps:", userData);

      const response = await this.datastoreCreate({
        identifier: "rbac_users",
        action: "create",
        data: userData,
      });

      console.log("ApiClient.createUser: Datastore response:", response);

      if (response.status === "error") {
        throw new Error(`Datastore error: ${response.message}`);
      }

      // Datastore create doesn't return the created data, so fetch it
      console.log("ApiClient.createUser: Fetching created user...");
      const createdUser = await this.getUser(user.microsoft_oid);
      console.log("ApiClient.createUser: Fetched user:", createdUser);

      if (!createdUser) {
        throw new Error("User was created but could not be retrieved");
      }

      return createdUser;
    } catch (error) {
      console.error("ApiClient.createUser: Error creating user:", error);
      throw error;
    }
  }

  async updateUser(microsoftOid: string, updates: Partial<UserRecord>): Promise<UserRecord> {
    try {
      console.log("ApiClient.updateUser: Updating user:", microsoftOid, updates);

      // Remove key fields that cannot be updated in DynamoDB, but we need record_id for the update operation
      const updateableFields = updates;

      const userData = {
        ...updateableFields,
        record_id: `user_${microsoftOid}`, // Required for datastore update operation
        microsoft_oid: microsoftOid,
        updated_at: new Date().toISOString(),
      };

      console.log("ApiClient.updateUser: Final update data:", userData);

      const response = await this.updateRecord("rbac_users", userData);
      console.log("ApiClient.updateUser: Update response:", response);

      if (response.status === "error") {
        throw new Error(`Datastore error: ${response.message}`);
      }

      // Fetch the updated user since update doesn't return the data
      console.log("ApiClient.updateUser: Fetching updated user...");
      const updatedUser = await this.getUser(microsoftOid);
      console.log("ApiClient.updateUser: Fetched updated user:", updatedUser);

      if (!updatedUser) {
        throw new Error("User was updated but could not be retrieved");
      }

      return updatedUser;
    } catch (error) {
      console.error("ApiClient.updateUser: Error:", error);
      throw error;
    }
  }

  async getAllUsers(): Promise<UserRecord[]> {
    const response = await this.getRecords("rbac_users");
    return (response.data as UserRecord[]) || [];
  }

  async getUsersByStatus(status: UserRecord["status"]): Promise<UserRecord[]> {
    const response = await this.getRecords("rbac_users", { status });
    return (response.data as UserRecord[]) || [];
  }

  // Role Management
  async getRole(roleId: string): Promise<RoleRecord | null> {
    try {
      const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_ID || 'antd_recruiter';
      const response = await this.getRecords(APP_IDENTIFIER, { role_id: roleId });
      return (response.data?.[0] as RoleRecord) || null;
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async createRole(roleRequest: CreateRoleRequest, createdBy: string): Promise<RoleRecord> {
    // Check if role already exists
    const existing = await this.getRole(roleRequest.role_id);
    if (existing) {
      return existing;
    }
    
    const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_ID || 'antd_recruiter';
    
    const roleData: RoleRecord = {
      app_id: roleRequest.scope === "app" && roleRequest.app_id ? roleRequest.app_id : "rbac_roles",
      record_id: `role_${roleRequest.role_id}`,
      ...roleRequest,
      is_system_role: createdBy === "system", // Set as system role if created by "system"
      created_at: new Date().toISOString(),
      created_by: createdBy,
      updated_at: new Date().toISOString(),
      updated_by: createdBy,
    };

    const response = await this.createRecord(
      APP_IDENTIFIER, // Use consistent identifier
      roleData as unknown as Record<string, unknown>
    );
    
    // Since datastore create doesn't return the data, fetch it
    const createdRole = await this.getRole(roleRequest.role_id);
    if (!createdRole) {
      throw new Error("Role was created but could not be retrieved");
    }
    return createdRole;
  }

  async updateRole(
    roleId: string,
    updates: UpdateRoleRequest,
    updatedBy: string
  ): Promise<RoleRecord> {
    const roleData = {
      ...updates,
      record_id: `role_${roleId}`, // Required for datastore update operation
      role_id: roleId,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    };

    const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_ID || 'antd_recruiter';
    const response = await this.updateRecord(APP_IDENTIFIER, roleData);
    
    // Fetch the updated role since update doesn't return the data
    const updatedRole = await this.getRole(roleId);
    if (!updatedRole) {
      throw new Error("Role was updated but could not be retrieved");
    }
    return updatedRole;
  }

  async deleteRole(roleId: string, deletedBy: string): Promise<void> {
    // Check if role is system role
    const role = await this.getRole(roleId);
    if (role?.is_system_role) {
      throw new RBACError("Cannot delete system role", RBACErrorCode.SYSTEM_ROLE_PROTECTED);
    }

    const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_ID || 'antd_recruiter';
    await this.deleteRecord(APP_IDENTIFIER, `role_${roleId}`);
  }

  async getAllRoles(): Promise<RoleRecord[]> {
    const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_ID || 'antd_recruiter';
    const response = await this.getRecords(APP_IDENTIFIER);
    // Filter to only get role records (they have role_id field)
    return ((response.data as RoleRecord[]) || []).filter(record => record.role_id);
  }

  async getRolesByScope(scope: RoleRecord["scope"], appId?: string): Promise<RoleRecord[]> {
    const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_ID || 'antd_recruiter';
    const response = await this.getRecords(APP_IDENTIFIER);
    // Filter roles by scope and app_id
    return ((response.data as RoleRecord[]) || []).filter(record => 
      record.role_id && 
      record.scope === scope && 
      (!appId || record.app_id === appId)
    );
  }

  // Permission Management
  async getPermission(permissionId: string): Promise<PermissionRecord | null> {
    try {
      const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_ID || 'antd_recruiter';
      const response = await this.getRecords(APP_IDENTIFIER, { permission_id: permissionId });
      return (response.data?.[0] as PermissionRecord) || null;
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async createPermission(
    permissionRequest: CreatePermissionRequest,
    createdBy: string
  ): Promise<PermissionRecord> {
    // Check if permission already exists
    const existing = await this.getPermission(permissionRequest.permission_id);
    if (existing) {
      return existing;
    }
    
    const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_ID || 'antd_recruiter';
    
    const permissionData: PermissionRecord = {
      app_id: permissionRequest.scope === "app" && permissionRequest.app_id ? permissionRequest.app_id : "rbac_permissions",
      record_id: `permission_${permissionRequest.permission_id}`,
      ...permissionRequest,
      is_system_permission: createdBy === "system", // Set as system permission if created by "system"
      created_at: new Date().toISOString(),
      created_by: createdBy,
    };

    const response = await this.createRecord(
      APP_IDENTIFIER, // Use consistent identifier
      permissionData as unknown as Record<string, unknown>
    );
    
    // Since datastore create doesn't return the data, fetch it
    const createdPermission = await this.getPermission(permissionRequest.permission_id);
    if (!createdPermission) {
      throw new Error("Permission was created but could not be retrieved");
    }
    return createdPermission;
  }

  async deletePermission(permissionId: string, deletedBy: string): Promise<void> {
    // Check if permission is system permission
    const permission = await this.getPermission(permissionId);
    if (permission?.is_system_permission) {
      throw new RBACError("Cannot delete system permission", RBACErrorCode.SYSTEM_ROLE_PROTECTED);
    }

    const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_ID || 'antd_recruiter';
    await this.deleteRecord(APP_IDENTIFIER, `permission_${permissionId}`);
  }

  async getAllPermissions(): Promise<PermissionRecord[]> {
    const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_ID || 'antd_recruiter';
    const response = await this.getRecords(APP_IDENTIFIER);
    // Filter to only get permission records (they have permission_id field)
    return ((response.data as PermissionRecord[]) || []).filter(record => record.permission_id);
  }

  async getPermissionsByScope(
    scope: PermissionRecord["scope"],
    appId?: string
  ): Promise<PermissionRecord[]> {
    const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_ID || 'antd_recruiter';
    const response = await this.getRecords(APP_IDENTIFIER);
    // Filter permissions by scope and app_id
    return ((response.data as PermissionRecord[]) || []).filter(record => 
      record.permission_id && 
      record.scope === scope && 
      (!appId || record.app_id === appId)
    );
  }

  // Application Management
  async getApplication(appId: string): Promise<ApplicationRecord | null> {
    try {
      const response = await this.getRecords("rbac_applications", { app_id: appId });
      return (response.data?.[0] as ApplicationRecord) || null;
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async createApplication(
    appRequest: CreateApplicationRequest,
    createdBy: string
  ): Promise<ApplicationRecord> {
    // Check if application already exists
    const existing = await this.getApplication(appRequest.app_id);
    if (existing) {
      return existing;
    }
    
    const appData: ApplicationRecord = {
      ...appRequest,
      app_id: "rbac_applications", // Datastore identifier - override the spread
      record_id: `app_${appRequest.app_id}`,
      created_at: new Date().toISOString(),
      created_by: createdBy,
      is_active: true,
    };

    const response = await this.createRecord(
      "rbac_applications",
      appData as unknown as Record<string, unknown>
    );
    
    // Since datastore create doesn't return the data, fetch it
    const createdApp = await this.getApplication(appRequest.app_id);
    if (!createdApp) {
      throw new Error("Application was created but could not be retrieved");
    }
    return createdApp;
  }

  async updateApplication(
    appId: string,
    updates: Partial<ApplicationRecord>
  ): Promise<ApplicationRecord> {
    const appData = {
      ...updates,
      record_id: `app_${appId}`, // Required for datastore update operation
      app_id: appId,
      updated_at: new Date().toISOString(),
    };

    const response = await this.updateRecord("rbac_applications", appData);
    
    // Fetch the updated application since update doesn't return the data
    const updatedApp = await this.getApplication(appId);
    if (!updatedApp) {
      throw new Error("Application was updated but could not be retrieved");
    }
    return updatedApp;
  }

  async getAllApplications(): Promise<ApplicationRecord[]> {
    const response = await this.getRecords("rbac_applications");
    return (response.data as ApplicationRecord[]) || [];
  }

  async getActiveApplications(): Promise<ApplicationRecord[]> {
    const response = await this.getRecords("rbac_applications", { is_active: true });
    return (response.data as ApplicationRecord[]) || [];
  }

  // Role Assignment
  async assignUserRole(request: AssignUserRoleRequest): Promise<void> {
    const user = await this.getUser(request.user_id);
    if (!user) {
      throw new RBACError("User not found", RBACErrorCode.USER_NOT_FOUND);
    }

    const role = await this.getRole(request.role_id);
    if (!role) {
      throw new RBACError("Role not found", RBACErrorCode.ROLE_NOT_FOUND);
    }

    // Update user record with new role assignment
    let updatedUser: UserRecord;
    if (role.scope === "global") {
      // Add to global roles if not already present
      if (!user.global_roles.includes(request.role_id)) {
        updatedUser = {
          ...user,
          global_roles: [...user.global_roles, request.role_id],
          updated_at: new Date().toISOString(),
        };
      } else {
        return; // Role already assigned
      }
    } else {
      // Add to app-specific roles
      if (!request.app_id) {
        throw new RBACError("App ID required for app-scoped role", RBACErrorCode.INVALID_SCOPE);
      }

      const appRoles = user.app_roles[request.app_id] || [];
      if (!appRoles.includes(request.role_id)) {
        updatedUser = {
          ...user,
          app_roles: {
            ...user.app_roles,
            [request.app_id]: [...appRoles, request.role_id],
          },
          updated_at: new Date().toISOString(),
        };
      } else {
        return; // Role already assigned
      }
    }

    // Add the proper record_id for datastore update
    const userUpdateData = {
      ...updatedUser,
      record_id: `user_${request.user_id}`, // Required for datastore update operation
    } as unknown as Record<string, unknown>;
    
    await this.updateRecord("rbac_users", userUpdateData);
  }

  async removeUserRole(request: RemoveUserRoleRequest): Promise<void> {
    const user = await this.getUser(request.user_id);
    if (!user) {
      throw new RBACError("User not found", RBACErrorCode.USER_NOT_FOUND);
    }

    const role = await this.getRole(request.role_id);
    if (!role) {
      throw new RBACError("Role not found", RBACErrorCode.ROLE_NOT_FOUND);
    }

    let updatedUser: UserRecord;
    if (role.scope === "global") {
      // Remove from global roles
      updatedUser = {
        ...user,
        global_roles: user.global_roles.filter((roleId) => roleId !== request.role_id),
        updated_at: new Date().toISOString(),
      };
    } else {
      // Remove from app-specific roles
      if (!request.app_id) {
        throw new RBACError("App ID required for app-scoped role", RBACErrorCode.INVALID_SCOPE);
      }

      const appRoles = user.app_roles[request.app_id] || [];
      updatedUser = {
        ...user,
        app_roles: {
          ...user.app_roles,
          [request.app_id]: appRoles.filter((roleId) => roleId !== request.role_id),
        },
        updated_at: new Date().toISOString(),
      };
    }

    // Add the proper record_id for datastore update
    const userUpdateData = {
      ...updatedUser,
      record_id: `user_${request.user_id}`, // Required for datastore update operation
    } as unknown as Record<string, unknown>;
    
    await this.updateRecord("rbac_users", userUpdateData);
  }

  // Permission Checking
  async checkPermission(context: PermissionContext): Promise<PermissionCheckResult> {
    const user = await this.getUser(context.userId);
    if (!user) {
      return { granted: false, reason: "User not found" };
    }

    // Super admin has all permissions
    if (user.is_super_admin) {
      return { granted: true, reason: "Super admin access" };
    }

    // Get all user roles (global + app-specific)
    const userRoles: RoleRecord[] = [];

    // Add global roles
    for (const roleId of user.global_roles) {
      const role = await this.getRole(roleId);
      if (role) userRoles.push(role);
    }

    // Add app-specific roles if checking app permission
    if (context.appId && user.app_roles[context.appId]) {
      for (const roleId of user.app_roles[context.appId]) {
        const role = await this.getRole(roleId);
        if (role) userRoles.push(role);
      }
    }

    // Check permissions in each role
    const permissionPattern = context.appId
      ? `${context.appId}.${context.resource}.${context.action}`
      : `system.${context.resource}.${context.action}`;

    for (const role of userRoles) {
      for (const permissionId of role.permission_ids) {
        // Handle wildcard permissions
        if (permissionId.endsWith(".*")) {
          const basePattern = permissionId.slice(0, -2);
          if (permissionPattern.startsWith(basePattern)) {
            return { granted: true, sourceRole: role.role_id };
          }
        }

        // Handle exact match
        if (permissionId === permissionPattern) {
          return { granted: true, sourceRole: role.role_id };
        }

        // Handle system.* for super permissions
        if (permissionId === "system.*") {
          return { granted: true, sourceRole: role.role_id };
        }
      }
    }

    return { granted: false, reason: "Permission not found in user roles" };
  }

  // System Bootstrap
  async bootstrapSystem(config: SystemBootstrapConfig): Promise<BootstrapResult> {
    console.log('🚀 Bootstrap: Starting RBAC system bootstrap...');

    const result: BootstrapResult = {
      success: false,
      applicationsCreated: 0,
      permissionsCreated: 0,
      rolesCreated: 0,
      superAdminsAssigned: 0,
      errors: [],
    };

    try {
      // Create applications
      for (const app of config.applications) {
        try {
          await this.createApplication(app, "system");
          result.applicationsCreated++;
        } catch (error) {
          result.errors.push(
            `Failed to create application ${app.app_id}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      // Create permissions
      for (const permission of config.permissions) {
        try {
          await this.createPermission(permission, "system");
          result.permissionsCreated++;
        } catch (error) {
          result.errors.push(
            `Failed to create permission ${permission.permission_id}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      // Create roles
      for (const role of config.roles) {
        try {
          await this.createRole(role, "system");
          result.rolesCreated++;
        } catch (error) {
          result.errors.push(
            `Failed to create role ${role.role_id}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      // Assign super admins
      for (const oid of config.superAdminOids) {
        try {
          const user = await this.getUser(oid);
          if (user) {
            await this.updateUser(oid, { is_super_admin: true });
          }
          result.superAdminsAssigned++;
        } catch (error) {
          result.errors.push(
            `Failed to assign super admin ${oid}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      result.success = result.errors.length === 0;
      console.log('🏁 Bootstrap: Process completed! Created:', {
        applications: result.applicationsCreated,
        permissions: result.permissionsCreated,
        roles: result.rolesCreated,
        superAdmins: result.superAdminsAssigned,
        errors: result.errors.length
      });
      return result;
    } catch (error) {
      console.error('💥 Bootstrap: Critical error:', error);
      result.errors.push(
        `Bootstrap failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      return result;
    }
  }

  // Debug method for testing
  async debugBootstrap(): Promise<void> {
    console.log('🐛 DEBUG: Starting bootstrap debug...');
    console.log('🐛 DEBUG: Environment variables:');
    console.log('  - NEXT_PUBLIC_APP_ID:', process.env.NEXT_PUBLIC_APP_ID);
    console.log('  - NEXT_PUBLIC_APP_NAME:', process.env.NEXT_PUBLIC_APP_NAME);
    console.log('  - NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
    
    // Test creating a single permission
    try {
      console.log('🐛 DEBUG: Testing single permission creation...');
      const testPermission = {
        permission_id: 'test.debug.permission',
        name: 'Debug Test Permission',
        description: 'Test permission for debugging',
        resource: 'test',
        action: 'debug',
        scope: 'global' as const
      };
      
      const result = await this.createPermission(testPermission, 'debug');
      console.log('🐛 DEBUG: Permission creation result:', result);
    } catch (error) {
      console.error('🐛 DEBUG: Permission creation failed:', error);
    }

    // Test datastore connectivity
    try {
      console.log('🐛 DEBUG: Testing datastore read...');
      const permissions = await this.getAllPermissions();
      console.log('🐛 DEBUG: Current permissions count:', permissions.length);
      console.log('🐛 DEBUG: Permissions:', permissions);
    } catch (error) {
      console.error('🐛 DEBUG: Datastore read failed:', error);
    }
  }

  // System Health
  async getSystemHealth(): Promise<SystemHealthCheck> {
    try {
      const [users, roles, permissions, applications] = await Promise.all([
        this.getAllUsers(),
        this.getAllRoles(),
        this.getAllPermissions(),
        this.getAllApplications(),
      ]);

      return {
        healthy: true,
        userCount: users.length,
        roleCount: roles.length,
        permissionCount: permissions.length,
        applicationCount: applications.length,
        issues: [],
      };
    } catch (error) {
      return {
        healthy: false,
        userCount: 0,
        roleCount: 0,
        permissionCount: 0,
        applicationCount: 0,
        issues: [
          `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      };
    }
  }

  // Audit Operations
  async createAuditLog(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<void> {
    const auditData: AuditLogEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    await this.createRecord("rbac_audit_logs", auditData as unknown as Record<string, unknown>);
  }

  async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLogEntry[]> {
    const response = await this.getRecords("rbac_audit_logs", filters);
    return (response.data as AuditLogEntry[]) || [];
  }
}

export const apiClient = new ApiClient();

// Global debug function for browser console
if (typeof window !== 'undefined') {
  (window as any).debugBootstrap = () => apiClient.debugBootstrap();
  (window as any).debugApiClient = apiClient;
}
