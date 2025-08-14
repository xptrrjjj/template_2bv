# Job Role Approval Workflow - Permissions & Roles Guide

This document outlines the custom permissions and roles created for the job role approval workflow system in the AntD Recruiter application.

## Overview

The approval workflow enforces role-based permissions for job role transitions through different approval stages:

1. **Data Collection** → **Recruiter approval**
2. **Test Setup** → **HR Manager approval** 
3. **Management Review** → **Recruitment Lead approval**
4. **Ready to Publish** → **Director approval**

## Job Role Status Flow

```
draft → data_collection → test_setup → management_review → ready_to_publish → published_to_teamtailor → active
         ↑ Recruiter      ↑ HR Manager    ↑ Recruitment Lead    ↑ Director
```

## Setup Instructions

### Automatic Setup
1. Navigate to **Admin → Permissions** page
2. Look for the **Job Role Approval Workflow** card
3. Click **"Setup Approval Workflow"** button
4. The system will create all required permissions and roles automatically

### Manual Removal
To remove the workflow:
1. Click **"Wipe Approval Workflow"** button (only visible when setup is complete)
2. Confirm the action - this will remove all workflow-specific roles and permissions

---

## Permissions Reference

### Approval Permissions
These permissions control who can approve transitions between workflow stages:

| Permission ID | Name | Description | Required For |
|---------------|------|-------------|--------------|
| `antd_recruiter.job_roles.approve_data_collection` | Approve Data Collection | Approve transition from data_collection status | Recruiters+ |
| `antd_recruiter.job_roles.approve_test_setup` | Approve Test Setup | Approve transition from test_setup status | HR Managers+ |
| `antd_recruiter.job_roles.approve_management_review` | Approve Management Review | Approve transition from management_review status | Recruitment Leads+ |
| `antd_recruiter.job_roles.approve_publish` | Approve Publishing | Approve transition to published status | Directors |

### Management Permissions
These permissions control who can manage job roles at different stages:

| Permission ID | Name | Description | Use Case |
|---------------|------|-------------|----------|
| `antd_recruiter.job_roles.view_all_statuses` | View All Job Role Statuses | View roles in any status across workflow | HR oversight |
| `antd_recruiter.job_roles.manage_draft` | Manage Draft Job Roles | Create and edit roles in draft status | Initial role creation |
| `antd_recruiter.job_roles.manage_data_collection` | Manage Data Collection | Edit roles in data_collection status | Data gathering phase |
| `antd_recruiter.job_roles.manage_test_setup` | Manage Test Setup | Configure test parameters and interview setup | Interview configuration |
| `antd_recruiter.job_roles.view_approval_history` | View Approval History | View approval audit trail and history | Audit and compliance |
| `antd_recruiter.job_roles.override_workflow` | Override Workflow | Bypass approval workflow in emergency | Emergency situations |

---

## Roles Reference

### Role Hierarchy
```
Director (highest authority)
├── All lower-level permissions
├── Final publishing approval
└── Emergency workflow override

Recruitment Lead
├── All HR Manager permissions
├── Management review approval
└── Approval history access

HR Manager  
├── All Recruiter permissions
├── Test setup approval
├── User management
└── Cross-status visibility

Recruiter (entry level)
├── Data collection approval
├── Draft management
└── Basic data operations
```

### Detailed Role Permissions

#### 1. Recruiter (`antd_recruiter_recruiter`)
**Purpose**: Manages job roles through the data collection phase

**Permissions**:
- `antd_recruiter.job_roles.approve_data_collection` - Approve data collection completion
- `antd_recruiter.job_roles.manage_draft` - Create and edit draft roles
- `antd_recruiter.job_roles.manage_data_collection` - Manage roles in data collection
- `antd_recruiter.data.read` - Read application data
- `antd_recruiter.data.write` - Create/update application data

**Typical Users**: Recruitment coordinators, junior recruiters

#### 2. HR Manager (`antd_recruiter_hr_manager`)
**Purpose**: Approves test setup and manages HR-related configurations

