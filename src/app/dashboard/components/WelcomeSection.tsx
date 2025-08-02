'use client';

import React from 'react';
import { Card, Typography, Row, Col } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface WelcomeSectionProps {
  userName?: string;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ userName }) => {
  const firstName = userName?.split(' ')[0] || 'User';

  return (
    <Card
      style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        marginBottom: '32px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
      styles={{ body: { padding: '40px' } }}
    >
      <Row align="middle">
        <Col flex="1">
          <Title level={1} style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
            Welcome back, {firstName}! 👋
          </Title>
          <Text style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', display: 'block' }}>
            Your application is ready to use. Navigate using the sidebar to access different features.
          </Text>
        </Col>
        <Col>
          <div style={{
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}>
            <TrophyOutlined style={{ fontSize: '40px', color: 'white' }} />
          </div>
        </Col>
      </Row>
    </Card>
  );
};