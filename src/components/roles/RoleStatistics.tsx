import React from 'react';
import { Card, Row, Col, Statistic, Typography, Tag, Tooltip } from 'antd';
import { 
  TeamOutlined, 
  GlobalOutlined, 
  AppstoreOutlined, 
  SafetyCertificateOutlined,
  UserOutlined,
  SettingOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

interface RoleWithDetails {
  role_id: string;
  name: string;
  description: string;
  scope: 'global' | 'app';
  app_id?: string;
  permission_ids: string[];
  permissionNames: string[];
  userCount: number;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

interface RoleStats {
  total: number;
  systemRoles: number;
  customRoles: number;
  globalRoles: number;
  appRoles: number;
  totalUsers: number;
  averagePermissions: number;
  mostAssignedRole: {
    name: string;
    userCount: number;
  } | null;
  leastUsedRole: {
    name: string;
    userCount: number;
  } | null;
}

interface RoleStatisticsProps {
  roles: RoleWithDetails[];
  loading?: boolean;
}

const calculateRoleStats = (roles: RoleWithDetails[]): RoleStats => {
  if (roles.length === 0) {
    return {
      total: 0,
      systemRoles: 0,
      customRoles: 0,
      globalRoles: 0,
      appRoles: 0,
      totalUsers: 0,
      averagePermissions: 0,
      mostAssignedRole: null,
      leastUsedRole: null,
    };
  }

  const systemRoles = roles.filter(role => role.is_system_role);
  const customRoles = roles.filter(role => !role.is_system_role);
  const globalRoles = roles.filter(role => role.scope === 'global');
  const appRoles = roles.filter(role => role.scope === 'app');

  // Calculate total unique users across all roles
  const totalUsers = roles.reduce((sum, role) => sum + role.userCount, 0);

  // Calculate average permissions per role
  const totalPermissions = roles.reduce((sum, role) => sum + role.permission_ids.length, 0);
  const averagePermissions = roles.length > 0 ? totalPermissions / roles.length : 0;

  // Find most assigned role (excluding roles with 0 users)
  const rolesWithUsers = roles.filter(role => role.userCount > 0);
  const mostAssignedRole = rolesWithUsers.length > 0 
    ? rolesWithUsers.reduce((max, role) => 
        role.userCount > max.userCount ? { name: role.name, userCount: role.userCount } : max,
        { name: rolesWithUsers[0].name, userCount: rolesWithUsers[0].userCount }
      )
    : null;

  // Find least used role (with users, but lowest count)
  const leastUsedRole = rolesWithUsers.length > 0
    ? rolesWithUsers.reduce((min, role) => 
        role.userCount < min.userCount ? { name: role.name, userCount: role.userCount } : min,
        { name: rolesWithUsers[0].name, userCount: rolesWithUsers[0].userCount }
      )
    : null;

  return {
    total: roles.length,
    systemRoles: systemRoles.length,
    customRoles: customRoles.length,
    globalRoles: globalRoles.length,
    appRoles: appRoles.length,
    totalUsers,
    averagePermissions: Number(averagePermissions.toFixed(1)),
    mostAssignedRole,
    leastUsedRole,
  };
};

export const RoleStatistics: React.FC<RoleStatisticsProps> = ({ roles, loading = false }) => {
  const stats = calculateRoleStats(roles);

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Main Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
            <Statistic
              title={
                <span style={{ color: '#666', fontSize: '12px' }}>
                  <TeamOutlined style={{ marginRight: 4 }} />
                  Total Roles
                </span>
              }
              value={stats.total}
              loading={loading}
              valueStyle={{ color: '#1890ff', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
            <Statistic
              title={
                <span style={{ color: '#666', fontSize: '12px' }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  Total Assignments
                </span>
              }
              value={stats.totalUsers}
              loading={loading}
              valueStyle={{ color: '#52c41a', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
            <Statistic
              title={
                <span style={{ color: '#666', fontSize: '12px' }}>
                  <SafetyCertificateOutlined style={{ marginRight: 4 }} />
                  Avg Permissions
                </span>
              }
              value={stats.averagePermissions}
              loading={loading}
              precision={1}
              valueStyle={{ color: '#722ed1', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
            <Statistic
              title={
                <span style={{ color: '#666', fontSize: '12px' }}>
                  <SettingOutlined style={{ marginRight: 4 }} />
                  Custom Roles
                </span>
              }
              value={stats.customRoles}
              loading={loading}
              valueStyle={{ color: '#fa8c16', fontSize: '24px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Breakdown */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card 
            size="small" 
            title={<Text style={{ fontSize: '14px', fontWeight: 500 }}>Role Types</Text>}
            style={{ borderRadius: '8px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <SettingOutlined style={{ color: '#fa8c16', marginRight: 6 }} />
                  <Text style={{ fontSize: '13px' }}>System</Text>
                </span>
                <Tag color="orange">{stats.systemRoles}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <TeamOutlined style={{ color: '#1890ff', marginRight: 6 }} />
                  <Text style={{ fontSize: '13px' }}>Custom</Text>
                </span>
                <Tag color="blue">{stats.customRoles}</Tag>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card 
            size="small" 
            title={<Text style={{ fontSize: '14px', fontWeight: 500 }}>Scope Distribution</Text>}
            style={{ borderRadius: '8px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <GlobalOutlined style={{ color: '#52c41a', marginRight: 6 }} />
                  <Text style={{ fontSize: '13px' }}>Global</Text>
                </span>
                <Tag color="green">{stats.globalRoles}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <AppstoreOutlined style={{ color: '#722ed1', marginRight: 6 }} />
                  <Text style={{ fontSize: '13px' }}>Application</Text>
                </span>
                <Tag color="purple">{stats.appRoles}</Tag>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card 
            size="small" 
            title={<Text style={{ fontSize: '14px', fontWeight: 500 }}>Usage Insights</Text>}
            style={{ borderRadius: '8px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.mostAssignedRole && (
                <div>
                  <Text style={{ fontSize: '12px', color: '#666' }}>Most Assigned:</Text>
                  <div style={{ marginTop: 2 }}>
                    <Tooltip title={`${stats.mostAssignedRole.userCount} users assigned`}>
                      <Tag color="green" style={{ fontSize: '11px' }}>
                        {stats.mostAssignedRole.name}
                      </Tag>
                    </Tooltip>
                  </div>
                </div>
              )}
              {stats.leastUsedRole && stats.mostAssignedRole && 
               stats.leastUsedRole.name !== stats.mostAssignedRole.name && (
                <div>
                  <Text style={{ fontSize: '12px', color: '#666' }}>Least Used:</Text>
                  <div style={{ marginTop: 2 }}>
                    <Tooltip title={`${stats.leastUsedRole.userCount} users assigned`}>
                      <Tag color="orange" style={{ fontSize: '11px' }}>
                        {stats.leastUsedRole.name}
                      </Tag>
                    </Tooltip>
                  </div>
                </div>
              )}
              {(!stats.mostAssignedRole && !stats.leastUsedRole) && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  No role assignments yet
                </Text>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};