import { apiClient } from '../api';
import { 
  UserRecord, 
  AssignUserRoleRequest, 
  RemoveUserRoleRequest,
  ResolvedUser,
  RoleRecord,
  RBACError,
  RBACErrorCode
} from '@/types/rbac';

/**
 * User Service - Handles all user-related RBAC operations
 */
export class UserService {
  /**
   * Get user by Microsoft OID
   */
  async getUser(microsoftOid: string): Promise<UserRecord | null> {
    return apiClient.getUser(microsoftOid);
  }

  /**
   * Create new user (typically called during user provisioning)
   */
  async createUser(userData: {
    microsoft_oid: string;
    email: string;
    name: string;
    global_roles?: string[];
    app_roles?: Record<string, string[]>;
    is_super_admin?: boolean;
    profile_picture?: string;
    status?: UserRecord['status'];
  }): Promise<UserRecord> {
    try {
      console.log('UserService.createUser: Input data:', userData);
      
      const user: Omit<UserRecord, 'record_id' | 'created_at' | 'updated_at'> = {
        microsoft_oid: userData.microsoft_oid,
        email: userData.email,
        name: userData.name,
        global_roles: userData.global_roles || [],
        app_roles: userData.app_roles || {},
        status: userData.status || 'active',
        is_super_admin: userData.is_super_admin || false,
        profile_picture: userData.profile_picture,
        last_login: new Date().toISOString(),
      };

      console.log('UserService.createUser: Formatted user data:', user);
      
      const result = await apiClient.createUser(user);
      console.log('UserService.createUser: API client result:', result);
      
      return result;
    } catch (error) {
      console.error('UserService.createUser: Error:', error);
      throw error;
    }
  }

