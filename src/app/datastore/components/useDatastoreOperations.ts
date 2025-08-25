"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/services/api";
import { DatastoreAction } from "@/types/datastore";

export type { DatastoreAction };

// Form schemas
export const operationFormSchema = z.object({
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

export const retrieveFormSchema = z.object({
  identifier: z.string().min(1, "Please enter identifier"),
  filters: z.string().refine((value) => {
    if (!value || value.trim() === "") return true;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, "Invalid JSON format"),
});

export type OperationFormData = z.infer<typeof operationFormSchema>;
export type RetrieveFormData = z.infer<typeof retrieveFormSchema>;

// Types
export interface TestResult {
  operation: string;
  timestamp: string;
  request: unknown;
  response: unknown;
  status: "success" | "error";
  error?: string;
}

// Test templates
export const testTemplates = {
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

export const retrieveTemplates = {
  all_records: {
    identifier: process.env.NEXT_PUBLIC_APP_IDENTIFIER || "antd_recruiter",
    filters: {},
  },
  by_status: {
    identifier: process.env.NEXT_PUBLIC_APP_IDENTIFIER || "antd_recruiter",
    filters: {
      status: "active",
    },
  },
  by_position: {
    identifier: process.env.NEXT_PUBLIC_APP_IDENTIFIER || "antd_recruiter",
    filters: {
      position: "Senior Developer",
    },
  },
  by_record_id: {
    identifier: process.env.NEXT_PUBLIC_APP_IDENTIFIER || "antd_recruiter",
    filters: {
      record_id: "candidate_001",
    },
  },
  multiple_filters: {
    identifier: process.env.NEXT_PUBLIC_APP_IDENTIFIER || "antd_recruiter",
    filters: {
      status: "active",
      experience_years: 5,
    },
  },
};

export function useDatastoreOperations() {
  const { toast } = useToast();
  const [results, setResults] = useState<TestResult[]>([]);
  const [operationLoading, setOperationLoading] = useState(false);
  const [retrieveLoading, setRetrieveLoading] = useState(false);

  // Operation form
  const operationForm = useForm<OperationFormData>({
    resolver: zodResolver(operationFormSchema),
    defaultValues: {
      identifier: process.env.NEXT_PUBLIC_APP_IDENTIFIER || "antd_recruiter",
      action: "create",
      data: "{}",
    },
  });

  // Retrieve form
  const retrieveForm = useForm<RetrieveFormData>({
    resolver: zodResolver(retrieveFormSchema),
    defaultValues: {
      identifier: process.env.NEXT_PUBLIC_APP_IDENTIFIER || "antd_recruiter",
      filters: "{}",
    },
  });

  // Add result to results array
  const addResult = useCallback((result: TestResult) => {
    setResults((prev) => [result, ...prev]);
  }, []);

  // Clear all results
  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  // Handle operation submission
  const handleOperationSubmit = useCallback(async (values: OperationFormData) => {
    setOperationLoading(true);
    try {
      const requestData = {
        identifier: values.identifier,
        action: values.action as DatastoreAction,
        data: JSON.parse(values.data),
      };

      const response = await apiClient.datastoreCreate(requestData);

      const result: TestResult = {
        operation: `${values.action.toUpperCase()} Operation`,
        timestamp: new Date().toISOString(),
        request: requestData,
        response,
        status: "success",
      };

      addResult(result);

      toast({
        title: "Operation Successful",
        description: `${values.action} operation completed successfully`,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      const result: TestResult = {
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
      };

      addResult(result);

      toast({
        title: "Operation Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return result;
    } finally {
      setOperationLoading(false);
    }
  }, [addResult, toast]);

  // Handle retrieve submission
  const handleRetrieveSubmit = useCallback(async (values: RetrieveFormData) => {
    setRetrieveLoading(true);
    try {
      const requestData = {
        identifier: values.identifier,
        filters: values.filters ? JSON.parse(values.filters) : {},
      };

      const response = await apiClient.datastoreRetrieve(requestData);

      const result: TestResult = {
        operation: "RETRIEVE Operation",
        timestamp: new Date().toISOString(),
        request: requestData,
        response,
        status: "success",
      };

      addResult(result);

      toast({
        title: "Retrieve Successful",
        description: `Found ${response.data?.length || 0} records`,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      const result: TestResult = {
        operation: "RETRIEVE Operation",
        timestamp: new Date().toISOString(),
        request: {
          identifier: values.identifier,
          filters: values.filters,
        },
        response: null,
        status: "error",
        error: errorMessage,
      };

      addResult(result);

      toast({
        title: "Retrieve Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return result;
    } finally {
      setRetrieveLoading(false);
    }
  }, [addResult, toast]);

  // Load operation template
  const loadOperationTemplate = useCallback((action: DatastoreAction) => {
    const template = testTemplates[action];
    operationForm.setValue("identifier", template.identifier);
    operationForm.setValue("action", template.action);
    operationForm.setValue("data", JSON.stringify(template.data, null, 2));
  }, [operationForm]);

  // Load retrieve template
  const loadRetrieveTemplate = useCallback((templateKey: keyof typeof retrieveTemplates) => {
    const template = retrieveTemplates[templateKey];
    retrieveForm.setValue("identifier", template.identifier);
    retrieveForm.setValue("filters", JSON.stringify(template.filters, null, 2));
  }, [retrieveForm]);

  // Clear forms
  const clearOperationForm = useCallback(() => {
    operationForm.reset();
  }, [operationForm]);

  const clearRetrieveForm = useCallback(() => {
    retrieveForm.reset();
  }, [retrieveForm]);

  return {
    // State
    results,
    operationLoading,
    retrieveLoading,
    
    // Forms
    operationForm,
    retrieveForm,
    
    // Actions
    handleOperationSubmit,
    handleRetrieveSubmit,
    loadOperationTemplate,
    loadRetrieveTemplate,
    clearOperationForm,
    clearRetrieveForm,
    clearResults,
    addResult,
    
    // Templates
    testTemplates,
    retrieveTemplates,
  };
}