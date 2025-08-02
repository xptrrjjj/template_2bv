import React from "react";
import { Typography } from "antd";

const { Text } = Typography;

interface BrandLogoProps {
  collapsed: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ collapsed }) => {
  return (
    <div
      style={{
        padding: collapsed ? "16px 8px" : "24px",
        borderBottom: "1px solid #f0f0f0",
        textAlign: collapsed ? "center" : "left",
        height: "80px",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        flexShrink: 0,
      }}
    >
      {!collapsed ? (
        <Text
          style={{
            fontSize: "20px",
            fontWeight: "700",
            background: "linear-gradient(135deg, #1890ff 0%, #722ed1 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Recruitment Tool
        </Text>
      ) : (
        <div
          style={{
            width: "32px",
            height: "32px",
            background: "linear-gradient(135deg, #1890ff 0%, #722ed1 100%)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold", fontSize: "16px" }}>R</Text>
        </div>
      )}
    </div>
  );
};
