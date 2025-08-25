"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, X } from "lucide-react";
import { OperationFormData } from "./useDatastoreOperations";
import { TemplateSelector } from "./TemplateSelector";

interface OperationFormProps {
  form: UseFormReturn<OperationFormData>;
  onSubmit: (values: OperationFormData) => Promise<void>;
  loading: boolean;
  onClear: () => void;
  onLoadTemplate: (action: string) => void;
}

export const OperationForm: React.FC<OperationFormProps> = ({
  form,
  onSubmit,
  loading,
  onClear,
  onLoadTemplate,
}) => {
  return (
    <Card className="bg-white border-slate-200 rounded-xl shadow-sm">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5 text-[#667eea]" />
          <span className="text-base font-semibold text-slate-800">
            Datastore Operations
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-800">Identifier</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., recruitment_tool" {...field} />
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
                  <FormLabel className="font-semibold text-slate-800">Action</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="append">Append</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                      <SelectItem value="delete_all">Delete All</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-800">Data (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={12}
                      placeholder="Enter JSON data..."
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 w-full">
              <TemplateSelector onLoadTemplate={onLoadTemplate} />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClear} className="gap-1">
                  <X className="w-4 h-4" />
                  Clear
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-br from-[#667eea] to-[#764ba2] hover:from-[#5a67d8] to-[#6b5b95] border-none gap-1"
                >
                  <Send className="w-4 h-4" />
                  {loading ? "Executing..." : "Execute"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};