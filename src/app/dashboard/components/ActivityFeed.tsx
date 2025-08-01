'use client';

import React from 'react';
import { Card, Typography, Space, Badge } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ActivityItem {
  id: string;
  action: string;
  position: string;
  time: string;
  status: 'new' | 'scheduled' | 'success';
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const defaultActivities: ActivityItem[] = [
    { id: '1', action: 'New candidate applied', position: 'Senior Developer', time: '2 hours ago', status: 'new' },
    { id: '2', action: 'Interview scheduled', position: 'Product Manager', time: '4 hours ago', status: 'scheduled' },
    { id: '3', action: 'Candidate hired', position: 'UX Designer', time: '1 day ago', status: 'success' }
  ];

  const currentActivities = activities || defaultActivities;

  const getStatusBadge = (status: ActivityItem['status']) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'scheduled':
        return 'processing';
      default:
        return 'default';
    }
  };

  return (
    <Card
      title={
        <Space>
          <ClockCircleOutlined style={{ color: '#667eea' }} />
          <Text strong style={{ fontSize: '16px', color: '#1a202c' }}>Recent Activity</Text>
        </Space>
      }
      style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
      styles={{ body: { padding: '24px' } }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {currentActivities.map((item) => (
          <div key={item.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Badge status={getStatusBadge(item.status)} />
              <div>
                <Text strong style={{ color: '#1a202c' }}>{item.action}</Text>
                <br />
                <Text style={{ color: '#64748b', fontSize: '14px' }}>{item.position}</Text>
              </div>
            </div>
            <Text style={{ fontSize: '12px', color: '#94a3b8' }}>{item.time}</Text>
          </div>
        ))}
      </Space>
    </Card>
  );
};