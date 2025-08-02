export interface User {
  id: string;
  name: string;
  email?: string;
  profilePicture?: string;
  [key: string]: unknown;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  loading: boolean;
}

export interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
}

// Enhanced types for RBAC integration
export interface EnhancedUser extends User {
  microsoftOid?: string;
  roles?: string[];
  permissions?: string[];
  isSuperAdmin?: boolean;
}

export interface RBACState {
  rbacUser: import("./rbac").UserRecord | null;
  userRoles: import("./rbac").RoleRecord[];
  userPermissions: import("./rbac").PermissionRecord[];
  currentApp: string;
  rbacLoading: boolean;
}

export interface EnhancedAuthContextType extends AuthContextType, RBACState {
  // RBAC Methods
  checkPermission: (resource: string, action: string, appId?: string) => Promise<boolean>;
  hasRole: (roleId: string, appId?: string) => boolean;
  isAdmin: (appId?: string) => boolean;
  isSuperAdmin: () => boolean;
  refreshPermissions: () => Promise<void>;
  switchApplication: (appId: string) => Promise<void>;
}
