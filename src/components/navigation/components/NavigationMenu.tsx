import React, { useMemo, useState } from "react";
import {
  Home,
  Database,
  Settings,
  Users,
  Shield,
  Trash2,
  Key,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { NavigationItem } from "@/types/rbac";
import { usePermissionFilter } from "@/hooks/usePermissions";
import { NavigationMenuItem, convertToMenuItems } from "../utils/menuConverter";
import { cn } from "@/lib/utils";

interface NavigationMenuProps {
  selectedKeys: string[];
  openKeys: string[];
  onOpenChange: (keys: string[]) => void;
  onMenuClick: (key: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  "/dashboard": <Home size={20} />,
  "/datastore": <Database size={20} />,
  "/admin": <Settings size={20} />,
  "/admin/users": <Users size={20} />,
  "/admin/roles": <Shield size={20} />,
  "/admin/permissions": <Key size={20} />,
  "/admin/system": <Settings size={20} />,
  "/cleanup": <Trash2 size={20} />,
};

interface MenuItemProps {
  item: NavigationMenuItem;
  level: number;
  selectedKeys: string[];
  openKeys: string[];
  onOpenChange: (keys: string[]) => void;
  onMenuClick: (key: string) => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  item,
  level,
  selectedKeys,
  openKeys,
  onOpenChange,
  onMenuClick,
}) => {
  const isSelected = selectedKeys.includes(item.key);
  const isOpen = openKeys.includes(item.key);
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      const newOpenKeys = isOpen
        ? openKeys.filter((key) => key !== item.key)
        : [...openKeys, item.key];
      onOpenChange(newOpenKeys);
    } else {
      onMenuClick(item.key);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-100 transition-colors rounded-lg mx-2",
          isSelected && "bg-blue-50 text-blue-600 border-r-2 border-blue-600",
          level > 0 && "ml-6 pl-8"
        )}
      >
        <div className="flex items-center gap-3 flex-1">
          {iconMap[item.key] || item.icon}
          <span className="font-medium">{item.label}</span>
        </div>
        {hasChildren && (
          <div>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        )}
      </button>
      {hasChildren && isOpen && (
        <div className="mt-1">
          {item.children?.map((child) => (
            <MenuItem
              key={child.key}
              item={child}
              level={level + 1}
              selectedKeys={selectedKeys}
              openKeys={openKeys}
              onOpenChange={onOpenChange}
              onMenuClick={onMenuClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  selectedKeys,
  openKeys,
  onOpenChange,
  onMenuClick,
}) => {
  const allMenuItems: NavigationItem[] = useMemo(
    () => [
      {
        key: "/dashboard",
        icon: <Home size={20} />,
        label: "Dashboard",
        requiredPermission: {
          resource: "dashboard",
          action: "read",
        },
      },
      {
        key: "/datastore",
        icon: <Database size={20} />,
        label: "Datastore Testing",
        requiredPermission: {
          resource: "data",
          action: "read",
        },
      },
      {
        key: "/admin",
        icon: <Settings size={20} />,
        label: "Administration",
        requiredRole: ["super_admin", "system_admin", "antd_recruiter_app_admin"],
        children: [
          {
            key: "/admin/users",
            icon: <Users size={20} />,
            label: "User Management",
            requiredPermission: {
              resource: "admin",
              action: "users",
            },
          },
          {
            key: "/admin/roles",
            icon: <Shield size={20} />,
            label: "Role Management",
            requiredPermission: {
              resource: "roles",
              action: "read",
            },
          },
          {
            key: "/admin/permissions",
            icon: <Key size={20} />,
            label: "Permission Management",
            requiredPermission: {
              resource: "permissions",
              action: "read",
            },
          },
          {
            key: "/admin/system",
            icon: <Settings size={20} />,
            label: "System Settings",
            requiredRole: ["super_admin"],
          },
          {
            key: "/cleanup",
            icon: <Trash2 size={20} />,
            label: "Cleanup Duplicates",
            requiredRole: ["super_admin"],
          },
        ],
      },
    ],
    []
  );

  // Filter menu items based on user permissions
  const { filteredItems: menuItems } = usePermissionFilter(allMenuItems);

  const navigationMenuItems = useMemo(() => convertToMenuItems(menuItems), [menuItems]);

  return (
    <div className="flex-1 overflow-auto py-4">
      {navigationMenuItems.map((item) => (
        <MenuItem
          key={item.key}
          item={item}
          level={0}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          onMenuClick={onMenuClick}
        />
      ))}
    </div>
  );
};
