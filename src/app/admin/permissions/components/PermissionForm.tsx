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
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

const createPermissionSchema = z.object({
  permission_id: z.string().min(1, "Permission ID is required").regex(/^[a-zA-Z0-9_.]+$/, "Permission ID can only contain letters, numbers, dots, and underscores"),
  name: z.string().min(1, "Display name is required"),
  description: z.string().min(1, "Description is required"),
  resource: z.string().min(1, "Resource is required"),
  action: z.string().min(1, "Action is required"),
  scope: z.enum(["global", "app"]),
  app_id: z.string().optional(),
}).refine((data) => {
  if (data.scope === "app" && !data.app_id) {
    return false;
  }
  return true;
}, {
  message: "Application ID is required for app-scoped permissions",
  path: ["app_id"],
});

type CreatePermissionFormData = z.infer<typeof createPermissionSchema>;

interface PermissionFormProps {
  form: UseFormReturn<CreatePermissionFormData>;
  onSubmit: (values: CreatePermissionFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PermissionForm({ 
  form, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: PermissionFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="permission_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Permission ID</FormLabel>
              <FormControl>
                <Input placeholder="e.g., recruitment.candidates.create" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Create Candidates" {...field} />
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
                  placeholder="Describe what this permission allows users to do..."
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="resource"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resource</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., candidates" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="action"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Action</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="write">Write</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="*">All (*)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="scope"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scope</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
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
                  <Input placeholder="e.g., antd_recruiter" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
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
            Create Permission
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export { createPermissionSchema };
export type { CreatePermissionFormData };