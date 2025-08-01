'use client';

import React from 'react';
import { Card, Statistic, Typography } from 'antd';
import { RiseOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => {
  return (
    <Card
      style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        position: 'relative',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
      styles={{ body: { padding: '24px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          background: `${color}15`, 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          fontSize: '24px'
        }}>
          {icon}
        </div>
      </div>
      <Statistic
        title={<Text style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>{title}</Text>}
        value={value}
        valueStyle={{ color: '#1a202c', fontSize: '28px', fontWeight: '700' }}
      />
      {trend && (
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <RiseOutlined style={{ color: '#10b981', fontSize: '14px' }} />
          <Text style={{ color: '#10b981', fontSize: '13px', fontWeight: '500' }}>+{trend}% from last week</Text>
        </div>
      )}
    </Card>
  );
};