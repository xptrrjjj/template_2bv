"use client";

import React from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { PermissionGuard } from "@/components/guards";
import { RoleRecord } from "@/types/rbac";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

const updateUserSchema = z.object({
  status: z.enum(["active", "inactive", "suspended"]),
  global_roles: z.array(z.string()).optional(),
  is_super_admin: z.boolean(),
});

type UpdateUserForm = z.infer<typeof updateUserSchema>;

interface UserFormProps {
  form: UseFormReturn<UpdateUserForm>;
  roles: RoleRecord[];
  onSubmit: (values: UpdateUserForm) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function UserForm({ 
  form, 
  roles, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: UserFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="global_roles"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Global Roles</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.[0]}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select global roles" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles
                    .filter((role) => role.scope === "global")
                    .map((role) => (
                      <SelectItem key={role.role_id} value={role.role_id}>
                        {role.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <PermissionGuard resource="system" action="admin" showFallback={false}>
          <FormField
            control={form.control}
            name="is_super_admin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Super Administrator</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "true")}
                  defaultValue={field.value ? "true" : "false"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select admin status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </PermissionGuard>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Update User
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export { updateUserSchema };
export type { UpdateUserForm };