"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PermissionGuard } from "@/components/guards";
import {
  RoleHeader,
  RoleFilters,
  RoleTable,
  CreateRoleDialog,
  EditRoleDialog,
  ViewRoleDialog,
  useRoleManagement,
} from "./components";

export default function RolesPage() {
  const {
    roles,
    allRoles,
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
  } = useRoleManagement();

  return (
    <PermissionGuard resource="roles" action="read">
      <div className="container mx-auto p-6 space-y-6">
        <RoleHeader
          onRefresh={loadRoles}
          onCreateRole={() => setCreateModalVisible(true)}
          loading={loading}
        />

        <Card>
          <CardContent className="p-6">
            <RoleFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              scopeFilter={scopeFilter}
              onScopeFilterChange={setScopeFilter}
              systemFilter={systemFilter}
              onSystemFilterChange={setSystemFilter}
              totalRoles={allRoles.length}
              filteredCount={roles.length}
              onClearFilters={clearFilters}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <RoleTable
                    roles={roles}
                    loading={loading}
                    onViewRole={handleViewRole}
                    onEditRole={handleEditRole}
                    onDeleteRole={handleDeleteRole}
                  />
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <CreateRoleDialog
          open={createModalVisible}
          onOpenChange={setCreateModalVisible}
          form={createForm}
          permissions={permissions}
          onSubmit={handleCreateRole}
        />

        <EditRoleDialog
          open={editModalVisible}
          onOpenChange={setEditModalVisible}
          form={editForm}
          permissions={permissions}
          onSubmit={handleUpdateRole}
        />

        <ViewRoleDialog
          open={viewModalVisible}
          onOpenChange={setViewModalVisible}
          role={selectedRole}
        />
      </div>
    </PermissionGuard>
  );
}
