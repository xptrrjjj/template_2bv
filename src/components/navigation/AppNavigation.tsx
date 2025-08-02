'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Layout, Menu, Typography, Avatar, Dropdown } from 'antd';
import { 
  HomeOutlined, 
  DatabaseOutlined, 
  UserOutlined, 
  LogoutOutlined,
  DownOutlined,
  SettingOutlined,
  TeamOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/types/auth';
import { NavigationItem } from '@/types/rbac';
import { usePermissionFilter } from '@/hooks/usePermissions';

const { Sider, Header } = Layout;
const { Text } = Typography;

interface AppSidebarProps {
  user: User | null;
  onLogout: () => void;
  children: React.ReactNode;
}

const AppSidebarComponent: React.FC<AppSidebarProps> = ({ user, onLogout, children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  
  // Initialize openKeys based on current path and persist in localStorage
  const getInitialOpenKeys = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nav-openKeys');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // Fall back to default
        }
      }
    }
    
    if (pathname.startsWith('/admin')) {
      return ['/admin'];
    }
    return [];
  };
  
  const [openKeys, setOpenKeys] = useState<string[]>(getInitialOpenKeys);

  const allMenuItems: NavigationItem[] = useMemo(() => [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: 'Dashboard',
      requiredPermission: {
        resource: 'dashboard',
        action: 'read'
      }
    },
    {
      key: '/datastore',
      icon: <DatabaseOutlined />,
      label: 'Datastore Testing',
      requiredPermission: {
        resource: 'data',
        action: 'read'
      }
    },
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: 'Administration',
      requiredRole: ['super_admin', 'system_admin', 'antd_recruiter_app_admin'],
      children: [
        {
          key: '/admin/users',
          icon: <TeamOutlined />,
          label: 'User Management',
          requiredPermission: {
            resource: 'admin',
            action: 'users'
          }
        },
        {
          key: '/admin/roles',
          icon: <SafetyCertificateOutlined />,
          label: 'Role Management',
          requiredPermission: {
            resource: 'admin',
            action: 'users'
          }
        },
        {
          key: '/admin/system',
          icon: <SettingOutlined />,
          label: 'System Settings',
          requiredRole: ['super_admin']
        }
      ]
    }
  ], []);

  // Filter menu items based on user permissions
  const { filteredItems: menuItems } = usePermissionFilter(allMenuItems);

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  // Convert NavigationItem[] to Ant Design Menu items format
  const convertToMenuItems = useCallback((items: NavigationItem[]) => {
    return items.map(item => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
      children: item.children ? convertToMenuItems(item.children) : undefined
    }));
  }, []);

  const antdMenuItems = useMemo(() => convertToMenuItems(menuItems), [menuItems, convertToMenuItems]);

  const getSelectedKey = () => {
    if (pathname === '/dashboard' || pathname === '/') return ['/dashboard'];
    if (pathname.startsWith('/datastore')) return ['/datastore'];
    if (pathname.startsWith('/admin/users')) return ['/admin/users'];
    if (pathname.startsWith('/admin/roles')) return ['/admin/roles'];
    if (pathname.startsWith('/admin/system')) return ['/admin/system'];
    if (pathname.startsWith('/admin')) return ['/admin'];
    return ['/dashboard'];
  };

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nav-openKeys', JSON.stringify(keys));
    }
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
            openKeys={openKeys}
            onOpenChange={handleOpenChange}
            items={antdMenuItems}
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

AppSidebarComponent.displayName = 'AppSidebar';

export const AppSidebar = React.memo(AppSidebarComponent);