'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppNavigation } from '@/components/navigation/AppNavigation';
import { AdminOnly } from '@/components/guards';
import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  
  // Routes that don't need navigation (login, landing, etc.)
  const publicRoutes = ['/login', '/'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Routes that need admin protection
  const adminRoutes = ['/admin'];
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  // If it's a public route, just render children without navigation
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For protected routes, wrap with navigation and appropriate guards
  return (
    <ProtectedRoute>
      {isAdminRoute ? (
        <AdminOnly>
          <AppNavigation user={user} onLogout={logout}>
            {children}
          </AppNavigation>
        </AdminOnly>
      ) : (
        <AppNavigation user={user} onLogout={logout}>
          {children}
        </AppNavigation>
      )}
    </ProtectedRoute>
  );
};