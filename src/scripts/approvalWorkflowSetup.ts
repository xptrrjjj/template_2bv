import { apiClient } from "../services/api";
import { CreatePermissionRequest, CreateRoleRequest } from "@/types/rbac";

/**
 * Approval Workflow Setup Script
 * Creates custom roles and permissions for job role approval workflow
 * This is app-specific and separate from the main bootstrap system
 */

const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_ID || 'antd_recruiter';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'AntD Recruiter';

// Define approval workflow permissions
export const APPROVAL_WORKFLOW_PERMISSIONS: CreatePermissionRequest[] = [
  // Job Role Approval Permissions
  {
    permission_id: `${APP_IDENTIFIER}.job_roles.approve_data_collection`,
    name: "Approve Data Collection",
    description: "Approve transition from data_collection status",
    resource: "job_roles",
    action: "approve_data_collection",
    scope: "app",
    app_id: APP_IDENTIFIER,
  },
  {
    permission_id: `${APP_IDENTIFIER}.job_roles.approve_test_setup`,
    name: "Approve Test Setup",
    description: "Approve transition from test_setup status",
    resource: "job_roles",
    action: "approve_test_setup",
    scope: "app",
    app_id: APP_IDENTIFIER,
  },
  {
    permission_id: `${APP_IDENTIFIER}.job_roles.approve_management_review`,
    name: "Approve Management Review",
    description: "Approve transition from management_review status",
    resource: "job_roles",
    action: "approve_management_review",
    scope: "app",
    app_id: APP_IDENTIFIER,
  },
  {
    permission_id: `${APP_IDENTIFIER}.job_roles.approve_publish`,
    name: "Approve Publishing",
    description: "Approve transition to published status",
    resource: "job_roles",
    action: "approve_publish",
    scope: "app",
    app_id: APP_IDENTIFIER,
  },
  
  // Job Role Management Permissions
  {
    permission_id: `${APP_IDENTIFIER}.job_roles.view_all_statuses`,
    name: "View All Job Role Statuses",
    description: "View roles in any status across the workflow",
    resource: "job_roles",
    action: "view_all_statuses",
    scope: "app",
    app_id: APP_IDENTIFIER,
  },
  {
    permission_id: `${APP_IDENTIFIER}.job_roles.manage_draft`,
    name: "Manage Draft Job Roles",
    description: "Create and edit roles in draft status",
    resource: "job_roles",
    action: "manage_draft",
    scope: "app",
    app_id: APP_IDENTIFIER,
  },
  {
    permission_id: `${APP_IDENTIFIER}.job_roles.manage_data_collection`,
    name: "Manage Data Collection",
    description: "Edit roles in data_collection status",
    resource: "job_roles",
    action: "manage_data_collection",
    scope: "app",
    app_id: APP_IDENTIFIER,
  },
  {
    permission_id: `${APP_IDENTIFIER}.job_roles.manage_test_setup`,
    name: "Manage Test Setup",
    description: "Configure test parameters and interview setup",
    resource: "job_roles",
    action: "manage_test_setup",
    scope: "app",
    app_id: APP_IDENTIFIER,
  },
  {
    permission_id: `${APP_IDENTIFIER}.job_roles.view_approval_history`,
    name: "View Approval History",
    description: "View approval audit trail and history",
    resource: "job_roles",
    action: "view_approval_history",
    scope: "app",
    app_id: APP_IDENTIFIER,
  },
  {
    permission_id: `${APP_IDENTIFIER}.job_roles.override_workflow`,
    name: "Override Workflow",
    description: "Bypass approval workflow in emergency situations",
    resource: "job_roles",
    action: "override_workflow",
    scope: "app",
    app_id: APP_IDENTIFIER,
  },
];

