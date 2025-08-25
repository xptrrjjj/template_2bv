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
import { Globe, AppWindow, Lock } from "lucide-react";
import { PermissionForm, CreatePermissionFormData } from "./PermissionForm";
import { PermissionRecord } from "@/types/rbac";
import { UseFormReturn } from "react-hook-form";

interface PermissionWithDetails extends PermissionRecord {
  roleCount: number;
  canDelete: boolean;
}

interface CreatePermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CreatePermissionFormData>;
  onSubmit: (values: CreatePermissionFormData) => void;
  isSubmitting?: boolean;
}

interface ViewPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission: PermissionWithDetails | null;
}

export function CreatePermissionDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  isSubmitting = false,
}: CreatePermissionDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Permission</DialogTitle>
          <DialogDescription>
            Create a new permission for the RBAC system.
          </DialogDescription>
        </DialogHeader>
        
        <PermissionForm
          form={form}
          onSubmit={onSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}

export function ViewPermissionDialog({
  open,
  onOpenChange,
  permission,
}: ViewPermissionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permission Details</DialogTitle>
        </DialogHeader>
        
        {permission && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Permission ID:</span>
                <code className="text-sm bg-muted px-2 py-1 rounded">{permission.permission_id}</code>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Name:</span>
                <span className="font-semibold">{permission.name}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Description:</span>
                <span className="text-right max-w-md">{permission.description}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Resource:</span>
                <Badge variant="outline" className="bg-cyan-50">{permission.resource}</Badge>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Action:</span>
                <Badge variant="outline" className="bg-orange-50">{permission.action}</Badge>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Scope:</span>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={permission.scope === "global" ? "secondary" : "default"}
                    className="flex items-center gap-1"
                  >
                    {permission.scope === "global" ? <Globe className="h-3 w-3" /> : <AppWindow className="h-3 w-3" />}
                    {permission.scope}
                  </Badge>
                  {permission.scope === "app" && permission.app_id && (
                    <span className="text-sm text-muted-foreground">({permission.app_id})</span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Type:</span>
                <Badge 
                  variant={permission.is_system_permission ? "secondary" : "default"}
                  className="flex items-center gap-1"
                >
                  <Lock className="h-3 w-3" />
                  {permission.is_system_permission ? "System Permission" : "Custom Permission"}
                </Badge>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Used by Roles:</span>
                <Badge variant={permission.roleCount > 0 ? "default" : "secondary"}>
                  {permission.roleCount} role{permission.roleCount !== 1 ? "s" : ""}
                </Badge>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Created By:</span>
                <span>{permission.created_by}</span>
              </div>
              
              <div className="flex justify-between py-2">
                <span className="font-medium">Created At:</span>
                <span>{new Date(permission.created_at).toLocaleString()}</span>
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