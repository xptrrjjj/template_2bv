import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface UseNavigationStateProps {
  onLogout: () => void;
}

interface UseNavigationStateReturn {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  openKeys: string[];
  setOpenKeys: (keys: string[]) => void;
  pathname: string;
  selectedKeys: string[];
  handleMenuClick: (key: string) => void;
  handleOpenChange: (keys: string[]) => void;
  handleLogout: () => void;
}

export const useNavigationState = ({ onLogout }: UseNavigationStateProps): UseNavigationStateReturn => {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  
  // Initialize openKeys based on current path and persist in localStorage
  const getInitialOpenKeys = (): string[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nav-openKeys');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // Fall back to default
        }
      }
    }
    
    if (pathname.startsWith('/admin')) {
      return ['/admin'];
    }
    return [];
  };
  
  const [openKeys, setOpenKeys] = useState<string[]>(getInitialOpenKeys);

  const getSelectedKeys = useCallback((): string[] => {
    if (pathname === '/dashboard' || pathname === '/') return ['/dashboard'];
    if (pathname.startsWith('/datastore')) return ['/datastore'];
    if (pathname.startsWith('/admin/users')) return ['/admin/users'];
    if (pathname.startsWith('/admin/roles')) return ['/admin/roles'];
    if (pathname.startsWith('/admin/system')) return ['/admin/system'];
    if (pathname.startsWith('/admin')) return ['/admin'];
    return ['/dashboard'];
  }, [pathname]);

  const handleMenuClick = useCallback((key: string) => {
    router.push(key);
  }, [router]);

  const handleOpenChange = useCallback((keys: string[]) => {
    setOpenKeys(keys);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nav-openKeys', JSON.stringify(keys));
    }
  }, []);

  const handleLogout = useCallback(() => {
    onLogout();
  }, [onLogout]);

  return {
    collapsed,
    setCollapsed,
    openKeys,
    setOpenKeys,
    pathname,
    selectedKeys: getSelectedKeys(),
    handleMenuClick,
    handleOpenChange,
    handleLogout,
  };
};