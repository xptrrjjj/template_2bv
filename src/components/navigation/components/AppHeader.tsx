import React from 'react';
import { Layout, Typography } from 'antd';

const { Header } = Layout;
const { Text } = Typography;

interface AppHeaderProps {
  pathname: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ pathname }) => {
  const getPageTitle = (path: string): string => {
    if (path === '/dashboard' || path === '/') return 'Dashboard';
    if (path.startsWith('/datastore')) return 'Datastore Testing';
    if (path.startsWith('/admin/users')) return 'User Management';
    if (path.startsWith('/admin/roles')) return 'Role Management';
    if (path.startsWith('/admin/system')) return 'System Settings';
    if (path.startsWith('/admin')) return 'Administration';
    return 'Dashboard';
  };

  return (
    <Header style={{
      background: '#fff',
      padding: '0 24px',
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '64px'
    }}>
      <Text style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
        {getPageTitle(pathname)}
      </Text>
    </Header>
  );
};