"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserForm, UpdateUserForm } from "./UserForm";
import { RoleRecord, UserRecord } from "@/types/rbac";
import { UseFormReturn } from "react-hook-form";

interface UserWithRoles extends UserRecord {
  roleNames: string[];
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: UserWithRoles | null;
  form: UseFormReturn<UpdateUserForm>;
  roles: RoleRecord[];
  onSubmit: (values: UpdateUserForm) => void;
  isSubmitting?: boolean;
}

export function UserDialog({
  open,
  onOpenChange,
  selectedUser,
  form,
  roles,
  onSubmit,
  isSubmitting = false,
}: UserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user status, roles, and permissions.
          </DialogDescription>
        </DialogHeader>
        {selectedUser && (
          <UserForm
            form={form}
            roles={roles}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}