// Define approval workflow roles
export const APPROVAL_WORKFLOW_ROLES: CreateRoleRequest[] = [
  {
    role_id: `${APP_IDENTIFIER}_recruiter`,
    name: "Recruiter",
    description: "Manages job roles through data collection phase",
    scope: "app",
    app_id: APP_IDENTIFIER,
    permission_ids: [
      `${APP_IDENTIFIER}.job_roles.approve_data_collection`,
      `${APP_IDENTIFIER}.job_roles.manage_draft`,
      `${APP_IDENTIFIER}.job_roles.manage_data_collection`,
      `${APP_IDENTIFIER}.data.read`,
      `${APP_IDENTIFIER}.data.write`,
    ],
  },
  {
    role_id: `${APP_IDENTIFIER}_hr_manager`,
    name: "HR Manager",
    description: "Approves test setup and manages HR-related configurations",
    scope: "app",
    app_id: APP_IDENTIFIER,
    permission_ids: [
      // Inherit all recruiter permissions
      `${APP_IDENTIFIER}.job_roles.approve_data_collection`,
      `${APP_IDENTIFIER}.job_roles.manage_draft`,
      `${APP_IDENTIFIER}.job_roles.manage_data_collection`,
      // Additional HR Manager permissions
      `${APP_IDENTIFIER}.job_roles.approve_test_setup`,
      `${APP_IDENTIFIER}.job_roles.manage_test_setup`,
      `${APP_IDENTIFIER}.job_roles.view_all_statuses`,
      `${APP_IDENTIFIER}.admin.users`,
      `${APP_IDENTIFIER}.data.read`,
      `${APP_IDENTIFIER}.data.write`,
    ],
  },
  {
    role_id: `${APP_IDENTIFIER}_recruitment_lead`,
    name: "Recruitment Lead",
    description: "Approves management review and oversees recruitment process",
    scope: "app",
    app_id: APP_IDENTIFIER,
    permission_ids: [
      // Inherit all HR Manager permissions
      `${APP_IDENTIFIER}.job_roles.approve_data_collection`,
      `${APP_IDENTIFIER}.job_roles.manage_draft`,
      `${APP_IDENTIFIER}.job_roles.manage_data_collection`,
      `${APP_IDENTIFIER}.job_roles.approve_test_setup`,
      `${APP_IDENTIFIER}.job_roles.manage_test_setup`,
      `${APP_IDENTIFIER}.job_roles.view_all_statuses`,
      // Additional Recruitment Lead permissions
      `${APP_IDENTIFIER}.job_roles.approve_management_review`,
      `${APP_IDENTIFIER}.job_roles.view_approval_history`,
      `${APP_IDENTIFIER}.admin.users`,
      `${APP_IDENTIFIER}.data.read`,
      `${APP_IDENTIFIER}.data.write`,
    ],
  },
  {
    role_id: `${APP_IDENTIFIER}_director`,
    name: "Director",
    description: "Final approval for publishing with strategic oversight",
    scope: "app",
    app_id: APP_IDENTIFIER,
    permission_ids: [
      // Inherit all Recruitment Lead permissions
      `${APP_IDENTIFIER}.job_roles.approve_data_collection`,
      `${APP_IDENTIFIER}.job_roles.manage_draft`,
      `${APP_IDENTIFIER}.job_roles.manage_data_collection`,
      `${APP_IDENTIFIER}.job_roles.approve_test_setup`,
      `${APP_IDENTIFIER}.job_roles.manage_test_setup`,
      `${APP_IDENTIFIER}.job_roles.view_all_statuses`,
      `${APP_IDENTIFIER}.job_roles.approve_management_review`,
      `${APP_IDENTIFIER}.job_roles.view_approval_history`,
      // Additional Director permissions
      `${APP_IDENTIFIER}.job_roles.approve_publish`,
      `${APP_IDENTIFIER}.job_roles.override_workflow`,
      `${APP_IDENTIFIER}.admin.users`,
      `${APP_IDENTIFIER}.admin.settings`,
      `${APP_IDENTIFIER}.data.read`,
      `${APP_IDENTIFIER}.data.write`,
      `${APP_IDENTIFIER}.data.delete`,
    ],
  },
];

export interface ApprovalWorkflowSetupResult {
  success: boolean;
  permissionsCreated: number;
  rolesCreated: number;
  errors: string[];
  details: {
    permissions: { id: string; status: 'created' | 'existed' | 'failed' }[];
    roles: { id: string; status: 'created' | 'existed' | 'failed' }[];
  };
}

/**
 * Setup approval workflow permissions and roles
 */
