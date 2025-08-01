'use client';

import React, { useState } from 'react';
import { Layout, Row, Col, App } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppSidebar } from '@/components/navigation/AppNavigation';
import {
  WelcomeSection,
  StatsSection,
  ActivityFeed,
  SystemHealth
} from './components';

const { Content } = Layout;

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { notification } = App.useApp();
  const [testResults, setTestResults] = useState<Array<{ operation: string; status: string; data: unknown }>>([]);
  const [loading, setLoading] = useState(false);

  const testDatastoreConnection = async () => {
    setLoading(true);
    try {
      const createResult = await apiClient.createRecord('recruitment_tool', {
        app_id: 'recruitment_tool',
        record_id: `test_${Date.now()}`,
        name: 'Test Candidate',
        email: 'test@example.com',
        position: 'Software Developer',
        status: 'active'
      });

      const retrieveResult = await apiClient.getRecords('recruitment_tool');

      setTestResults([
        { operation: 'Create Record', status: createResult.status, data: createResult },
        { operation: 'Retrieve Records', status: retrieveResult.status, data: retrieveResult }
      ]);

      notification.success({
        message: 'Datastore Test Complete',
        description: 'Successfully tested datastore operations',
      });
    } catch (error) {
      console.error('Datastore test failed:', error);
      notification.error({
        message: 'Datastore Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppSidebar user={user} onLogout={logout}>
        <Content style={{ padding: '32px', background: '#f8fafc' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <WelcomeSection userName={user?.name} />
            <StatsSection />
            
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={16}>
                <ActivityFeed />
              </Col>
              <Col xs={24} lg={8}>
                <SystemHealth 
                  testResults={testResults}
                  loading={loading}
                  onTestConnection={testDatastoreConnection}
                />
              </Col>
            </Row>
          </div>
        </Content>
      </AppSidebar>
    </ProtectedRoute>
  );
}