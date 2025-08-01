'use client';

import React, { useState } from 'react';
import { Layout, Menu, Typography, Space, Avatar, Button, Dropdown } from 'antd';
import { 
  HomeOutlined, 
  DatabaseOutlined, 
  UserOutlined, 
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/types/auth';

const { Sider, Header } = Layout;
const { Text } = Typography;

interface AppSidebarProps {
  user: User | null;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ user, onLogout, children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/datastore',
      icon: <DatabaseOutlined />,
      label: 'Datastore Testing',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  const getSelectedKey = () => {
    if (pathname === '/dashboard' || pathname === '/') return ['/dashboard'];
    if (pathname.startsWith('/datastore')) return ['/datastore'];
    return ['/dashboard'];
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      disabled: true,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: onLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={280}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column'
        }}
        theme="light"
        collapsedWidth={80}
        reverseArrow
      >
        {/* Logo/Brand */}
        <div style={{
          padding: collapsed ? '16px 8px' : '24px',
          borderBottom: '1px solid #f0f0f0',
          textAlign: collapsed ? 'center' : 'left',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexShrink: 0
        }}>
          {!collapsed ? (
            <Text style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Recruitment Tool
            </Text>
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>R</Text>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Menu
            mode="inline"
            selectedKeys={getSelectedKey()}
            items={menuItems}
            onClick={handleMenuClick}
            style={{
              border: 'none',
              background: 'transparent',
              padding: '16px 0'
            }}
          />
        </div>

        {/* User Profile at Bottom */}
        <div style={{
          padding: collapsed ? '16px 8px' : '16px 24px',
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa',
          flexShrink: 0
        }}>
          {!collapsed ? (
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={['click']}
              placement="topLeft"
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar 
                  size={40}
                  src={user?.profilePicture}
                  icon={<UserOutlined />}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    color: '#1a202c',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user?.name}
                  </Text>
                  <Text style={{ 
                    fontSize: '12px', 
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'  
                  }}>
                    {user?.email}
                  </Text>
                </div>
                <DownOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
              </div>
            </Dropdown>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <Dropdown
                menu={{ items: userMenuItems }}
                trigger={['click']}
                placement="topRight"
              >
                <Avatar 
                  size={32}
                  src={user?.profilePicture}
                  icon={<UserOutlined />}
                  style={{ cursor: 'pointer' }}
                />
              </Dropdown>
            </div>
          )}
        </div>
      </Sider>

      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '64px'
        }}>
          {/* Page Title - dynamically set based on route */}
          <Text style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
            {pathname === '/dashboard' || pathname === '/' ? 'Dashboard' : 
             pathname.startsWith('/datastore') ? 'Datastore Testing' : 'Dashboard'}
          </Text>
        </Header>
        
        {children}
      </Layout>
    </Layout>
  );
};