**Permissions** (Inherits all Recruiter permissions plus):
- `antd_recruiter.job_roles.approve_test_setup` - Approve test configurations
- `antd_recruiter.job_roles.manage_test_setup` - Configure interview processes
- `antd_recruiter.job_roles.view_all_statuses` - View roles across all stages
- `antd_recruiter.admin.users` - Manage application users

**Typical Users**: HR managers, senior HR coordinators

#### 3. Recruitment Lead (`antd_recruiter_recruitment_lead`)
**Purpose**: Approves management review and oversees recruitment process

**Permissions** (Inherits all HR Manager permissions plus):
- `antd_recruiter.job_roles.approve_management_review` - Approve strategic reviews
- `antd_recruiter.job_roles.view_approval_history` - Access audit trails

**Typical Users**: Recruitment team leads, senior recruiters

#### 4. Director (`antd_recruiter_director`)
**Purpose**: Final approval for publishing with strategic oversight

**Permissions** (Inherits all Recruitment Lead permissions plus):
- `antd_recruiter.job_roles.approve_publish` - Final publishing approval
- `antd_recruiter.job_roles.override_workflow` - Emergency workflow bypass
- `antd_recruiter.admin.settings` - Manage application settings  
- `antd_recruiter.data.delete` - Delete application data

**Typical Users**: Directors, VPs, C-level executives

---

## Implementation Details

### Permission Scope
- **Scope**: `app` (application-specific)
- **App ID**: `antd_recruiter` (from `NEXT_PUBLIC_APP_IDENTIFIER`)
- **Resource**: `job_roles`
- **Actions**: Various approval and management actions

### Role Scope
- **Scope**: `app` (application-specific)  
- **App ID**: `antd_recruiter`
- **Inheritance**: Each higher role inherits all lower-level permissions

### Audit & Compliance
- All approvals are logged with metadata (approver, timestamp, comments)
- Approval history is accessible to Recruitment Leads and above
- System maintains audit trail for compliance requirements

---

## Usage Examples

### Setting Up a New Hire Process
1. **Recruiter** creates job role in draft status
2. **Recruiter** completes data collection and requests approval
3. **HR Manager** reviews and approves test setup
4. **Recruitment Lead** conducts management review and approval
5. **Director** gives final approval to publish
6. Job role moves to `published_to_teamtailor` status

### Emergency Situations
- **Directors** can use `override_workflow` permission to bypass normal approval flow
- Useful for urgent roles or when approvers are unavailable
- Override actions are logged for audit purposes

### User Assignment Best Practices
1. **Start with minimal permissions** - assign lowest appropriate role
2. **Review regularly** - ensure users have appropriate access levels
3. **Use temporary elevation** - for vacation coverage or special projects
4. **Monitor audit logs** - track permission usage and approvals

---

## Troubleshooting

### Setup Issues
- Ensure user has `system.permissions.write` permission to run setup
- Check console logs for specific error messages
- Verify datastore connectivity

### Permission Denied
- Check user's assigned roles in Admin → Users
- Verify role has required permissions in Admin → Roles
- Confirm workflow setup is complete

### Approval Blocked
- Verify approver has correct role assignment
- Check if job role is in correct status for approval
- Review approval history for previous actions

---

## Security Considerations

### System Protection
- Workflow roles cannot be deleted if assigned to users
- System permissions are protected from accidental deletion
- Approval permissions require explicit assignment

### Access Control
- Users can only approve stages their role allows
- Higher roles inherit lower permissions (hierarchical)
- Emergency overrides are logged and audited

### Best Practices
- Regular access reviews and role assignments
- Principle of least privilege
- Monitor approval patterns for unusual activity
- Keep approval workflow documentation updated

---

## Related Documentation
- [DATASTORE_USAGE_GUIDE.md](DATASTORE_USAGE_GUIDE.md) - Data structure patterns
- [ROLES.md](ROLES.md) - General RBAC role management
- Admin → Permissions page - Live permission management interface