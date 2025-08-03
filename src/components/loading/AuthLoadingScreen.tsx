import React from "react";
import { Card, Typography, Space, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

interface AuthLoadingScreenProps {
  message?: string;
  description?: string;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  message = "Loading...",
  description = "Checking authentication status"
}) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Card
        style={{
          maxWidth: "450px",
          width: "100%",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          border: "none",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              boxShadow: "0 8px 16px rgba(102, 126, 234, 0.3)",
              position: "relative",
            }}
          >
            <UserOutlined style={{ fontSize: "32px", color: "white" }} />
            <Spin
              size="large"
              style={{
                position: "absolute",
                top: "-10px",
                left: "-10px",
                right: "-10px",
                bottom: "-10px",
              }}
            />
          </div>
          <Title level={3} style={{ color: "#2c3e50", margin: 0 }}>
            {message}
          </Title>
          <Paragraph style={{ color: "#7f8c8d", margin: 0 }}>
            {description}
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
};