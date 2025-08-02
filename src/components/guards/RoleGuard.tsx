'use client';

import React from 'react';
import { Result } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useHasRole } from '@/hooks/usePermissions';

interface RoleGuardProps {
  roles: string | string[];
  appId?: string;
  operator?: 'AND' | 'OR';
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
        icon={<UserOutlined style={{ color: '#ff4d4f' }} />}
        extra={
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <p style={{ color: '#8c8c8c', fontSize: '14px' }}>
              Required role: <code>{firstRole}</code>
              {appId && <><br />Application: <code>{appId}</code></>}
            </p>
          </div>
        }
      />
    );
  }

  return <>{children}</>;
};