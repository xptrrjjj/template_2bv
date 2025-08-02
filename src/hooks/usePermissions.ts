import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to get current user's permissions
 */
export const usePermissions = (appId?: string) => {
  const { userPermissions, currentApp, refreshPermissions } = useAuth();

  const targetAppId = appId || currentApp;

  // Filter permissions by app if specified
  const filteredPermissions = userPermissions.filter((permission) => {
    if (permission.scope === "global") return true;
    if (permission.scope === "app" && permission.app_id === targetAppId) return true;
    return false;
  });

  return {
    permissions: filteredPermissions,
    hasPermissions: filteredPermissions.length > 0,
    refreshPermissions,
  };
};

/**
 * Hook to check if user has a specific permission
 */
export const useHasPermission = (resource: string, action: string, appId?: string) => {
  const { checkPermission, currentApp } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  const targetAppId = appId || currentApp;

  useEffect(() => {
    const checkUserPermission = async () => {
      setLoading(true);
      try {
        const result = await checkPermission(resource, action, targetAppId);
        setHasPermission(result);
      } catch (error) {
        console.error("Permission check failed:", error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserPermission();
  }, [resource, action, targetAppId, checkPermission]);

  return {
    hasPermission,
    loading,
  };
};

/**
 * Hook to check if user has a specific role
 */
export const useHasRole = (roleId: string, appId?: string) => {
  const { hasRole } = useAuth();
  return hasRole(roleId, appId);
};

/**
 * Hook to get current user's roles
 */
export const useUserRoles = (appId?: string) => {
  const { userRoles, rbacUser, currentApp } = useAuth();

  const targetAppId = appId || currentApp;

  if (!rbacUser) {
    return {
      globalRoles: [],
      appRoles: [],
      allRoles: [],
    };
  }

  const globalRoles = userRoles.filter((role) => role.scope === "global");
  const appRoles = userRoles.filter((role) => role.scope === "app" && role.app_id === targetAppId);

  return {
    globalRoles,
    appRoles,
    allRoles: [...globalRoles, ...appRoles],
  };
};

/**
 * Hook for admin checks
 */
export const useIsAdmin = (appId?: string) => {
  const { isAdmin } = useAuth();
  return isAdmin(appId);
};

/**
 * Hook for super admin checks
 */
export const useIsSuperAdmin = () => {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin();
};

/**
 * Hook to get available applications for current user
 */
export const useApplications = () => {
  const { rbacUser } = useAuth();

  if (!rbacUser) {
    return {
      applications: [],
      hasApplications: false,
    };
  }

  // Extract unique app IDs from user's app roles
  const appIds = Object.keys(rbacUser.app_roles);

  return {
    applications: appIds,
    hasApplications: appIds.length > 0,
  };
};

/**
 * Hook for permission-based navigation filtering
 */
export const usePermissionFilter = <
  T extends {
    requiredPermission?: { resource: string; action: string; appId?: string };
    requiredRole?: string[];
  },
>(
  items: T[],
  appId?: string
) => {
  const { rbacUser, currentApp } = useAuth();
  const [filteredItems, setFilteredItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const targetAppId = appId || currentApp;

  useEffect(() => {
    // Only run filtering when we have RBAC data
    if (rbacUser === null) {
      setLoading(true);
      return;
    }

    const filtered: T[] = [];

    for (const item of items) {
      let hasAccess = true;

      // Super admin has access to everything
      if (rbacUser.is_super_admin) {
        hasAccess = true;
      } else {
        // Check role requirement for non-super-admins
        if (item.requiredRole && item.requiredRole.length > 0) {
          hasAccess = false;

          // Check global roles
          if (rbacUser.global_roles) {
            hasAccess = item.requiredRole.some((roleId) => rbacUser.global_roles.includes(roleId));
          }

          // Check app-specific roles if not already granted
          if (!hasAccess && rbacUser.app_roles && targetAppId) {
            const appRoles = rbacUser.app_roles[targetAppId] || [];
            hasAccess = item.requiredRole.some((roleId) => appRoles.includes(roleId));
          }
        }

        // For permission-based access, super admins already have access
        // For now, we'll allow non-super-admins with roles to access permission-based items
        // This is a simplified approach - you can enhance this later
      }

      if (hasAccess) {
        filtered.push(item);
      }
    }

    setFilteredItems(filtered);
    setLoading(false);
  }, [items, targetAppId, rbacUser]);

  return {
    filteredItems,
    loading,
  };
};

/**
 * Hook for real-time permission updates
 */
export const usePermissionUpdates = () => {
  const { refreshPermissions, rbacLoading } = useAuth();

  return {
    refreshPermissions,
    loading: rbacLoading,
  };
};

/**
 * Hook to get permission summary for current user
 */
export const usePermissionSummary = (appId?: string) => {
  const { rbacUser, userRoles, userPermissions, currentApp } = useAuth();

  const targetAppId = appId || currentApp;

  if (!rbacUser) {
    return {
      summary: {
        totalRoles: 0,
        globalRoles: 0,
        appRoles: 0,
        totalPermissions: 0,
        globalPermissions: 0,
        appPermissions: 0,
        isSuperAdmin: false,
        hasAdminAccess: false,
      },
      loading: false,
    };
  }

  const globalRoles = userRoles.filter((role) => role.scope === "global");
  const appRoles = userRoles.filter((role) => role.scope === "app" && role.app_id === targetAppId);

  const globalPermissions = userPermissions.filter((p) => p.scope === "global");
  const appPermissions = userPermissions.filter(
    (p) => p.scope === "app" && p.app_id === targetAppId
  );

  const hasAdminAccess =
    rbacUser.is_super_admin ||
    rbacUser.global_roles.includes("system_admin") ||
    (rbacUser.app_roles[targetAppId] || []).some((roleId) => roleId.includes("admin"));

  return {
    summary: {
      totalRoles: globalRoles.length + appRoles.length,
      globalRoles: globalRoles.length,
      appRoles: appRoles.length,
      totalPermissions: globalPermissions.length + appPermissions.length,
      globalPermissions: globalPermissions.length,
      appPermissions: appPermissions.length,
      isSuperAdmin: rbacUser.is_super_admin,
      hasAdminAccess,
    },
    loading: false,
  };
};

/**
 * Hook to check multiple permissions at once
 */
export const useHasPermissions = (
  permissions: Array<{ resource: string; action: string; appId?: string }>
) => {
  const { checkPermission, currentApp } = useAuth();
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMultiplePermissions = async () => {
      setLoading(true);
      const newResults: Record<string, boolean> = {};

      for (const perm of permissions) {
        const key = `${perm.resource}.${perm.action}.${perm.appId || currentApp}`;
        try {
          newResults[key] = await checkPermission(
            perm.resource,
            perm.action,
            perm.appId || currentApp
          );
        } catch (error) {
          console.error(`Permission check failed for ${key}:`, error);
          newResults[key] = false;
        }
      }

      setResults(newResults);
      setLoading(false);
    };

    if (permissions.length > 0) {
      checkMultiplePermissions();
    }
  }, [permissions, checkPermission, currentApp]);

  const hasPermission = (resource: string, action: string, appId?: string) => {
    const key = `${resource}.${action}.${appId || currentApp}`;
    return results[key] || false;
  };

  const hasAllPermissions = () => {
    return permissions.every((perm) => {
      const key = `${perm.resource}.${perm.action}.${perm.appId || currentApp}`;
      return results[key];
    });
  };

  const hasAnyPermission = () => {
    return permissions.some((perm) => {
      const key = `${perm.resource}.${perm.action}.${perm.appId || currentApp}`;
      return results[key];
    });
  };

  return {
    hasPermission,
    hasAllPermissions: hasAllPermissions(),
    hasAnyPermission: hasAnyPermission(),
    results,
    loading,
  };
};
