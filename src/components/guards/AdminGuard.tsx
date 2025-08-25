"use client";

import React from "react";
import { Result } from "@/components/ui/result";
import { Crown, Shield } from "lucide-react";
import { useIsAdmin, useIsSuperAdmin } from "@/hooks/usePermissions";

interface AdminOnlyProps {
  appId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * Component that renders children only for admin users
 */
export const AdminOnly: React.FC<AdminOnlyProps> = ({
  appId,
  children,
  fallback,
  showFallback = true,
}) => {
  const isAdmin = useIsAdmin(appId);

  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <Result
        status="403"
        title="Admin Access Required"
        subTitle="You need administrator privileges to access this content."
        icon={<Crown className="h-16 w-16 text-yellow-500" />}
        extra={
          <div className="text-center mt-4">
            <p className="text-slate-500 text-sm">
              Required: Administrator role
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

interface SuperAdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * Component that renders children only for super admin users
 */
export const SuperAdminOnly: React.FC<SuperAdminOnlyProps> = ({
  children,
  fallback,
  showFallback = true,
}) => {
  const isSuperAdmin = useIsSuperAdmin();

  if (!isSuperAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <Result
        status="403"
        title="Super Admin Access Required"
        subTitle="You need super administrator privileges to access this content."
        icon={<Shield className="h-16 w-16 text-purple-600" />}
        extra={
          <div className="text-center mt-4">
            <p className="text-slate-500 text-sm">Required: Super Administrator role</p>
          </div>
        }
      />
    );
  }

  return <>{children}</>;
};

interface DeveloperOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * Component that renders children only in development environment
 * Useful for debug panels, admin tools, etc.
 */
export const DeveloperOnly: React.FC<DeveloperOnlyProps> = ({
  children,
  fallback,
  showFallback = false,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isSuperAdmin = useIsSuperAdmin();

  // Show content if in development or user is super admin
  if (!isDevelopment && !isSuperAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <Result
        status="404"
        title="Development Only"
        subTitle="This content is only available in development mode or for super administrators."
      />
    );
  }

  return <>{children}</>;
};
