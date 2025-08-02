import { apiClient } from '../api';
import {
  RoleRecord,
  CreateRoleRequest,
  UpdateRoleRequest,
  ResolvedRole,
  RBACError,
  RBACErrorCode
} from '@/types/rbac';

/**
 * Role Service - Handles all role-related RBAC operations
 */
export class RoleService {
  /**
   * Get role by ID
   */
  async getRole(roleId: string): Promise<RoleRecord | null> {
    return apiClient.getRole(roleId);
  }

  /**
   * Create new role
   */
  async createRole(roleRequest: CreateRoleRequest, createdBy: string): Promise<RoleRecord> {
    // Validate permission IDs exist
    for (const permissionId of roleRequest.permission_ids) {
      const permission = await apiClient.getPermission(permissionId);
      if (!permission) {
        throw new RBACError(`Permission ${permissionId} not found`, RBACErrorCode.PERMISSION_NOT_FOUND);
      }
    }

    const role = await apiClient.createRole(roleRequest, createdBy);

    // Create audit log
    await apiClient.createAuditLog({
      user_id: createdBy,
      action: 'create',
      resource_type: 'role',
      resource_id: role.role_id,
      details: {
        name: role.name,
        scope: role.scope,
        appId: role.app_id,
        permissionCount: role.permission_ids.length,
        action: 'role_created'
      }
    });

    return role;
  }

