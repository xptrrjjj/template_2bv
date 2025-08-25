"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, AppWindow } from "lucide-react";
import { RoleForm, CreateRoleFormData, EditRoleFormData } from "./RoleForm";
import { RoleRecord, PermissionRecord } from "@/types/rbac";
import { UseFormReturn } from "react-hook-form";

interface RoleWithDetails extends RoleRecord {
  permissionNames: string[];
  userCount: number;
}

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CreateRoleFormData>;
  permissions: PermissionRecord[];
  onSubmit: (values: CreateRoleFormData) => void;
  isSubmitting?: boolean;
}

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<EditRoleFormData>;
  permissions: PermissionRecord[];
  onSubmit: (values: EditRoleFormData) => void;
  isSubmitting?: boolean;
}

interface ViewRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleWithDetails | null;
}

export function CreateRoleDialog({
  open,
  onOpenChange,
  form,
  permissions,
  onSubmit,
  isSubmitting = false,
}: CreateRoleDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Create a new role with specific permissions.
          </DialogDescription>
        </DialogHeader>
        
        <RoleForm
          form={form as UseFormReturn<CreateRoleFormData | EditRoleFormData>}
          permissions={permissions}
          onSubmit={onSubmit as (values: CreateRoleFormData | EditRoleFormData) => void}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditRoleDialog({
  open,
  onOpenChange,
  form,
  permissions,
  onSubmit,
  isSubmitting = false,
}: EditRoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
          <DialogDescription>
            Update the role details and permissions.
          </DialogDescription>
        </DialogHeader>
        
        <RoleForm
          form={form as UseFormReturn<CreateRoleFormData | EditRoleFormData>}
          permissions={permissions}
          onSubmit={onSubmit as (values: CreateRoleFormData | EditRoleFormData) => void}
          onCancel={() => onOpenChange(false)}
          isEdit={true}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}

export function ViewRoleDialog({
  open,
  onOpenChange,
  role,
}: ViewRoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Role Details</DialogTitle>
        </DialogHeader>
        
        {role && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Role ID:</span>
                <code className="text-sm bg-muted px-2 py-1 rounded">{role.role_id}</code>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Name:</span>
                <span className="font-semibold">{role.name}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Description:</span>
                <span className="text-right max-w-md">{role.description}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Scope:</span>
                <Badge 
                  variant={role.scope === "global" ? "secondary" : "default"}
                  className="flex items-center gap-1"
                >
                  {role.scope === "global" ? <Globe className="h-3 w-3" /> : <AppWindow className="h-3 w-3" />}
                  {role.scope === "global" ? "Global" : `App: ${role.app_id}`}
                </Badge>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">System Role:</span>
                <span>{role.is_system_role ? "Yes" : "No"}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Created:</span>
                <span>{new Date(role.created_at).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Created By:</span>
                <span>{role.created_by}</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Permissions ({role.permission_ids.length})</h4>
              <div className="flex flex-wrap gap-2">
                {role.permissionNames.length > 0 ? (
                  role.permissionNames.map((name) => (
                    <Badge key={name} variant="outline">{name}</Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">No permissions assigned</span>
                )}
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}