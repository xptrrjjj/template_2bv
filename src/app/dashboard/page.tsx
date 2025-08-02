'use client';

import React from 'react';
import { Layout } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppSidebar } from '@/components/navigation/AppNavigation';
import { WelcomeSection } from './components';

const { Content } = Layout;

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <AppSidebar user={user} onLogout={logout}>
        <Content style={{ padding: '32px', background: '#f8fafc', minHeight: '100vh' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <WelcomeSection userName={user?.name} />
          </div>
        </Content>
      </AppSidebar>
    </ProtectedRoute>
  );
}