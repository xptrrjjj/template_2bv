"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Send, X, Zap } from "lucide-react";
import { apiClient } from "@/services/api";
import { DatastoreAction } from "@/types/datastore";

const formSchema = z.object({
  identifier: z.string().min(1, "Please enter identifier"),
  action: z.string().min(1, "Please select action"),
  data: z.string().min(1, "Please enter data").refine((value) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, "Invalid JSON format"),
});

type FormData = z.infer<typeof formSchema>;

interface TestResult {
  operation: string;
  timestamp: string;
  request: unknown;
  response: unknown;
  status: "success" | "error";
  error?: string;
}

interface DatastoreOperationFormProps {
  onResult: (result: TestResult) => void;
}

const testTemplates = {
  create: {
    identifier: process.env.NEXT_PUBLIC_APP_IDENTIFIER || "antd_recruiter",
    action: "create" as DatastoreAction,
    data: {
      app_id: "test_candidates",
      record_id: "candidate_001",
      name: "John Doe",
      email: "john.doe@example.com",
      position: "Senior Developer",
      status: "active",
      skills: ["JavaScript", "React", "Node.js"],
      experience_years: 5,
    },
  },
  update: {
    identifier: process.env.NEXT_PUBLIC_APP_IDENTIFIER || "antd_recruiter",
    action: "update" as DatastoreAction,
    data: {
      record_id: "candidate_001",
      status: "interviewed",
      interview_date: "2024-01-15",
      notes: "Strong technical skills",
    },
  },
  append: {
    identifier: process.env.NEXT_PUBLIC_APP_IDENTIFIER || "antd_recruiter",
    action: "append" as DatastoreAction,
    data: {
      record_id: "candidate_001",
      certifications: ["AWS Certified", "React Certified"],
      last_updated: new Date().toISOString(),
    },
  },
  delete: {
    identifier: process.env.NEXT_PUBLIC_APP_IDENTIFIER || "antd_recruiter",
    action: "delete" as DatastoreAction,
    data: {
      record_id: "candidate_001",
    },
  },
  delete_all: {
    identifier: process.env.NEXT_PUBLIC_APP_IDENTIFIER || "antd_recruiter",
    action: "delete_all" as DatastoreAction,
    data: {},
  },
};

export const DatastoreOperationForm: React.FC<DatastoreOperationFormProps> = ({ onResult }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: process.env.NEXT_PUBLIC_APP_IDENTIFIER || "antd_recruiter",
      action: "create",
      data: "{}",
    },
  });

  const handleSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      const requestData = {
        identifier: values.identifier,
        action: values.action as DatastoreAction,
        data: JSON.parse(values.data),
      };

      const response = await apiClient.datastoreCreate(requestData);

      onResult({
        operation: `${values.action.toUpperCase()} Operation`,
        timestamp: new Date().toISOString(),
        request: requestData,
        response,
        status: "success",
      });

      toast({
        title: "Operation Successful",
        description: `${values.action} operation completed successfully`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      onResult({
        operation: `${values.action.toUpperCase()} Operation`,
        timestamp: new Date().toISOString(),
        request: {
          identifier: values.identifier,
          action: values.action,
          data: values.data,
        },
        response: null,
        status: "error",
        error: errorMessage,
      });

      toast({
        title: "Operation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (action: DatastoreAction) => {
    const template = testTemplates[action];
    form.setValue("identifier", template.identifier);
    form.setValue("action", template.action);
    form.setValue("data", JSON.stringify(template.data, null, 2));
  };

  const clearForm = () => {
    form.reset();
  };

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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
          <div className="mb-4">
            <p className="font-semibold text-slate-800 mb-2 block">
              Quick Templates:
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(testTemplates).map((action) => (
                <Button
                  key={action}
                  size="sm"
                  variant="outline"
                  onClick={() => loadTemplate(action as DatastoreAction)}
                  className="gap-1 capitalize"
                >
                  <Zap className="w-3 h-3" />
                  {action.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={clearForm} className="gap-1">
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
