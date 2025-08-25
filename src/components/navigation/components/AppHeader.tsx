import React from "react";

interface AppHeaderProps {
  pathname: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ pathname }) => {
  const getPageTitle = (path: string): string => {
    if (path === "/dashboard" || path === "/") return "Dashboard";
    if (path.startsWith("/datastore")) return "Datastore Testing";
    if (path.startsWith("/admin/users")) return "User Management";
    if (path.startsWith("/admin/roles")) return "Role Management";
    if (path.startsWith("/admin/system")) return "System Settings";
    if (path.startsWith("/admin")) return "Administration";
    return "Dashboard";
  };

  return (
    <header className="bg-white px-6 border-b border-gray-200 flex items-center justify-center h-16">
      <h1 className="text-lg font-semibold text-gray-900">
        {getPageTitle(pathname)}
      </h1>
    </header>
  );
};
