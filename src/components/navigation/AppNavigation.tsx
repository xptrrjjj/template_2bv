"use client";

import React from "react";
import { Layout } from "antd";
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
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
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

      <Layout
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <AppHeader pathname={pathname} />
        <div
          style={{
            flex: 1,
            overflow: "auto",
            background: "#f5f5f5",
            height: "calc(100vh - 64px)", // Subtract header height
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </div>
      </Layout>
    </Layout>
  );
};

AppNavigationComponent.displayName = "AppNavigation";

export const AppNavigation = React.memo(AppNavigationComponent);

// For backward compatibility
export const AppSidebar = AppNavigation;
