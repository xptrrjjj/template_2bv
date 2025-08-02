'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WelcomeSection } from './components';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div style={{ padding: '32px', background: '#f8fafc', height: '100%' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <WelcomeSection userName={user?.name} />
      </div>
    </div>
  );
}