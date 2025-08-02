'use client';

import React from 'react';
import { Result, Spin } from 'antd';
import { LockOutlined, LoadingOutlined } from '@ant-design/icons';
import { useHasPermission } from '@/hooks/usePermissions';

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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '20px' 
      }}>
        <Spin 
          indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} 
        />
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
        icon={<LockOutlined style={{ color: '#ff4d4f' }} />}
        extra={
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <p style={{ color: '#8c8c8c', fontSize: '14px' }}>
              Required permission: <code>{resource}.{action}</code>
              {appId && <><br />Application: <code>{appId}</code></>}
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
  operator?: 'AND' | 'OR';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * Component that checks multiple permissions with AND/OR logic
 */
export const MultiPermissionGuard: React.FC<MultiPermissionGuardProps> = ({
  permissions,
  operator = 'AND',
  children,
  fallback,
  showFallback = true,
}) => {
  // Get permission results for all permissions
  const permissionResults = permissions.map(perm => 
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHasPermission(perm.resource, perm.action, perm.appId)
  );
  
  // Check if any results are still loading
  const isLoading = permissionResults.some(result => result.loading);
  
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '20px' 
      }}>
        <Spin 
          indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} 
        />
      </div>
    );
  }
  
  // Apply AND/OR logic
  const hasRequiredPermissions = operator === 'AND'
    ? permissionResults.every(result => result.hasPermission)
    : permissionResults.some(result => result.hasPermission);
  
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
        subTitle={`You need ${operator === 'AND' ? 'all' : 'one'} of the required permissions.`}
        icon={<LockOutlined style={{ color: '#ff4d4f' }} />}
        extra={
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <p style={{ color: '#8c8c8c', fontSize: '14px' }}>
              Required permissions: {permissions.map(perm => 
                <code key={`${perm.resource}.${perm.action}`}>
                  {perm.resource}.{perm.action}
                </code>
              ).reduce((acc, curr, i) => 
                i === 0 ? [curr] : [...acc, ', ', curr], [] as React.ReactNode[]
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
    <PermissionGuard
      resource={resource}
      action={action}
      appId={appId}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
};