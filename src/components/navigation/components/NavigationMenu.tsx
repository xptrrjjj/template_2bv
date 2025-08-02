import React, { useMemo } from 'react';
import { Menu } from 'antd';
import { 
  HomeOutlined, 
  DatabaseOutlined, 
  SettingOutlined,
  TeamOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { NavigationItem } from '@/types/rbac';
import { usePermissionFilter } from '@/hooks/usePermissions';
import { convertToMenuItems } from '../utils/menuConverter';

interface NavigationMenuProps {
  selectedKeys: string[];
  openKeys: string[];
  onOpenChange: (keys: string[]) => void;
  onMenuClick: (key: string) => void;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  selectedKeys,
  openKeys,
  onOpenChange,
  onMenuClick
}) => {
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

  const antdMenuItems = useMemo(() => convertToMenuItems(menuItems), [menuItems]);

  const handleMenuClick = ({ key }: { key: string }) => {
    onMenuClick(key);
  };

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        items={antdMenuItems}
        onClick={handleMenuClick}
        style={{
          border: 'none',
          background: 'transparent',
          padding: '16px 0'
        }}
      />
    </div>
  );
};