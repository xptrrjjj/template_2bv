"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { UserRecord, RoleRecord, UserStatus } from "@/types/rbac";
import { userService, roleService } from "@/services/rbac";
import { updateUserSchema, UpdateUserForm } from "./UserForm";

interface UserWithRoles extends UserRecord {
  roleNames: string[];
}

export function useUserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  
  const form = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      status: "active",
      global_roles: [],
      is_super_admin: false,
    },
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        userService.getAllUsers(),
        roleService.getAllRoles(),
      ]);

      // Enhance users with role names
      const usersWithRoles: UserWithRoles[] = usersData.map((user) => {
        const userRoleNames: string[] = [];

        // Add global role names
        user.global_roles.forEach((roleId) => {
          const role = rolesData.find((r) => r.role_id === roleId);
          if (role) userRoleNames.push(role.name);
        });

        // Add app role names
        Object.values(user.app_roles)
          .flat()
          .forEach((roleId) => {
            const role = rolesData.find((r) => r.role_id === roleId);
            if (role && !userRoleNames.includes(role.name)) {
              userRoleNames.push(role.name);
            }
          });

        return {
          ...user,
          roleNames: userRoleNames,
        };
      });

      setUsers(usersWithRoles);
      setRoles(rolesData);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleEditUser = (user: UserWithRoles) => {
    setSelectedUser(user);
    form.reset({
      status: user.status as "active" | "inactive" | "suspended",
      global_roles: user.global_roles,
      is_super_admin: user.is_super_admin,
    });
    setEditModalVisible(true);
  };

  const handleUpdateUser = async (values: UpdateUserForm) => {
    if (!selectedUser) return;

    try {
      await userService.updateUser(selectedUser.microsoft_oid, {
        status: values.status as UserStatus,
        is_super_admin: values.is_super_admin,
      });

      // Update roles if changed
      const currentGlobalRoles = selectedUser.global_roles;
      const newGlobalRoles = values.global_roles || [];

      // Remove roles that are no longer selected
      for (const roleId of currentGlobalRoles) {
        if (!newGlobalRoles.includes(roleId)) {
          await userService.removeRole({
            user_id: selectedUser.microsoft_oid,
            role_id: roleId,
          });
        }
      }

      // Add new roles
      for (const roleId of newGlobalRoles) {
        if (!currentGlobalRoles.includes(roleId)) {
          await userService.assignRole({
            user_id: selectedUser.microsoft_oid,
            role_id: roleId,
          });
        }
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setEditModalVisible(false);
      loadUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (user: UserWithRoles) => {
    try {
      await userService.deleteUser(user.microsoft_oid);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      loadUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  return {
    users: filteredUsers,
    roles,
    loading,
    searchText,
    setSearchText,
    editModalVisible,
    setEditModalVisible,
    selectedUser,
    form,
    loadUsers,
    handleEditUser,
    handleUpdateUser,
    handleDeleteUser,
  };
}