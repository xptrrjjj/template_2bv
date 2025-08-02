'use client';

import React from 'react';
import { Result } from 'antd';
import { CrownOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useIsAdmin, useIsSuperAdmin } from '@/hooks/usePermissions';

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
        icon={<CrownOutlined style={{ color: '#faad14' }} />}
        extra={
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <p style={{ color: '#8c8c8c', fontSize: '14px' }}>
              Required: Administrator role
              {appId && <><br />Application: <code>{appId}</code></>}
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
        icon={<SafetyCertificateOutlined style={{ color: '#722ed1' }} />}
        extra={
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <p style={{ color: '#8c8c8c', fontSize: '14px' }}>
              Required: Super Administrator role
            </p>
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
  const isDevelopment = process.env.NODE_ENV === 'development';
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