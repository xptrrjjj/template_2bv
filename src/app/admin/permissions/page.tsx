"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Info } from "lucide-react";
import {
  PermissionHeader,
  PermissionSearch,
  PermissionStats,
  PermissionTable,
  CreatePermissionDialog,
  ViewPermissionDialog,
  usePermissionManagement,
} from "./components";

export default function PermissionsPage() {
  const {
    permissions,
    allPermissions,
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
  } = usePermissionManagement();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PermissionHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={loadPermissions}
        onCreatePermission={() => setCreateModalOpen(true)}
        loading={loading}
      />
      
      <Card>
        <CardContent className="space-y-6 p-6">
          <PermissionSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          <PermissionStats permissions={allPermissions} />

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              System permissions cannot be deleted and are created during bootstrap. Custom permissions can only be deleted if they are not used by any roles.
            </AlertDescription>
          </Alert>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permission ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Used by Roles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <PermissionTable
                  permissions={permissions}
                  loading={loading}
                  onViewPermission={handleView}
                  onDeletePermission={handleDelete}
                />
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreatePermissionDialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        form={form}
        onSubmit={handleCreate}
      />

      <ViewPermissionDialog
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        permission={selectedPermission}
      />
    </div>
  );
}