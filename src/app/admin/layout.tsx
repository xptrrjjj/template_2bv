'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppSidebar } from '@/components/navigation/AppNavigation';
import { AdminOnly } from '@/components/guards';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <AdminOnly>
        <AppSidebar user={user} onLogout={logout}>
          {children}
        </AppSidebar>
      </AdminOnly>
    </ProtectedRoute>
  );
}