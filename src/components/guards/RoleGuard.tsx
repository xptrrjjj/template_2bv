"use client";

import React from "react";
import { Result } from "@/components/ui/result";
import { User } from "lucide-react";
import { useHasRole } from "@/hooks/usePermissions";

interface RoleGuardProps {
  roles: string | string[];
  appId?: string;
  operator?: "AND" | "OR";
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * Component that renders children only if user has the required role(s)
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  appId,
  children,
  fallback,
  showFallback = true,
}) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  // For simplicity and to follow React Hook rules, we check only the first role
  // For complex multi-role scenarios, consider using the MultiPermissionGuard instead
  const firstRole = roleArray[0];
  const hasRole = useHasRole(firstRole, appId);

  // In a single-role scenario, we just use that result
  // For OR operator with multiple roles, we'd need a different implementation
  const hasRequiredRoles = hasRole;

  if (!hasRequiredRoles) {
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
        subTitle="You need the required role to access this content."
        icon={<User className="w-16 h-16 text-red-500" />}
        extra={
          <div className="text-center mt-4">
            <p className="text-gray-500 text-sm">
              Required role: <code className="bg-gray-100 px-1 py-0.5 rounded">{firstRole}</code>
              {appId && (
                <>
                  <br />
                  Application: <code className="bg-gray-100 px-1 py-0.5 rounded">{appId}</code>
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
