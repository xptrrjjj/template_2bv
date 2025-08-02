import { NavigationItem } from "@/types/rbac";
import type { MenuProps } from "antd";

export type AntdMenuItem = NonNullable<MenuProps["items"]>[0];

export const convertToMenuItems = (items: NavigationItem[]): AntdMenuItem[] => {
  return items.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    children: item.children ? convertToMenuItems(item.children) : undefined,
  }));
};