  /**
   * Update existing role
   */
  async updateRole(roleId: string, updates: UpdateRoleRequest, updatedBy: string): Promise<RoleRecord> {
    const existingRole = await this.getRole(roleId);
    if (!existingRole) {
      throw new RBACError('Role not found', RBACErrorCode.ROLE_NOT_FOUND);
    }

    if (existingRole.is_system_role) {
      throw new RBACError('Cannot modify system role', RBACErrorCode.SYSTEM_ROLE_PROTECTED);
    }

    // Validate permission IDs if being updated
    if (updates.permission_ids) {
      for (const permissionId of updates.permission_ids) {
        const permission = await apiClient.getPermission(permissionId);
        if (!permission) {
          throw new RBACError(`Permission ${permissionId} not found`, RBACErrorCode.PERMISSION_NOT_FOUND);
        }
      }
    }

    const role = await apiClient.updateRole(roleId, updates, updatedBy);

    // Create audit log
    await apiClient.createAuditLog({
      user_id: updatedBy,
      action: 'update',
      resource_type: 'role',
      resource_id: roleId,
      details: {
        updates,
        action: 'role_updated'
      }
    });

    return role;
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: string, deletedBy: string): Promise<void> {
    const role = await this.getRole(roleId);
    if (!role) {
      throw new RBACError('Role not found', RBACErrorCode.ROLE_NOT_FOUND);
    }

    if (role.is_system_role) {
      throw new RBACError('Cannot delete system role', RBACErrorCode.SYSTEM_ROLE_PROTECTED);
    }

    // Check if any users have this role
    const allUsers = await apiClient.getAllUsers();
    const usersWithRole = allUsers.filter(user => 
      user.global_roles.includes(roleId) ||
      Object.values(user.app_roles).some(roles => roles.includes(roleId))
    );

    if (usersWithRole.length > 0) {
      throw new RBACError(
        `Cannot delete role: ${usersWithRole.length} users still have this role assigned`,
        RBACErrorCode.PERMISSION_DENIED,
        { userCount: usersWithRole.length }
      );
    }

    await apiClient.deleteRole(roleId);

    // Create audit log
    await apiClient.createAuditLog({
      user_id: deletedBy,
      action: 'delete',
      resource_type: 'role',
      resource_id: roleId,
      details: {
        name: role.name,
        scope: role.scope,
        action: 'role_deleted'
      }
    });
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<RoleRecord[]> {
    return apiClient.getAllRoles();
  }

  /**
   * Get roles by scope
   */
  async getRolesByScope(scope: RoleRecord['scope'], appId?: string): Promise<RoleRecord[]> {
    return apiClient.getRolesByScope(scope, appId);
  }

  /**
   * Get global roles
   */
  async getGlobalRoles(): Promise<RoleRecord[]> {
    return this.getRolesByScope('global');
  }

  /**
   * Get app-specific roles
   */
  async getAppRoles(appId: string): Promise<RoleRecord[]> {
    return this.getRolesByScope('app', appId);
  }

  /**
   * Get system roles (non-modifiable)
   */
  async getSystemRoles(): Promise<RoleRecord[]> {
    const allRoles = await this.getAllRoles();
    return allRoles.filter(role => role.is_system_role);
  }

  /**
   * Get custom roles (user-created)
   */
  async getCustomRoles(): Promise<RoleRecord[]> {
    const allRoles = await this.getAllRoles();
    return allRoles.filter(role => !role.is_system_role);
  }

  /**
   * Get role with resolved permissions and user count
   */
  async getResolvedRole(roleId: string): Promise<ResolvedRole | null> {
    const role = await this.getRole(roleId);
    if (!role) {
      return null;
    }

    // Get all permissions for this role
    const permissions = [];
    for (const permissionId of role.permission_ids) {
      const permission = await apiClient.getPermission(permissionId);
      if (permission) {
        permissions.push(permission);
      }
    }

    // Count users with this role
    const allUsers = await apiClient.getAllUsers();
    const userCount = allUsers.filter(user => 
      user.global_roles.includes(roleId) ||
      Object.values(user.app_roles).some(roles => roles.includes(roleId))
    ).length;

    return {
      role,
      permissions,
      userCount
    };
  }

  /**
   * Add permission to role
   */
  async addPermissionToRole(roleId: string, permissionId: string, updatedBy: string): Promise<RoleRecord> {
    const role = await this.getRole(roleId);
    if (!role) {
      throw new RBACError('Role not found', RBACErrorCode.ROLE_NOT_FOUND);
    }

    if (role.is_system_role) {
      throw new RBACError('Cannot modify system role', RBACErrorCode.SYSTEM_ROLE_PROTECTED);
    }

    const permission = await apiClient.getPermission(permissionId);
    if (!permission) {
      throw new RBACError('Permission not found', RBACErrorCode.PERMISSION_NOT_FOUND);
    }

    // Check if permission is already assigned
    if (role.permission_ids.includes(permissionId)) {
      return role; // Already has permission
    }

    const updatedPermissions = [...role.permission_ids, permissionId];
    return this.updateRole(roleId, { permission_ids: updatedPermissions }, updatedBy);
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(roleId: string, permissionId: string, updatedBy: string): Promise<RoleRecord> {
    const role = await this.getRole(roleId);
    if (!role) {
      throw new RBACError('Role not found', RBACErrorCode.ROLE_NOT_FOUND);
    }

    if (role.is_system_role) {
      throw new RBACError('Cannot modify system role', RBACErrorCode.SYSTEM_ROLE_PROTECTED);
    }

    const updatedPermissions = role.permission_ids.filter(id => id !== permissionId);
    return this.updateRole(roleId, { permission_ids: updatedPermissions }, updatedBy);
  }

  /**
   * Clone role (create copy with new ID)
   */
  async cloneRole(roleId: string, newRoleId: string, newName: string, createdBy: string): Promise<RoleRecord> {
    const sourceRole = await this.getRole(roleId);
    if (!sourceRole) {
      throw new RBACError('Source role not found', RBACErrorCode.ROLE_NOT_FOUND);
    }

    const cloneRequest: CreateRoleRequest = {
      role_id: newRoleId,
      name: newName,
      description: `Copy of ${sourceRole.name}: ${sourceRole.description}`,
      scope: sourceRole.scope,
      app_id: sourceRole.app_id,
      permission_ids: [...sourceRole.permission_ids]
    };

    return this.createRole(cloneRequest, createdBy);
  }

  /**
   * Get role usage statistics
   */
  async getRoleStats(): Promise<{
    total: number;
    global: number;
    app: number;
    system: number;
    custom: number;
  }> {
    const allRoles = await this.getAllRoles();
    
    return {
      total: allRoles.length,
      global: allRoles.filter(r => r.scope === 'global').length,
      app: allRoles.filter(r => r.scope === 'app').length,
      system: allRoles.filter(r => r.is_system_role).length,
      custom: allRoles.filter(r => !r.is_system_role).length,
    };
  }

  /**
   * Search roles by name or description
   */
  async searchRoles(query: string): Promise<RoleRecord[]> {
    const allRoles = await this.getAllRoles();
    const lowerQuery = query.toLowerCase();
    
    return allRoles.filter(role => 
      role.name.toLowerCase().includes(lowerQuery) ||
      role.description.toLowerCase().includes(lowerQuery) ||
      role.role_id.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get roles with specific permission
   */
  async getRolesWithPermission(permissionId: string): Promise<RoleRecord[]> {
    const allRoles = await this.getAllRoles();
    return allRoles.filter(role => role.permission_ids.includes(permissionId));
  }

  /**
   * Validate role hierarchy (ensure no circular dependencies)
   */
  async validateRoleHierarchy(): Promise<boolean> {
    // For now, we have a flat role structure, so no circular dependencies possible
    // This method is a placeholder for future hierarchical role support
    return true;
  }

  /**
   * Get role templates for common use cases
   */
  getRoleTemplates(): { [key: string]: Omit<CreateRoleRequest, 'role_id'> } {
    return {
      admin: {
        name: 'Administrator',
        description: 'Full administrative access within the application',
        scope: 'app',
        permission_ids: ['{app_id}.admin.*', '{app_id}.data.*', '{app_id}.dashboard.*']
      },
      editor: {
        name: 'Editor',
        description: 'Can create and edit content within the application',
        scope: 'app',
        permission_ids: ['{app_id}.data.read', '{app_id}.data.write', '{app_id}.dashboard.read']
      },
      viewer: {
        name: 'Viewer',
        description: 'Read-only access to the application',
        scope: 'app',
        permission_ids: ['{app_id}.data.read', '{app_id}.dashboard.read']
      },
      moderator: {
        name: 'Moderator',
        description: 'Can moderate content and manage basic settings',
        scope: 'app',
        permission_ids: ['{app_id}.data.*', '{app_id}.dashboard.read', '{app_id}.admin.settings']
      }
    };
  }

  /**
   * Create role from template
   */
  async createRoleFromTemplate(
    templateId: string, 
    roleId: string, 
    appId: string, 
    createdBy: string,
    customizations?: Partial<CreateRoleRequest>
  ): Promise<RoleRecord> {
    const templates = this.getRoleTemplates();
    const template = templates[templateId];
    
    if (!template) {
      throw new RBACError(`Role template ${templateId} not found`, RBACErrorCode.ROLE_NOT_FOUND);
    }

    // Replace {app_id} placeholders in permission IDs
    const permissionIds = template.permission_ids.map(id => 
      id.replace('{app_id}', appId)
    );

    const roleRequest: CreateRoleRequest = {
      role_id: roleId,
      name: customizations?.name || template.name,
      description: customizations?.description || template.description,
      scope: template.scope,
      app_id: appId,
      permission_ids: customizations?.permission_ids || permissionIds
    };

    return this.createRole(roleRequest, createdBy);
  }
}

export const roleService = new RoleService();