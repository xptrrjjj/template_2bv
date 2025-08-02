'use client';

import React, { useState } from 'react';
import { Layout, Card, Typography, Row, Col } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppSidebar } from '@/components/navigation/AppNavigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  DatastoreOperationForm,
  DatastoreRetrieveForm,
  ResponseDisplay
} from './components';

const { Content } = Layout;
const { Title, Text } = Typography;

interface TestResult {
  operation: string;
  timestamp: string;
  request: unknown;
  response: unknown;
  status: 'success' | 'error';
  error?: string;
}

export default function DatastorePage() {
  const { user, logout } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev].slice(0, 20)); // Keep last 20 results
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ProtectedRoute>
      <AppSidebar user={user} onLogout={logout}>
        <Content style={{ padding: '32px', background: '#f8fafc' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <Card
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                marginBottom: '32px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              styles={{ body: { padding: '32px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
                }}>
                  <DatabaseOutlined style={{ fontSize: '28px', color: 'white' }} />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, color: '#1a202c' }}>
                    Datastore Testing
                  </Title>
                  <Text style={{ fontSize: '16px', color: '#64748b' }}>
                    Manually test datastore operations with custom payloads
                  </Text>
                </div>
              </div>
            </Card>

            <Row gutter={[24, 24]}>
              {/* Operation Forms */}
              <Col xs={24} lg={12}>
                <DatastoreOperationForm onResult={addTestResult} />
              </Col>
              
              {/* Retrieve Form */}
              <Col xs={24} lg={12}>
                <DatastoreRetrieveForm onResult={addTestResult} />
              </Col>
              
              {/* Results Display */}
              <Col xs={24}>
                <ResponseDisplay 
                  results={testResults} 
                  onClear={clearResults}
                />
              </Col>
            </Row>
          </div>
        </Content>
      </AppSidebar>
    </ProtectedRoute>
  );
}