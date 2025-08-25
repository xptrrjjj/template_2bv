import React from "react";
import { User } from "@/types/auth";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { NavigationMenu } from "./NavigationMenu";
import { UserProfile } from "./UserProfile";
import { Button } from "@/components/ui/button";

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
  onLogout,
}) => {
  return (
    <div
      className={`bg-white border-r border-gray-200 shadow-[2px_0_8px_rgba(0,0,0,0.15)] flex flex-col relative transition-all duration-200 ${
        collapsed ? "w-20" : "w-70"
      }`}
    >
      {/* Collapse Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onCollapse(!collapsed)}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-white shadow-md hover:bg-gray-50"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      <BrandLogo collapsed={collapsed} />

      <NavigationMenu
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        onMenuClick={onMenuClick}
      />

      <UserProfile user={user} collapsed={collapsed} onLogout={onLogout} />
    </div>
  );
};
