"use client";

import React from "react";
import { User } from "@/types/auth";
import { useNavigationState } from "./hooks/useNavigationState";
import { AppSidebar as AppSidebarComponent } from "./components/AppSidebar";
import { AppHeader } from "./components/AppHeader";

interface AppNavigationProps {
  user: User | null;
  onLogout: () => void;
  children: React.ReactNode;
}

const AppNavigationComponent: React.FC<AppNavigationProps> = ({ user, onLogout, children }) => {
  const {
    collapsed,
    setCollapsed,
    openKeys,
    pathname,
    selectedKeys,
    handleMenuClick,
    handleOpenChange,
    handleLogout,
  } = useNavigationState({ onLogout });

  return (
    <div className="h-screen overflow-hidden flex">
      <AppSidebarComponent
        user={user}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        onMenuClick={handleMenuClick}
        onLogout={handleLogout}
      />

      <div className="flex flex-col h-screen overflow-hidden flex-1">
        <AppHeader pathname={pathname} />
        <div className="flex-1 overflow-auto bg-gray-100 h-[calc(100vh-64px)] flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
};

AppNavigationComponent.displayName = "AppNavigation";

export const AppNavigation = React.memo(AppNavigationComponent);

// For backward compatibility
export const AppSidebar = AppNavigation;