export async function setupApprovalWorkflow(createdBy: string = "admin"): Promise<ApprovalWorkflowSetupResult> {
  console.log('🚀 Starting approval workflow setup...');
  
  const result: ApprovalWorkflowSetupResult = {
    success: true,
    permissionsCreated: 0,
    rolesCreated: 0,
    errors: [],
    details: {
      permissions: [],
      roles: [],
    },
  };

  // Create permissions first
  console.log('📋 Creating approval workflow permissions...');
  for (const permission of APPROVAL_WORKFLOW_PERMISSIONS) {
    try {
      // Check if permission already exists
      const existing = await apiClient.getPermission(permission.permission_id);
      if (existing) {
        console.log(`✅ Permission already exists: ${permission.permission_id}`);
        result.details.permissions.push({ id: permission.permission_id, status: 'existed' });
      } else {
        await apiClient.createPermission(permission, createdBy);
        console.log(`✨ Created permission: ${permission.permission_id}`);
        result.permissionsCreated++;
        result.details.permissions.push({ id: permission.permission_id, status: 'created' });
      }
    } catch (error) {
      const errorMsg = `Failed to create permission ${permission.permission_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌', errorMsg);
      result.errors.push(errorMsg);
      result.success = false;
      result.details.permissions.push({ id: permission.permission_id, status: 'failed' });
    }
  }

  // Create roles
  console.log('👥 Creating approval workflow roles...');
  for (const role of APPROVAL_WORKFLOW_ROLES) {
    try {
      // Check if role already exists
      const existing = await apiClient.getRole(role.role_id);
      if (existing) {
        console.log(`✅ Role already exists: ${role.role_id}`);
        result.details.roles.push({ id: role.role_id, status: 'existed' });
      } else {
        await apiClient.createRole(role, createdBy);
        console.log(`✨ Created role: ${role.role_id}`);
        result.rolesCreated++;
        result.details.roles.push({ id: role.role_id, status: 'created' });
      }
    } catch (error) {
      const errorMsg = `Failed to create role ${role.role_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌', errorMsg);
      result.errors.push(errorMsg);
      result.success = false;
      result.details.roles.push({ id: role.role_id, status: 'failed' });
    }
  }

  console.log('🎉 Approval workflow setup completed:', {
    success: result.success,
    permissionsCreated: result.permissionsCreated,
    rolesCreated: result.rolesCreated,
    errors: result.errors.length,
  });

  return result;
}

/**
 * Remove all approval workflow permissions and roles
 */
export async function wipeApprovalWorkflow(deletedBy: string = "admin"): Promise<ApprovalWorkflowSetupResult> {
  console.log('🧹 Starting approval workflow wipe...');
  
  const result: ApprovalWorkflowSetupResult = {
    success: true,
    permissionsCreated: 0, // Will use as deleted count
    rolesCreated: 0, // Will use as deleted count
    errors: [],
    details: {
      permissions: [],
      roles: [],
    },
  };

  // Delete roles first (they depend on permissions)
  console.log('🗑️ Deleting approval workflow roles...');
  for (const role of APPROVAL_WORKFLOW_ROLES) {
    try {
      const existing = await apiClient.getRole(role.role_id);
      if (existing) {
        await apiClient.deleteRole(role.role_id, deletedBy);
        console.log(`🗑️ Deleted role: ${role.role_id}`);
        result.rolesCreated++; // Using as deleted count
        result.details.roles.push({ id: role.role_id, status: 'created' }); // Using as deleted status
      } else {
        console.log(`ℹ️ Role doesn't exist: ${role.role_id}`);
        result.details.roles.push({ id: role.role_id, status: 'existed' });
      }
    } catch (error) {
      const errorMsg = `Failed to delete role ${role.role_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌', errorMsg);
      result.errors.push(errorMsg);
      result.success = false;
      result.details.roles.push({ id: role.role_id, status: 'failed' });
    }
  }

  // Delete permissions
  console.log('🗑️ Deleting approval workflow permissions...');
  for (const permission of APPROVAL_WORKFLOW_PERMISSIONS) {
    try {
      const existing = await apiClient.getPermission(permission.permission_id);
      if (existing) {
        await apiClient.deletePermission(permission.permission_id, deletedBy);
        console.log(`🗑️ Deleted permission: ${permission.permission_id}`);
        result.permissionsCreated++; // Using as deleted count
        result.details.permissions.push({ id: permission.permission_id, status: 'created' }); // Using as deleted status
      } else {
        console.log(`ℹ️ Permission doesn't exist: ${permission.permission_id}`);
        result.details.permissions.push({ id: permission.permission_id, status: 'existed' });
      }
    } catch (error) {
      const errorMsg = `Failed to delete permission ${permission.permission_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌', errorMsg);
      result.errors.push(errorMsg);
      result.success = false;
      result.details.permissions.push({ id: permission.permission_id, status: 'failed' });
    }
  }

  console.log('🧹 Approval workflow wipe completed:', {
    success: result.success,
    permissionsDeleted: result.permissionsCreated,
    rolesDeleted: result.rolesCreated,
    errors: result.errors.length,
  });

  return result;
}

/**
 * Check if approval workflow is already set up
 */
export async function isApprovalWorkflowSetup(): Promise<boolean> {
  try {
    console.log('🔍 Checking approval workflow setup status...');
    
    // Check if at least one role and one permission exist
    const sampleRole = await apiClient.getRole(`${APP_IDENTIFIER}_recruiter`);
    const samplePermission = await apiClient.getPermission(`${APP_IDENTIFIER}.job_roles.approve_data_collection`);
    
    const isSetup = !!(sampleRole && samplePermission);
    console.log('🔍 Approval workflow setup status:', isSetup);
    
    return isSetup;
  } catch (error) {
    console.error('Error checking approval workflow setup:', error);
    return false;
  }
}