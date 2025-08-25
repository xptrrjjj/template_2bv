"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { RoleRecord, PermissionRecord, CreateRoleRequest } from "@/types/rbac";
import { roleService, permissionService, userService } from "@/services/rbac";
import { 
  createRoleSchema, 
  editRoleSchema, 
  CreateRoleFormData, 
  EditRoleFormData 
} from "./RoleForm";

interface RoleWithDetails extends RoleRecord {
  permissionNames: string[];
  userCount: number;
}

export function useRoleManagement() {
  const { toast } = useToast();
  const { rbacUser } = useAuth();
  const [roles, setRoles] = useState<RoleWithDetails[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'global' | 'app'>('all');
  const [systemFilter, setSystemFilter] = useState<'all' | 'system' | 'custom'>('all');

  const createForm = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      role_id: "",
      name: "",
      description: "",
      scope: "global" as const,
      app_id: "",
      permission_ids: [],
    },
  });
  
  const editForm = useForm<EditRoleFormData>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      permission_ids: [],
    },
  });

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData] = await Promise.all([
        roleService.getAllRoles(),
        permissionService.getAllPermissions(),
      ]);

      // Enhance roles with permission names and user counts
      const rolesWithDetails: RoleWithDetails[] = await Promise.all(
        rolesData.map(async (role) => {
          const rolePermissions = role.permission_ids
            .map((permId) => permissionsData.find((p) => p.permission_id === permId))
            .filter(Boolean) as PermissionRecord[];

          // Get actual user count for this role
          const usersWithRole = await userService.getUsersWithRole(
            role.role_id,
            role.scope === 'app' ? role.app_id : undefined
          );

          return {
            ...role,
            permissionNames: rolePermissions.map((p) => p.name),
            userCount: usersWithRole.length,
          };
        })
      );

      setRoles(rolesWithDetails);
      setPermissions(permissionsData);
    } catch (error) {
      console.error("Failed to load roles:", error);
      toast({
        title: "Error",
        description: "Failed to load roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleCreateRole = async (values: CreateRoleFormData) => {
    try {
      const roleRequest: CreateRoleRequest = {
        role_id: values.role_id,
        name: values.name,
        description: values.description,
        scope: values.scope,
        app_id: values.scope === "app" ? values.app_id : undefined,
        permission_ids: values.permission_ids || [],
      };

      await roleService.createRole(roleRequest, rbacUser?.microsoft_oid || "");
      toast({
        title: "Success",
        description: "Role created successfully",
      });
      setCreateModalVisible(false);
      createForm.reset();
      loadRoles();
    } catch (error) {
      console.error("Failed to create role:", error);
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    }
  };

  const handleEditRole = (role: RoleWithDetails) => {
    setSelectedRole(role);
    editForm.reset({
      name: role.name,
      description: role.description,
      permission_ids: role.permission_ids,
    });
    setEditModalVisible(true);
  };

  const handleUpdateRole = async (values: EditRoleFormData) => {
    if (!selectedRole) return;

    try {
      await roleService.updateRole(
        selectedRole.role_id,
        {
          name: values.name,
          description: values.description,
          permission_ids: values.permission_ids || [],
        },
        rbacUser?.microsoft_oid || ""
      );

      toast({
        title: "Success",
        description: "Role updated successfully",
      });
      setEditModalVisible(false);
      loadRoles();
    } catch (error) {
      console.error("Failed to update role:", error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (role: RoleWithDetails) => {
    try {
      await roleService.deleteRole(role.role_id, rbacUser?.microsoft_oid || "");
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
      loadRoles();
    } catch (error) {
      console.error("Failed to delete role:", error);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  const handleViewRole = (role: RoleWithDetails) => {
    setSelectedRole(role);
    setViewModalVisible(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setScopeFilter('all');
    setSystemFilter('all');
  };

  // Filter roles based on search and filters
  const filteredRoles = roles.filter(role => {
    const matchesSearch = !searchTerm || 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.role_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.permissionNames.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesScope = scopeFilter === 'all' || role.scope === scopeFilter;
    const matchesSystem = systemFilter === 'all' || 
      (systemFilter === 'system' && role.is_system_role) ||
      (systemFilter === 'custom' && !role.is_system_role);
    
    return matchesSearch && matchesScope && matchesSystem;
  });

  return {
    roles: filteredRoles,
    allRoles: roles,
    permissions,
    loading,
    createModalVisible,
    setCreateModalVisible,
    editModalVisible,
    setEditModalVisible,
    viewModalVisible,
    setViewModalVisible,
    selectedRole,
    searchTerm,
    setSearchTerm,
    scopeFilter,
    setScopeFilter,
    systemFilter,
    setSystemFilter,
    createForm,
    editForm,
    loadRoles,
    handleCreateRole,
    handleEditRole,
    handleUpdateRole,
    handleDeleteRole,
    handleViewRole,
    clearFilters,
  };
}