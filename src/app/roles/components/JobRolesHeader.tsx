// SOLID Principle: Single Responsibility - Header component
import React from 'react';
import { 
  Row, 
  Col, 
  Button, 
  Space, 
  Typography
} from 'antd';
import { 
  PlusOutlined, 
  ReloadOutlined, 
  CarryOutOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface JobRolesHeaderProps {
  onCreateClick: () => void;
  onRefreshClick: () => void;
  loading?: boolean;
  totalRoles?: number;
  activeRoles?: number;
  draftRoles?: number;
}

export const JobRolesHeader: React.FC<JobRolesHeaderProps> = ({
  onCreateClick,
  onRefreshClick,
  loading = false,
  totalRoles = 0,
  activeRoles = 0,
  draftRoles = 0
}) => {
  return (
    <div style={{ padding: '32px' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Space align="center" size={16}>
            <div
              style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CarryOutOutlined style={{ color: 'white', fontSize: '24px' }} />
            </div>
            <div>
              <Title level={2} style={{ margin: 0, color: '#1a202c' }}>
                Job Roles
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Manage recruiting positions and job openings
              </Text>
            </div>
          </Space>
        </Col>
        
        <Col>
          <Space size="middle">
            {/* Statistics */}
            <div className="hidden md:flex" style={{ gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '16px 24px', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Total</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a202c', marginTop: '4px' }}>
                  {totalRoles}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px 24px', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Active</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a', marginTop: '4px' }}>
                  {activeRoles}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px 24px', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Drafts</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14', marginTop: '4px' }}>
                  {draftRoles}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={onRefreshClick}
                loading={loading}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onCreateClick}
                disabled={loading}
                size="large"
              >
                Create Job Role
              </Button>
            </Space>
          </Space>
        </Col>
      </Row>
    </div>
  );
};