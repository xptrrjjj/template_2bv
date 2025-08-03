"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useMsal } from "@azure/msal-react";
import { AuthState, User, EnhancedAuthContextType, RBACState } from "@/types/auth";
import { loginRequest } from "@/config/msalConfig";
import { PermissionContext } from "@/types/rbac";
import { userService, permissionService, bootstrapService } from "@/services/rbac";

const AuthContext = createContext<EnhancedAuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { instance } = useMsal();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    loading: true,
  });

  const [rbacState, setRbacState] = useState<RBACState>({
    rbacUser: null,
    userRoles: [],
    userPermissions: [],
    currentApp: process.env.NEXT_PUBLIC_APP_ID || "recruitment_tool",
    rbacLoading: false,
  });

  useEffect(() => {
    // Check for existing authentication on mount
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("access_token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          // Validate stored user data
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id) {
            setAuthState({
              isAuthenticated: true,
              user: parsedUser,
              accessToken: storedToken,
              loading: false,
            });
            return;
          }
        }

        // Clear invalid data and set as unauthenticated
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setAuthState({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          loading: false,
        });
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Clear corrupted data
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setAuthState({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          loading: false,
        });
      }
    };

    // Add a small delay to prevent flash and ensure smooth loading
    const timer = setTimeout(async () => {
      await initializeAuth();
      // Minimum loading time to prevent flicker
      await new Promise(resolve => setTimeout(resolve, 200));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const exchangeTokenWithBackend = async (
    microsoftToken: string
  ): Promise<{ access_token: string; user: User }> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/microsoft/callback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          microsoft_token: microsoftToken,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Token exchange failed");
    }

    return response.json();
  };

  const fetchUserProfile = async (accessToken: string) => {
    try {
      // Fetch user profile from Microsoft Graph
      const profileResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();

        // Fetch profile picture
        try {
          const photoResponse = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (photoResponse.ok) {
            const photoBlob = await photoResponse.blob();
            // Convert blob to base64 data URL instead of blob URL
            const reader = new FileReader();
            const photoDataUrl = await new Promise<string>((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(photoBlob);
            });
            return { ...profile, profilePicture: photoDataUrl };
          }
        } catch (photoError) {
          console.log("Profile picture not available:", photoError);
        }

        return profile;
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
    return null;
  };

  // RBAC helper functions
  const initializeRBACSystem = async () => {
    try {
      // Ensure system is bootstrapped
      console.log("Initializing RBAC system...");
      const result = await bootstrapService.ensureBootstrapped();
      console.log("RBAC bootstrap result:", result);
    } catch (error) {
      console.error("Failed to initialize RBAC system:", error);
    }
  };

  const provisionUserInRBAC = async (microsoftData: {
    oid: string;
    email: string;
    name: string;
    profilePicture?: string;
  }) => {
    try {
      setRbacState((prev) => ({ ...prev, rbacLoading: true }));
      console.log("Provisioning user in RBAC:", microsoftData);
      const provisionedUser = await userService.provisionUser(microsoftData);
      console.log("User provisioned:", provisionedUser);

      if (!provisionedUser) {
        console.warn("User provisioning returned undefined - this might indicate an issue");
      } else {
        console.log(
          "User provisioned successfully with super admin status:",
          provisionedUser.is_super_admin
        );
      }
    } catch (error) {
      console.error("Failed to provision user in RBAC:", error);
      throw error; // Re-throw to handle in calling function
    } finally {
      setRbacState((prev) => ({ ...prev, rbacLoading: false }));
    }
  };

  const loadUserRBACData = useCallback(async (microsoftOid: string) => {
    try {
      setRbacState((prev) => ({ ...prev, rbacLoading: true }));
      console.log("Loading RBAC data for user:", microsoftOid);

      // Get user with resolved roles and permissions
      const resolvedUser = await userService.getResolvedUser(microsoftOid);
      console.log("Resolved user data:", resolvedUser);

      if (resolvedUser) {
        setRbacState((prev) => ({
          ...prev,
          rbacUser: resolvedUser.user,
          userRoles: [...resolvedUser.globalRoles, ...Object.values(resolvedUser.appRoles).flat()],
          userPermissions: resolvedUser.allPermissions.map((p) => p.permission),
          rbacLoading: false,
        }));
        console.log(
          "RBAC state updated for user with super admin status:",
          resolvedUser.user.is_super_admin
        );
      } else {
        console.warn("No resolved user data found");
        setRbacState((prev) => ({ ...prev, rbacLoading: false }));
      }
    } catch (error) {
      console.error("Failed to load user RBAC data:", error);
      setRbacState((prev) => ({ ...prev, rbacLoading: false }));
    }
  }, []);

  const refreshPermissions = async () => {
    if (authState.user?.microsoftOid && typeof authState.user.microsoftOid === "string") {
      await loadUserRBACData(authState.user.microsoftOid);
    }
  };

  const checkPermission = async (
    resource: string,
    action: string,
    appId?: string
  ): Promise<boolean> => {
    if (!authState.user?.microsoftOid || typeof authState.user.microsoftOid !== "string")
      return false;

    // Super admin has all permissions
    if (rbacState.rbacUser?.is_super_admin) {
      return true;
    }

    try {
      const context: PermissionContext = {
        userId: authState.user.microsoftOid,
        resource,
        action,
        appId: appId || rbacState.currentApp,
      };

      const result = await permissionService.checkPermission(context);
      return result.granted;
    } catch (error) {
      console.error("Permission check failed:", error);
      return false;
    }
  };

  const hasRole = (roleId: string, appId?: string): boolean => {
    if (!rbacState.rbacUser) return false;

    // Super admin is considered to have all roles
    if (rbacState.rbacUser.is_super_admin) {
      return true;
    }

    // Check global roles
    if (rbacState.rbacUser.global_roles.includes(roleId)) {
      return true;
    }

    // Check app-specific roles
    const targetAppId = appId || rbacState.currentApp;
    const appRoles = rbacState.rbacUser.app_roles[targetAppId] || [];
    return appRoles.includes(roleId);
  };

  const isAdmin = (appId?: string): boolean => {
    const targetAppId = appId || rbacState.currentApp;
    return hasRole("super_admin") || hasRole("system_admin") || hasRole(`${targetAppId}_app_admin`);
  };

  const isSuperAdmin = (): boolean => {
    return rbacState.rbacUser?.is_super_admin || false;
  };

  const switchApplication = async (appId: string) => {
    setRbacState((prev) => ({ ...prev, currentApp: appId }));
    if (authState.user?.microsoftOid && typeof authState.user.microsoftOid === "string") {
      await loadUserRBACData(authState.user.microsoftOid);
    }
  };

  // Initialize RBAC system only when user is authenticated
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      initializeRBACSystem();
    }
  }, [authState.isAuthenticated, authState.user]);

  // Load RBAC data when authentication state changes
  useEffect(() => {
    if (
      authState.isAuthenticated &&
      authState.user?.microsoftOid &&
      typeof authState.user.microsoftOid === "string" &&
      !rbacState.rbacUser
    ) {
      loadUserRBACData(authState.user.microsoftOid);
    }
  }, [authState.isAuthenticated, authState.user, rbacState.rbacUser, loadUserRBACData]);

  const login = async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true }));

      // Get Microsoft token via MSAL
      const loginResponse = await instance.loginPopup(loginRequest);
      console.log("Microsoft Login Response:", loginResponse);

      if (loginResponse.accessToken) {
        // Fetch user profile from Microsoft Graph
        const microsoftProfile = await fetchUserProfile(loginResponse.accessToken);

        // Exchange Microsoft token for API access token
        const { access_token, user } = await exchangeTokenWithBackend(loginResponse.accessToken);
        console.log("Backend API Response:", { access_token, user });

        // Store access token immediately so it's available for RBAC API calls
        localStorage.setItem("access_token", access_token);

        // Merge Microsoft profile data with backend user data
        const enhancedUser = {
          ...user,
          name: loginResponse.account.name || user.name,
          profilePicture: microsoftProfile?.profilePicture,
          email: microsoftProfile?.mail || microsoftProfile?.userPrincipalName || user.email,
          microsoftOid: loginResponse.account.localAccountId || loginResponse.uniqueId, // Add Microsoft OID
        };
        console.log("Enhanced User:", enhancedUser);

        // Store user info
        localStorage.setItem("user", JSON.stringify(enhancedUser));

        // Provision user in RBAC system (now that token is stored)
        await provisionUserInRBAC({
          oid: loginResponse.account.localAccountId || loginResponse.uniqueId,
          email: enhancedUser.email || "",
          name: enhancedUser.name,
          profilePicture: enhancedUser.profilePicture,
        });

        // Load RBAC data for the user first
        await loadUserRBACData(loginResponse.account.localAccountId || loginResponse.uniqueId);

        // Set auth state after everything is loaded to prevent UI flicker
        setAuthState({
          isAuthenticated: true,
          user: enhancedUser,
          accessToken: access_token,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        loading: false,
      });
    }
  };

  const logout = () => {
    // Use centralized auth interceptor for cleanup and redirect (client-side only)
    if (typeof window !== 'undefined') {
      import('@/services/authInterceptor').then(({ authInterceptor }) => {
        authInterceptor.logout();
      });
    } else {
      // Fallback cleanup for server-side
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    }
    
    // Update local state
    setAuthState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      loading: false,
    });

    // Clear RBAC state
    setRbacState({
      rbacUser: null,
      userRoles: [],
      userPermissions: [],
      currentApp: process.env.NEXT_PUBLIC_APP_ID || "recruitment_tool",
      rbacLoading: false,
    });
  };

  const contextValue: EnhancedAuthContextType = {
    ...authState,
    ...rbacState,
    login,
    logout,
    checkPermission,
    hasRole,
    isAdmin,
    isSuperAdmin,
    refreshPermissions,
    switchApplication,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
