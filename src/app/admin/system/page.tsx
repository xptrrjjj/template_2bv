'use client';

import React, { useEffect, useState } from 'react';
import { 
  Layout, 
  Card, 
  Typography, 
  Button, 
  Space, 
  Alert, 
  Statistic, 
  Progress,
  Descriptions,
  Row,
  Col,
  message,
  Popconfirm,
  Tag
} from 'antd';
import { 
  SettingOutlined, 
  ReloadOutlined, 
  DeleteOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { SuperAdminOnly } from '@/components/guards';
import { bootstrapService } from '@/services/rbac';
import { SystemHealthCheck, BootstrapResult } from '@/types/rbac';

const { Content } = Layout;
const { Title, Text } = Typography;

interface BootstrapProgress {
  applications: { created: number; total: number };
  permissions: { created: number; total: number };
  roles: { created: number; total: number };
  superAdmins: { assigned: number; total: number };
}

export default function SystemPage() {
  const [health, setHealth] = useState<SystemHealthCheck | null>(null);
  const [progress, setProgress] = useState<BootstrapProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [resetting, setResetting] = useState(false);

  const loadSystemInfo = async () => {
    try {
      setLoading(true);
      const [healthData, progressData] = await Promise.all([
        bootstrapService.getSystemHealth(),
        bootstrapService.getBootstrapProgress()
      ]);

      setHealth(healthData);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to load system info:', error);
      message.error('Failed to load system information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const handleBootstrapSystem = async () => {
    try {
      setBootstrapping(true);
      const result: BootstrapResult = await bootstrapService.bootstrapSystem();
      
      if (result.success) {
        message.success('System bootstrapped successfully');
      } else {
        message.warning(`Bootstrap completed with ${result.errors.length} errors`);
      }
      
      loadSystemInfo();
    } catch (error) {
      console.error('Bootstrap failed:', error);
      message.error('System bootstrap failed');
    } finally {
      setBootstrapping(false);
    }
  };

  const handleResetSystem = async () => {
    try {
      setResetting(true);
      await bootstrapService.resetSystem();
      message.success('System reset successfully');
      loadSystemInfo();
    } catch (error) {
      console.error('Reset failed:', error);
      message.error('System reset failed');
    } finally {
      setResetting(false);
    }
  };

  const handleRepairSystem = async () => {
    try {
      setBootstrapping(true);
      const result = await bootstrapService.repairSystem();
      
      if (result.repaired.length > 0) {
        message.success(`System repaired: ${result.repaired.join(', ')}`);
      }
      
      if (result.failed.length > 0) {
        message.error(`Repair failed for: ${result.failed.join(', ')}`);
      }
      
      loadSystemInfo();
    } catch (error) {
      console.error('Repair failed:', error);
      message.error('System repair failed');
    } finally {
      setBootstrapping(false);
    }
  };

  const getProgressPercentage = (created: number, total: number) => {
    return total > 0 ? Math.round((created / total) * 100) : 0;
  };

  const isSystemHealthy = health?.healthy && 
    progress?.applications.created === progress?.applications.total &&
    progress?.permissions.created === progress?.permissions.total &&
    progress?.roles.created === progress?.roles.total;

  return (
    <SuperAdminOnly>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Title level={2} style={{ margin: 0, color: '#1a202c' }}>
                      System Administration
                    </Title>
                    <Text style={{ fontSize: '16px', color: '#64748b' }}>
                      Manage system-wide settings and monitoring
                    </Text>
                  </div>
                  <Space>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={loadSystemInfo}
                      loading={loading}
                    >
                      Refresh
                    </Button>
                  </Space>
                </div>
              </Card>

              {/* System Health Alert */}
              {health && (
                <Alert
                  message={health.healthy ? "System Healthy" : "System Issues Detected"}
                  description={
                    health.healthy 
                      ? "All system components are functioning normally"
                      : `Issues found: ${health.issues.join(', ')}`
                  }
                  type={health.healthy ? "success" : "warning"}
                  showIcon
                  style={{ marginBottom: '24px' }}
                />
              )}

              <Row gutter={[24, 24]}>
                {/* System Statistics */}
                <Col xs={24} lg={12}>
                  <Card
                    title={
                      <Space>
                        <DatabaseOutlined style={{ color: '#1890ff' }} />
                        <Text strong>System Statistics</Text>
                      </Space>
                    }
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {health && (
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Statistic title="Users" value={health.userCount} />
                        </Col>
                        <Col span={12}>
                          <Statistic title="Roles" value={health.roleCount} />
                        </Col>
                        <Col span={12}>
                          <Statistic title="Permissions" value={health.permissionCount} />
                        </Col>
                        <Col span={12}>
                          <Statistic title="Applications" value={health.applicationCount} />
                        </Col>
                      </Row>
                    )}
                  </Card>
                </Col>

                {/* Bootstrap Progress */}
                <Col xs={24} lg={12}>
                  <Card
                    title={
                      <Space>
                        <SyncOutlined style={{ color: '#52c41a' }} />
                        <Text strong>Bootstrap Status</Text>
                      </Space>
                    }
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {progress && (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                          <Text>Applications</Text>
                          <Progress 
                            percent={getProgressPercentage(progress.applications.created, progress.applications.total)}
                            format={() => `${progress.applications.created}/${progress.applications.total}`}
                          />
                        </div>
                        <div>
                          <Text>Permissions</Text>
                          <Progress 
                            percent={getProgressPercentage(progress.permissions.created, progress.permissions.total)}
                            format={() => `${progress.permissions.created}/${progress.permissions.total}`}
                          />
                        </div>
                        <div>
                          <Text>Roles</Text>
                          <Progress 
                            percent={getProgressPercentage(progress.roles.created, progress.roles.total)}
                            format={() => `${progress.roles.created}/${progress.roles.total}`}
                          />
                        </div>
                        <div>
                          <Text>Super Admins</Text>
                          <Progress 
                            percent={getProgressPercentage(progress.superAdmins.assigned, progress.superAdmins.total)}
                            format={() => `${progress.superAdmins.assigned}/${progress.superAdmins.total}`}
                          />
                        </div>
                      </Space>
                    )}
                  </Card>
                </Col>

                {/* System Actions */}
                <Col xs={24}>
                  <Card
                    title={
                      <Space>
                        <SettingOutlined style={{ color: '#722ed1' }} />
                        <Text strong>System Actions</Text>
                      </Space>
                    }
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Title level={4}>Bootstrap System</Title>
                        <Text type="secondary">
                          Initialize the RBAC system with default applications, roles, and permissions.
                        </Text>
                        <div style={{ marginTop: '16px' }}>
                          <Button
                            type="primary"
                            icon={<SyncOutlined />}
                            onClick={handleBootstrapSystem}
                            loading={bootstrapping}
                            disabled={isSystemHealthy}
                            style={{
                              background: isSystemHealthy ? undefined : 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                              border: 'none'
                            }}
                          >
                            {isSystemHealthy ? 'System Already Bootstrapped' : 'Bootstrap System'}
                          </Button>
                        </div>
                      </div>

                      <div style={{ marginTop: '24px' }}>
                        <Title level={4}>Repair System</Title>
                        <Text type="secondary">
                          Repair common system issues and ensure all components are properly configured.
                        </Text>
                        <div style={{ marginTop: '16px' }}>
                          <Button
                            icon={<CheckCircleOutlined />}
                            onClick={handleRepairSystem}
                            loading={bootstrapping}
                          >
                            Repair System
                          </Button>
                        </div>
                      </div>

                      <div style={{ marginTop: '24px' }}>
                        <Title level={4} type="danger">Danger Zone</Title>
                        <Text type="secondary">
                          <strong>Warning:</strong> This action will completely reset the RBAC system and delete all users, roles, and permissions.
                        </Text>
                        <div style={{ marginTop: '16px' }}>
                          <Popconfirm
                            title="Reset System"
                            description="Are you sure you want to reset the entire RBAC system? This action cannot be undone."
                            onConfirm={handleResetSystem}
                            okText="Yes, Reset"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              loading={resetting}
                            >
                              Reset System
                            </Button>
                          </Popconfirm>
                        </div>
                      </div>
                    </Space>
                  </Card>
                </Col>

                {/* System Information */}
                <Col xs={24}>
                  <Card
                    title="System Information"
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <Descriptions bordered column={2}>
                      <Descriptions.Item label="Application ID">
                        {process.env.NEXT_PUBLIC_APP_ID || 'recruitment_tool'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Application Name">
                        {process.env.NEXT_PUBLIC_APP_NAME || 'Recruitment Tool'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Default Role">
                        {process.env.NEXT_PUBLIC_DEFAULT_ROLE || 'app_viewer'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Auto Provision Users">
                        {process.env.NEXT_PUBLIC_AUTO_PROVISION_USERS === 'true' ? 'Enabled' : 'Disabled'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Require Explicit Access">
                        {process.env.NEXT_PUBLIC_REQUIRE_EXPLICIT_ACCESS === 'true' ? 'Yes' : 'No'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Environment">
                        <Tag color={process.env.NODE_ENV === 'production' ? 'red' : 'green'}>
                          {process.env.NODE_ENV?.toUpperCase() || 'DEVELOPMENT'}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>
            </div>
      </Content>
    </SuperAdminOnly>
  );
}