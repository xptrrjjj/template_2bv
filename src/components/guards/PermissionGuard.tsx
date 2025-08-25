"use client";

import React from "react";
import { Result } from "@/components/ui/result";
import { Lock, Loader } from "lucide-react";
import { useHasPermission } from "@/hooks/usePermissions";

interface PermissionGuardProps {
  resource: string;
  action: string;
  appId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * Component that renders children only if user has the required permission
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  resource,
  action,
  appId,
  children,
  fallback,
  showFallback = true,
}) => {
  const { hasPermission, loading } = useHasPermission(resource, action, appId);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-5">
        <Loader className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle={`You don't have permission to ${action} ${resource}.`}
        icon={<Lock className="h-16 w-16 text-red-500" />}
        extra={
          <div className="text-center mt-4">
            <p className="text-slate-500 text-sm">
              Required permission:{" "}
              <code className="bg-slate-100 px-1 rounded">
                {resource}.{action}
              </code>
              {appId && (
                <>
                  <br />
                  Application: <code className="bg-slate-100 px-1 rounded">{appId}</code>
                </>
              )}
            </p>
          </div>
        }
      />
    );
  }

  return <>{children}</>;
};

interface MultiPermissionGuardProps {
  permissions: Array<{ resource: string; action: string; appId?: string }>;
  operator?: "AND" | "OR";
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * Component that checks multiple permissions with AND/OR logic
 */
export const MultiPermissionGuard: React.FC<MultiPermissionGuardProps> = ({
  permissions,
  operator = "AND",
  children,
  fallback,
  showFallback = true,
}) => {
  // Get permission results for all permissions
  const permissionResults = permissions.map((perm) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHasPermission(perm.resource, perm.action, perm.appId)
  );

  // Check if any results are still loading
  const isLoading = permissionResults.some((result) => result.loading);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-5">
        <Loader className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Apply AND/OR logic
  const hasRequiredPermissions =
    operator === "AND"
      ? permissionResults.every((result) => result.hasPermission)
      : permissionResults.some((result) => result.hasPermission);

  if (!hasRequiredPermissions) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle={`You need ${operator === "AND" ? "all" : "one"} of the required permissions.`}
        icon={<Lock className="h-16 w-16 text-red-500" />}
        extra={
          <div className="text-center mt-4">
            <p className="text-slate-500 text-sm">
              Required permissions:{" "}
              {permissions
                .map((perm) => (
                  <code key={`${perm.resource}.${perm.action}`} className="bg-slate-100 px-1 rounded">
                    {perm.resource}.{perm.action}
                  </code>
                ))
                .reduce(
                  (acc, curr, i) => (i === 0 ? [curr] : [...acc, ", ", curr]),
                  [] as React.ReactNode[]
                )}
            </p>
          </div>
        }
      />
    );
  }

  return <>{children}</>;
};

interface ConditionalPermissionGuardProps {
  condition: boolean;
  resource: string;
  action: string;
  appId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that only checks permissions if a condition is met
 */
export const ConditionalPermissionGuard: React.FC<ConditionalPermissionGuardProps> = ({
  condition,
  resource,
  action,
  appId,
  children,
  fallback,
}) => {
  if (!condition) {
    return <>{children}</>;
  }

  return (
    <PermissionGuard resource={resource} action={action} appId={appId} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
};
