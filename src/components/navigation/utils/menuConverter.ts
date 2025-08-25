import { NavigationItem } from "@/types/rbac";

export interface NavigationMenuItem {
  key: string;
  icon?: React.ReactNode;
  label: string;
  children?: NavigationMenuItem[];
}

export const convertToMenuItems = (items: NavigationItem[]): NavigationMenuItem[] => {
  return items.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    children: item.children ? convertToMenuItems(item.children) : undefined,
  }));
};
