import React from "react";
import { Typography, Avatar, Dropdown } from "antd";
import { UserOutlined, LogoutOutlined, DownOutlined } from "@ant-design/icons";
import { User } from "@/types/auth";

const { Text } = Typography;

interface UserProfileProps {
  user: User | null;
  collapsed: boolean;
  onLogout: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, collapsed, onLogout }) => {
  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      disabled: true,
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: onLogout,
    },
  ];

  return (
    <div
      style={{
        padding: collapsed ? "16px 8px" : "16px 24px",
        borderTop: "1px solid #f0f0f0",
        background: "#fafafa",
        flexShrink: 0,
      }}
    >
      {!collapsed ? (
        <Dropdown menu={{ items: userMenuItems }} trigger={["click"]} placement="topLeft">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Avatar size={40} src={user?.profilePicture} icon={<UserOutlined />} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text
                strong
                style={{
                  display: "block",
                  fontSize: "14px",
                  color: "#1a202c",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user?.name}
              </Text>
              <Text
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user?.email}
              </Text>
            </div>
            <DownOutlined style={{ fontSize: "12px", color: "#8c8c8c" }} />
          </div>
        </Dropdown>
      ) : (
        <div style={{ textAlign: "center" }}>
          <Dropdown menu={{ items: userMenuItems }} trigger={["click"]} placement="topRight">
            <Avatar
              size={32}
              src={user?.profilePicture}
              icon={<UserOutlined />}
              style={{ cursor: "pointer" }}
            />
          </Dropdown>
        </div>
      )}
    </div>
  );
};
