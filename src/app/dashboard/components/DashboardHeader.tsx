'use client';

import React from 'react';
import { Typography, Space, Avatar, Button } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { User } from '@/types/auth';

const { Title, Text } = Typography;

interface DashboardHeaderProps {
  user: User | null;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, onLogout }) => {
  return (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #e2e8f0',
      padding: '20px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div>
        <Title level={3} style={{ margin: 0, color: '#1a202c', fontWeight: '700' }}>
          Recruitment Dashboard
        </Title>
        <Text style={{ fontSize: '14px', color: '#64748b' }}>Manage your recruitment process efficiently</Text>
      </div>
      
      <Space size="large">
        <Space align="center" style={{ padding: '12px 16px', background: '#f1f5f9', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Avatar 
            size={40}
            src={user?.profilePicture}
            icon={<UserOutlined />}
            style={{ border: '2px solid #667eea' }}
          />
          <div>
            <Text strong style={{ display: 'block', fontSize: '14px', color: '#1a202c' }}>{user?.name}</Text>
            <Text style={{ fontSize: '12px', color: '#64748b' }}>{user?.email}</Text>
          </div>
        </Space>
        
        <Button 
          onClick={onLogout}
          style={{
            background: 'white',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#ef4444',
            fontWeight: '500',
            height: '40px',
            paddingInline: '20px'
          }}
        >
          <LogoutOutlined /> Logout
        </Button>
      </Space>
    </div>
  );
};