  /**
   * Update existing user
   */
  async updateUser(microsoftOid: string, updates: Partial<UserRecord>): Promise<UserRecord> {
    return apiClient.updateUser(microsoftOid, updates);
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(microsoftOid: string): Promise<UserRecord> {
    return this.updateUser(microsoftOid, {
      last_login: new Date().toISOString(),
    });
  }

  /**
   * Get all users in the system
   */
  async getAllUsers(): Promise<UserRecord[]> {
    return apiClient.getAllUsers();
  }

  /**
   * Get users by status
   */
  async getUsersByStatus(status: UserRecord['status']): Promise<UserRecord[]> {
    return apiClient.getUsersByStatus(status);
  }

  /**
   * Activate user
   */
  async activateUser(microsoftOid: string): Promise<UserRecord> {
    return this.updateUser(microsoftOid, { status: 'active' });
  }

  /**
   * Deactivate user
   */
  async deactivateUser(microsoftOid: string): Promise<UserRecord> {
    return this.updateUser(microsoftOid, { status: 'inactive' });
  }

  /**
   * Suspend user
   */
  async suspendUser(microsoftOid: string): Promise<UserRecord> {
    return this.updateUser(microsoftOid, { status: 'suspended' });
  }

  /**
   * Assign role to user
   */
  async assignRole(request: AssignUserRoleRequest): Promise<void> {
    await apiClient.assignUserRole(request);
    
    // Create audit log
    await apiClient.createAuditLog({
      user_id: request.user_id,
      action: 'assign',
      resource_type: 'role_assignment',
      resource_id: request.role_id,
      details: {
        roleId: request.role_id,
        appId: request.app_id,
        action: 'role_assigned'
      }
    });
  }

  /**
   * Remove role from user
   */
  async removeRole(request: RemoveUserRoleRequest): Promise<void> {
    await apiClient.removeUserRole(request);
    
    // Create audit log
    await apiClient.createAuditLog({
      user_id: request.user_id,
      action: 'revoke',
      resource_type: 'role_assignment',
      resource_id: request.role_id,
      details: {
        roleId: request.role_id,
        appId: request.app_id,
        action: 'role_removed'
      }
    });
  }

  /**
   * Get user with resolved roles and permissions
   */
  async getResolvedUser(microsoftOid: string): Promise<ResolvedUser | null> {
    const user = await this.getUser(microsoftOid);
    if (!user) {
      return null;
    }

    // Get all global roles
    const globalRoles = [];
    for (const roleId of user.global_roles) {
      const role = await apiClient.getRole(roleId);
      if (role) globalRoles.push(role);
    }

    // Get all app-specific roles
    const appRoles: Record<string, RoleRecord[]> = {};
    for (const [appId, roleIds] of Object.entries(user.app_roles)) {
      appRoles[appId] = [];
      for (const roleId of roleIds) {
        const role = await apiClient.getRole(roleId);
        if (role) appRoles[appId].push(role);
      }
    }

    // Get all permissions from all roles
    const allPermissions = [];
    const allRoles = [...globalRoles, ...Object.values(appRoles).flat()];
    
    for (const role of allRoles) {
      for (const permissionId of role.permission_ids) {
        const permission = await apiClient.getPermission(permissionId);
        if (permission) {
          allPermissions.push({
            permission,
            sourceRoles: [role],
            isInherited: false
          });
        }
      }
    }

    return {
      user,
      globalRoles,
      appRoles,
      allPermissions
    };
  }

  /**
   * Check if user has specific role
   */
  async hasRole(microsoftOid: string, roleId: string, appId?: string): Promise<boolean> {
    const user = await this.getUser(microsoftOid);
    if (!user) {
      return false;
    }

    // Check global roles
    if (user.global_roles.includes(roleId)) {
      return true;
    }

    // Check app-specific roles
    if (appId && user.app_roles[appId]?.includes(roleId)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user is super admin
   */
  async isSuperAdmin(microsoftOid: string): Promise<boolean> {
    const user = await this.getUser(microsoftOid);
    return user?.is_super_admin || false;
  }

  /**
   * Set user as super admin
   */
  async setSuperAdmin(microsoftOid: string, isSuperAdmin: boolean): Promise<UserRecord> {
    const result = await this.updateUser(microsoftOid, { is_super_admin: isSuperAdmin });
    
    // Create audit log
    await apiClient.createAuditLog({
      user_id: microsoftOid,
      action: 'update',
      resource_type: 'user',
      resource_id: microsoftOid,
      details: {
        field: 'is_super_admin',
        newValue: isSuperAdmin,
        action: isSuperAdmin ? 'super_admin_granted' : 'super_admin_revoked'
      }
    });

    return result;
  }

  /**
   * Provision user from Microsoft authentication data
   */
  async provisionUser(microsoftData: {
    oid: string;
    email: string;
    name: string;
    profilePicture?: string;
  }): Promise<UserRecord> {
    try {
      console.log('UserService: Starting user provisioning for OID:', microsoftData.oid);
      
      // Check if user already exists
      let user = await this.getUser(microsoftData.oid);
      console.log('UserService: Existing user found:', user ? 'Yes' : 'No');
      
      if (user) {
        // Update existing user with latest Microsoft data
        console.log('UserService: Updating existing user');
        user = await this.updateUser(microsoftData.oid, {
          email: microsoftData.email,
          name: microsoftData.name,
          profile_picture: microsoftData.profilePicture,
          last_login: new Date().toISOString(),
        });
        console.log('UserService: User updated:', user);
      } else {
        // Create new user
        const defaultRole = process.env.NEXT_PUBLIC_DEFAULT_ROLE || 'app_viewer';
        const superAdminOids = (process.env.NEXT_PUBLIC_SUPER_ADMIN_OIDS || '').split(',').map(s => s.trim());
        const isSuperAdmin = superAdminOids.includes(microsoftData.oid);
        
        console.log('UserService: Creating new user with super admin status:', isSuperAdmin);
        console.log('UserService: Super admin OIDs configured:', superAdminOids);
        
        const userData = {
          microsoft_oid: microsoftData.oid,
          email: microsoftData.email,
          name: microsoftData.name,
          profile_picture: microsoftData.profilePicture,
          is_super_admin: isSuperAdmin,
          status: 'active' as const,
          // Assign default role for current app
          app_roles: isSuperAdmin ? {} : {
            [process.env.NEXT_PUBLIC_APP_ID || 'recruitment_tool']: [defaultRole]
          }
        };
        
        console.log('UserService: User data to create:', userData);
        
        user = await this.createUser(userData);
        console.log('UserService: User created:', user);

        // Create audit log for new user
        await apiClient.createAuditLog({
          user_id: microsoftData.oid,
          action: 'create',
          resource_type: 'user',
          resource_id: microsoftData.oid,
          details: {
            email: microsoftData.email,
            name: microsoftData.name,
            isSuperAdmin,
            defaultRole,
            action: 'user_provisioned'
          }
        });
      }

      console.log('UserService: Final user object:', user);
      return user;
    } catch (error) {
      console.error('UserService: Error during user provisioning:', error);
      throw error;
    }
  }

  /**
   * Delete user (rarely used - typically just deactivate instead)
   */
  async deleteUser(microsoftOid: string): Promise<void> {
    // First check if user exists
    const user = await this.getUser(microsoftOid);
    if (!user) {
      throw new RBACError('User not found', RBACErrorCode.USER_NOT_FOUND);
    }

    // Cannot delete super admin
    if (user.is_super_admin) {
      throw new RBACError('Cannot delete super admin user', RBACErrorCode.PERMISSION_DENIED);
    }

    await apiClient.deleteRecord('rbac_users', `user_${microsoftOid}`);
    
    // Create audit log
    await apiClient.createAuditLog({
      user_id: microsoftOid,
      action: 'delete',
      resource_type: 'user',
      resource_id: microsoftOid,
      details: {
        email: user.email,
        name: user.name,
        action: 'user_deleted'
      }
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    superAdmins: number;
  }> {
    const allUsers = await this.getAllUsers();
    
    return {
      total: allUsers.length,
      active: allUsers.filter(u => u.status === 'active').length,
      inactive: allUsers.filter(u => u.status === 'inactive').length,
      suspended: allUsers.filter(u => u.status === 'suspended').length,
      superAdmins: allUsers.filter(u => u.is_super_admin).length,
    };
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string): Promise<UserRecord[]> {
    const allUsers = await this.getAllUsers();
    const lowerQuery = query.toLowerCase();
    
    return allUsers.filter(user => 
      user.name.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get users with specific role
   */
  async getUsersWithRole(roleId: string, appId?: string): Promise<UserRecord[]> {
    const allUsers = await this.getAllUsers();
    
    return allUsers.filter(user => {
      // Check global roles
      if (user.global_roles.includes(roleId)) {
        return true;
      }
      
      // Check app-specific roles
      if (appId && user.app_roles[appId]?.includes(roleId)) {
        return true;
      }
      
      return false;
    });
  }
}

export const userService = new UserService();