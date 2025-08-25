"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { PermissionGuard } from "@/components/guards";
import { 
  UserHeader, 
  UserTable, 
  UserDialog, 
  useUserManagement 
} from "./components";

export default function UsersPage() {
  const {
    users,
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
  } = useUserManagement();

  return (
    <PermissionGuard resource="users" action="read">
      <div className="p-8 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <UserHeader
            searchText={searchText}
            onSearchChange={setSearchText}
            onRefresh={loadUsers}
            loading={loading}
          />

          <Card>
            <div className="p-6">
              <UserTable
                users={users}
                loading={loading}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
              />
            </div>
          </Card>

          <UserDialog
            open={editModalVisible}
            onOpenChange={setEditModalVisible}
            selectedUser={selectedUser}
            form={form}
            roles={roles}
            onSubmit={handleUpdateUser}
          />
        </div>
      </div>
    </PermissionGuard>
  );
}