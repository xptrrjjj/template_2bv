'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMsal } from '@azure/msal-react';
import { AuthContextType, AuthState, User } from '@/types/auth';
import { loginRequest } from '@/config/msalConfig';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    loading: true,
  });

  useEffect(() => {
    // Check for existing authentication on mount
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');
        
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
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setAuthState({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          loading: false,
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setAuthState({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          loading: false,
        });
      }
    };

    // Add a small delay to prevent flash
    const timer = setTimeout(initializeAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  const exchangeTokenWithBackend = async (microsoftToken: string): Promise<{ access_token: string; user: User }> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/microsoft/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        microsoft_token: microsoftToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Token exchange failed');
    }

    return response.json();
  };

  const fetchUserProfile = async (accessToken: string) => {
    try {
      // Fetch user profile from Microsoft Graph
      const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        
        // Fetch profile picture
        try {
          const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
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
          console.log('Profile picture not available:', photoError);
        }
        
        return profile;
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
    return null;
  };

  const login = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      // Get Microsoft token via MSAL
      const loginResponse = await instance.loginPopup(loginRequest);
      console.log('Microsoft Login Response:', loginResponse);
      
      if (loginResponse.accessToken) {
        // Fetch user profile from Microsoft Graph
        const microsoftProfile = await fetchUserProfile(loginResponse.accessToken);
        
        // Exchange Microsoft token for API access token
        const { access_token, user } = await exchangeTokenWithBackend(loginResponse.accessToken);
        console.log('Backend API Response:', { access_token, user });
        
        // Merge Microsoft profile data with backend user data
        const enhancedUser = {
          ...user,
          name: loginResponse.account.name || user.name,
          profilePicture: microsoftProfile?.profilePicture,
          email: microsoftProfile?.mail || microsoftProfile?.userPrincipalName || user.email,
        };
        console.log('Enhanced User:', enhancedUser);
        
        // Store tokens and user info
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user', JSON.stringify(enhancedUser));
        
        setAuthState({
          isAuthenticated: true,
          user: enhancedUser,
          accessToken: access_token,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        loading: false,
      });
    }
  };

  const logout = () => {
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Clear session storage as well
    sessionStorage.clear();
    
    setAuthState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      loading: false,
    });

    // Force redirect to home page
    window.location.href = '/';
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};