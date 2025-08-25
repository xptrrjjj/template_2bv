"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { SystemHealthCheck } from "@/types/rbac";

interface SystemHealthAlertProps {
  health: SystemHealthCheck | null;
}

export function SystemHealthAlert({ health }: SystemHealthAlertProps) {
  if (!health) return null;

  return (
    <Alert className="mb-6">
      {health.healthy ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      )}
      <AlertTitle>
        {health.healthy ? "System Healthy" : "System Issues Detected"}
      </AlertTitle>
      <AlertDescription>
        {health.healthy
          ? "All system components are functioning normally"
          : `Issues found: ${health.issues.join(", ")}`}
      </AlertDescription>
    </Alert>
  );
}