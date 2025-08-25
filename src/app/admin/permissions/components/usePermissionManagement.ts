"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionRecord, CreatePermissionRequest } from "@/types/rbac";
import { permissionService, roleService } from "@/services/rbac";
import { createPermissionSchema, CreatePermissionFormData } from "./PermissionForm";

interface PermissionWithDetails extends PermissionRecord {
  roleCount: number;
  canDelete: boolean;
}

export function usePermissionManagement() {
  const { toast } = useToast();
  const { rbacUser } = useAuth();
  const [permissions, setPermissions] = useState<PermissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<PermissionWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<CreatePermissionFormData>({
    resolver: zodResolver(createPermissionSchema),
    defaultValues: {
      permission_id: "",
      name: "",
      description: "",
      resource: "",
      action: "",
      scope: "global" as const,
      app_id: "",
    },
  });

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const [permissionsData, rolesData] = await Promise.all([
        permissionService.getAllPermissions(),
        roleService.getAllRoles(),
      ]);

      // Count how many roles use each permission
      const rolePermissionCounts = permissionsData.map((permission) => {
        const roleCount = rolesData.filter((role) =>
          role.permission_ids.includes(permission.permission_id)
        ).length;

        return {
          ...permission,
          roleCount,
          canDelete: !permission.is_system_permission && roleCount === 0,
        };
      });

      setPermissions(rolePermissionCounts);
    } catch (error) {
      console.error("Failed to load permissions:", error);
      toast({
        title: "Error",
        description: "Failed to load permissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const handleCreate = async (values: CreatePermissionFormData) => {
    try {
      const permissionRequest: CreatePermissionRequest = {
        permission_id: values.permission_id,
        name: values.name,
        description: values.description,
        resource: values.resource,
        action: values.action,
        scope: values.scope,
        app_id: values.scope === "app" ? values.app_id : undefined,
      };

      await permissionService.createPermission(permissionRequest, rbacUser?.microsoft_oid || "");
      toast({
        title: "Success",
        description: "Permission created successfully",
      });
      setCreateModalOpen(false);
      form.reset();
      loadPermissions();
    } catch (error) {
      console.error("Failed to create permission:", error);
      toast({
        title: "Error",
        description: "Failed to create permission",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (permissionId: string) => {
    try {
      await permissionService.deletePermission(permissionId, rbacUser?.microsoft_oid || "");
      toast({
        title: "Success",
        description: "Permission deleted successfully",
      });
      loadPermissions();
    } catch (error) {
      console.error("Failed to delete permission:", error);
      toast({
        title: "Error",
        description: "Failed to delete permission",
        variant: "destructive",
      });
    }
  };

  const handleView = (permission: PermissionWithDetails) => {
    setSelectedPermission(permission);
    setViewModalOpen(true);
  };

  const filteredPermissions = permissions.filter((permission) =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.permission_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    permissions: filteredPermissions,
    allPermissions: permissions,
    loading,
    createModalOpen,
    setCreateModalOpen,
    viewModalOpen,
    setViewModalOpen,
    selectedPermission,
    searchTerm,
    setSearchTerm,
    form,
    loadPermissions,
    handleCreate,
    handleDelete,
    handleView,
  };
}