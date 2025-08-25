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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { PermissionRecord } from "@/types/rbac";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

const createRoleSchema = z.object({
  role_id: z.string().min(1, "Role ID is required").regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores allowed"),
  name: z.string().min(1, "Role name is required"),
  description: z.string().min(1, "Description is required"),
  scope: z.enum(["global", "app"]),
  app_id: z.string().optional(),
  permission_ids: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.scope === "app" && !data.app_id) {
    return false;
  }
  return true;
}, {
  message: "Application ID is required for app-scoped roles",
  path: ["app_id"],
});

const editRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().min(1, "Description is required"),
  permission_ids: z.array(z.string()).optional(),
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;
type EditRoleFormData = z.infer<typeof editRoleSchema>;

interface RoleFormProps {
  form: UseFormReturn<CreateRoleFormData | EditRoleFormData>;
  permissions: PermissionRecord[];
  onSubmit: (values: CreateRoleFormData | EditRoleFormData) => void;
  onCancel: () => void;
  isEdit?: boolean;
  isSubmitting?: boolean;
}

export function RoleForm({ 
  form, 
  permissions, 
  onSubmit, 
  onCancel, 
  isEdit = false,
  isSubmitting = false 
}: RoleFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!isEdit && (
          <FormField
            control={form.control}
            name="role_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role ID</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., custom_admin" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Custom Administrator" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  rows={3}
                  placeholder="Describe the role's purpose and responsibilities"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {!isEdit && (
          <>
            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scope</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role scope" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="global">Global (System-wide)</SelectItem>
                      <SelectItem value="app">Application-specific</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch("scope") === "app" && (
              <FormField
                control={form.control}
                name="app_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., recruitment_tool" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}
        
        <FormField
          control={form.control}
          name="permission_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Permissions {isEdit ? '' : '(Optional)'}</FormLabel>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {permissions.map((permission) => (
                  <div key={permission.permission_id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`${isEdit ? 'edit-' : ''}${permission.permission_id}`}
                      checked={field.value?.includes(permission.permission_id) || false}
                      onChange={(e) => {
                        const currentValue = field.value || [];
                        if (e.target.checked) {
                          field.onChange([...currentValue, permission.permission_id]);
                        } else {
                          field.onChange(currentValue.filter((id: string) => id !== permission.permission_id));
                        }
                      }}
                      className="rounded border border-gray-300"
                    />
                    <label htmlFor={`${isEdit ? 'edit-' : ''}${permission.permission_id}`} className="text-sm">
                      {permission.name} ({permission.permission_id})
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isEdit ? 'Update Role' : 'Create Role'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export { createRoleSchema, editRoleSchema };
export type { CreateRoleFormData, EditRoleFormData };