import React from 'react';
import { Layout } from 'antd';
import { User } from '@/types/auth';
import { BrandLogo } from './BrandLogo';
import { NavigationMenu } from './NavigationMenu';
import { UserProfile } from './UserProfile';

const { Sider } = Layout;

interface AppSidebarProps {
  user: User | null;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  selectedKeys: string[];
  openKeys: string[];
  onOpenChange: (keys: string[]) => void;
  onMenuClick: (key: string) => void;
  onLogout: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  user,
  collapsed,
  onCollapse,
  selectedKeys,
  openKeys,
  onOpenChange,
  onMenuClick,
  onLogout
}) => {
  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
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
      <BrandLogo collapsed={collapsed} />
      
      <NavigationMenu
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        onMenuClick={onMenuClick}
      />
      
      <UserProfile
        user={user}
        collapsed={collapsed}
        onLogout={onLogout}
      />
    </Sider>
  );
};