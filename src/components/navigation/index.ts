// Main navigation component
export { AppNavigation, AppSidebar } from './AppNavigation';

// Individual components (can be used separately if needed)
export { AppHeader } from './components/AppHeader';
export { AppSidebar as Sidebar } from './components/AppSidebar';
export { BrandLogo } from './components/BrandLogo';
export { NavigationMenu } from './components/NavigationMenu';
export { UserProfile } from './components/UserProfile';

// Hooks
export { useNavigationState } from './hooks/useNavigationState';

// Utils
export { convertToMenuItems } from './utils/menuConverter';
export type { AntdMenuItem } from './utils/menuConverter';